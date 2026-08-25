# Philobooth Booth for Windows

Windows desktop booth application. It opens the customer menu in an embedded
WebView2 at `https://philobooth.id/kiosk/welcome`, controls the tethered DSLR,
and prints through the local Windows printer service. Operators launch one app;
the local HTTP bridge runs behind the embedded booth UI.

```
[WebView2: philobooth.id] --HTTP localhost:5000--> [local bridge] --> [DSLR/printer]
```

## Platforms

- **Windows (production kiosk):** full-screen WebView2 booth + real DSLR control
  + printing + a system-tray icon. Two camera engines:
  - `CameraControl.Devices` (digiCamControl) — default. Nikon well supported,
    Canon partial, Sony limited.
  - Canon **EDSDK** — best Canon support, opt-in build. See `edsdk/README.md`.
- **macOS/Linux (dev, e.g. MBP):** builds a plain `net8.0` target with the
  **mock** camera + **mock** printer only — no hardware control. Use it to test
  the HTTP layer and kiosk wiring. `CameraControl.Devices`, the real printer, and
  the tray are Windows-only and excluded from this build.

## Run (dev, macOS)

```bash
cd dslr-agent
dotnet run
# -> http://localhost:5000  (mock camera)
```

## Build kiosk .exe (Windows)

The RID, self-contained, and single-file settings live in the csproj, so on
Windows:

```bash
dotnet publish -c Release
# -> bin/Release/net8.0-windows/win-x64/publish/philobooth-booth.exe
```

The exe opens the booth menu full screen and also shows an icon near the clock.
For Canon EDSDK support add `-p:IncludeEdsdk=true` (see `edsdk/README.md`).

### Cross-build the exe from macOS/Linux

The Windows target is keyed off the TFM (not the build OS) and
`EnableWindowsTargeting` is on, so the kiosk exe can be produced without a
Windows machine (restore separately because of the TFM override):

```bash
dotnet restore -p:TargetFramework=net8.0-windows
dotnet publish -c Release -p:TargetFramework=net8.0-windows --no-restore
```

The camera engine (`CameraControl.Devices`) is a .NET Framework package used via
the compat shim (the `NU1701` restore warning is expected). Camera + printing
still need a real Windows machine to test at runtime.

### Publishing the installer to the dashboard

The dashboard has a "Download aplikasi" button (`GET /admin/agent-download`).
Operators must receive the small verified installer, **not** the raw ~180 MB
agent executable. Run the `agent-installer` GitHub Actions workflow with a new
SemVer version, then download both files from its `installer` artifact:

```
philobooth-booth-setup.exe
philobooth-booth-checksums.txt
```

Read `installer_sha256` from the checksum file and publish the installer on the
Laravel server:

```bash
php artisan agent:publish --installer \
  --installer-file=philobooth-booth-setup.exe \
  --installer-sha256=<installer_sha256>
```

The command verifies the Windows executable and trusted checksum, copies it
atomically to `storage/app/private/agent/philobooth-booth-setup.exe`, and only
then makes the dashboard button available.

### Installer (operator-friendly)

`installer/philobooth-agent.iss` builds a small next-next-finish installer. It
uses Inno Setup's built-in downloader, verifies the payload size and SHA-256,
enables optional auto-start, and launches the agent after setup. Use the
workflow above for a release build. A manual Windows build requires a real
payload URL, hash, and byte size:

```bash
dotnet publish -c Release
ISCC installer\philobooth-agent.iss /DPayloadUrl="https://.../philobooth-booth.exe" /DPayloadSha256="<64 hex characters>" /DPayloadSize=<size in bytes>
# -> installer\Output\philobooth-booth-setup.exe
```

Plug in the DSLR (set to PTP mode), run the installer, then open the kiosk.

## Config

`appsettings.json` → `Booth:Url` controls the embedded page and defaults to
`https://philobooth.id/kiosk/welcome`. `Booth:AllowedOrigins` controls which web
origins may call the protected localhost bridge.

`appsettings.json` → `Camera:Mode`:

- `null` (default): real DSLR (digiCamControl) on Windows, mock elsewhere.
- `"Mock"`: force mock (useful on Windows without a camera).
- `"DigiCam"`: force digiCamControl engine (Windows only; errors elsewhere).
- `"Edsdk"`: force Canon EDSDK engine (Windows + `-p:IncludeEdsdk=true` build).

`Printer:DefaultPrinter` / `Printer:DefaultPaperSize` set fallbacks; the kiosk
can override per job via the `/print` query params.

## HTTP API

| Method | Path        | Body                  | Returns                                  |
| ------ | ----------- | --------------------- | ---------------------------------------- |
| GET    | `/health`   | —                     | `{ ok, cameraConnected, cameraModel, backend }` |
| GET    | `/settings` | —                     | `{ iso, shutter, aperture }` each `{ options[], current }` |
| POST   | `/set`      | `{ key, value }`      | 200 / 400                                |
| POST   | `/capture`  | —                     | `image/jpeg` (full-res file)             |
| GET    | `/printers` | —                     | `{ backend, printers[] }` each `{ name, isDefault }` |
| POST   | `/print`    | `image/jpeg` (raw)    | `{ printed }` — query: `?printer=&paper=&copies=` |

Chrome's Private Network Access: the agent echoes
`Access-Control-Allow-Private-Network: true` on preflight so the production HTTPS
site (`https://philobooth.id`) may call `http://localhost:5000`.

## Wiring the frontend

The kiosk picks its agent from the build environment via `createAgent()`
(`resources/js/lib/dslr-agent.ts`), no code change needed:

```
VITE_DSLR_AGENT_MODE = 'mock' | 'http'   # default: mock in dev, http in prod
VITE_DSLR_AGENT_URL  = http://localhost:5000   # override host/port
```

- `mock`: browser-only, capture falls back to the webcam canvas (no agent).
- `http`: calls this agent. Run it first (`dotnet run` / the `.exe`).
