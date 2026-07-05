#if WINDOWS
using System.Drawing;
using System.Windows.Forms;

namespace DslrAgent;

/// <summary>
/// System-tray presence for the kiosk. The agent runs as a WinExe (no console
/// window); this puts an icon near the clock so a non-technical operator can see
/// it is running and quit it. Runs on a dedicated STA thread so it does not block
/// the web host. Windows-only.
/// </summary>
internal static class Tray
{
    public static void Start(WebApplication app)
    {
        var thread = new Thread(() =>
        {
            Application.EnableVisualStyles();

            using var icon = new NotifyIcon
            {
                Icon = SystemIcons.Application,
                Visible = true,
                Text = "Philobooth Camera",
            };

            var menu = new ContextMenuStrip();
            var header = menu.Items.Add("Philobooth Camera Agent");
            header.Enabled = false;
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Keluar", null, (_, _) =>
            {
                icon.Visible = false;
                app.Lifetime.StopApplication();
                Application.ExitThread();
            });
            icon.ContextMenuStrip = menu;

            icon.ShowBalloonTip(
                3000,
                "Philobooth Camera",
                "Agen kamera berjalan. Booth siap dipakai.",
                ToolTipIcon.Info);

            Application.Run();
        })
        {
            IsBackground = true,
            Name = "tray",
        };

        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
    }
}
#endif
