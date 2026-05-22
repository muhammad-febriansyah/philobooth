import { Form, Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState  } from 'react';
import type {ReactNode} from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { Icon } from '@/components/philobooth/icon';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

type Slot = {
    slot_number: number;
    x: number;
    y: number;
    width: number;
    height: number;
};

type Frame = {
    id: number;
    name: string;
    description: string | null;
    thumbnail_url: string | null;
    orientation: string | null;
    type: string | null;
    photo_slots: number;
    category: string | null;
    paper_size_id: number | null;
    is_premium: boolean;
    is_active: boolean;
    slots: Slot[];
};

type Option = { value: string; label: string };

type Props = {
    frame: Frame | null;
    category_suggestions: string[];
    paper_sizes: Array<{ id: number; code: string; name: string }>;
    orientations: Option[];
    types: Option[];
    flash?: { success?: string; error?: string };
};

export default function FrameForm({
    frame,
    category_suggestions,
    paper_sizes,
    orientations,
    types,
    flash,
}: Props) {
    const isCreate = !frame;
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string>(
        frame?.type ?? 'kolase',
    );
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (flash?.success) {
toast.success(flash.success);
}

        if (flash?.error) {
toast.error(flash.error);
}
    }, [flash]);

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) {
            setFilePreview(null);

            return;
        }

        const url = URL.createObjectURL(file);
        setFilePreview(url);
    }

    const previewImage = filePreview ?? frame?.thumbnail_url ?? null;

    return (
        <>
            <Head
                title={isCreate ? 'Upload frame baru' : `Edit ${frame?.name}`}
            />
            <main
                style={{
                    padding: 32,
                    flex: 1,
                    overflow: 'auto',
                    maxWidth: 1200,
                    margin: '0 auto',
                    width: '100%',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 24,
                    }}
                >
                    <Link
                        href="/admin/frames"
                        className="pb-btn pb-btn-ghost pb-btn-icon"
                        title="Kembali ke daftar"
                    >
                        <Icon name="chevron-left" size={18} />
                    </Link>
                    <div>
                        <h1 className="pb-h2" style={{ margin: 0 }}>
                            {isCreate
                                ? 'Upload frame baru'
                                : `Edit ${frame?.name}`}
                        </h1>
                        <p
                            className="pb-body-sm"
                            style={{
                                margin: '4px 0 0',
                                color: 'var(--pb-text-muted)',
                            }}
                        >
                            {isCreate
                                ? 'Upload PNG / JPG / WEBP dengan area hitam (atau transparan) sebagai slot foto. Slot akan terdeteksi otomatis.'
                                : 'Edit metadata. Ganti file akan re-detect ulang semua slot.'}
                        </p>
                    </div>
                </div>

                <Form
                    method="post"
                    action={
                        isCreate
                            ? '/admin/frames'
                            : `/admin/frames/${frame?.id}`
                    }
                    options={{ preserveScroll: true }}
                >
                    {({ errors, processing }) => (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 24,
                                alignItems: 'flex-start',
                            }}
                        >
                            {/* LEFT: Image upload + preview */}
                            <Card padding={20}>
                                <Label
                                    label="File frame"
                                    required={isCreate}
                                    hint="Format: PNG, JPG, atau WEBP · max 5MB. Slot foto = area hitam (RGB ≈0) atau transparan."
                                />

                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    style={{
                                        border: '2px dashed var(--pb-border)',
                                        borderRadius: 12,
                                        padding: 20,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: '#FAFAFA',
                                        transition: 'border-color .15s',
                                        minHeight: 360,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt="preview"
                                            style={{
                                                maxHeight: 500,
                                                maxWidth: '100%',
                                                display: 'block',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: '40px 12px',
                                                color: 'var(--pb-text-muted)',
                                            }}
                                        >
                                            <Icon name="image" size={40} />
                                            <div
                                                style={{
                                                    marginTop: 12,
                                                    fontSize: 15,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Klik untuk pilih file
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: 'var(--pb-text-faint)',
                                                    marginTop: 6,
                                                }}
                                            >
                                                atau drag-drop ke sini
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="image"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={onFileChange}
                                    style={{ display: 'none' }}
                                />
                                <InputError
                                    message={errors.image}
                                    className="mt-2"
                                />

                                {!isCreate && frame && (
                                    <div
                                        style={{
                                            marginTop: 16,
                                            padding: 12,
                                            background: 'rgba(245,250,12,0.12)',
                                            borderRadius: 8,
                                            fontSize: 13,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Icon name="info" size={14} />
                                        <span>
                                            Frame ini punya{' '}
                                            <strong>
                                                {frame.slots.length} slot
                                            </strong>{' '}
                                            foto terdeteksi. Ganti file =
                                            re-detect ulang.
                                        </span>
                                    </div>
                                )}
                            </Card>

                            {/* RIGHT: Metadata fields */}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 16,
                                }}
                            >
                                <Card padding={20}>
                                    <h3
                                        className="pb-h4"
                                        style={{
                                            margin: 0,
                                            marginBottom: 16,
                                        }}
                                    >
                                        Metadata
                                    </h3>

                                    <Field
                                        label="Nama frame"
                                        required
                                        error={errors.name}
                                    >
                                        <input
                                            name="name"
                                            defaultValue={frame?.name ?? ''}
                                            placeholder="Contoh: Birthday 2026"
                                            className="pb-input"
                                        />
                                    </Field>

                                    <div style={{ marginTop: 14 }}>
                                        <Field
                                            label="Kategori"
                                            required
                                            error={errors.category}
                                            hint="Ketik bebas. Pilihan di bawah bisa di-klik atau ketik baru."
                                        >
                                            <input
                                                name="category"
                                                defaultValue={
                                                    frame?.category ?? ''
                                                }
                                                placeholder="Contoh: Birthday, Wedding, K-pop"
                                                className="pb-input"
                                                list="category-list"
                                                autoComplete="off"
                                            />
                                            <datalist id="category-list">
                                                {category_suggestions.map(
                                                    (c) => (
                                                        <option
                                                            key={c}
                                                            value={c}
                                                        />
                                                    ),
                                                )}
                                            </datalist>
                                            {category_suggestions.length >
                                                0 && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: 6,
                                                        marginTop: 8,
                                                    }}
                                                >
                                                    {category_suggestions
                                                        .slice(0, 8)
                                                        .map((c) => (
                                                            <button
                                                                type="button"
                                                                key={c}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    const form =
                                                                        (
                                                                            e.currentTarget as HTMLButtonElement
                                                                        ).closest(
                                                                            'form',
                                                                        );
                                                                    const input =
                                                                        form?.querySelector(
                                                                            '[name="category"]',
                                                                        ) as HTMLInputElement | null;

                                                                    if (input) {
                                                                        input.value =
                                                                            c;
                                                                    }
                                                                }}
                                                                style={{
                                                                    padding:
                                                                        '4px 10px',
                                                                    border: '1px solid var(--pb-border)',
                                                                    borderRadius: 999,
                                                                    background:
                                                                        '#fff',
                                                                    fontSize: 11,
                                                                    fontFamily:
                                                                        'inherit',
                                                                    cursor: 'pointer',
                                                                    color: 'var(--pb-text-muted)',
                                                                }}
                                                            >
                                                                {c}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}
                                        </Field>
                                    </div>

                                    <div style={{ marginTop: 14 }}>
                                        <Field
                                            label="Jenis frame"
                                            required
                                            error={errors.type}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 8,
                                                }}
                                            >
                                                {types.map((t) => {
                                                    const isActive =
                                                        selectedType ===
                                                        t.value;

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={t.value}
                                                            onClick={() =>
                                                                setSelectedType(
                                                                    t.value,
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    '8px 16px',
                                                                borderRadius: 999,
                                                                border: isActive
                                                                    ? '2px solid var(--pb-primary)'
                                                                    : '1px solid var(--pb-border)',
                                                                background:
                                                                    isActive
                                                                        ? 'rgba(245,250,12,0.16)'
                                                                        : '#fff',
                                                                fontSize: 13,
                                                                fontWeight: 600,
                                                                fontFamily:
                                                                    'inherit',
                                                                cursor: 'pointer',
                                                                color: isActive
                                                                    ? 'var(--pb-ink)'
                                                                    : 'var(--pb-text-muted)',
                                                            }}
                                                        >
                                                            {t.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <input
                                                type="hidden"
                                                name="type"
                                                value={selectedType}
                                            />
                                        </Field>
                                    </div>

                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 12,
                                            marginTop: 14,
                                        }}
                                    >
                                        <Field
                                            label="Ukuran kertas"
                                            required
                                            error={errors.paper_size_id}
                                        >
                                            <select
                                                name="paper_size_id"
                                                defaultValue={
                                                    frame?.paper_size_id ?? ''
                                                }
                                                className="pb-input"
                                            >
                                                <option value="">
                                                    — Pilih —
                                                </option>
                                                {paper_sizes.map((p) => (
                                                    <option
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {p.code} · {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                        <Field
                                            label="Orientasi"
                                            required
                                            error={errors.orientation}
                                        >
                                            <select
                                                name="orientation"
                                                defaultValue={
                                                    frame?.orientation ??
                                                    'portrait'
                                                }
                                                className="pb-input"
                                            >
                                                {orientations.map((o) => (
                                                    <option
                                                        key={o.value}
                                                        value={o.value}
                                                    >
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    </div>

                                    <div style={{ marginTop: 14 }}>
                                        <Field
                                            label="Deskripsi"
                                            error={errors.description}
                                        >
                                            <textarea
                                                name="description"
                                                defaultValue={
                                                    frame?.description ?? ''
                                                }
                                                rows={3}
                                                placeholder="Catatan / deskripsi singkat..."
                                                className="pb-input"
                                                style={{
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                        </Field>
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: 20,
                                            marginTop: 16,
                                        }}
                                    >
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                fontSize: 14,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="is_premium"
                                                value="1"
                                                defaultChecked={
                                                    frame?.is_premium
                                                }
                                                style={{
                                                    accentColor:
                                                        'var(--pb-primary)',
                                                }}
                                            />
                                            Premium
                                        </label>
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                fontSize: 14,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                value="1"
                                                defaultChecked={
                                                    frame?.is_active ?? true
                                                }
                                                style={{
                                                    accentColor:
                                                        'var(--pb-primary)',
                                                }}
                                            />
                                            Aktif
                                        </label>
                                    </div>
                                </Card>

                                {!isCreate && frame && frame.slots.length > 0 && (
                                    <Card padding={20}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 12,
                                            }}
                                        >
                                            <h3
                                                className="pb-h4"
                                                style={{ margin: 0 }}
                                            >
                                                Slot foto terdeteksi
                                            </h3>
                                            <Badge tone="active">
                                                {frame.slots.length} slot
                                            </Badge>
                                        </div>
                                        <p
                                            className="pb-body-sm"
                                            style={{
                                                margin: 0,
                                                color: 'var(--pb-text-muted)',
                                                marginBottom: 12,
                                            }}
                                        >
                                            Posisi otomatis di-scan dari pixel
                                            hitam image.
                                        </p>
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns:
                                                    'repeat(auto-fill, minmax(120px, 1fr))',
                                                gap: 8,
                                            }}
                                        >
                                            {frame.slots.map((s) => (
                                                <div
                                                    key={s.slot_number}
                                                    style={{
                                                        background: '#FAFAFA',
                                                        border: '1px solid var(--pb-border)',
                                                        borderRadius: 8,
                                                        padding: 10,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontSize: 18,
                                                            fontWeight: 700,
                                                            color: 'var(--pb-ink)',
                                                        }}
                                                    >
                                                        #{s.slot_number}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            color: 'var(--pb-text-faint)',
                                                            marginTop: 2,
                                                        }}
                                                    >
                                                        {s.width}×{s.height}px
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: 11,
                                                            color: 'var(--pb-text-faint)',
                                                        }}
                                                    >
                                                        ({s.x}, {s.y})
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        marginTop: 8,
                                    }}
                                >
                                    <Link
                                        href="/admin/frames"
                                        className="pb-btn pb-btn-secondary"
                                        style={{ flex: 1 }}
                                    >
                                        <Icon name="x" size={16} /> Batal
                                    </Link>
                                    <Btn
                                        type="submit"
                                        variant="primary"
                                        icon="check"
                                        disabled={processing}
                                        style={{ flex: 2 }}
                                    >
                                        {processing
                                            ? 'Memproses…'
                                            : isCreate
                                              ? 'Upload & deteksi slot'
                                              : 'Perbarui frame'}
                                    </Btn>
                                </div>
                            </div>
                        </div>
                    )}
                </Form>
            </main>
        </>
    );
}

function Label({
    label,
    required,
    hint,
}: {
    label: string;
    required?: boolean;
    hint?: string;
}) {
    return (
        <>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 6,
                }}
            >
                {label}
                {required && (
                    <span style={{ color: 'var(--pb-danger)' }}>*</span>
                )}
            </div>
            {hint && (
                <div
                    style={{
                        fontSize: 12,
                        color: 'var(--pb-text-faint)',
                        marginBottom: 12,
                    }}
                >
                    {hint}
                </div>
            )}
        </>
    );
}

function Field({
    label,
    required,
    error,
    hint,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 6,
                }}
            >
                {label}
                {required && (
                    <span style={{ color: 'var(--pb-danger)' }}>*</span>
                )}
            </label>
            {children}
            {hint && (
                <div
                    style={{
                        fontSize: 11,
                        color: 'var(--pb-text-faint)',
                        marginTop: 4,
                    }}
                >
                    {hint}
                </div>
            )}
            <InputError message={error} className="mt-1" />
        </div>
    );
}

FrameForm.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="frames">{page}</PhilobboothAdminLayout>
);
