# Philobooth DSLR Agent

Headless local HTTP service that lets the kiosk browser control a tethered
DSLR. The browser cannot touch a USB camera directly, so this agent runs on the
kiosk machine, drives the camera, and exposes a small HTTP API the kiosk
frontend calls (`resources/js/lib/dslr-agent.ts`).

```
[React kiosk] --HTTP localhost:5000--> [this agent] --PTP/USB--> [DSLR]
```

## Platforms

- **Windows (production kiosk):** real DSLR control + printing + a system-tray
  icon. Two camera engines:
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
# -> bin/Release/net8.0-windows/win-x64/publish/philobooth-dslr-agent.exe
```

The exe runs as a tray app (no console window) and shows an icon near the clock.
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

### Serving the exe from the dashboard

The dashboard has a "Download aplikasi" button (`GET /admin/agent-download`).
Place the built exe on the server's `local` disk so operators can download it
(the `local` disk root is `storage/app/private`):

```
storage/app/private/agent/philobooth-dslr-agent.exe
```

The button shows "Belum tersedia" until that file exists. Replace it with the
Inno Setup installer (renamed to the same path) once you build one.

### Installer (operator-friendly)

`installer/philobooth-agent.iss` is an Inno Setup script that wraps the exe in a
next-next-finish installer, auto-starts it on login, and launches it after setup:

```bash
dotnet publish -c Release
ISCC installer\philobooth-agent.iss
# -> installer\Output\philobooth-agent-setup.exe
```

Plug in the DSLR (set to PTP mode), run the installer, then open the kiosk.

## Config

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
