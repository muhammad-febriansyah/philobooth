; Inno Setup script for the Philobooth Camera agent.
;
; This produces a small "stub" installer (a few MB) rather than one that carries
; the ~180 MB agent exe inside it. The operator downloads the small file — which
; a booth's connection can actually finish — and the installer then fetches the
; payload with a progress bar, retries by itself if the connection drops, and
; refuses to install a payload whose SHA-256 doesn't match. A browser download of
; the raw exe had no such check: a truncated file installed happily and Windows
; then reported "This app can't run on your PC".
;
; Requires Inno Setup 6.1.0 or newer (for CreateDownloadPage).
;
; Compiling needs Windows. There is normally no reason to do it by hand — run the
; "agent-installer" GitHub Actions workflow instead, which builds the agent and
; compiles this script on a Windows runner and hands back both files.
;
; By hand, on Windows:
;
;   cd dslr-agent
;   dotnet publish -c Release
;   php artisan agent:publish --payload   (from the Laravel app; prints URL + hash)
;   ISCC installer\philobooth-agent.iss /DPayloadUrl="https://..." /DPayloadSha256="..."
;
; Produces installer\Output\philobooth-camera-setup.exe.

#define AppName "Philobooth Camera"
#define AppExe "philobooth-dslr-agent.exe"

; Overridable at compile time via ISCC's /DAppVersion=...
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif

#define Publisher "Philobooth"

; Where the installer fetches the agent exe from, and the SHA-256 it must have.
; Both are overridden at compile time (see the ISCC line above); the defaults
; only exist so the script compiles unattended. An empty hash skips verification
; — never ship a release built that way.
#ifndef PayloadUrl
  #define PayloadUrl "https://philobooth.test/agent/philobooth-dslr-agent.exe"
#endif
#ifndef PayloadSha256
  #define PayloadSha256 ""
#endif

; Path to the published build. Only the small side files (EDSDK natives, if the
; build included them) are compiled into the installer; the exe is downloaded.
#define PublishDir "..\bin\Release\net8.0-windows\win-x64\publish"

[Setup]
AppId={{A7F3C2E1-9B4D-4E6A-8C1F-2D3E4F5A6B7C}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#Publisher}
VersionInfoVersion={#AppVersion}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputBaseFilename=philobooth-camera-setup
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible
PrivilegesRequired=admin
MinVersion=10.0
WizardStyle=modern
; Close a running copy on update, and relaunch it when done.
CloseApplications=yes
RestartApplications=yes

[Tasks]
Name: "autostart"; Description: "Jalankan otomatis saat Windows menyala"; GroupDescription: "Startup:"

[Files]
; Downloaded to {tmp} before this step runs — see NextButtonClick below.
Source: "{tmp}\{#AppExe}"; DestDir: "{app}"; Flags: ignoreversion external
; EDSDK / native DLLs that sit next to the exe (only when present). Small enough
; to carry inside the installer.
Source: "{#PublishDir}\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"
; Auto-start on login (only if the operator kept the task checked).
Name: "{autostartup}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: autostart

[Run]
Filename: "{app}\{#AppExe}"; Description: "Jalankan {#AppName} sekarang"; Flags: nowait postinstall skipifsilent

[Code]
const
  DownloadAttempts = 3;

var
  DownloadPage: TDownloadWizardPage;

function OnDownloadProgress(const Url, FileName: String; const Progress, ProgressMax: Int64): Boolean;
begin
  if ProgressMax > 0 then
  begin
    DownloadPage.SetText(
      'Mengunduh aplikasi kamera...',
      Format('%.1f MB dari %.1f MB', [Progress / 1048576, ProgressMax / 1048576]));
  end;
  Result := True;
end;

procedure InitializeWizard;
begin
  DownloadPage := CreateDownloadPage(
    'Mengunduh aplikasi',
    'File aplikasi sedang diunduh. Pastikan internet tetap tersambung.',
    @OnDownloadProgress);
end;

{ Downloads the payload, retrying a few times so a single dropped connection
  doesn't send the operator back to the browser. Returns True once the file is
  in {tmp} with a matching hash. }
function DownloadPayload: Boolean;
var
  Attempt: Integer;
  LastError: String;
begin
  Result := False;

  for Attempt := 1 to DownloadAttempts do
  begin
    DownloadPage.Clear;
    DownloadPage.Add('{#PayloadUrl}', '{#AppExe}', '{#PayloadSha256}');

    try
      DownloadPage.Download;
      Result := True;
      Exit;
    except
      LastError := GetExceptionMessage;
      if Attempt < DownloadAttempts then
      begin
        DownloadPage.SetText(
          'Unduhan terputus, mencoba lagi...',
          Format('Percobaan %d dari %d', [Attempt + 1, DownloadAttempts]));
      end;
    end;
  end;

  SuppressibleMsgBox(
    'Gagal mengunduh aplikasi setelah ' + IntToStr(DownloadAttempts) + ' percobaan.' + #13#10#13#10 +
    LastError + #13#10#13#10 +
    'Periksa koneksi internet, lalu jalankan installer ini lagi.',
    mbCriticalError, MB_OK, IDOK);
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  if CurPageID <> wpReady then
  begin
    Result := True;
    Exit;
  end;

  DownloadPage.Show;
  try
    Result := DownloadPayload;
  finally
    DownloadPage.Hide;
  end;
end;
