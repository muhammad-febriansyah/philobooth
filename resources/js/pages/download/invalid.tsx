import { Head } from '@inertiajs/react';
import { Card } from '@/components/philobooth/card';
import { Icon } from '@/components/philobooth/icon';
import { Logo } from '@/components/philobooth/logo';

type Props = {
    reason?: string;
};

export default function DownloadInvalid({ reason }: Props) {
    return (
        <>
            <Head title="Link tidak valid · philobooth" />
            <div
                className="pb-root"
                style={{
                    minHeight: '100vh',
                    background: '#FAFAFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                }}
            >
                <Card
                    padding={36}
                    style={{
                        maxWidth: 460,
                        width: '100%',
                        textAlign: 'center',
                    }}
                >
                    <Logo size={28} />
                    <div
                        style={{
                            display: 'inline-flex',
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            background: 'rgba(220,38,38,0.10)',
                            color: 'var(--pb-danger)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '32px 0 16px',
                        }}
                    >
                        <Icon name="alert" size={28} />
                    </div>
                    <h1
                        style={{
                            fontSize: 24,
                            fontWeight: 700,
                            margin: 0,
                        }}
                    >
                        Link tidak valid atau sudah kedaluwarsa
                    </h1>
                    <p
                        style={{
                            fontSize: 14,
                            color: 'var(--pb-text-muted)',
                            margin: '12px 0 0',
                            lineHeight: 1.5,
                        }}
                    >
                        {reason === 'expired'
                            ? 'Foto download link aktif 48 jam setelah sesi. Hubungi cabang tempat kamu foto jika butuh kembali file aslinya.'
                            : 'Pastikan kamu scan QR yang benar dari Philobooth.'}
                    </p>
                </Card>
            </div>
        </>
    );
}
