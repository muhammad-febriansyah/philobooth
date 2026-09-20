#if WINDOWS
using System.Drawing;
using System.Drawing.Printing;

namespace DslrAgent.Services;

/// <summary>
/// Real printing via System.Drawing.Printing (Windows-only). Lists installed
/// printers and prints a JPEG scaled to fit the page, centered, preserving
/// aspect ratio. Compiled only for the net8.0-windows target.
/// </summary>
public sealed class WindowsPrinterService : IPrinterService
{
    private readonly ILogger<WindowsPrinterService> _logger;
    private readonly string? _defaultPrinterName;
    private readonly string? _defaultPaperSize;

    public WindowsPrinterService(
        ILogger<WindowsPrinterService> logger,
        IConfiguration configuration)
    {
        _logger = logger;
        _defaultPrinterName = configuration["Printer:DefaultPrinter"];
        _defaultPaperSize = configuration["Printer:DefaultPaperSize"];
    }

    public string Backend => "windows";

    public IReadOnlyList<PrinterInfo> ListPrinters()
    {
        var defaultName = new PrinterSettings().PrinterName;
        var printers = new List<PrinterInfo>();

        foreach (string name in PrinterSettings.InstalledPrinters)
        {
            var settings = new PrinterSettings { PrinterName = name };
            var paperSizes = GetPaperSizes(settings);

            printers.Add(new PrinterInfo(
                name,
                string.Equals(name, defaultName, StringComparison.OrdinalIgnoreCase),
                paperSizes));
        }

        return printers;
    }

    public void Print(byte[] jpeg, string? printerName, string? paperSize, int copies)
    {
        using var stream = new MemoryStream(jpeg);
        using var image = Image.FromStream(stream);
        using var document = new PrintDocument();

        var selectedPrinterName = string.IsNullOrWhiteSpace(printerName)
            ? _defaultPrinterName
            : printerName;
        var selectedPaperSize = string.IsNullOrWhiteSpace(paperSize)
            ? _defaultPaperSize
            : paperSize;

        if (!string.IsNullOrWhiteSpace(selectedPrinterName))
        {
            document.PrinterSettings.PrinterName = selectedPrinterName;
        }

        if (!document.PrinterSettings.IsValid)
        {
            throw new ArgumentException(
                $"Printer '{selectedPrinterName ?? "(system default)"}' not found");
        }

        document.PrinterSettings.Copies = (short)Math.Clamp(copies, 1, 99);

        if (!string.IsNullOrWhiteSpace(selectedPaperSize))
        {
            var matchingPaper = document.PrinterSettings.PaperSizes
                .Cast<PaperSize>()
                .FirstOrDefault(size => string.Equals(
                    size.PaperName,
                    selectedPaperSize,
                    StringComparison.OrdinalIgnoreCase));

            if (matchingPaper is null)
            {
                throw new ArgumentException(
                    $"Paper size '{selectedPaperSize}' not found on printer '{document.PrinterSettings.PrinterName}'");
            }

            document.DefaultPageSettings.PaperSize = matchingPaper;
        }

        document.DefaultPageSettings.Landscape = image.Width > image.Height;

        document.PrintPage += (_, e) =>
        {
            var area = e.MarginBounds;
            var scale = Math.Min(
                (float)area.Width / image.Width,
                (float)area.Height / image.Height);
            var width = image.Width * scale;
            var height = image.Height * scale;
            var x = area.Left + (area.Width - width) / 2f;
            var y = area.Top + (area.Height - height) / 2f;

            e.Graphics!.DrawImage(image, x, y, width, height);
            e.HasMorePages = false;
        };

        document.Print();

        _logger.LogInformation(
            "Printed {Bytes} bytes to '{Printer}' on '{Paper}' x{Copies}",
            jpeg.Length,
            document.PrinterSettings.PrinterName,
            document.DefaultPageSettings.PaperSize.PaperName,
            document.PrinterSettings.Copies);
    }

    private IReadOnlyList<PrinterPaperInfo> GetPaperSizes(PrinterSettings settings)
    {
        if (!settings.IsValid)
        {
            return [];
        }

        try
        {
            return settings.PaperSizes
                .Cast<PaperSize>()
                .Select(size => new PrinterPaperInfo(
                    size.PaperName,
                    Math.Round(size.Width * 25.4 / 100, 1),
                    Math.Round(size.Height * 25.4 / 100, 1)))
                .OrderBy(size => size.WidthMm)
                .ThenBy(size => size.HeightMm)
                .ToArray();
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception,
                "Could not read paper sizes for printer '{Printer}'",
                settings.PrinterName);

            return [];
        }
    }
}
#endif
