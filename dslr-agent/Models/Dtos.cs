namespace DslrAgent.Models;

/// <summary>A single adjustable camera setting and its allowed values.</summary>
/// <param name="Options">Allowed values reported by the camera.</param>
/// <param name="Current">Currently selected value (one of <paramref name="Options"/>).</param>
public record Setting(IReadOnlyList<string> Options, string Current);

/// <summary>Exposure controls exposed to the kiosk UI.</summary>
public record Settings(Setting Iso, Setting Shutter, Setting Aperture);

/// <summary>Body of POST /set — change one exposure parameter.</summary>
/// <param name="Key">One of: iso, shutter, aperture.</param>
/// <param name="Value">New value, must be one of the setting's options.</param>
public record SetRequest(string Key, string Value);
