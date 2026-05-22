import { Head } from '@inertiajs/react';
import { Card } from '@/components/philobooth/card';
import { Icon } from '@/components/philobooth/icon';
import { Logo } from '@/components/philobooth/logo';

type Props = {
    session: {
        session_code: string;
        branch: string | null;
        final_url: string | null;
        photos: Array<{ slot_number: number; url: string | null }>;
        completed_at: string | null;
        download_expires_at: string | null;
        download_count: number;
    };
    download_url: string;
};

export default function DownloadShow({ session, download_url }: Props) {
    const completedDate = session.completed_at
        ? new Date(session.completed_at).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

    const expiresDate = session.download_expires_at
        ? new Date(session.download_expires_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : '—';

    return (
        <>
            <Head title={`Download foto · ${session.session_code}`} />
            <div
                className="pb-root"
                style={{
                    minHeight: '100vh',
                    background:
                        'linear-gradient(180deg, #FFFEF0 0%, #FAFAFA 30%)',
                    padding: '32px 16px 64px',
                }}
            >
                <div
                    style={{
                        maxWidth: 720,
                        margin: '0 auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                    }}
                >
                    <header
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 4px',
                        }}
                    >
                        <Logo size={28} />
                        <span
                            style={{
                                fontSize: 12,
                                color: 'var(--pb-text-faint)',
                                fontFamily: 'monospace',
                            }}
                        >
                            {session.session_code}
                        </span>
                    </header>

                    <div
                        style={{
                            textAlign: 'center',
                            padding: '24px 16px 8px',
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-flex',
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                background: 'var(--pb-primary)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <Icon
                                name="check"
                                size={28}
                                color="#0A0A0A"
                                strokeWidth={3}
                            />
                        </div>
                        <h1
                            style={{
                                fontSize: 32,
                                fontWeight: 700,
                                letterSpacing: -0.8,
                                margin: 0,
                            }}
                        >
                            Foto kamu siap diunduh
                        </h1>
                        <p
                            style={{
                                fontSize: 15,
                                color: 'var(--pb-text-muted)',
                                margin: '8px 0 0',
                                lineHeight: 1.5,
                            }}
                        >
                            Hasil sesi di {session.branch ?? 'philobooth'}{' '}
                            tanggal {completedDate}. <br />
                            Link aktif sampai {expiresDate}.
                        </p>
                    </div>

                    {session.final_url ? (
                        <Card padding={16}>
                            <div
                                style={{
                                    background: '#FAFAFA',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    aspectRatio: '3/4',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <img
                                    src={session.final_url}
                                    alt="Hasil foto"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            </div>
                        </Card>
                    ) : (
                        <Card padding={32}>
                            <div
                                style={{
                                    textAlign: 'center',
                                    color: 'var(--pb-text-faint)',
                                }}
                            >
                                <Icon name="image" size={32} />
                                <p style={{ marginTop: 12, fontSize: 14 }}>
                                    Foto sedang diproses. Coba refresh sebentar
                                    lagi.
                                </p>
                            </div>
                        </Card>
                    )}

                    <a
                        href={download_url}
                        className="pb-btn pb-btn-primary pb-btn-xl"
                        download
                        style={{ width: '100%' }}
                    >
                        <Icon name="download" size={20} />
                        Download foto (PNG)
                    </a>

                    {session.photos.length > 0 && (
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
                                    Foto asli (tanpa frame)
                                </h3>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--pb-text-faint)',
                                    }}
                                >
                                    {session.photos.length} foto
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        'repeat(auto-fill, minmax(100px, 1fr))',
                                    gap: 8,
                                }}
                            >
                                {session.photos.map((p) => (
                                    <div
                                        key={p.slot_number}
                                        style={{
                                            aspectRatio: '3/4',
                                            background: '#FAFAFA',
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            position: 'relative',
                                        }}
                                    >
                                        {p.url ? (
                                            <img
                                                src={p.url}
                                                alt={`Foto ${p.slot_number}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--pb-text-faint)',
                                                }}
                                            >
                                                <Icon
                                                    name="image"
                                                    size={20}
                                                />
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 4,
                                                left: 6,
                                                background:
                                                    'rgba(10,10,10,0.8)',
                                                color: 'var(--pb-primary)',
                                                fontSize: 10,
                                                fontWeight: 700,
                                                padding: '2px 6px',
                                                borderRadius: 999,
                                            }}
                                        >
                                            #{p.slot_number}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    <div
                        style={{
                            textAlign: 'center',
                            fontSize: 12,
                            color: 'var(--pb-text-faint)',
                            padding: 16,
                        }}
                    >
                        Sudah di-download {session.download_count}× · tag{' '}
                        <strong>@philobooth.id</strong> di IG biar bisa
                        direpost ✨
                    </div>
                </div>
            </div>
        </>
    );
}
