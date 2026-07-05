namespace DslrAgent.Services;

/// <summary>A printer installed on the kiosk machine.</summary>
/// <param name="Name">Printer name as the OS reports it.</param>
/// <param name="IsDefault">True if this is the system default printer.</param>
public record PrinterInfo(string Name, bool IsDefault);

/// <summary>
/// Abstraction over local printing. Implemented by <c>MockPrinterService</c>
/// (cross-platform, logs only) and <c>WindowsPrinterService</c> (real printing
/// via System.Drawing on the kiosk).
/// </summary>
public interface IPrinterService
{
    /// <summary>Which backend drives this service: "mock" | "windows".</summary>
    string Backend { get; }

    /// <summary>List printers installed on this machine.</summary>
    IReadOnlyList<PrinterInfo> ListPrinters();

    /// <summary>
    /// Print a JPEG, scaled to fit the page while preserving aspect ratio.
    /// </summary>
    /// <param name="jpeg">Full image bytes to print.</param>
    /// <param name="printerName">Target printer, or null for the system default.</param>
    /// <param name="paperSize">Paper name (e.g. "4x6"), or null for the printer default.</param>
    /// <param name="copies">Number of copies (clamped to 1..99).</param>
    void Print(byte[] jpeg, string? printerName, string? paperSize, int copies);
}
