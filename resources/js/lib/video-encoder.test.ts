import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    buildFrameSequence,
    isVideoEncodingSupported,
    pickVideoMimeType,
    scaleFrameRects,
} from './video-encoder';

describe('buildFrameSequence', () => {
    it('returns empty for no frames', () => {
        expect(buildFrameSequence(0, true)).toEqual([]);
    });

    it('forward-only when boomerang is off', () => {
        expect(buildFrameSequence(4, false)).toEqual([0, 1, 2, 3]);
    });

    it('bounces without repeating endpoints when boomerang is on', () => {
        // forward 0..3 then back 2,1 (drops the repeated 3 and 0)
        expect(buildFrameSequence(4, true)).toEqual([0, 1, 2, 3, 2, 1]);
    });

    it('stays forward when too few frames to bounce', () => {
        expect(buildFrameSequence(2, true)).toEqual([0, 1]);
    });
});

describe('scaleFrameRects', () => {
    it('keeps every template slot aligned with the scaled video canvas', () => {
        expect(
            scaleFrameRects(
                [
                    { x: 100, y: 200, width: 400, height: 300 },
                    { x: 550, y: 200, width: 400, height: 300 },
                ],
                0.5,
            ),
        ).toEqual([
            { x: 50, y: 100, width: 200, height: 150 },
            { x: 275, y: 100, width: 200, height: 150 },
        ]);
    });
});

describe('pickVideoMimeType', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns null when MediaRecorder is unavailable', () => {
        vi.stubGlobal('MediaRecorder', undefined);

        expect(pickVideoMimeType()).toBeNull();
    });

    it('prefers mp4 when supported', () => {
        vi.stubGlobal('MediaRecorder', {
            isTypeSupported: (t: string) => t === 'video/mp4',
        });

        expect(pickVideoMimeType()).toEqual({
            mimeType: 'video/mp4',
            ext: 'mp4',
        });
    });

    it('falls back to webm vp9 when mp4 is unsupported', () => {
        vi.stubGlobal('MediaRecorder', {
            isTypeSupported: (t: string) => t.startsWith('video/webm'),
        });

        expect(pickVideoMimeType()).toEqual({
            mimeType: 'video/webm;codecs=vp9',
            ext: 'webm',
        });
    });

    it('returns null when nothing is supported', () => {
        vi.stubGlobal('MediaRecorder', {
            isTypeSupported: () => false,
        });

        expect(pickVideoMimeType()).toBeNull();
    });
});

describe('isVideoEncodingSupported', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('false when MediaRecorder is absent', () => {
        vi.stubGlobal('MediaRecorder', undefined);

        expect(isVideoEncodingSupported()).toBe(false);
    });
});
