; Inno Setup script for the Philobooth DSLR Agent.
; Build the agent first, then compile this with Inno Setup (ISCC.exe):
;
;   dotnet publish -c Release
;   ISCC installer\philobooth-agent.iss
;
; Produces installer\Output\philobooth-agent-setup.exe — a next-next-finish
; installer for the booth operator. Installs the single-file exe, auto-starts it
; on login, and launches it at the end of setup.

#define AppName "Philobooth Camera"
#define AppVersion "1.0.0"
#define AppExe "philobooth-dslr-agent.exe"
#define Publisher "Philobooth"

; Path to the published single-file exe (adjust if your TFM folder differs).
#define PublishDir "..\bin\Release\net8.0-windows\win-x64\publish"

[Setup]
AppId={{8E6F5A21-2C4B-4E9A-9B3D-PHILOBOOTH01}}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#Publisher}
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputBaseFilename=philobooth-agent-setup
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible
PrivilegesRequired=admin
WizardStyle=modern

[Files]
Source: "{#PublishDir}\{#AppExe}"; DestDir: "{app}"; Flags: ignoreversion
; If EDSDK is bundled, its native DLLs sit next to the exe — include them too:
Source: "{#PublishDir}\*.dll"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{autostartup}\{#AppName}"; Filename: "{app}\{#AppExe}"

[Run]
Filename: "{app}\{#AppExe}"; Description: "Jalankan {#AppName} sekarang"; Flags: nowait postinstall skipifsilent
