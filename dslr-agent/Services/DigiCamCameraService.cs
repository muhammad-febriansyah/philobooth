#if WINDOWS
using CameraControl.Devices;
using CameraControl.Devices.Classes;
using DslrAgent.Models;

namespace DslrAgent.Services;

/// <summary>
/// Real DSLR control via CameraControl.Devices (digiCamControl's engine).
/// Windows-only: drives Canon/Nikon/Sony over PTP/USB. Compiled only when the
/// WINDOWS target framework constant is defined (see DslrAgent.csproj).
/// </summary>
public sealed class DigiCamCameraService : ICameraService, IDisposable
{
    private CameraDeviceManager? _manager;
    private readonly ILogger<DigiCamCameraService> _logger;
    private string? _initializationError;

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
        var cam = Camera;
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

        var manager = _manager
            ?? throw new InvalidOperationException(_initializationError ?? "Camera backend is unavailable");

        manager.PhotoCaptured += Handler;

        try
        {
            cam.CapturePhoto();

            using (ct.Register(() => tcs.TrySetCanceled(ct)))
            {
                return await tcs.Task.WaitAsync(TimeSpan.FromSeconds(30), ct);
            }
        }
        finally
        {
            manager.PhotoCaptured -= Handler;
        }
    }

    private static Setting ToSetting(PropertyValue<long> prop)
    {
        return new Setting(prop.Values.ToList(), prop.Value);
    }

    public void Dispose()
    {
        _manager?.CloseAll();
    }
}
#endif
