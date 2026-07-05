import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgent, createHttpAgent, createMockAgent } from './dslr-agent';
import type { DslrCaptureResult } from './dslr-agent';

const fakeGrab = (filename: string): Promise<DslrCaptureResult> =>
    Promise.resolve({
        file: new File(['x'], filename, { type: 'image/jpeg' }),
        url: `blob:${filename}`,
    });

describe('createMockAgent', () => {
    it('reports available', async () => {
        await expect(createMockAgent(fakeGrab).isAvailable()).resolves.toBe(
            true,
        );
    });

    it('returns default settings', async () => {
        const settings = await createMockAgent(fakeGrab).getSettings();

        expect(settings.iso.current).toBe('400');
        expect(settings.iso.options).toContain('400');
        expect(settings.shutter.current).toBe('1/125');
        expect(settings.aperture.current).toBe('f/5.6');
    });

    it('returns a clone, not internal state', async () => {
        const agent = createMockAgent(fakeGrab);
        const first = await agent.getSettings();
        first.iso.current = 'mutated';
        const second = await agent.getSettings();

        expect(second.iso.current).toBe('400');
    });

    it('applies a valid setting', async () => {
        const agent = createMockAgent(fakeGrab);
        await agent.setSetting('iso', '1600');

        expect((await agent.getSettings()).iso.current).toBe('1600');
    });

    it('ignores a value not in options', async () => {
        const agent = createMockAgent(fakeGrab);
        await agent.setSetting('iso', '99999');

        expect((await agent.getSettings()).iso.current).toBe('400');
    });

    it('delegates capture to the supplied grabber', async () => {
        const grab = vi.fn(fakeGrab);
        const result = await createMockAgent(grab).capture('slot-1.jpg');

        expect(grab).toHaveBeenCalledWith('slot-1.jpg');
        expect(result.file.name).toBe('slot-1.jpg');
    });

    it('reports a connected status', async () => {
        const status = await createMockAgent(fakeGrab).getStatus();

        expect(status.agentReachable).toBe(true);
        expect(status.cameraConnected).toBe(true);
        expect(status.backend).toBe('mock');
    });
});

describe('createHttpAgent', () => {
    beforeEach(() => {
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => 'blob:fake'),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('isAvailable true when /health ok', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response(null, { status: 200 })),
        );

        await expect(createHttpAgent().isAvailable()).resolves.toBe(true);
    });

    it('isAvailable false when fetch throws', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('refused');
            }),
        );

        await expect(createHttpAgent().isAvailable()).resolves.toBe(false);
    });

    it('getStatus maps health payload with a connected camera', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(
                async () =>
                    new Response(
                        JSON.stringify({
                            ok: true,
                            cameraConnected: true,
                            cameraModel: 'Canon EOS 750D',
                            backend: 'digicam',
                        }),
                        { status: 200 },
                    ),
            ),
        );

        const status = await createHttpAgent().getStatus();

        expect(status.agentReachable).toBe(true);
        expect(status.cameraConnected).toBe(true);
        expect(status.cameraModel).toBe('Canon EOS 750D');
        expect(status.backend).toBe('digicam');
    });

    it('getStatus reports agent up but no camera', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(
                async () =>
                    new Response(
                        JSON.stringify({
                            ok: true,
                            cameraConnected: false,
                            cameraModel: null,
                            backend: 'digicam',
                        }),
                        { status: 200 },
                    ),
            ),
        );

        const status = await createHttpAgent().getStatus();

        expect(status.agentReachable).toBe(true);
        expect(status.cameraConnected).toBe(false);
        expect(status.cameraModel).toBeNull();
    });

    it('getStatus reports agent unreachable when fetch throws', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => {
                throw new Error('refused');
            }),
        );

        const status = await createHttpAgent().getStatus();

        expect(status.agentReachable).toBe(false);
        expect(status.cameraConnected).toBe(false);
        expect(status.backend).toBeNull();
    });

    it('getSettings parses JSON', async () => {
        const payload = {
            iso: { options: ['100', '200'], current: '200' },
            shutter: { options: ['1/60'], current: '1/60' },
            aperture: { options: ['f/4'], current: 'f/4' },
        };
        vi.stubGlobal(
            'fetch',
            vi.fn(
                async () =>
                    new Response(JSON.stringify(payload), { status: 200 }),
            ),
        );

        expect((await createHttpAgent().getSettings()).iso.current).toBe('200');
    });

    it('setSetting throws on non-ok', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response(null, { status: 400 })),
        );

        await expect(
            createHttpAgent().setSetting('iso', '100'),
        ).rejects.toThrow('Failed to set iso');
    });

    it('capture returns a File from the response blob', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(
                async () =>
                    new Response(
                        new Blob(['jpegdata'], { type: 'image/jpeg' }),
                        {
                            status: 200,
                        },
                    ),
            ),
        );

        const result = await createHttpAgent().capture('slot-2.jpg');

        expect(result.file.name).toBe('slot-2.jpg');
        expect(result.file.type).toBe('image/jpeg');
    });
});

describe('createAgent (env selection)', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('uses mock when VITE_DSLR_AGENT_MODE=mock', async () => {
        vi.stubEnv('VITE_DSLR_AGENT_MODE', 'mock');
        const grab = vi.fn(fakeGrab);
        await createAgent(grab).capture('slot-1.jpg');

        expect(grab).toHaveBeenCalled();
    });

    it('uses http when VITE_DSLR_AGENT_MODE=http', async () => {
        vi.stubEnv('VITE_DSLR_AGENT_MODE', 'http');
        const fetchMock = vi.fn(
            async () => new Response(null, { status: 200 }),
        );
        vi.stubGlobal('fetch', fetchMock);

        const grab = vi.fn(fakeGrab);
        await createAgent(grab).isAvailable();

        // http agent hits the network; the grabber is never used.
        expect(fetchMock).toHaveBeenCalled();
        expect(grab).not.toHaveBeenCalled();
    });
});
