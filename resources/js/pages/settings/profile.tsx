import { Form, Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Badge } from '@/components/philobooth/badge';
import { Btn } from '@/components/philobooth/btn';
import { Card } from '@/components/philobooth/card';
import { PageHead } from '@/components/philobooth/extras';
import { Icon } from '@/components/philobooth/icon';
import PhilobboothAdminLayout from '@/layouts/philobooth-admin-layout';
import { send } from '@/routes/verification';

type Profile = {
    name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: string | null;
    branch: { id: number; name: string; code: string } | null;
    created_at: string | null;
    last_login_at: string | null;
};

type Props = {
    mustVerifyEmail: boolean;
    status?: string;
    profile: Profile;
    flash?: { success?: string; error?: string };
};

function formatDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function roleLabel(role: string | null): string {
    if (role === 'admin') {
        return 'Super Admin';
    }

    if (role === 'cabang') {
        return 'User Cabang';
    }

    return '—';
}

function initialsOf(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function Profile({
    mustVerifyEmail,
    status,
    profile,
    flash,
}: Props) {
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
            <Head title="Profil saya" />

            <div style={{ padding: 32, flex: 1, overflow: 'auto' }}>
                <PageHead
                    title="Profil saya"
                    subtitle="Perbarui identitas, kontak, dan foto profil kamu."
                    actions={
                        <Link
                            href="/settings/security"
                            className="pb-btn pb-btn-secondary"
                        >
                            <Icon name="lock" size={16} /> Keamanan akun
                        </Link>
                    }
                />

                <Form
                    method="post"
                    action="/settings/profile"
                    encType="multipart/form-data"
                    options={{ preserveScroll: true }}
                    transform={(data: Record<string, unknown>) => ({
                        ...data,
                        _method: 'patch',
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
                                    icon="user"
                                    title="Foto profil"
                                    subtitle="Ditampilkan di topbar, sidebar, dan log aktivitas."
                                />
                                <AvatarField
                                    currentUrl={profile.avatar_url}
                                    name={profile.name}
                                    error={errors.avatar}
                                />
                            </Card>

                            <Card padding={24}>
                                <SectionHeader
                                    icon="user"
                                    title="Identitas"
                                    subtitle="Nama dan kontak akan dipakai untuk komunikasi internal."
                                />
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 16,
                                    }}
                                >
                                    <Field
                                        label="Nama lengkap"
                                        required
                                        error={errors.name}
                                    >
                                        <input
                                            name="name"
                                            defaultValue={profile.name}
                                            className="pb-input"
                                            placeholder="Nama kamu"
                                            autoComplete="name"
                                            required
                                        />
                                    </Field>
                                    <Field
                                        label="Email"
                                        required
                                        error={errors.email}
                                    >
                                        <input
                                            type="email"
                                            name="email"
                                            defaultValue={profile.email}
                                            className="pb-input"
                                            placeholder="email@philobooth.id"
                                            autoComplete="username"
                                            required
                                        />
                                    </Field>
                                    <Field
                                        label="Nomor HP"
                                        error={errors.phone}
                                        hint="Opsional. Dipakai untuk kontak operasional."
                                    >
                                        <input
                                            type="tel"
                                            name="phone"
                                            defaultValue={profile.phone ?? ''}
                                            className="pb-input"
                                            placeholder="08xx-xxxx-xxxx"
                                            autoComplete="tel"
                                            maxLength={30}
                                        />
                                    </Field>
                                </div>

                                {mustVerifyEmail &&
                                    profile.email &&
                                    status !== 'verification-link-sent' && (
                                        <div
                                            style={{
                                                marginTop: 16,
                                                padding: '10px 14px',
                                                background: '#FFF8E6',
                                                border: '1px solid #FFE7A8',
                                                borderRadius: 10,
                                                fontSize: 13,
                                                color: '#7A5C00',
                                                display: 'flex',
                                                gap: 8,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Icon name="alert" size={16} />
                                            <span>
                                                Email kamu belum diverifikasi.
                                            </span>
                                            <Link
                                                href={send()}
                                                as="button"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#7A5C00',
                                                    fontWeight: 600,
                                                    textDecoration: 'underline',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    font: 'inherit',
                                                }}
                                            >
                                                Kirim link verifikasi
                                            </Link>
                                        </div>
                                    )}

                                {status === 'verification-link-sent' && (
                                    <div
                                        style={{
                                            marginTop: 16,
                                            padding: '10px 14px',
                                            background: '#E8F8EE',
                                            border: '1px solid #B7E4C7',
                                            borderRadius: 10,
                                            fontSize: 13,
                                            color: '#1F6F3E',
                                            display: 'flex',
                                            gap: 8,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Icon name="check-circle" size={16} />
                                        Link verifikasi sudah dikirim ke email
                                        kamu.
                                    </div>
                                )}
                            </Card>

                            <Card padding={24}>
                                <SectionHeader
                                    icon="lock"
                                    title="Info akun"
                                    subtitle="Dikelola oleh admin, hanya bisa dilihat dari sini."
                                />
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 16,
                                    }}
                                >
                                    <ReadOnly
                                        label="Role"
                                        value={roleLabel(profile.role)}
                                        hint="Hak akses di sistem"
                                    />
                                    <ReadOnly
                                        label="Cabang"
                                        value={
                                            profile.branch
                                                ? `${profile.branch.name} (${profile.branch.code})`
                                                : 'Tanpa cabang'
                                        }
                                        hint={
                                            profile.branch
                                                ? 'Hanya admin yang bisa pindahkan cabang'
                                                : 'Akses ke semua cabang'
                                        }
                                    />
                                    <ReadOnly
                                        label="Bergabung sejak"
                                        value={formatDate(profile.created_at)}
                                        hint="Tanggal akun dibuat"
                                    />
                                    <ReadOnly
                                        label="Login terakhir"
                                        value={formatDate(
                                            profile.last_login_at,
                                        )}
                                        hint="Aktivitas terakhir di sistem"
                                    />
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
                                    Simpan perubahan
                                </Btn>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

function SectionHeader({
    icon,
    title,
    subtitle,
}: {
    icon: 'user' | 'lock';
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

function AvatarField({
    currentUrl,
    name,
    error,
}: {
    currentUrl: string | null;
    name: string;
    error?: string;
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

    function triggerPicker() {
        inputRef.current?.click();
    }

    const initials = initialsOf(name || 'PB');

    return (
        <div
            style={{
                display: 'flex',
                gap: 18,
                alignItems: 'center',
                padding: 14,
                background: '#FAFAFA',
                border: '1px dashed var(--pb-border)',
                borderRadius: 12,
            }}
        >
            <div
                style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background:
                        'linear-gradient(135deg, #FFE9C7, #FFB37C)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 28,
                    color: '#7A3E00',
                    boxShadow:
                        '0 0 0 3px #fff, 0 0 0 4px rgba(0,0,0,0.06)',
                    flexShrink: 0,
                }}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt={name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                ) : (
                    initials
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 13,
                        color: 'var(--pb-text-muted)',
                        marginBottom: 8,
                    }}
                >
                    PNG / JPG / WebP — maks 2MB. Dipotong otomatis jadi
                    bulat.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Btn
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon="image"
                        onClick={triggerPicker}
                    >
                        Pilih foto baru
                    </Btn>
                    {(preview || currentUrl) && !removed && (
                        <Btn
                            type="button"
                            variant="danger"
                            size="sm"
                            icon="trash"
                            onClick={clearFile}
                        >
                            Hapus
                        </Btn>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    name="avatar"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={onChange}
                    style={{ display: 'none' }}
                />
                <input
                    type="hidden"
                    name="remove_avatar"
                    value={removed ? '1' : '0'}
                />

                <InputError message={error} className="mt-2" />
            </div>
        </div>
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
                        fontSize: 11.5,
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

function ReadOnly({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) {
    return (
        <div>
            <div
                style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--pb-text-muted)',
                    marginBottom: 6,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    padding: '10px 12px',
                    background: '#FAFAFA',
                    border: '1px solid var(--pb-border-soft)',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                {value}
                {label === 'Role' && value !== '—' && (
                    <Badge tone="neutral">readonly</Badge>
                )}
            </div>
            {hint && (
                <div
                    style={{
                        fontSize: 11.5,
                        color: 'var(--pb-text-faint)',
                        marginTop: 4,
                    }}
                >
                    {hint}
                </div>
            )}
        </div>
    );
}

Profile.layout = (page: ReactNode) => (
    <PhilobboothAdminLayout active="settings">{page}</PhilobboothAdminLayout>
);
