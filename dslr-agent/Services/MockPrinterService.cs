namespace DslrAgent.Services;

/// <summary>
/// Cross-platform printer stub. Runs on macOS/Linux dev where the real printing
/// stack (System.Drawing) is unavailable. Lists a fake printer and logs print
/// jobs instead of sending them, so the kiosk print flow can be built and tested
/// without hardware.
/// </summary>
public sealed class MockPrinterService : IPrinterService
{
    private readonly ILogger<MockPrinterService> _logger;

    public MockPrinterService(ILogger<MockPrinterService> logger)
    {
        _logger = logger;
    }

    public string Backend => "mock";

    public IReadOnlyList<PrinterInfo> ListPrinters()
    {
        return new[]
        {
            new PrinterInfo("Mock Printer (dev)", true,
            [
                new PrinterPaperInfo("4x6", 101.6, 152.4),
                new PrinterPaperInfo("A4", 210, 297),
                new PrinterPaperInfo("A3", 297, 420),
            ]),
            new PrinterInfo("Mock Photo Printer 4x6", false,
            [
                new PrinterPaperInfo("4x6", 101.6, 152.4),
            ]),
        };
    }

    public void Print(byte[] jpeg, string? printerName, string? paperSize, int copies)
    {
        _logger.LogInformation(
            "Mock print: {Bytes} bytes -> '{Printer}' paper={Paper} copies={Copies}",
            jpeg.Length,
            printerName ?? "(default)",
            paperSize ?? "(default)",
            copies);
    }
}
