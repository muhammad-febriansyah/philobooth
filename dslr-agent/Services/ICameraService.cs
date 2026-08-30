using DslrAgent.Models;

namespace DslrAgent.Services;

/// <summary>Captured photo: raw JPEG bytes pulled off the camera.</summary>
/// <param name="Bytes">Full-resolution JPEG data.</param>
/// <param name="FileName">Suggested file name.</param>
public record CaptureResult(byte[] Bytes, string FileName);

/// <summary>
/// Abstraction over the camera. Implemented by <c>MockCameraService</c>
/// (cross-platform, no hardware) and <c>DigiCamCameraService</c> (Windows,
/// real DSLR via CameraControl.Devices).
/// </summary>
public interface ICameraService
{
    /// <summary>True if a camera is connected and ready.</summary>
    bool IsAvailable { get; }

    /// <summary>
    /// Human-readable model of the connected camera (e.g. "Canon EOS 750D"),
    /// or <c>null</c> when no camera is connected. Surfaced in /health so the
    /// kiosk can show exactly what is attached instead of a bare boolean.
    /// </summary>
    string? Model { get; }

    /// <summary>Which backend drives this service: "mock" | "digicam".</summary>
    string Backend { get; }

    /// <summary>
    /// Actionable initialization error, or <c>null</c> when the backend loaded
    /// normally. A default keeps optional camera backends source-compatible.
    /// </summary>
    string? Error => null;

    bool Connect();

    /// <summary>Read current settings + allowed values from the camera.</summary>
    Settings GetSettings();

    /// <summary>Push a new value for one exposure parameter.</summary>
    void SetSetting(string key, string value);

    /// <summary>Trigger the shutter and download the resulting photo.</summary>
    Task<CaptureResult> CaptureAsync(CancellationToken ct = default);
}
