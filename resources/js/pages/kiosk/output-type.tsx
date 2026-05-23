import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Icon } from '@/components/philobooth/icon';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { Spotlight } from '@/components/philobooth/kiosk-aceternity';
import { KioskScene } from '@/components/philobooth/kiosk-scene';

type OutputChoice = 'photo' | 'stop_motion_video';

type Props = {
    session: {
        session_code: string;
        session_type: OutputChoice | null;
    };
};

const CHOICES: Array<{
    value: OutputChoice;
    title: string;
    tagline: string;
    description: string;
    iconName: string;
    bullets: string[];
    accent: string;
}> = [
    {
        value: 'photo',
        title: 'Foto Cetak',
        tagline: 'Klasik · cetak fisik',
        description:
            'Ambil beberapa foto, pilih frame favorit, langsung cetak di kertas strip.',
        iconName: 'camera',
        bullets: [
            'Strip foto langsung jadi cetakan fisik',
            'Pilih frame & filter sesuka kamu',
            'Bisa cetak lembar tambahan',
        ],
        accent: 'var(--pb-primary)',
    },
    {
        value: 'stop_motion_video',
        title: 'Stop Motion GIF',
        tagline: 'Animasi · digital',
        description:
            'Foto-foto kamu digabung jadi GIF animasi pendek. Unduh via QR code di HP.',
        iconName: 'sparkles',
        bullets: [
            'Output GIF animasi (bukan cetak)',
            'Scan QR untuk download di HP',
            'Cocok dibagikan di sosmed',
        ],
        accent: '#A78BFA',
    },
];

export default function KioskOutputType({ session }: Props) {
    const [selected, setSelected] = useState<OutputChoice | null>(
        session.session_type,
    );
    const [processing, setProcessing] = useState(false);

    function next() {
        if (!selected) return;

        setProcessing(true);
        router.post(
            '/kiosk/output-type',
            { session_type: selected },
            { onFinish: () => setProcessing(false) },
        );
    }

    return (
        <>
            <Head title="Pilih jenis output — Philobooth" />
            <KioskScene>
                <Spotlight
                    position="top-right"
                    color="#F5FA0C"
                    size={620}
                    opacity={0.28}
                />
                <Spotlight
                    position="bottom-left"
                    color="#A78BFA"
                    size={520}
                    opacity={0.18}
                    blur={110}
                />
                <KioskHeader step={3} totalSteps={8} />

                <main
                    style={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 1,
                        padding: 'clamp(24px, 4vw, 48px)',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        maxWidth: 1320,
                        margin: '0 auto',
                        width: '100%',
                    }}
                >
                    <div
                        style={{
                            fontSize: 'clamp(11px, 1vw, 13px)',
                            fontWeight: 700,
                            color: 'var(--pb-text-faint)',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 10,
                        }}
                    >
                        <span
                            style={{
                                width: 28,
                                height: 1,
                                background: 'var(--pb-text-faint)',
                            }}
                        />
                        Langkah 3 · Pilih jenis output
                    </div>
                    <h1
                        style={{
                            fontSize: 'clamp(28px, 3.6vw, 46px)',
                            fontWeight: 700,
                            letterSpacing: '-0.035em',
                            lineHeight: 1.0,
                            margin: 0,
                            marginBottom: 8,
                        }}
                    >
                        Mau hasil seperti apa?
                    </h1>
                    <p
                        style={{
                            color: 'var(--pb-text-faint)',
                            fontSize: 'clamp(14px, 1.2vw, 16px)',
                            margin: 0,
                            marginBottom: 'clamp(24px, 3vw, 36px)',
                        }}
                    >
                        Pilih satu — harga sama, alur capture sama. Yang beda
                        cuma format hasil akhir.
                    </p>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(320px, 1fr))',
                            gap: 'clamp(16px, 2vw, 28px)',
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        {CHOICES.map((choice) => {
                            const isSelected = selected === choice.value;

                            return (
                                <button
                                    key={choice.value}
                                    type="button"
                                    onClick={() => setSelected(choice.value)}
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        textAlign: 'left',
                                        padding: 'clamp(20px, 2.5vw, 32px)',
                                        borderRadius: 24,
                                        border: isSelected
                                            ? `2px solid ${choice.accent}`
                                            : '2px solid rgba(255,255,255,0.08)',
                                        background: isSelected
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'rgba(255,255,255,0.03)',
                                        color: 'inherit',
                                        cursor: 'pointer',
                                        transition:
                                            'border 0.18s, background 0.18s, transform 0.18s',
                                        transform: isSelected
                                            ? 'translateY(-2px)'
                                            : 'translateY(0)',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 56,
                                            height: 56,
                                            borderRadius: 16,
                                            background: `${choice.accent}22`,
                                            color: choice.accent,
                                            marginBottom: 16,
                                        }}
                                    >
                                        <Icon
                                            name={choice.iconName}
                                            size={28}
                                        />
                                    </div>

                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: '0.16em',
                                            textTransform: 'uppercase',
                                            color: 'var(--pb-text-faint)',
                                            marginBottom: 6,
                                        }}
                                    >
                                        {choice.tagline}
                                    </div>
                                    <h2
                                        style={{
                                            fontSize: 'clamp(20px, 2vw, 26px)',
                                            fontWeight: 700,
                                            letterSpacing: '-0.02em',
                                            margin: 0,
                                            marginBottom: 10,
                                        }}
                                    >
                                        {choice.title}
                                    </h2>
                                    <p
                                        style={{
                                            margin: 0,
                                            marginBottom: 18,
                                            color: 'var(--pb-text-faint)',
                                            fontSize: 14,
                                            lineHeight: 1.55,
                                        }}
                                    >
                                        {choice.description}
                                    </p>

                                    <ul
                                        style={{
                                            listStyle: 'none',
                                            padding: 0,
                                            margin: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                            width: '100%',
                                        }}
                                    >
                                        {choice.bullets.map((b) => (
                                            <li
                                                key={b}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    fontSize: 13,
                                                }}
                                            >
                                                <Icon
                                                    name="check"
                                                    size={14}
                                                    color={choice.accent}
                                                />
                                                {b}
                                            </li>
                                        ))}
                                    </ul>

                                    {isSelected && (
                                        <span
                                            style={{
                                                position: 'absolute',
                                                top: 16,
                                                right: 16,
                                                width: 28,
                                                height: 28,
                                                borderRadius: 999,
                                                background: choice.accent,
                                                color: '#0A0A0A',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Icon name="check" size={16} />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div
                        style={{
                            marginTop: 'clamp(24px, 3vw, 36px)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}
                    >
                        <button
                            type="button"
                            onClick={next}
                            disabled={!selected || processing}
                            style={{
                                padding: '14px 32px',
                                borderRadius: 999,
                                border: 'none',
                                background: selected
                                    ? 'var(--pb-primary)'
                                    : 'rgba(255,255,255,0.08)',
                                color: selected ? '#0A0A0A' : '#6b6b6b',
                                fontWeight: 700,
                                fontSize: 16,
                                letterSpacing: '0.02em',
                                cursor: selected ? 'pointer' : 'not-allowed',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 10,
                                transition: 'background 0.18s',
                            }}
                        >
                            Lanjut
                            <Icon name="arrow-right" size={18} />
                        </button>
                    </div>
                </main>
            </KioskScene>
        </>
    );
}
