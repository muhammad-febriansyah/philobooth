/**
 * DSLR agent client.
 *
 * The kiosk browser cannot talk to a DSLR over USB directly. Instead a small
 * headless agent (C# / .NET) runs on the kiosk machine, exposes a local HTTP
 * API, and drives the camera through a vendor SDK / gphoto2.
 *
 * This module defines the contract the UI codes against. Right now it ships a
 * MOCK implementation so the capture flow can be built and demoed without any
 * hardware. To go live, point `AGENT_BASE_URL` at the real agent and swap
 * `mockAgent` for `httpAgent` (already stubbed below).
 */

/** A single adjustable camera setting and its currently selected value. */
export type DslrSetting = {
    /** Allowed values reported by the camera, e.g. ['100','200','400']. */
    options: string[];
    /** Currently selected value (must be one of `options`). */
    current: string;
};

/** Full set of exposure controls the agent exposes. */
export type DslrSettings = {
    iso: DslrSetting;
    shutter: DslrSetting;
    aperture: DslrSetting;
};

/** Which exposure parameter to change. */
export type DslrSettingKey = keyof DslrSettings;

/** Result of a capture: a full-resolution JPEG pulled off the camera. */
export type DslrCaptureResult = {
    file: File;
    url: string;
};

/**
 * Diagnostic snapshot from the agent's /health endpoint. Lets the kiosk tell
 * apart the three failure modes an operator needs to distinguish:
 *   - agent not running        → agentReachable = false
 *   - agent up, no camera       → agentReachable = true, cameraConnected = false
 *   - camera attached           → cameraConnected = true, cameraModel set
 */
export type DslrStatus = {
    /** The agent process answered (regardless of camera state). */
    agentReachable: boolean;
    /** A camera is connected and ready. */
    cameraConnected: boolean;
    /** Model of the connected camera, or null. */
    cameraModel: string | null;
    /** Backend driving the agent: 'mock' | 'digicam' | null when unreachable. */
    backend: string | null;
    /** Actionable backend startup error reported by the Windows app. */
    error: string | null;
};

export interface DslrAgent {
    /** True if the agent process is reachable and a camera is connected. */
    isAvailable(): Promise<boolean>;
    /** Detailed health snapshot for the kiosk status indicator. */
    getStatus(): Promise<DslrStatus>;
    /** Ask the local agent to scan USB for a newly connected DSLR. */
    connect(): Promise<DslrStatus>;
    /** Read current settings + allowed values from the connected camera. */
    getSettings(): Promise<DslrSettings>;
    /** Push a new value for one exposure parameter to the camera. */
    setSetting(key: DslrSettingKey, value: string): Promise<void>;
    /** Trigger the shutter and download the resulting full-res photo. */
    capture(filename: string): Promise<DslrCaptureResult>;
}

/** Local agent endpoint. Override via VITE_DSLR_AGENT_URL when going live. */
export const AGENT_BASE_URL =
    import.meta.env.VITE_DSLR_AGENT_URL ?? 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Mock implementation — no hardware required.
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const MOCK_SETTINGS: DslrSettings = {
    iso: {
        options: ['100', '200', '400', '800', '1600', '3200'],
        current: '400',
    },
    shutter: {
        options: ['1/30', '1/60', '1/125', '1/250', '1/500', '1/1000'],
        current: '1/125',
    },
    aperture: {
        options: ['f/1.8', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11'],
        current: 'f/5.6',
    },
};

/**
 * Mock agent. Settings live in memory; capture is delegated to a caller-
 * supplied grabber (the webcam canvas) so the end-to-end flow still produces
 * a real image during development.
 */
export function createMockAgent(
    grabFrame: (filename: string) => Promise<DslrCaptureResult>,
): DslrAgent {
    const state: DslrSettings = structuredClone(MOCK_SETTINGS);

    return {
        async isAvailable() {
            await delay(150);

            return true;
        },
        async getStatus() {
            await delay(150);

            return {
                agentReachable: true,
                cameraConnected: true,
                cameraModel: 'Kamera Mock (dev)',
                backend: 'mock',
                error: null,
            };
        },
        async connect() {
            await delay(150);

            return this.getStatus();
        },
        async getSettings() {
            await delay(200);

            return structuredClone(state);
        },
        async setSetting(key, value) {
            await delay(120);

            if (state[key].options.includes(value)) {
                state[key].current = value;
            }
        },
        async capture(filename) {
            // Simulate shutter + transfer latency of a real DSLR.
            await delay(400);

            return grabFrame(filename);
        },
    };
}

// ---------------------------------------------------------------------------
// Real HTTP implementation — wired against the C# agent. Not used until the
// agent exists; kept here so the swap is a one-line change.
// ---------------------------------------------------------------------------

export function createHttpAgent(baseUrl = AGENT_BASE_URL): DslrAgent {
    return {
        async isAvailable() {
            try {
                const res = await fetch(`${baseUrl}/health`, {
                    signal: AbortSignal.timeout(5_000),
                });

                if (!res.ok) {
                    return false;
                }

                const body = (await res.json()) as {
                    cameraConnected?: boolean;
                };

                return body.cameraConnected === true;
            } catch {
                return false;
            }
        },
        async getStatus() {
            try {
                const res = await fetch(`${baseUrl}/health`, {
                    signal: AbortSignal.timeout(5_000),
                });

                if (!res.ok) {
                    return {
                        agentReachable: true,
                        cameraConnected: false,
                        cameraModel: null,
                        backend: null,
                        error: null,
                    };
                }

                const body = (await res.json()) as {
                    cameraConnected?: boolean;
                    cameraModel?: string | null;
                    backend?: string | null;
                    error?: string | null;
                };

                return {
                    agentReachable: true,
                    cameraConnected: body.cameraConnected ?? false,
                    cameraModel: body.cameraModel ?? null,
                    backend: body.backend ?? null,
                    error: body.error ?? null,
                };
            } catch {
                // Connection refused / DNS / network — agent process is down.
                return {
                    agentReachable: false,
                    cameraConnected: false,
                    cameraModel: null,
                    backend: null,
                    error: null,
                };
            }
        },
        async connect() {
            try {
                const res = await fetch(`${baseUrl}/camera/connect`, {
                    method: 'POST',
                    signal: AbortSignal.timeout(10_000),
                });

                if (!res.ok) {
                    throw new Error('Failed to connect DSLR');
                }

                return (await res.json()) as DslrStatus;
            } catch {
                return this.getStatus();
            }
        },
        async getSettings() {
            const res = await fetch(`${baseUrl}/settings`, {
                signal: AbortSignal.timeout(5_000),
            });

            if (!res.ok) {
                throw new Error('Failed to read DSLR settings');
            }

            return (await res.json()) as DslrSettings;
        },
        async setSetting(key, value) {
            const res = await fetch(`${baseUrl}/set`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
                signal: AbortSignal.timeout(5_000),
            });

            if (!res.ok) {
                throw new Error(`Failed to set ${key}`);
            }
        },
        async capture(filename) {
            const res = await fetch(`${baseUrl}/capture`, {
                method: 'POST',
                signal: AbortSignal.timeout(35_000),
            });

            if (!res.ok) {
                throw new Error('Capture failed');
            }

            const blob = await res.blob();
            const file = new File([blob], filename, { type: blob.type });

            return { file, url: URL.createObjectURL(file) };
        },
    };
}

// ---------------------------------------------------------------------------
// Factory — picks the implementation from the build environment so dev and
// production can differ without code changes.
//   VITE_DSLR_AGENT_MODE = 'mock' | 'http'
//   default: 'mock' in dev, 'http' in production builds.
// ---------------------------------------------------------------------------

export type DslrAgentMode = 'mock' | 'http';

/**
 * Build the DSLR agent for the current environment.
 *
 * @param grabFrame Webcam-canvas grabber, used by the mock agent's capture so
 *                  the flow still produces a real image without hardware.
 */
export function createAgent(
    grabFrame: (filename: string) => Promise<DslrCaptureResult>,
): DslrAgent {
    const mode: DslrAgentMode =
        (import.meta.env.VITE_DSLR_AGENT_MODE as DslrAgentMode | undefined) ??
        (import.meta.env.DEV ? 'mock' : 'http');

    return mode === 'http' ? createHttpAgent() : createMockAgent(grabFrame);
}
