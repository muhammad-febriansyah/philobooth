; Inno Setup script for the Philobooth Booth desktop application.
;
; This installer carries the published agent exe directly. Installation does
; not require a second connection to GitHub, which is important on booth PCs
; with restricted DNS.
;
; Compiling needs Windows. There is normally no reason to do it by hand — run the
; "agent-installer" GitHub Actions workflow instead, which builds the agent and
; compiles this script on a Windows runner and hands back both files.
;
; By hand, on Windows:
;
;   cd dslr-agent
;   dotnet publish -c Release
;   ISCC installer\philobooth-agent.iss /DAppVersion="1.0.0"
;
; Produces installer\Output\philobooth-booth-setup.exe.

#define AppName "Philobooth Booth"
#define AppExe "philobooth-booth.exe"

; Overridable at compile time via ISCC's /DAppVersion=...
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif

#define Publisher "Philobooth"

; Path to the published build bundled into the installer.
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
; Main executable and Canon native runtime are installed locally.
Source: "{#PublishDir}\{#AppExe}"; DestDir: "{app}"; Flags: ignoreversion
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
