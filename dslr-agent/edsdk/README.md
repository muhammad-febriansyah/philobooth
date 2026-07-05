# Canon EDSDK backend (optional)

Best Canon support (all bodies with a remote API — excludes M3, R1, M100, which
have no tethering interface). Off by default so the standard build needs no
proprietary SDK.

## Enable

1. Join the **Canon Developer Programme** (free) and download the **EDSDK for
   Windows**: <https://developers.canon-europe.com/> (or the Asia portal).
2. From the SDK package, copy into this `edsdk/` folder:
   - `EDSDKLib.cs` — the C# wrapper (namespace `EDSDKLib`).
   - The native DLLs: `EDSDK.dll`, `EdsImage.dll`, and the `Edsdk`/dependency
     DLLs shipped alongside them (use the **x64** set to match `win-x64`).
3. Build with the flag:

   ```bash
   dotnet publish -c Release -p:IncludeEdsdk=true
   ```

4. Force this backend at runtime via `appsettings.json`:

   ```json
   { "Camera": { "Mode": "Edsdk" } }
   ```

   Leave `Mode` as `null` to auto-pick digiCamControl (default). There is no
   auto-fallback between EDSDK and digiCamControl in one build — pick per booth
   by camera brand (Canon → `Edsdk`, Nikon → `DigiCam`).

## Verify on Windows

`Services/EdsdkCameraService.cs` follows the EDSDK reference but is compiled out
of the default build and cannot be tested without the SDK + a Canon body. Before
production, confirm on the kiosk:

- `GET /health` shows `backend: "edsdk"` and the connected `cameraModel`.
- `GET /settings` lists real ISO / shutter / aperture values.
- The code↔label tables in `EdsdkCameraService.cs` match what the camera
  reports (unmapped codes appear as raw hex like `0x58` — add them to the maps).
- `POST /capture` returns a full-resolution JPEG.

> Close Canon **EOS Utility** first — it locks the camera and EDSDK cannot open a
> session while it runs.
