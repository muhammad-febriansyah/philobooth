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
    /**
     * When set, the canvas is sized to the frame template and each photo is
     * drawn into every template slot (cover-fit) before the frame thumbnail is
     * overlaid on top — matching the composite photo layout instead of a
     * plain letterboxed clip.
     */
    frameOverlay?: {
        imageSize: { width: number; height: number };
        slotRects: FrameRect[];
        thumbnailUrl: string;
    };
};

export type FrameRect = {
    x: number;
    y: number;
    width: number;
    height: number;
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

export function scaleFrameRects(
    slots: FrameRect[],
    scale: number,
): FrameRect[] {
    return slots.map((slot) => ({
        x: slot.x * scale,
        y: slot.y * scale,
        width: slot.width * scale,
        height: slot.height * scale,
    }));
}

async function prepareFrameOverlay(
    thumbnailUrl: string,
    canvasWidth: number,
    canvasHeight: number,
    slots: FrameRect[],
): Promise<HTMLCanvasElement> {
    const frameImage = await new Promise<HTMLImageElement>(
        (resolve, reject) => {
            const image = new Image();
            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = () =>
                reject(new Error('Frame overlay gagal dimuat.'));
            image.src = thumbnailUrl;
        },
    );

    const overlay = document.createElement('canvas');
    overlay.width = canvasWidth;
    overlay.height = canvasHeight;
    const context = overlay.getContext('2d');

    if (!context) {
        throw new Error('Canvas frame overlay tidak tersedia.');
    }

    context.drawImage(frameImage, 0, 0, canvasWidth, canvasHeight);

    // Some uploaded templates use solid black slot placeholders instead of
    // transparent PNG cut-outs. Clear the detected slot rectangles explicitly
    // so both template formats reveal the moving video beneath them.
    slots.forEach((slot) => {
        context.clearRect(slot.x, slot.y, slot.width, slot.height);
    });

    return overlay;
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
        frameOverlay,
    } = options;

    const bitmaps = await Promise.all(
        images.map((img) => createImageBitmap(img)),
    );

    try {
        let canvasSourceW: number;
        let canvasSourceH: number;

        if (frameOverlay) {
            canvasSourceW = frameOverlay.imageSize.width;
            canvasSourceH = frameOverlay.imageSize.height;
        } else {
            // Canvas size derived from the first frame, scaled so the long
            // edge is at most maxEdge (keeps orientation natural).
            const first = bitmaps[0];
            canvasSourceW = first.width;
            canvasSourceH = first.height;
        }

        const scale = Math.min(
            1,
            maxEdge / Math.max(canvasSourceW, canvasSourceH),
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(canvasSourceW * scale);
        canvas.height = Math.round(canvasSourceH * scale);

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Canvas 2D context unavailable');
        }

        const scaledSlots = frameOverlay
            ? scaleFrameRects(frameOverlay.slotRects, scale)
            : [];
        const frameCanvas = frameOverlay
            ? await prepareFrameOverlay(
                  frameOverlay.thumbnailUrl,
                  canvas.width,
                  canvas.height,
                  scaledSlots,
              )
            : null;

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
            ctx.fillStyle = frameOverlay ? '#FFFFFF' : '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (frameOverlay) {
                scaledSlots.forEach((slot) => {
                    const r = coverRect(
                        bmp.width,
                        bmp.height,
                        slot.width,
                        slot.height,
                    );

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(slot.x, slot.y, slot.width, slot.height);
                    ctx.clip();
                    ctx.drawImage(bmp, slot.x + r.x, slot.y + r.y, r.w, r.h);
                    ctx.restore();
                });

                if (frameCanvas) {
                    ctx.drawImage(
                        frameCanvas,
                        0,
                        0,
                        canvas.width,
                        canvas.height,
                    );
                }
            } else {
                const r = coverRect(
                    bmp.width,
                    bmp.height,
                    canvas.width,
                    canvas.height,
                );
                ctx.drawImage(bmp, r.x, r.y, r.w, r.h);
            }

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
