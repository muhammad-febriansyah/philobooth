/**
 * Printer agent client.
 *
 * Companion to `dslr-agent.ts`. The kiosk browser cannot drive a printer
 * directly, so the same local agent (C# / .NET) exposes `/printers` and
 * `/print`. This module is the typed contract the UI codes against, with a MOCK
 * implementation for dev and an HTTP implementation for production — selected
 * from the build environment exactly like the DSLR agent.
 */

import { AGENT_BASE_URL } from './dslr-agent';
import type { DslrAgentMode } from './dslr-agent';

/** A printer installed on the kiosk machine. */
export type PrinterInfo = {
    name: string;
    isDefault: boolean;
};

/** Response of GET /printers. */
export type PrinterListing = {
    /** Backend driving the agent: 'mock' | 'windows' | null when unreachable. */
    backend: string | null;
    printers: PrinterInfo[];
};

/** Options for a print job. */
export type PrintOptions = {
    /** Target printer name; omit for the system default. */
    printer?: string;
    /** Paper size name (e.g. '4x6'); omit for the printer default. */
    paper?: string;
    /** Number of copies (default 1). */
    copies?: number;
};

export interface PrintAgent {
    /** List printers installed on the kiosk machine. */
    listPrinters(): Promise<PrinterListing>;
    /** Send a composed photo (JPEG) to the printer. */
    printImage(jpeg: Blob, options?: PrintOptions): Promise<void>;
}

// ---------------------------------------------------------------------------
// Mock implementation — no hardware required.
// ---------------------------------------------------------------------------

export function createMockPrintAgent(): PrintAgent {
    return {
        async listPrinters() {
            return {
                backend: 'mock',
                printers: [
                    { name: 'Mock Printer (dev)', isDefault: true },
                    { name: 'Mock Photo Printer 4x6', isDefault: false },
                ],
            };
        },
        async printImage() {
            // No-op in dev; the real agent sends bytes to the OS print spooler.
        },
    };
}

// ---------------------------------------------------------------------------
// Real HTTP implementation — wired against the C# agent.
// ---------------------------------------------------------------------------

export function createHttpPrintAgent(baseUrl = AGENT_BASE_URL): PrintAgent {
    return {
        async listPrinters() {
            const res = await fetch(`${baseUrl}/printers`);

            if (!res.ok) {
                throw new Error('Failed to list printers');
            }

            const body = (await res.json()) as Partial<PrinterListing>;

            return {
                backend: body.backend ?? null,
                printers: body.printers ?? [],
            };
        },
        async printImage(jpeg, options = {}) {
            const params = new URLSearchParams();

            if (options.printer) {
                params.set('printer', options.printer);
            }

            if (options.paper) {
                params.set('paper', options.paper);
            }

            if (options.copies && options.copies > 1) {
                params.set('copies', String(options.copies));
            }

            const query = params.toString();
            const res = await fetch(
                `${baseUrl}/print${query ? `?${query}` : ''}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'image/jpeg' },
                    body: jpeg,
                },
            );

            if (!res.ok) {
                throw new Error('Print failed');
            }
        },
    };
}

// ---------------------------------------------------------------------------
// Factory — mirrors createAgent() in dslr-agent.ts.
//   VITE_DSLR_AGENT_MODE = 'mock' | 'http'
//   default: 'mock' in dev, 'http' in production builds.
// ---------------------------------------------------------------------------

export function createPrintAgent(): PrintAgent {
    const mode: DslrAgentMode =
        (import.meta.env.VITE_DSLR_AGENT_MODE as DslrAgentMode | undefined) ??
        (import.meta.env.DEV ? 'mock' : 'http');

    return mode === 'http' ? createHttpPrintAgent() : createMockPrintAgent();
}
