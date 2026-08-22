using DslrAgent.Models;
using DslrAgent.Services;

var builder = WebApplication.CreateBuilder(args);

// Listen on the port the kiosk frontend expects (VITE_DSLR_AGENT_URL).
builder.WebHost.UseUrls("http://localhost:5000");

// The kiosk runs in a browser on a different origin, so it needs CORS to call
// this local agent. Dev allows any origin; tighten to the kiosk URL in prod.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// Pick the camera backend. Default: real DSLR on Windows, mock everywhere else.
// Override with "Camera:Mode" = "Mock" | "DigiCam" | "Edsdk" in appsettings.json.
// ("Edsdk" requires a build with -p:IncludeEdsdk=true; see edsdk/README.md.)
var mode = builder.Configuration["Camera:Mode"];

#if WINDOWS
switch (mode)
{
    case "Mock":
        builder.Services.AddSingleton<ICameraService, MockCameraService>();
        break;
#if EDSDK
    case "Edsdk":
        builder.Services.AddSingleton<ICameraService, EdsdkCameraService>();
        break;
#endif
    default: // null or "DigiCam"
        builder.Services.AddSingleton<ICameraService, DigiCamCameraService>();
        break;
}

builder.Services.AddSingleton<IPrinterService, WindowsPrinterService>();
#else
if (mode is "DigiCam" or "Edsdk")
{
    throw new PlatformNotSupportedException(
        $"Camera mode '{mode}' requires Windows. Build/run on the kiosk machine, or use Camera:Mode=Mock.");
}

builder.Services.AddSingleton<ICameraService, MockCameraService>();
builder.Services.AddSingleton<IPrinterService, MockPrinterService>();
#endif

var app = builder.Build();

// Chrome's Private Network Access: when a public/secure page (https://philobooth.id)
// fetches a private address (http://localhost:5000), Chrome sends a preflight with
// `Access-Control-Request-Private-Network: true` and refuses the call unless the
// response echoes `Access-Control-Allow-Private-Network: true`. The CORS middleware
// does not add this, so set it before UseCors handles the preflight. Without this
// the agent is unreachable from the production site.
app.Use(async (context, next) =>
{
    if (HttpMethods.IsOptions(context.Request.Method) &&
        context.Request.Headers.ContainsKey("Access-Control-Request-Private-Network"))
    {
        context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
    }

    await next();
});

app.UseCors();

// --- Endpoints (contract matches resources/js/lib/dslr-agent.ts) ---

app.MapGet("/health", (ICameraService cam) =>
    Results.Ok(new
    {
        ok = true,
        cameraConnected = cam.IsAvailable,
        cameraModel = cam.Model,
        backend = cam.Backend,
        error = cam.Error,
    }));

app.MapGet("/settings", (ICameraService cam) =>
{
    try
    {
        return Results.Ok(cam.GetSettings());
    }
    catch (InvalidOperationException ex)
    {
        return Results.Problem(ex.Message, statusCode: 503);
    }
});

app.MapPost("/set", (SetRequest req, ICameraService cam) =>
{
    try
    {
        cam.SetSetting(req.Key, req.Value);

        return Results.Ok();
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/capture", async (ICameraService cam, CancellationToken ct) =>
{
    try
    {
        var result = await cam.CaptureAsync(ct);

        return Results.File(result.Bytes, "image/jpeg", result.FileName);
    }
    catch (OperationCanceledException)
    {
        return Results.StatusCode(499);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message, statusCode: 500);
    }
});

app.MapGet("/printers", (IPrinterService printer) =>
    Results.Ok(new { backend = printer.Backend, printers = printer.ListPrinters() }));

// POST the composed photo as the raw request body (image/jpeg). Optional query:
// ?printer=<name>&paper=<paperName>&copies=<n>
app.MapPost("/print", async (HttpRequest req, IPrinterService printer) =>
{
    using var ms = new MemoryStream();
    await req.Body.CopyToAsync(ms);
    var bytes = ms.ToArray();

    if (bytes.Length == 0)
    {
        return Results.BadRequest(
            new { error = "Empty body; POST the JPEG bytes as the request body." });
    }

    var printerName = req.Query["printer"].FirstOrDefault();
    var paper = req.Query["paper"].FirstOrDefault();
    var copies = int.TryParse(req.Query["copies"].FirstOrDefault(), out var c) ? c : 1;

    try
    {
        printer.Print(bytes, printerName, paper, copies);

        return Results.Ok(new { printed = true });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message, statusCode: 500);
    }
});

#if WINDOWS
DslrAgent.Tray.Start(app);
#endif

app.Run();
