#if WINDOWS
using System.Drawing;
using System.Windows.Forms;

namespace DslrAgent;

/// <summary>
/// Owns the Windows UI thread: full-screen WebView2 booth plus tray controls.
/// The ASP.NET camera/printer service keeps running on the main host thread.
/// </summary>
internal static class Tray
{
    public static void Start(WebApplication app, string boothUrl)
    {
        var thread = new Thread(() =>
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            using var booth = new BoothWindow(boothUrl);

            using var icon = new NotifyIcon
            {
                Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath)
                    ?? SystemIcons.Application,
                Visible = true,
                Text = "Philobooth",
            };

            var menu = new ContextMenuStrip();
            var header = menu.Items.Add("Philobooth");
            header.Enabled = false;
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Buka Booth", null, (_, _) => booth.ShowBooth());
            menu.Items.Add("Halaman Awal", null, (_, _) => booth.GoHome());
            menu.Items.Add("Muat Ulang", null, (_, _) => booth.ReloadBooth());
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Keluar", null, (_, _) =>
            {
                icon.Visible = false;
                booth.RequestExit();
                app.Lifetime.StopApplication();
            });
            icon.ContextMenuStrip = menu;
            icon.DoubleClick += (_, _) => booth.ShowBooth();

            icon.ShowBalloonTip(
                3000,
                "Philobooth",
                "Aplikasi booth, kamera, dan printer siap dipakai.",
                ToolTipIcon.Info);

            app.Lifetime.ApplicationStopping.Register(() =>
            {
                if (!booth.IsHandleCreated || booth.IsDisposed)
                {
                    return;
                }

                booth.BeginInvoke(new Action(booth.RequestExit));
            });

            Application.Run(booth);
        })
        {
            IsBackground = true,
            Name = "philobooth-ui",
        };

        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
    }
}
#endif
