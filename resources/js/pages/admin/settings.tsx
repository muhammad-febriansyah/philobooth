import { Form, Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { PageHead } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import { RupiahInput } from '@/components/philobooth/rupiah-input';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';

type Settings = {
    app_name: string;
    app_tagline: string | null;
    support_email: string | null;
    support_phone: string | null;
    logo_url: string | null;
    favicon_url: string | null;
    base_price: number;
    tax_percent: number;
    service_fee: number;
    extra_print_price: number;
    min_prints: number;
    max_prints: number;
    currency: string;
};

type Props = {
    settings: Settings;
    flash?: { success?: string; error?: string };
};

export default function SettingsPage({ settings, flash }: Props) {
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <>
            <Head title="Pengaturan Aplikasi" />
            <main style={{ padding: 32, flex: 1, overflow: 'auto' }}>
                <PageHead
                    title="Pengaturan aplikasi"
                    subtitle="Identitas web, branding, dan harga transaksi"
                />

                <Form
                    method="post"
                    action="/admin/settings"
                    encType="multipart/form-data"
                    options={{ preserveScroll: true }}
                    transform={(data: Record<string, unknown>) => ({
                        ...data,
                        _method: 'put',
                    })}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        maxWidth: 880,
                    }}
                >
                    {({ errors, processing }) => (
                        <>
                            <Card padding={24}>
                                <SectionHeader
                                    icon="store"
                                    title="Identitas aplikasi"
                                    subtitle="Nama, tagline, dan kontak yang ditampilkan di kiosk & email."
                                />
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 16,
                                    }}
                                >
                                    <Field
                                        label="Nama aplikasi"
                                        required
                                        error={errors.app_name}
                                    >
                                        <input
                                            name="app_name"
                                            defaultValue={settings.app_name}
                                            className="pb-input"
                                            placeholder="Philobooth"
                                        />
                                    </Field>
                                    <Field
                                        label="Tagline"
                                        error={errors.app_tagline}
                                    >
                                        <input
                                            name="app_tagline"
                                            defaultValue={
                                                settings.app_tagline ?? ''
                                            }
                                            className="pb-input"
                                            placeholder="Self-service photobooth"
                                        />
                                    </Field>
                                    <Field
                                        label="Email support"
                                        error={errors.support_email}
                                    >
                                        <input
                                            type="email"
                                            name="support_email"
                                            defaultValue={
                                                settings.support_email ?? ''
                                            }
                                            className="pb-input"
                                            placeholder="hello@philobooth.id"
                                        />
                                    </Field>
                                    <Field
                                        label="Nomor support"
                                        error={errors.support_phone}
                                    >
                                        <input
                                            name="support_phone"
                                            defaultValue={
                                                settings.support_phone ?? ''
                                            }
                                            className="pb-input"
                                            placeholder="+62 812-3456-7890"
                                        />
                                    </Field>
                                </div>
                            </Card>

                            <Card padding={24}>
                                <SectionHeader
                                    icon="image"
                                    title="Logo & favicon"
                                    subtitle="Logo digunakan di kiosk, struk, dan sidebar. Favicon tampil di tab browser."
                                />
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 20,
                                    }}
                                >
                                    <FileField
                                        label="Logo"
                                        name="logo"
                                        removeName="remove_logo"
                                        currentUrl={settings.logo_url}
                                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                        hint="PNG / JPG / SVG / WebP — maks 2MB"
                                        error={errors.logo}
                                        previewSize={120}
                                    />
                                    <FileField
                                        label="Favicon"
                                        name="favicon"
                                        removeName="remove_favicon"
                                        currentUrl={settings.favicon_url}
                                        accept="image/png,image/x-icon,image/svg+xml"
                                        hint="PNG / ICO / SVG — maks 512KB"
                                        error={errors.favicon}
                                        previewSize={64}
                                    />
                                </div>
                            </Card>

                            <Card padding={24}>
                                <SectionHeader
                                    icon="tag"
                                    title="Harga transaksi"
                                    subtitle="Harga default global. Dapat di-override per cabang lewat Harga cabang."
                                />
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr 1fr',
                                        gap: 16,
                                    }}
                                >
                                    <Field
                                        label="Mata uang"
                                        required
                                        error={errors.currency}
                                    >
                                        <input
                                            name="currency"
                                            defaultValue={settings.currency}
                                            maxLength={3}
                                            className="pb-input"
                                            placeholder="IDR"
                                            style={{
                                                textTransform: 'uppercase',
                                            }}
                                        />
                                    </Field>
                                    <Field
                                        label="Harga dasar"
                                        required
                                        error={errors.base_price}
                                    >
                                        <RupiahInput
                                            name="base_price"
                                            defaultValue={settings.base_price}
                                            min={0}
                                            max={9999999}
                                        />
                                    </Field>
                                    <Field
                                        label="Cetak tambahan / lembar"
                                        required
                                        error={errors.extra_print_price}
                                    >
                                        <RupiahInput
                                            name="extra_print_price"
                                            defaultValue={
                                                settings.extra_print_price
                                            }
                                            min={0}
                                            max={9999999}
                                        />
                                    </Field>
                                    <Field
                                        label="Biaya layanan"
                                        required
                                        error={errors.service_fee}
                                    >
                                        <RupiahInput
                                            name="service_fee"
                                            defaultValue={settings.service_fee}
                                            min={0}
                                            max={9999999}
                                        />
                                    </Field>
                                    <Field
                                        label="Pajak (%)"
                                        required
                                        error={errors.tax_percent}
                                    >
                                        <input
                                            name="tax_percent"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            defaultValue={settings.tax_percent}
                                            className="pb-input"
                                        />
                                    </Field>
                                    <div />
                                    <Field
                                        label="Minimal cetak"
                                        required
                                        error={errors.min_prints}
                                    >
                                        <input
                                            name="min_prints"
                                            type="number"
                                            min="1"
                                            defaultValue={settings.min_prints}
                                            className="pb-input"
                                        />
                                    </Field>
                                    <Field
                                        label="Maksimal cetak"
                                        required
                                        error={errors.max_prints}
                                    >
                                        <input
                                            name="max_prints"
                                            type="number"
                                            min="1"
                                            defaultValue={settings.max_prints}
                                            className="pb-input"
                                        />
                                    </Field>
                                </div>
                            </Card>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: 8,
                                    paddingBottom: 32,
                                }}
                            >
                                <Btn
                                    variant="primary"
                                    icon="check"
                                    type="submit"
                                    disabled={processing}
                                >
                                    Simpan pengaturan
                                </Btn>
                            </div>
                        </>
                    )}
                </Form>
            </main>
        </>
    );
}

function SectionHeader({
    icon,
    title,
    subtitle,
}: {
    icon: 'store' | 'image' | 'tag';
    title: string;
    subtitle: string;
}) {
    return (
        <div
            style={{
                display: 'flex',
                gap: 12,
                marginBottom: 18,
                alignItems: 'flex-start',
            }}
        >
            <div
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'rgba(245,250,12,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <Icon name={icon} size={18} />
            </div>
            <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
                <div
                    style={{
                        fontSize: 13,
                        color: 'var(--pb-text-muted)',
                        marginTop: 2,
                    }}
                >
                    {subtitle}
                </div>
            </div>
        </div>
    );
}

function FileField({
    label,
    name,
    removeName,
    currentUrl,
    accept,
    hint,
    error,
    previewSize,
}: {
    label: string;
    name: string;
    removeName: string;
    currentUrl: string | null;
    accept: string;
    hint: string;
    error?: string;
    previewSize: number;
}) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string | null>(currentUrl);
    const [removed, setRemoved] = useState(false);

    function onChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];

        if (!file) {
            setPreview(currentUrl);

            return;
        }

        setRemoved(false);
        setPreview(URL.createObjectURL(file));
    }

    function clearFile() {
        if (inputRef.current) {
            inputRef.current.value = '';
        }

        setPreview(null);
        setRemoved(true);
    }

    return (
        <div>
            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    fontWeight: 500,
                    marginBottom: 8,
                }}
            >
                {label}
            </label>

            <div
                style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                    padding: 12,
                    border: '1px dashed var(--pb-border)',
                    borderRadius: 10,
                    background: '#FAFAFA',
                }}
            >
                <div
                    style={{
                        width: previewSize,
                        height: previewSize,
                        borderRadius: 8,
                        background: '#fff',
                        border: '1px solid var(--pb-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                    }}
                >
                    {preview ? (
                        <img
                            src={preview}
                            alt={label}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    ) : (
                        <Icon
                            name="image"
                            size={24}
                            color="var(--pb-text-faint)"
                        />
                    )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                        ref={inputRef}
                        type="file"
                        name={name}
                        accept={accept}
                        onChange={onChange}
                        style={{ fontSize: 12, marginBottom: 6 }}
                    />
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--pb-text-faint)',
                        }}
                    >
                        {hint}
                    </div>
                    {currentUrl && (
                        <Btn
                            type="button"
                            variant="danger"
                            size="sm"
                            icon="trash"
                            onClick={clearFile}
                            style={{ marginTop: 6 }}
                        >
                            Hapus
                        </Btn>
                    )}
                    <input
                        type="hidden"
                        name={removeName}
                        value={removed ? '1' : '0'}
                    />
                </div>
            </div>
            <InputError message={error} className="mt-1" />
        </div>
    );
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
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
            <InputError message={error} className="mt-1" />
        </div>
    );
}

SettingsPage.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="settings">{page}</PhilobboothAdminLayout>
);
