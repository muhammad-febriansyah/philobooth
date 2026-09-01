; Inno Setup script for the Philobooth Booth desktop application.
;
; This produces a small "stub" installer (a few MB) rather than one that carries
; the ~180 MB agent exe inside it. The operator downloads the small file — which
; a booth's connection can actually finish — and the installer then fetches the
; payload with Inno Setup's built-in download support and refuses to install a
; payload whose size or SHA-256 doesn't match. Using a declarative [Files] entry
; also avoids the Pascal download callback that caused "Out Of Stack Range" on
; some operator PCs. A browser download of the raw exe had no such check: a
; truncated file installed happily and Windows then reported "This app can't run
; on your PC".
;
; Requires Inno Setup 6.5.0 or newer (for the [Files] download flag + Hash).
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
;   ISCC installer\philobooth-agent.iss /DPayloadUrl="https://..." /DPayloadSha256="..." /DPayloadSize=123456789
;
; Produces installer\Output\philobooth-booth-setup.exe.

#define AppName "Philobooth Booth"
#define AppExe "philobooth-booth.exe"

; Overridable at compile time via ISCC's /DAppVersion=...
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif

#define Publisher "Philobooth"

; Where the installer fetches the agent exe from, and the SHA-256 it must have.
; Both values are mandatory. Refuse to compile an installer that could download
; from a development URL or skip integrity verification.
#ifndef PayloadUrl
  #error PayloadUrl is required. Pass /DPayloadUrl="https://..."
#endif
#ifndef PayloadSha256
  #error PayloadSha256 is required. Pass /DPayloadSha256="<64 hex characters>"
#endif
#ifndef PayloadSize
  #error PayloadSize is required. Pass /DPayloadSize=<size in bytes>
#endif
#if PayloadUrl == ""
  #error PayloadUrl cannot be empty
#endif
#if PayloadSha256 == ""
  #error PayloadSha256 cannot be empty
#endif
#if Copy(PayloadUrl, 1, 8) != "https://"
  #error PayloadUrl must use HTTPS
#endif
#if Len(PayloadSha256) != 64
  #error PayloadSha256 must contain exactly 64 hexadecimal characters
#endif
#if PayloadSize == ""
  #error PayloadSize cannot be empty
#endif

; Path to the published build. Only the small side files (EDSDK natives, if the
; build included them) are compiled into the installer; the exe is downloaded.
#define PublishDir "..\bin\Release\net8.0-windows\win-x86\publish"

[Setup]
AppId={{A7F3C2E1-9B4D-4E6A-8C1F-2D3E4F5A6B7C}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#Publisher}
VersionInfoVersion={#AppVersion}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputBaseFilename=philobooth-booth-setup
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
; Inno Setup downloads directly to a temporary name in {app}, verifies the
; expected size and SHA-256, then atomically activates the final filename. On a
; failed connection the standard installer UI offers Retry or Cancel.
Source: "{#PayloadUrl}"; DestDir: "{app}"; DestName: "{#AppExe}"; Hash: "{#PayloadSha256}"; ExternalSize: {#PayloadSize}; Flags: external download ignoreversion
; WebView2 loader and optional camera native DLLs sit beside the single-file exe.
Source: "{#PublishDir}\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
; Refresh production defaults on every upgrade. Older camera-only installers
; could leave Camera.Mode=Mock behind, which makes a real DSLR invisible even
; though the new executable is installed correctly. CI can still override this
; with Camera__Mode=Mock during its isolated smoke test.
Source: "{#PublishDir}\appsettings.json"; DestDir: "{app}"; Flags: ignoreversion
; Official Microsoft bootstrapper is downloaded and Authenticode-verified by CI.
Source: "MicrosoftEdgeWebView2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[InstallDelete]
; Remove the payload name used by camera-only releases with the same AppId.
Type: files; Name: "{app}\philobooth-dslr-agent.exe"

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"
; Auto-start on login (only if the operator kept the task checked).
Name: "{autostartup}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: autostart

[Run]
Filename: "{tmp}\MicrosoftEdgeWebView2Setup.exe"; Parameters: "/silent /install"; StatusMsg: "Memasang komponen tampilan Microsoft WebView2..."; Flags: runhidden waituntilterminated
Filename: "{app}\{#AppExe}"; Description: "Jalankan {#AppName} sekarang"; Flags: nowait postinstall skipifsilent
