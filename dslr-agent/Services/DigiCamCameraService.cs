#if WINDOWS
using CameraControl.Devices;
using CameraControl.Devices.Classes;
using DslrAgent.Models;
using System.Drawing;
using System.Drawing.Imaging;

namespace DslrAgent.Services;

/// <summary>
/// Real DSLR control via CameraControl.Devices (digiCamControl's engine).
/// Windows-only: drives Canon/Nikon/Sony over PTP/USB. Compiled only when the
/// WINDOWS target framework constant is defined (see DslrAgent.csproj).
/// </summary>
public sealed class DigiCamCameraService : ICameraService, IDisposable
{
    private readonly SemaphoreSlim _cameraGate = new(1, 1);
    private CameraDeviceManager? _manager;
    private readonly ILogger<DigiCamCameraService> _logger;
    private string? _initializationError;
    private string? _liveViewError;
    private byte[]? _lastLiveViewImage;
    private bool _liveViewStarted;

    public DigiCamCameraService(ILogger<DigiCamCameraService> logger)
    {
        _logger = logger;

        try
        {
            Connect();
        }
        catch (Exception exception)
        {
            _initializationError =
                "Driver kamera gagal dimuat. Tutup EOS Utility/aplikasi kamera lain, cabut-pasang USB, lalu buka ulang Philobooth Camera.";
            _logger.LogError(exception, "Failed to initialize the digiCam camera backend");
        }
    }

    private ICameraDevice Camera =>
        _manager?.SelectedCameraDevice is { IsConnected: true } camera
            ? camera
            : throw new InvalidOperationException(
                _initializationError ?? "Kamera tidak terdeteksi. Pastikan kamera menyala dan USB terhubung.");

    public bool IsAvailable => _manager?.SelectedCameraDevice is { IsConnected: true };

    public string? Model =>
        _manager?.SelectedCameraDevice is { IsConnected: true } device
            ? device.DeviceName
            : null;

    public string Backend => "digicam";

    public string? Error => _initializationError;

    public string? LiveViewError => _liveViewError;

    public bool LiveViewStarted => _liveViewStarted;

    public bool Connect()
    {
        try
        {
            _manager?.CloseAll();
            _manager = new CameraDeviceManager();
            _manager.ConnectToCamera();

            _initializationError = IsAvailable
                ? null
                : "DSLR belum terdeteksi. Gunakan kabel data USB, nyalakan kamera, pilih mode foto, lalu tutup EOS Utility/digiCamControl.";

            return IsAvailable;
        }
        catch (Exception exception)
        {
            _initializationError =
                $"Driver DSLR gagal: {exception.Message}. Tutup EOS Utility/digiCamControl, cabut-pasang kabel data USB, lalu tekan Hubungkan kamera.";
            _logger.LogError(exception, "Failed to connect to the camera");

            return false;
        }
    }

    public bool StartLiveView()
    {
        _cameraGate.Wait();

        try
        {
            return StartLiveViewUnsafe();
        }
        finally
        {
            _cameraGate.Release();
        }
    }

    private bool StartLiveViewUnsafe()
    {
        try
        {
            StopLiveViewUnsafe();
            Camera.StartLiveView();
            _liveViewStarted = true;
            _liveViewError = null;

            return true;
        }
        catch (Exception exception)
        {
            _liveViewStarted = false;
            _liveViewError =
                $"Live view gagal dimulai: {exception.Message}. Putar mode kamera ke M/P/Av/Tv, aktifkan Live View, lalu tutup EOS Utility.";
            _logger.LogWarning(exception, "Failed to start DSLR live view");

            return false;
        }
    }

    public void StopLiveView()
    {
        _cameraGate.Wait();

        try
        {
            StopLiveViewUnsafe();
        }
        finally
        {
            _cameraGate.Release();
        }
    }

    private void StopLiveViewUnsafe()
    {
        if (!_liveViewStarted || !IsAvailable)
        {
            return;
        }

        try
        {
            Camera.StopLiveView();
        }
        catch (Exception exception)
        {
            _logger.LogDebug(exception, "Failed to stop DSLR live view");
        }
        finally
        {
            _liveViewStarted = false;
        }
    }

    public byte[]? GetLiveViewImage()
    {
        if (!_liveViewStarted || !IsAvailable)
        {
            return null;
        }

        // Do not let preview polling compete with a shutter command. Skipping
        // one frame is preferable to making Canon report DEVICE_BUSY.
        if (!_cameraGate.Wait(TimeSpan.FromMilliseconds(100)))
        {
            return null;
        }

        try
        {
            var liveView = Camera.GetLiveViewImage();

            if (liveView?.ImageData is not { Length: > 0 } imageData)
            {
                return null;
            }

            using var input = new MemoryStream(
                imageData,
                liveView.ImageDataPosition,
                imageData.Length - liveView.ImageDataPosition);
            using var bitmap = new Bitmap(input);
            using var output = new MemoryStream();
            bitmap.Save(output, ImageFormat.Jpeg);

            _liveViewError = null;

            var jpeg = output.ToArray();
            _lastLiveViewImage = jpeg;

            return jpeg;
        }
        catch (Exception exception)
        {
            _liveViewError =
                $"Frame live view gagal dibaca: {exception.Message}. Pastikan Live View aktif di kamera.";
            _logger.LogDebug(exception, "Failed to read DSLR live-view frame");

            return null;
        }
        finally
        {
            _cameraGate.Release();
        }
    }

    public Settings GetSettings()
    {
        var cam = Camera;

        return new Settings(
            ToSetting(cam.IsoNumber),
            ToSetting(cam.ShutterSpeed),
            ToSetting(cam.FNumber));
    }

    public void SetSetting(string key, string value)
    {
        var cam = Camera;
        var prop = key switch
        {
            "iso" => cam.IsoNumber,
            "shutter" => cam.ShutterSpeed,
            "aperture" => cam.FNumber,
            _ => throw new ArgumentException($"Unknown setting '{key}'", nameof(key)),
        };

        if (!prop.Values.Contains(value))
        {
            throw new ArgumentException($"'{value}' not allowed for '{key}'", nameof(value));
        }

        prop.SetValue(value);
    }

    public async Task<CaptureResult> CaptureAsync(CancellationToken ct = default)
    {
        await _cameraGate.WaitAsync(ct);

        ICameraDevice? cam = null;
        CameraDeviceManager? manager = null;
        var restartLiveView = false;
        var handlerSubscribed = false;
        byte[]? liveViewFallback = null;
        var tcs = new TaskCompletionSource<CaptureResult>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        void Handler(object? sender, PhotoCapturedEventArgs e)
        {
            try
            {
                using var ms = new MemoryStream();
                e.CameraDevice.TransferFile(e.Handle, ms);
                e.CameraDevice.ReleaseResurce(e.Handle);
                var name = string.IsNullOrEmpty(e.FileName)
                    ? $"capture-{DateTime.Now:yyyyMMdd-HHmmss}.jpg"
                    : e.FileName;
                tcs.TrySetResult(new CaptureResult(ms.ToArray(), name));
            }
            catch (Exception ex)
            {
                tcs.TrySetException(ex);
            }
        }

        try
        {
            cam = Camera;
            manager = _manager
                ?? throw new InvalidOperationException(
                    _initializationError ?? "Camera backend is unavailable");
            restartLiveView = _liveViewStarted;
            liveViewFallback = _lastLiveViewImage?.ToArray();
            manager.PhotoCaptured += Handler;
            handlerSubscribed = true;

            if (restartLiveView)
            {
                StopLiveViewUnsafe();
                await Task.Delay(500, ct);
            }

            // A fixed photobooth should not refuse a shot just because AF did
            // not lock. The full-resolution JPEG is transferred directly to
            // memory and returned to the React slot preview.
            cam.IsBusy = true;
            cam.CaptureInSdRam = true;
            cam.CapturePhotoNoAf();

            using (ct.Register(() => tcs.TrySetCanceled(ct)))
            {
                return await tcs.Task.WaitAsync(TimeSpan.FromSeconds(8), ct);
            }
        }
        catch (Exception exception) when (
            !ct.IsCancellationRequested &&
            liveViewFallback is { Length: > 0 })
        {
            // Some older Canon bodies fire the shutter but never deliver the
            // host-transfer callback through this legacy EDSDK wrapper. The
            // live-view frame still comes from the DSLR, so use the latest
            // frame rather than leaving the template slot empty.
            _logger.LogWarning(
                exception,
                "Full-resolution DSLR transfer failed; using the latest live-view frame");

            return new CaptureResult(
                liveViewFallback,
                $"capture-preview-{DateTime.Now:yyyyMMdd-HHmmss}.jpg");
        }
        finally
        {
            if (handlerSubscribed && manager is not null)
            {
                manager.PhotoCaptured -= Handler;
            }

            if (cam is not null)
            {
                cam.IsBusy = false;
            }

            if (restartLiveView && IsAvailable)
            {
                await Task.Delay(500, CancellationToken.None);
                StartLiveViewUnsafe();
            }

            _cameraGate.Release();
        }
    }

    private static Setting ToSetting(PropertyValue<long> prop)
    {
        return new Setting(prop.Values.ToList(), prop.Value);
    }

    public void Dispose()
    {
        StopLiveView();
        _manager?.CloseAll();
        _cameraGate.Dispose();
    }
}
#endif
