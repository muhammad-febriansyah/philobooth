import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { finishPrinting } from '@/actions/App/Http/Controllers/Kiosk/SessionController';
import { KioskHeader } from '@/components/philobooth/kiosk-chrome';
import { createPrintAgent } from '@/lib/print-agent';

type PrintingProps = {
    image_url: string | null;
    printer: {
        name: string;
        system_name: string | null;
        status: string | null;
    } | null;
    paper: { code: string; name: string } | null;
    copies: number;
};

type PrintState = 'checking' | 'printing' | 'finishing' | 'failed';

function errorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : 'Printer gagal merespons. Periksa koneksi USB dan coba lagi.';
}

export default function KioskPrinting({
    image_url: imageUrl,
    printer,
    paper,
    copies,
}: PrintingProps) {
    const [state, setState] = useState<PrintState>('checking');
    const [error, setError] = useState<string | null>(null);
    const running = useRef(false);

    const print = useCallback(async () => {
        if (running.current) {
            return;
        }

        running.current = true;
        setError(null);
        setState('checking');

        try {
            if (!imageUrl) {
                throw new Error('File hasil foto belum tersedia.');
            }

            if (!printer?.system_name) {
                throw new Error(
                    'Printer Windows belum dipilih. Atur printer dari halaman Admin > Printer.',
                );
            }

            const agent = createPrintAgent();
            const listing = await agent.listPrinters();
            const installedPrinter = listing.printers.find(
                ({ name }) => name === printer.system_name,
            );

            if (!installedPrinter) {
                throw new Error(
                    `Printer “${printer.system_name}” tidak ditemukan di Windows. Pastikan printer USB menyala lalu deteksi ulang dari Admin > Printer.`,
                );
            }

            const imageResponse = await fetch(imageUrl, {
                signal: AbortSignal.timeout(30_000),
            });

            if (!imageResponse.ok) {
                throw new Error('File hasil foto gagal diunduh untuk dicetak.');
            }

            setState('printing');
            await agent.printImage(await imageResponse.blob(), {
                printer: installedPrinter.name,
                copies: Math.max(1, copies),
            });

            setState('finishing');
            router.post(finishPrinting.url(), undefined, {
                preserveScroll: true,
                onError: () => {
                    running.current = false;
                    setState('failed');
                    setError(
                        'Foto sudah dikirim ke printer, tetapi status sesi gagal disimpan. Tekan lanjutkan tanpa mencetak ulang.',
                    );
                },
            });
        } catch (caughtError) {
            running.current = false;
            setState('failed');
            setError(errorMessage(caughtError));
        }
    }, [copies, imageUrl, printer]);

    useEffect(() => {
        const timeout = window.setTimeout(() => void print(), 0);

        return () => window.clearTimeout(timeout);
    }, [print]);

    const continueWithoutReprint = () => {
        running.current = true;
        setError(null);
        setState('finishing');
        router.post(finishPrinting.url());
    };

    const isFailed = state === 'failed';
    const title = isFailed
        ? 'Cetak belum berhasil'
        : state === 'finishing'
          ? 'Cetak selesai'
          : state === 'printing'
            ? 'Sedang mencetak…'
            : 'Menghubungkan printer…';

    return (
        <>
            <Head title="Mencetak — Philobooth" />
            <div
                className="pb-root"
                style={{
                    width: '100%',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    background:
                        'radial-gradient(at 50% 30%, #1f1f1f 0%, #050505 80%)',
                    color: '#fff',
                    overflow: 'hidden',
                }}
            >
                <KioskHeader step={0} dark />
                <main
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 56px',
                        textAlign: 'center',
                    }}
                >
                    <div
                        className={isFailed ? undefined : 'pb-pulse'}
                        style={{
                            width: 116,
                            height: 116,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            marginBottom: 36,
                            background: isFailed
                                ? 'rgba(255,89,89,.14)'
                                : 'rgba(245,250,12,.14)',
                            border: `2px solid ${isFailed ? '#ff5959' : 'var(--pb-primary)'}`,
                            fontSize: 48,
                        }}
                    >
                        {isFailed ? '!' : '▣'}
                    </div>

                    <h1
                        style={{
                            fontSize: 52,
                            lineHeight: 1.1,
                            fontWeight: 700,
                            letterSpacing: -1.3,
                            margin: '0 0 18px',
                        }}
                    >
                        {title}
                    </h1>

                    <p
                        style={{
                            maxWidth: 720,
                            color: isFailed
                                ? '#ffb3b3'
                                : 'rgba(255,255,255,.68)',
                            fontSize: 18,
                            lineHeight: 1.65,
                            margin: '0 0 32px',
                        }}
                    >
                        {error ??
                            `${copies} lembar ${paper?.name ?? 'foto'} dikirim ke ${printer?.name ?? 'printer booth'}. Jangan cabut kabel USB saat proses berjalan.`}
                    </p>

                    {isFailed ? (
                        <div
                            style={{
                                display: 'flex',
                                gap: 14,
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => void print()}
                                style={{
                                    border: 0,
                                    borderRadius: 999,
                                    padding: '16px 30px',
                                    background: 'var(--pb-primary)',
                                    color: '#0a0a0a',
                                    fontSize: 16,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Coba cetak lagi
                            </button>
                            {error?.startsWith('Foto sudah dikirim') && (
                                <button
                                    type="button"
                                    onClick={continueWithoutReprint}
                                    style={{
                                        border: '1px solid rgba(255,255,255,.28)',
                                        borderRadius: 999,
                                        padding: '16px 30px',
                                        background: 'transparent',
                                        color: '#fff',
                                        fontSize: 16,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Lanjutkan tanpa cetak ulang
                                </button>
                            )}
                        </div>
                    ) : (
                        <div
                            style={{
                                width: 'min(560px, 86vw)',
                                height: 10,
                                borderRadius: 999,
                                overflow: 'hidden',
                                background: 'rgba(255,255,255,.1)',
                            }}
                        >
                            <div
                                className="pb-pulse"
                                style={{
                                    width:
                                        state === 'checking'
                                            ? '30%'
                                            : state === 'printing'
                                              ? '75%'
                                              : '100%',
                                    height: '100%',
                                    borderRadius: 999,
                                    background: 'var(--pb-primary)',
                                    transition: 'width .35s ease',
                                }}
                            />
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
