/**
 * Client-side video encoder for the kiosk.
 *
 * Builds a short "video frame" clip from the captured photos entirely in the
 * browser (canvas + MediaRecorder), so no server-side ffmpeg is required. The
 * kiosk runs Chrome, where MediaRecorder produces WebM; on browsers that can
 * record MP4 (e.g. Safari) an MP4 is produced instead. The resulting blob is
 * uploaded to the agent-agnostic `/kiosk/video` endpoint.
 *
 * The encode itself needs browser media APIs and is validated on the kiosk; the
 * pure helpers below (capability check, mime-type pick, frame sequence) are unit
 * tested.
 */

export type VideoEncodeOptions = {
    /** Milliseconds each photo is shown. */
    frameDurationMs?: number;
    /** Bounce forward then back for a boomerang feel. */
    boomerang?: boolean;
    /** Capture frame rate. */
    fps?: number;
    /** Longest canvas edge in px; frames are scaled to fit. */
    maxEdge?: number;
};

export type VideoEncodeResult = {
    blob: Blob;
    /** File extension matching the encoded container: 'mp4' | 'webm'. */
    ext: 'mp4' | 'webm';
    mimeType: string;
};

/** Candidate containers, best (most shareable) first. */
const MIME_CANDIDATES: Array<{ mimeType: string; ext: 'mp4' | 'webm' }> = [
    { mimeType: 'video/mp4', ext: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
];

/** True when the browser can encode a canvas stream to a video blob. */
export function isVideoEncodingSupported(): boolean {
    return (
        typeof MediaRecorder !== 'undefined' &&
        typeof HTMLCanvasElement !== 'undefined' &&
        typeof HTMLCanvasElement.prototype.captureStream === 'function'
    );
}

/**
 * Pick the best supported container. Returns null when none is supported (the
 * caller should then skip video generation — it is always optional).
 */
export function pickVideoMimeType(): {
    mimeType: string;
    ext: 'mp4' | 'webm';
} | null {
    if (
        typeof MediaRecorder === 'undefined' ||
        typeof MediaRecorder.isTypeSupported !== 'function'
    ) {
        return null;
    }

    for (const candidate of MIME_CANDIDATES) {
        if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
            return candidate;
        }
    }

    return null;
}

/**
 * Playback order of frame indices. Forward once, or forward then back (without
 * repeating the endpoints) for a boomerang bounce.
 */
export function buildFrameSequence(
    count: number,
    boomerang: boolean,
): number[] {
    if (count <= 0) {
        return [];
    }

    const forward = Array.from({ length: count }, (_, i) => i);

    if (!boomerang || count < 3) {
        return forward;
    }

    const back = forward.slice(1, -1).reverse();

    return [...forward, ...back];
}

/** Cover-fit rectangle for drawing a source image into a target box. */
function coverRect(
    srcW: number,
    srcH: number,
    dstW: number,
    dstH: number,
): { x: number; y: number; w: number; h: number } {
    const scale = Math.max(dstW / srcW, dstH / srcH);
    const w = srcW * scale;
    const h = srcH * scale;

    return { x: (dstW - w) / 2, y: (dstH - h) / 2, w, h };
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Encode the given images into a short video clip. Resolves with the blob, or
 * throws if the browser cannot encode — callers treat video as optional and
 * swallow the error.
 */
export async function encodePhotosToVideo(
    images: Blob[],
    options: VideoEncodeOptions = {},
): Promise<VideoEncodeResult> {
    if (!isVideoEncodingSupported()) {
        throw new Error('Video encoding not supported in this browser');
    }

    const chosen = pickVideoMimeType();

    if (!chosen) {
        throw new Error('No supported video container');
    }

    if (images.length === 0) {
        throw new Error('No images to encode');
    }

    const {
        frameDurationMs = 600,
        boomerang = true,
        fps = 30,
        maxEdge = 720,
    } = options;

    const bitmaps = await Promise.all(
        images.map((img) => createImageBitmap(img)),
    );

    try {
        // Canvas size derived from the first frame, scaled so the long edge
        // is at most maxEdge (keeps orientation natural).
        const first = bitmaps[0];
        const scale = Math.min(
            1,
            maxEdge / Math.max(first.width, first.height),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(first.width * scale);
        canvas.height = Math.round(first.height * scale);

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Canvas 2D context unavailable');
        }

        const stream = canvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, {
            mimeType: chosen.mimeType,
        });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        const done = new Promise<void>((resolve) => {
            recorder.onstop = () => resolve();
        });

        recorder.start();

        const sequence = buildFrameSequence(bitmaps.length, boomerang);

        for (const index of sequence) {
            const bmp = bitmaps[index];
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const r = coverRect(
                bmp.width,
                bmp.height,
                canvas.width,
                canvas.height,
            );
            ctx.drawImage(bmp, r.x, r.y, r.w, r.h);
            await wait(frameDurationMs);
        }

        recorder.stop();
        await done;

        return {
            blob: new Blob(chunks, { type: chosen.mimeType }),
            ext: chosen.ext,
            mimeType: chosen.mimeType,
        };
    } finally {
        bitmaps.forEach((b) => b.close());
    }
}
