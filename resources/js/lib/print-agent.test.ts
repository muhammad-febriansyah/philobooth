import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createHttpPrintAgent,
    createMockPrintAgent,
    createPrintAgent,
} from './print-agent';

describe('createMockPrintAgent', () => {
    it('lists mock printers with a default', async () => {
        const listing = await createMockPrintAgent().listPrinters();

        expect(listing.backend).toBe('mock');
        expect(listing.printers.length).toBeGreaterThan(0);
        expect(listing.printers.some((p) => p.isDefault)).toBe(true);
    });

    it('printImage resolves without hardware', async () => {
        await expect(
            createMockPrintAgent().printImage(new Blob(['x'])),
        ).resolves.toBeUndefined();
    });
});

describe('createHttpPrintAgent', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('listPrinters parses JSON', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(
                async () =>
                    new Response(
                        JSON.stringify({
                            backend: 'windows',
                            printers: [{ name: 'DNP DS620', isDefault: true }],
                        }),
                        { status: 200 },
                    ),
            ),
        );

        const listing = await createHttpPrintAgent().listPrinters();

        expect(listing.backend).toBe('windows');
        expect(listing.printers[0].name).toBe('DNP DS620');
    });

    it('listPrinters throws on non-ok', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response(null, { status: 500 })),
        );

        await expect(createHttpPrintAgent().listPrinters()).rejects.toThrow(
            'Failed to list printers',
        );
    });

    it('printImage posts the blob to the print URL with query params', async () => {
        let capturedUrl = '';
        let capturedInit: RequestInit | undefined;
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string, init?: RequestInit) => {
                capturedUrl = url;
                capturedInit = init;

                return new Response(null, { status: 200 });
            }),
        );

        await createHttpPrintAgent('http://localhost:5000').printImage(
            new Blob(['jpeg']),
            { printer: 'DNP DS620', paper: '4x6', copies: 2 },
        );

        expect(capturedUrl).toContain('/print?');
        expect(capturedUrl).toContain('printer=DNP+DS620');
        expect(capturedUrl).toContain('paper=4x6');
        expect(capturedUrl).toContain('copies=2');
        expect(capturedInit?.method).toBe('POST');
    });

    it('printImage omits copies when 1', async () => {
        let capturedUrl = '';
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string) => {
                capturedUrl = url;

                return new Response(null, { status: 200 });
            }),
        );

        await createHttpPrintAgent().printImage(new Blob(['jpeg']), {
            copies: 1,
        });

        expect(capturedUrl).not.toContain('copies=');
    });

    it('printImage throws on non-ok', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response(null, { status: 500 })),
        );

        await expect(
            createHttpPrintAgent().printImage(new Blob(['x'])),
        ).rejects.toThrow('Print failed');
    });
});

describe('createPrintAgent (env selection)', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('uses mock when VITE_DSLR_AGENT_MODE=mock', async () => {
        vi.stubEnv('VITE_DSLR_AGENT_MODE', 'mock');
        const listing = await createPrintAgent().listPrinters();

        expect(listing.backend).toBe('mock');
    });

    it('uses http when VITE_DSLR_AGENT_MODE=http', async () => {
        vi.stubEnv('VITE_DSLR_AGENT_MODE', 'http');
        const fetchMock = vi.fn(
            async () =>
                new Response(
                    JSON.stringify({ backend: 'windows', printers: [] }),
                    { status: 200 },
                ),
        );
        vi.stubGlobal('fetch', fetchMock);

        await createPrintAgent().listPrinters();

        expect(fetchMock).toHaveBeenCalled();
    });
});
