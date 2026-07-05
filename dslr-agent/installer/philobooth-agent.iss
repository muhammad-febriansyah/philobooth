; Inno Setup script for the Philobooth Camera agent.
;
; Build the agent, then compile this with Inno Setup (ISCC.exe) on Windows:
;
;   cd dslr-agent
;   dotnet publish -c Release
;   ISCC installer\philobooth-agent.iss
;
; Produces installer\Output\philobooth-camera-setup.exe — a next-next-finish
; installer for the booth operator. It installs the single-file exe, starts it
; automatically on login, closes any running copy on update, and launches it at
; the end of setup.

#define AppName "Philobooth Camera"
#define AppVersion "1.0.0"
#define AppExe "philobooth-dslr-agent.exe"
#define Publisher "Philobooth"

; Path to the published single-file exe (adjust the TFM folder if it differs).
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
Source: "{#PublishDir}\{#AppExe}"; DestDir: "{app}"; Flags: ignoreversion
; EDSDK / native DLLs that sit next to the exe (only when present).
Source: "{#PublishDir}\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"
; Auto-start on login (only if the operator kept the task checked).
Name: "{autostartup}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: autostart

[Run]
Filename: "{app}\{#AppExe}"; Description: "Jalankan {#AppName} sekarang"; Flags: nowait postinstall skipifsilent
