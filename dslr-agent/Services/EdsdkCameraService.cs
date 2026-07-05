#if WINDOWS && EDSDK
using System.Runtime.InteropServices;
using DslrAgent.Models;
using EDSDKLib;

namespace DslrAgent.Services;

/// <summary>
/// Canon EDSDK camera backend — best Canon support (all bodies with a remote
/// API; excludes M3, R1, M100 which have no tethering interface).
///
/// Compiled ONLY when built with <c>-p:IncludeEdsdk=true</c> after dropping
/// Canon's <c>EDSDKLib.cs</c> wrapper and native DLLs into <c>edsdk/</c>
/// (see edsdk/README.md). It is excluded from the default build, which needs no
/// proprietary SDK.
///
/// Structure follows the EDSDK reference; the code/label tables and the capture
/// event flow MUST be verified on Windows against a real Canon body before
/// production use.
/// </summary>
public sealed class EdsdkCameraService : ICameraService, IDisposable
{
    private readonly ILogger<EdsdkCameraService> _logger;
    private readonly object _gate = new();
    private IntPtr _camera = IntPtr.Zero;
    private bool _sdkInitialized;

    // Code -> human label maps (from the EDSDK reference). SetSetting reverses
    // them. Values not present are shown/returned as their raw hex code.
    private static readonly IReadOnlyDictionary<uint, string> IsoLabels = new Dictionary<uint, string>
    {
        [0x00] = "Auto",
        [0x48] = "100",
        [0x50] = "200",
        [0x58] = "400",
        [0x60] = "800",
        [0x68] = "1600",
        [0x70] = "3200",
        [0x78] = "6400",
        [0x80] = "12800",
        [0x88] = "25600",
    };

    private static readonly IReadOnlyDictionary<uint, string> ApertureLabels = new Dictionary<uint, string>
    {
        [0x15] = "f/1.8",
        [0x18] = "f/2.0",
        [0x1B] = "f/2.2",
        [0x20] = "f/2.8",
        [0x25] = "f/3.5",
        [0x28] = "f/4.0",
        [0x2B] = "f/4.5",
        [0x30] = "f/5.6",
        [0x35] = "f/7.1",
        [0x38] = "f/8.0",
        [0x3B] = "f/9.0",
        [0x40] = "f/11",
        [0x45] = "f/14",
        [0x48] = "f/16",
        [0x4B] = "f/18",
        [0x50] = "f/22",
    };

    private static readonly IReadOnlyDictionary<uint, string> ShutterLabels = new Dictionary<uint, string>
    {
        [0x10] = "Bulb",
        [0x1C] = "15\"",
        [0x24] = "8\"",
        [0x2C] = "4\"",
        [0x34] = "2\"",
        [0x3C] = "1\"",
        [0x44] = "1/2",
        [0x4C] = "1/4",
        [0x54] = "1/8",
        [0x5C] = "1/15",
        [0x64] = "1/30",
        [0x6C] = "1/60",
        [0x74] = "1/125",
        [0x7C] = "1/250",
        [0x84] = "1/500",
        [0x8C] = "1/1000",
        [0x94] = "1/2000",
        [0x9C] = "1/4000",
        [0xA4] = "1/8000",
    };

    public EdsdkCameraService(ILogger<EdsdkCameraService> logger)
    {
        _logger = logger;

        if (EDSDK.EdsInitializeSDK() == EDSDK.EDS_ERR_OK)
        {
            _sdkInitialized = true;
            Connect();
        }
        else
        {
            _logger.LogError("EdsInitializeSDK failed");
        }
    }

    public bool IsAvailable => _camera != IntPtr.Zero;

    public string Backend => "edsdk";

    public string? Model
    {
        get
        {
            if (_camera == IntPtr.Zero)
            {
                return null;
            }

            return EDSDK.EdsGetDeviceInfo(_camera, out var info) == EDSDK.EDS_ERR_OK
                ? info.szDeviceDescription
                : "Canon";
        }
    }

    private void Connect()
    {
        if (EDSDK.EdsGetCameraList(out var list) != EDSDK.EDS_ERR_OK)
        {
            return;
        }

        try
        {
            if (EDSDK.EdsGetChildCount(list, out var count) != EDSDK.EDS_ERR_OK || count == 0)
            {
                return;
            }

            if (EDSDK.EdsGetChildAtIndex(list, 0, out var camera) != EDSDK.EDS_ERR_OK)
            {
                return;
            }

            if (EDSDK.EdsOpenSession(camera) == EDSDK.EDS_ERR_OK)
            {
                _camera = camera;
                _logger.LogInformation("EDSDK connected: {Model}", Model);
            }
        }
        finally
        {
            EDSDK.EdsRelease(list);
        }
    }

    public Settings GetSettings()
    {
        var cam = RequireCamera();

        lock (_gate)
        {
            return new Settings(
                ReadSetting(cam, EDSDK.PropID_ISOSpeed, IsoLabels),
                ReadSetting(cam, EDSDK.PropID_Tv, ShutterLabels),
                ReadSetting(cam, EDSDK.PropID_Av, ApertureLabels));
        }
    }

    public void SetSetting(string key, string value)
    {
        var cam = RequireCamera();
        var (propId, labels) = key switch
        {
            "iso" => (EDSDK.PropID_ISOSpeed, IsoLabels),
            "shutter" => (EDSDK.PropID_Tv, ShutterLabels),
            "aperture" => (EDSDK.PropID_Av, ApertureLabels),
            _ => throw new ArgumentException($"Unknown setting '{key}'", nameof(key)),
        };

        var code = LabelToCode(labels, value)
            ?? throw new ArgumentException($"'{value}' not allowed for '{key}'", nameof(value));

        lock (_gate)
        {
            var err = EDSDK.EdsSetPropertyData(cam, propId, 0, Marshal.SizeOf(typeof(uint)), code);

            if (err != EDSDK.EDS_ERR_OK)
            {
                throw new InvalidOperationException($"EdsSetPropertyData failed (0x{err:X})");
            }
        }
    }

    public async Task<CaptureResult> CaptureAsync(CancellationToken ct = default)
    {
        var cam = RequireCamera();
        var tcs = new TaskCompletionSource<CaptureResult>(
            TaskCreationOptions.RunContinuationsAsynchronously);

        EDSDK.EdsObjectEventHandler handler = (uint inEvent, IntPtr inRef, IntPtr _) =>
        {
            if (inEvent == EDSDK.ObjectEvent_DirItemRequestTransfer)
            {
                try
                {
                    tcs.TrySetResult(Download(inRef));
                }
                catch (Exception ex)
                {
                    tcs.TrySetException(ex);
                }
            }

            return EDSDK.EDS_ERR_OK;
        };

        EDSDK.EdsSetObjectEventHandler(cam, EDSDK.ObjectEvent_All, handler, IntPtr.Zero);

        try
        {
            lock (_gate)
            {
                var err = EDSDK.EdsSendCommand(cam, EDSDK.CameraCommand_TakePicture, 0);

                if (err != EDSDK.EDS_ERR_OK)
                {
                    throw new InvalidOperationException($"TakePicture failed (0x{err:X})");
                }
            }

            using (ct.Register(() => tcs.TrySetCanceled(ct)))
            {
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(30));

                // EDSDK delivers the object event via EdsGetEvent on this thread.
                while (!tcs.Task.IsCompleted)
                {
                    EDSDK.EdsGetEvent();

                    if (timeout.IsCancellationRequested)
                    {
                        throw new TimeoutException("Capture timed out");
                    }

                    await Task.Delay(50, ct);
                }

                return await tcs.Task;
            }
        }
        finally
        {
            EDSDK.EdsSetObjectEventHandler(cam, EDSDK.ObjectEvent_All, null, IntPtr.Zero);
        }
    }

    private static CaptureResult Download(IntPtr dirItem)
    {
        if (EDSDK.EdsGetDirectoryItemInfo(dirItem, out var info) != EDSDK.EDS_ERR_OK)
        {
            throw new InvalidOperationException("EdsGetDirectoryItemInfo failed");
        }

        if (EDSDK.EdsCreateMemoryStream(info.Size, out var stream) != EDSDK.EDS_ERR_OK)
        {
            throw new InvalidOperationException("EdsCreateMemoryStream failed");
        }

        try
        {
            EDSDK.EdsDownload(dirItem, info.Size, stream);
            EDSDK.EdsDownloadComplete(dirItem);
            EDSDK.EdsGetPointer(stream, out var pointer);

            var bytes = new byte[info.Size];
            Marshal.Copy(pointer, bytes, 0, (int)info.Size);

            var name = string.IsNullOrEmpty(info.szFileName)
                ? $"capture-{Guid.NewGuid():N}.jpg"
                : info.szFileName;

            return new CaptureResult(bytes, name);
        }
        finally
        {
            EDSDK.EdsRelease(stream);
        }
    }

    private static Setting ReadSetting(IntPtr cam, uint propId, IReadOnlyDictionary<uint, string> labels)
    {
        EDSDK.EdsGetPropertyData(cam, propId, 0, out uint current);
        EDSDK.EdsGetPropertyDesc(cam, propId, out var desc);

        var options = new List<string>(desc.NumElements);

        for (var i = 0; i < desc.NumElements; i++)
        {
            options.Add(CodeToLabel(labels, (uint)desc.PropDesc[i]));
        }

        return new Setting(options, CodeToLabel(labels, current));
    }

    private static string CodeToLabel(IReadOnlyDictionary<uint, string> labels, uint code)
    {
        return labels.TryGetValue(code, out var label) ? label : $"0x{code:X}";
    }

    private static uint? LabelToCode(IReadOnlyDictionary<uint, string> labels, string label)
    {
        foreach (var pair in labels)
        {
            if (pair.Value == label)
            {
                return pair.Key;
            }
        }

        // Allow raw hex ("0x58") passthrough for values without a mapped label.
        if (label.StartsWith("0x", StringComparison.OrdinalIgnoreCase) &&
            uint.TryParse(label[2..], System.Globalization.NumberStyles.HexNumber, null, out var raw))
        {
            return raw;
        }

        return null;
    }

    private IntPtr RequireCamera()
    {
        if (_camera == IntPtr.Zero)
        {
            throw new InvalidOperationException("No camera connected");
        }

        return _camera;
    }

    public void Dispose()
    {
        if (_camera != IntPtr.Zero)
        {
            EDSDK.EdsCloseSession(_camera);
            EDSDK.EdsRelease(_camera);
            _camera = IntPtr.Zero;
        }

        if (_sdkInitialized)
        {
            EDSDK.EdsTerminateSDK();
            _sdkInitialized = false;
        }
    }
}
#endif
