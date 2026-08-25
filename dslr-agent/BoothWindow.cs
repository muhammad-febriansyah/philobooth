#if WINDOWS
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using System.Drawing;
using System.Windows.Forms;

namespace DslrAgent;

/// <summary>
/// Full-screen booth shell. The customer UI stays on philobooth.id while USB
/// camera and printer access remain local through the HTTP service in Program.
/// </summary>
internal sealed class BoothWindow : Form
{
    private readonly Uri boothUri;
    private readonly WebView2 webView;
    private readonly Panel statusPanel;
    private readonly Label statusTitle;
    private readonly Label statusDetail;
    private readonly Button retryButton;
    private bool initializing;
    private bool allowClose;

    public BoothWindow(string boothUrl)
    {
        boothUri = ValidateBoothUri(boothUrl);

        Text = "Philobooth Booth";
        Name = "PhiloboothBooth";
        StartPosition = FormStartPosition.CenterScreen;
        WindowState = FormWindowState.Maximized;
        FormBorderStyle = FormBorderStyle.None;
        MinimumSize = new Size(1024, 700);
        BackColor = Color.FromArgb(15, 15, 15);
        KeyPreview = true;

        webView = new WebView2
        {
            Dock = DockStyle.Fill,
            DefaultBackgroundColor = Color.FromArgb(15, 15, 15),
        };

        statusTitle = new Label
        {
            AutoSize = true,
            Font = new Font("Segoe UI", 20, FontStyle.Bold),
            ForeColor = Color.White,
            Text = "Menyiapkan Philobooth…",
        };

        statusDetail = new Label
        {
            AutoSize = true,
            MaximumSize = new Size(720, 0),
            Font = new Font("Segoe UI", 11),
            ForeColor = Color.FromArgb(190, 190, 190),
            Text = "Menghubungkan aplikasi booth, kamera, dan printer.",
        };

        retryButton = new Button
        {
            AutoSize = true,
            BackColor = Color.FromArgb(245, 250, 12),
            FlatStyle = FlatStyle.Flat,
            Font = new Font("Segoe UI", 10, FontStyle.Bold),
            ForeColor = Color.Black,
            Padding = new Padding(18, 8, 18, 8),
            Text = "Coba lagi",
            Visible = false,
        };
        retryButton.FlatAppearance.BorderSize = 0;
        retryButton.Click += async (_, _) => await InitializeOrReloadAsync();

        var content = new FlowLayoutPanel
        {
            Anchor = AnchorStyles.None,
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            FlowDirection = FlowDirection.TopDown,
            MaximumSize = new Size(760, 0),
            WrapContents = false,
        };
        content.Controls.Add(statusTitle);
        content.Controls.Add(statusDetail);
        content.Controls.Add(retryButton);

        statusPanel = new Panel
        {
            BackColor = Color.FromArgb(15, 15, 15),
            Dock = DockStyle.Fill,
        };
        statusPanel.Controls.Add(content);
        statusPanel.Resize += (_, _) =>
        {
            content.Left = Math.Max(24, (statusPanel.ClientSize.Width - content.Width) / 2);
            content.Top = Math.Max(24, (statusPanel.ClientSize.Height - content.Height) / 2);
        };

        Controls.Add(webView);
        Controls.Add(statusPanel);
        statusPanel.BringToFront();

        Shown += async (_, _) => await InitializeOrReloadAsync();
        FormClosing += OnFormClosing;
        KeyDown += OnKeyDown;
    }

    public void ShowBooth()
    {
        if (!Visible)
        {
            Show();
        }

        WindowState = FormWindowState.Maximized;
        Activate();
        webView.Focus();
    }

    public void GoHome()
    {
        ShowBooth();

        if (webView.CoreWebView2 is null)
        {
            _ = InitializeOrReloadAsync();
            return;
        }

        webView.CoreWebView2.Navigate(boothUri.AbsoluteUri);
    }

    public void ReloadBooth()
    {
        ShowBooth();

        if (webView.CoreWebView2 is null)
        {
            _ = InitializeOrReloadAsync();
            return;
        }

        ShowStatus("Memuat ulang Philobooth…", "Mohon tunggu sebentar.", false);
        webView.Reload();
    }

    public void RequestExit()
    {
        allowClose = true;
        Close();
    }

    private async Task InitializeOrReloadAsync()
    {
        if (initializing)
        {
            return;
        }

        if (webView.CoreWebView2 is not null)
        {
            ShowStatus("Memuat ulang Philobooth…", "Mohon tunggu sebentar.", false);
            webView.CoreWebView2.Navigate(boothUri.AbsoluteUri);
            return;
        }

        initializing = true;
        ShowStatus(
            "Menyiapkan Philobooth…",
            "Menghubungkan aplikasi booth, kamera, dan printer.",
            false);

        try
        {
            var userDataFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Philobooth",
                "WebView2");
            Directory.CreateDirectory(userDataFolder);

            var environment = await CoreWebView2Environment.CreateAsync(
                browserExecutableFolder: null,
                userDataFolder: userDataFolder);
            await webView.EnsureCoreWebView2Async(environment);

            ConfigureWebView();
            webView.CoreWebView2.Navigate(boothUri.AbsoluteUri);
        }
        catch (WebView2RuntimeNotFoundException)
        {
            ShowStatus(
                "WebView2 belum tersedia",
                "Jalankan ulang installer Philobooth Booth agar komponen Microsoft WebView2 dipasang.",
                true);
        }
        catch (Exception exception)
        {
            ShowStatus(
                "Philobooth belum dapat dibuka",
                $"Periksa koneksi internet lalu coba lagi.\n\n{exception.Message}",
                true);
        }
        finally
        {
            initializing = false;
        }
    }

    private void ConfigureWebView()
    {
        var core = webView.CoreWebView2;
        core.Settings.AreDefaultContextMenusEnabled = false;
        core.Settings.AreDevToolsEnabled = false;
        core.Settings.AreBrowserAcceleratorKeysEnabled = false;
        core.Settings.IsStatusBarEnabled = false;
        core.Settings.IsZoomControlEnabled = false;

        core.NavigationStarting += (_, _) =>
            ShowStatus("Memuat Philobooth…", "Mohon tunggu sebentar.", false);
        core.NavigationCompleted += (_, args) =>
        {
            if (args.IsSuccess)
            {
                statusPanel.Visible = false;
                webView.Focus();
                return;
            }

            ShowStatus(
                "Halaman booth gagal dimuat",
                $"Periksa internet lalu coba lagi. Kode: {args.WebErrorStatus}",
                true);
        };
        core.NewWindowRequested += (_, args) =>
        {
            args.Handled = true;

            if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var uri)
                && uri.Scheme is "https" or "http")
            {
                core.Navigate(uri.AbsoluteUri);
            }
        };
        core.ProcessFailed += (_, _) =>
            ShowStatus(
                "Tampilan booth berhenti",
                "Klik Coba lagi untuk memuat ulang aplikasi booth.",
                true);
    }

    private void ShowStatus(string title, string detail, bool canRetry)
    {
        statusTitle.Text = title;
        statusDetail.Text = detail;
        retryButton.Visible = canRetry;
        statusPanel.Visible = true;
        statusPanel.BringToFront();

        if (statusPanel.Controls.Count > 0)
        {
            var content = statusPanel.Controls[0];
            content.Left = Math.Max(24, (statusPanel.ClientSize.Width - content.Width) / 2);
            content.Top = Math.Max(24, (statusPanel.ClientSize.Height - content.Height) / 2);
        }
    }

    private void OnFormClosing(object? sender, FormClosingEventArgs args)
    {
        if (allowClose
            || args.CloseReason is CloseReason.WindowsShutDown
                or CloseReason.TaskManagerClosing)
        {
            return;
        }

        args.Cancel = true;
        Hide();
    }

    private void OnKeyDown(object? sender, KeyEventArgs args)
    {
        if (args.KeyCode == Keys.F5)
        {
            ReloadBooth();
            args.Handled = true;
        }
    }

    private static Uri ValidateBoothUri(string boothUrl)
    {
        if (!Uri.TryCreate(boothUrl, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttps
                && !(uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback)))
        {
            throw new InvalidOperationException(
                "Booth:Url harus memakai HTTPS atau HTTP localhost untuk development.");
        }

        return uri;
    }
}
#endif
