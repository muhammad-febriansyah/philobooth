import { Head, Link } from '@inertiajs/react';
import { useRef, useState  } from 'react';
import type {ReactNode} from 'react';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { PhotoPH } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

type Slot = {
    slot_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

type Props = {
    frame: {
        id: number;
        name: string;
        thumbnail_url: string | null;
        orientation: string | null;
        photo_slots: number;
        category: string | null;
        paper_size: string | null;
        slots: Slot[];
        image_size: { width: number; height: number } | null;
    };
};

type SlotPhoto = { slot: number; url: string };

export default function FramePreview({ frame }: Props) {
    const [photos, setPhotos] = useState<SlotPhoto[]>([]);
    const [showOverlay, setShowOverlay] = useState(true);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    function uploadSamplePhoto(slotNumber: number) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];

            if (!file) {
return;
}

            const url = URL.createObjectURL(file);
            setPhotos((prev) => [
                ...prev.filter((p) => p.slot !== slotNumber),
                { slot: slotNumber, url },
            ]);
        };
        input.click();
    }

    function uploadAllAtOnce(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);

        if (!files.length) {
return;
}

        const newPhotos: SlotPhoto[] = files
            .slice(0, frame.slots.length)
            .map((file, i) => ({
                slot: frame.slots[i].slot_number,
                url: URL.createObjectURL(file),
            }));
        setPhotos(newPhotos);
    }

    function clearPhotos() {
        photos.forEach((p) => URL.revokeObjectURL(p.url));
        setPhotos([]);
    }

    const imgW = frame.image_size?.width ?? 1000;
    const imgH = frame.image_size?.height ?? 1500;

    return (
        <>
            <Head title={`Preview · ${frame.name}`} />
            <main className="pb-page-main">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 16,
                    }}
                >
                    <Link
                        href="/admin/frames"
                        className="pb-btn pb-btn-ghost pb-btn-icon"
                    >
                        <Icon name="chevron-left" size={18} />
                    </Link>
                    <div>
                        <h1
                            className="pb-h2"
                            style={{ margin: 0 }}
                        >
                            {frame.name}
                        </h1>
                        <div
                            style={{
                                fontSize: 13,
                                color: 'var(--pb-text-muted)',
                                marginTop: 2,
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                            }}
                        >
                            <span>{frame.category ?? '—'}</span>
                            <span>·</span>
                            <span>{frame.paper_size ?? '—'}</span>
                            <span>·</span>
                            <span>
                                {frame.image_size
                                    ? `${frame.image_size.width} × ${frame.image_size.height}px`
                                    : 'unknown size'}
                            </span>
                            <span>·</span>
                            <Badge tone="active">
                                {frame.slots.length} slot
                            </Badge>
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr',
                        gap: 24,
                        alignItems: 'flex-start',
                    }}
                >
                    <Card padding={16}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <h3
                                    className="pb-h4"
                                    style={{ margin: 0 }}
                                >
                                    Preview composite
                                </h3>
                                <Badge
                                    tone={
                                        photos.length === frame.slots.length
                                            ? 'success'
                                            : 'neutral'
                                    }
                                >
                                    {photos.length} / {frame.slots.length} foto
                                </Badge>
                            </div>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={showOverlay}
                                    onChange={(e) =>
                                        setShowOverlay(e.target.checked)
                                    }
                                    style={{
                                        accentColor: 'var(--pb-primary)',
                                    }}
                                />
                                Tampilkan overlay slot
                            </label>
                        </div>

                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                aspectRatio: `${imgW} / ${imgH}`,
                                background: '#FAFAFA',
                                borderRadius: 8,
                                overflow: 'hidden',
                            }}
                        >
                            {/* Layer 1: foto sample di slot (di belakang) */}
                            {frame.slots.map((s) => {
                                const photo = photos.find(
                                    (p) => p.slot === s.slot_number,
                                );

                                return (
                                    <div
                                        key={s.slot_number}
                                        style={{
                                            position: 'absolute',
                                            left: `${(s.x / imgW) * 100}%`,
                                            top: `${(s.y / imgH) * 100}%`,
                                            width: `${(s.width / imgW) * 100}%`,
                                            height: `${(s.height / imgH) * 100}%`,
                                            overflow: 'hidden',
                                            background: photo
                                                ? '#000'
                                                : 'rgba(0,0,0,0.1)',
                                        }}
                                    >
                                        {photo ? (
                                            <img
                                                src={photo.url}
                                                alt={`Slot ${s.slot_number}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <PhotoPH
                                                seed={s.slot_number}
                                                label={`Slot ${s.slot_number}`}
                                            />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Layer 2: frame PNG di atas */}
                            {frame.thumbnail_url && (
                                <img
                                    src={frame.thumbnail_url}
                                    alt={frame.name}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        width: '100%',
                                        height: '100%',
                                        pointerEvents: 'none',
                                    }}
                                />
                            )}

                            {/* Layer 3: overlay slot numbers (debug) */}
                            {showOverlay &&
                                frame.slots.map((s) => (
                                    <div
                                        key={`overlay-${s.slot_number}`}
                                        style={{
                                            position: 'absolute',
                                            left: `${(s.x / imgW) * 100}%`,
                                            top: `${(s.y / imgH) * 100}%`,
                                            width: `${(s.width / imgW) * 100}%`,
                                            height: `${(s.height / imgH) * 100}%`,
                                            border: '2px solid var(--pb-primary)',
                                            background:
                                                'rgba(245,250,12,0.10)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        <span
                                            style={{
                                                background:
                                                    'var(--pb-primary)',
                                                color: 'var(--pb-ink)',
                                                fontWeight: 700,
                                                fontSize: 14,
                                                padding: '4px 10px',
                                                borderRadius: 999,
                                            }}
                                        >
                                            #{s.slot_number}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </Card>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 16,
                        }}
                    >
                        <Card>
                            <h3
                                className="pb-h4"
                                style={{ margin: 0, marginBottom: 4 }}
                            >
                                Test composite
                            </h3>
                            <p
                                className="pb-body-sm"
                                style={{
                                    margin: 0,
                                    color: 'var(--pb-text-muted)',
                                    marginBottom: 14,
                                }}
                            >
                                Upload {frame.slots.length} foto sekaligus atau
                                isi per slot di bawah untuk simulasi hasil
                                cetakan.
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={uploadAllAtOnce}
                                />
                                <Btn
                                    variant="primary"
                                    icon="image"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    style={{ flex: 1 }}
                                >
                                    Upload {frame.slots.length} foto
                                </Btn>
                                {photos.length > 0 && (
                                    <Btn
                                        variant="secondary"
                                        icon="trash"
                                        onClick={clearPhotos}
                                    >
                                        Reset
                                    </Btn>
                                )}
                            </div>
                        </Card>

                        <Card>
                            <h3
                                className="pb-h4"
                                style={{ margin: 0, marginBottom: 4 }}
                            >
                                Slot terdeteksi
                            </h3>
                            <p
                                className="pb-body-sm"
                                style={{
                                    margin: 0,
                                    color: 'var(--pb-text-muted)',
                                    marginBottom: 14,
                                }}
                            >
                                Hasil auto-detection saat upload. Klik untuk
                                set foto sample.
                            </p>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: 8,
                                }}
                            >
                                {frame.slots.map((s) => {
                                    const photo = photos.find(
                                        (p) => p.slot === s.slot_number,
                                    );

                                    return (
                                        <button
                                            key={s.slot_number}
                                            type="button"
                                            onClick={() =>
                                                uploadSamplePhoto(
                                                    s.slot_number,
                                                )
                                            }
                                            style={{
                                                background: '#FAFAFA',
                                                border: photo
                                                    ? '2px solid var(--pb-primary)'
                                                    : '1px solid var(--pb-border)',
                                                borderRadius: 8,
                                                padding: 10,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 6,
                                                    background:
                                                        'var(--pb-primary)',
                                                    color: 'var(--pb-ink)',
                                                    fontWeight: 700,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {s.slot_number}
                                            </div>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {s.width} × {s.height}px
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: 11,
                                                        color: 'var(--pb-text-faint)',
                                                    }}
                                                >
                                                    at ({s.x}, {s.y})
                                                </div>
                                            </div>
                                            {photo && (
                                                <Icon
                                                    name="check-circle"
                                                    size={16}
                                                    color="var(--pb-success)"
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    );
}

FramePreview.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="frames">{page}</PhilobboothAdminLayout>
);
