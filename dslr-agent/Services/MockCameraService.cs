using DslrAgent.Models;

namespace DslrAgent.Services;

/// <summary>
/// In-memory camera. Runs anywhere (incl. macOS/Linux dev), holds settings in
/// memory, and returns a generated placeholder JPEG on capture. Use this to
/// build and test the HTTP layer + kiosk wiring without a DSLR.
/// </summary>
public sealed class MockCameraService : ICameraService
{
    private readonly Dictionary<string, (string[] Options, string Current)> _state = new()
    {
        ["iso"] = (new[] { "100", "200", "400", "800", "1600", "3200" }, "400"),
        ["shutter"] = (new[] { "1/30", "1/60", "1/125", "1/250", "1/500", "1/1000" }, "1/125"),
        ["aperture"] = (new[] { "f/1.8", "f/2.8", "f/4", "f/5.6", "f/8", "f/11" }, "f/5.6"),
    };

    public bool IsAvailable => true;

    public string? Model => "Kamera Mock (dev)";

    public string Backend => "mock";

    public bool Connect() => true;

    public Settings GetSettings()
    {
        return new Settings(
            new Setting(_state["iso"].Options, _state["iso"].Current),
            new Setting(_state["shutter"].Options, _state["shutter"].Current),
            new Setting(_state["aperture"].Options, _state["aperture"].Current));
    }

    public void SetSetting(string key, string value)
    {
        if (!_state.TryGetValue(key, out var setting))
        {
            throw new ArgumentException($"Unknown setting '{key}'", nameof(key));
        }

        if (!setting.Options.Contains(value))
        {
            throw new ArgumentException($"'{value}' not allowed for '{key}'", nameof(value));
        }

        _state[key] = (setting.Options, value);
    }

    public async Task<CaptureResult> CaptureAsync(CancellationToken ct = default)
    {
        // Simulate shutter + transfer latency of a real DSLR.
        await Task.Delay(400, ct);

        // 1x1 black JPEG placeholder so the kiosk receives valid image bytes.
        var jpeg = Convert.FromBase64String(
            "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof" +
            "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAAB" +
            "AAAAAAAAAAAAAAAAAAAAAv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AfwD/2Q==");

        return new CaptureResult(jpeg, $"capture-{DateTime.Now:yyyyMMdd-HHmmss}.jpg");
    }
}
