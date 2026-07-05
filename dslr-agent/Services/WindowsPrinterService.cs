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

    public WindowsPrinterService(ILogger<WindowsPrinterService> logger)
    {
        _logger = logger;
    }

    public string Backend => "windows";

    public IReadOnlyList<PrinterInfo> ListPrinters()
    {
        var defaultName = new PrinterSettings().PrinterName;
        var printers = new List<PrinterInfo>();

        foreach (string name in PrinterSettings.InstalledPrinters)
        {
            printers.Add(new PrinterInfo(
                name,
                string.Equals(name, defaultName, StringComparison.OrdinalIgnoreCase)));
        }

        return printers;
    }

    public void Print(byte[] jpeg, string? printerName, string? paperSize, int copies)
    {
        using var stream = new MemoryStream(jpeg);
        using var image = Image.FromStream(stream);
        using var document = new PrintDocument();

        if (!string.IsNullOrWhiteSpace(printerName))
        {
            document.PrinterSettings.PrinterName = printerName;

            if (!document.PrinterSettings.IsValid)
            {
                throw new ArgumentException($"Printer '{printerName}' not found");
            }
        }

        document.PrinterSettings.Copies = (short)Math.Clamp(copies, 1, 99);

        if (!string.IsNullOrWhiteSpace(paperSize))
        {
            foreach (PaperSize size in document.PrinterSettings.PaperSizes)
            {
                if (string.Equals(size.PaperName, paperSize, StringComparison.OrdinalIgnoreCase))
                {
                    document.DefaultPageSettings.PaperSize = size;
                    break;
                }
            }
        }

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
            "Printed {Bytes} bytes to '{Printer}' x{Copies}",
            jpeg.Length,
            document.PrinterSettings.PrinterName,
            document.PrinterSettings.Copies);
    }
}
#endif
