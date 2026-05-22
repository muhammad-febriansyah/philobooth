/* kiosk.jsx — Kiosk customer flow, 1920×1080 landscape */

// Shared kiosk chrome — header with logo, branch chip, time, step indicator
const KioskHeader = ({ step = 1, totalSteps = 8, branch = "Senayan City", time = "14:32", dark = false }) => (
  <header style={{
    height: 88, display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 56px",
    borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--pb-border)",
    background: dark ? "transparent" : "rgba(255,255,255,0.8)",
    backdropFilter: "blur(8px)",
    color: dark ? "#fff" : "var(--pb-ink)",
  }}>
    <Logo size={36} dark={dark}/>
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      {step > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span key={i} style={{
              width: i < step ? 28 : 10, height: 6, borderRadius: 3,
              background: i < step ? "var(--pb-primary)" : (dark ? "rgba(255,255,255,0.18)" : "#E5E5E5"),
              transition: "all .3s ease",
            }}/>
          ))}
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: dark ? "rgba(255,255,255,0.7)" : "var(--pb-text-muted)" }}>
            Langkah {step} / {totalSteps}
          </span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, opacity: dark ? 0.85 : 1 }}>
        <Icon name="store" size={16} color={dark ? "var(--pb-primary)" : "var(--pb-ink)"}/>
        {branch}
        <span style={{ color: dark ? "rgba(255,255,255,0.4)" : "var(--pb-text-faint)" }}>·</span>
        {time}
      </div>
    </div>
  </header>
);

// Footer with back/next buttons for kiosk
const KioskFooter = ({ back = "Kembali", next = "Lanjutkan", onNext, dark = false, hideBack, nextIcon = "arrow-right", nextDisabled, helper }) => (
  <footer style={{
    height: 120, padding: "0 56px",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--pb-border)",
    background: dark ? "transparent" : "rgba(255,255,255,0.8)",
  }}>
    {hideBack ? <div/> : (
      <button className="pb-btn pb-btn-secondary pb-btn-xl" style={{
        background: dark ? "rgba(255,255,255,0.06)" : "#fff",
        color: dark ? "#fff" : "var(--pb-ink)",
        borderColor: dark ? "rgba(255,255,255,0.16)" : "var(--pb-border)",
      }}>
        <Icon name="chevron-left" size={22}/>
        {back}
      </button>
    )}
    {helper && <div style={{ fontSize: 16, color: dark ? "rgba(255,255,255,0.6)" : "var(--pb-text-muted)" }}>{helper}</div>}
    <button className="pb-btn pb-btn-primary pb-btn-xl" disabled={nextDisabled} style={{
      opacity: nextDisabled ? 0.5 : 1,
      cursor: nextDisabled ? "not-allowed" : "pointer",
      padding: "20px 36px", fontSize: 20,
    }}>
      {next}
      {nextIcon && <Icon name={nextIcon} size={22}/>}
    </button>
  </footer>
);

// ─────────────────────────────────────────────────────────────
// 1. Welcome — Variation A (light, energetic)
// ─────────────────────────────────────────────────────────────
const KioskWelcomeA = () => (
  <div className="pb-root" style={{
    width: "100%", height: "100%", position: "relative", overflow: "hidden",
    background: "linear-gradient(135deg, #FFFEF0 0%, #FAFAFA 60%)",
    display: "flex", flexDirection: "column",
  }}>
    <KioskHeader step={0} totalSteps={8}/>
    {/* Decorative giant yellow disk */}
    <div style={{
      position: "absolute", right: -260, top: -180,
      width: 800, height: 800, borderRadius: "50%",
      background: "var(--pb-primary)", opacity: 0.92, zIndex: 0,
    }}/>
    <div style={{
      position: "absolute", right: 60, top: 120,
      width: 160, height: 160, borderRadius: "50%",
      background: "var(--pb-ink)", zIndex: 0,
    }}/>
    {/* Halftone dot field */}
    <div className="pb-halftone" style={{
      position: "absolute", left: 0, bottom: 0, width: "60%", height: "55%",
      opacity: 0.7, zIndex: 0,
    }}/>

    <main style={{ flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", position: "relative", zIndex: 1, padding: "0 56px" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", paddingRight: 60 }}>
        <div style={{
          display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 8,
          padding: "8px 14px", borderRadius: 999, background: "#0A0A0A",
          color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 28,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--pb-primary)" }}/>
          Booth siap pakai
        </div>
        <h1 style={{
          fontSize: 120, fontWeight: 700, letterSpacing: -3.5,
          lineHeight: 0.95, margin: 0, color: "var(--pb-ink)",
        }}>
          Cetak<br/>momen,<br/>
          <span style={{
            background: "var(--pb-primary)", padding: "0 18px",
            borderRadius: 16, boxDecorationBreak: "clone",
          }}>bukan cuma</span><br/>
          <em style={{ fontStyle: "italic", fontWeight: 700 }}>foto.</em>
        </h1>
        <p style={{
          fontSize: 22, color: "var(--pb-text-muted)",
          maxWidth: 540, marginTop: 32, lineHeight: 1.5,
        }}>
          Pilih frame, ambil foto, bayar pakai QRIS — 3 menit dari sini ke selesai.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24, position: "relative", zIndex: 2 }}>
        {/* Stacked sample strip */}
        <div style={{ position: "relative", width: 320, height: 480 }}>
          {[
            { r: -8, x: -34, z: 1, s: 4 },
            { r: 6, x: 24, z: 2, s: 1 },
            { r: -2, x: 0, z: 3, s: 0 },
          ].map((c, i) => (
            <div key={i} style={{
              position: "absolute", inset: 0,
              transform: `rotate(${c.r}deg) translateX(${c.x}px)`,
              zIndex: c.z,
              background: "#fff", borderRadius: 8,
              padding: 14, paddingBottom: 36,
              boxShadow: "0 12px 40px rgba(10,10,10,0.18), 0 2px 8px rgba(10,10,10,0.08)",
            }}>
              <div style={{ display: "grid", gridTemplateRows: "1fr 1fr 1fr", gap: 10, height: "100%" }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ borderRadius: 4, overflow: "hidden" }}>
                    <PhotoPH seed={c.s + j}/>
                  </div>
                ))}
              </div>
              <div style={{
                position: "absolute", bottom: 10, left: 0, right: 0,
                textAlign: "center", fontSize: 11, fontWeight: 700,
                color: "var(--pb-ink)", letterSpacing: 1,
              }}>PHILOBOOTH ✨ 22·05·26</div>
            </div>
          ))}
        </div>
        {/* Marquee ticker */}
        <div style={{
          marginTop: 12, width: "100%",
          background: "var(--pb-ink)", color: "var(--pb-primary)",
          padding: "16px 0", overflow: "hidden",
          borderRadius: 12,
        }}>
          <div className="pb-marquee-track" style={{ whiteSpace: "nowrap", fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <span key={i} style={{ display: "inline-flex", gap: 32, marginRight: 32 }}>
                <span>✨ 100% original you</span>
                <span>·</span>
                <span>30+ FRAMES SIAP PAKAI</span>
                <span>·</span>
                <span>QRIS &amp; VOUCHER</span>
                <span>·</span>
                <span>CETAK 4R · STRIP 2×6</span>
                <span>·</span>
                <span>SCAN ME → GET PHOTOS</span>
                <span>·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>

    <div style={{
      position: "relative", zIndex: 1,
      height: 200, padding: "0 56px 48px",
      display: "flex", justifyContent: "center", alignItems: "flex-end",
    }}>
      <button className="pb-btn pb-btn-primary" style={{
        padding: "32px 88px", fontSize: 30, fontWeight: 700,
        borderRadius: 24, minHeight: 110,
        gap: 16,
        boxShadow: "0 12px 32px rgba(245,250,12,0.5), 0 4px 12px rgba(10,10,10,0.18)",
        transform: "translateY(-12px)",
      }}>
        <Icon name="camera" size={32}/>
        Mulai sesi
        <Icon name="arrow-right" size={32}/>
      </button>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 1b. Welcome — Variation B (dark, dramatic)
// ─────────────────────────────────────────────────────────────
const KioskWelcomeB = () => (
  <div className="pb-root" style={{
    width: "100%", height: "100%", position: "relative", overflow: "hidden",
    background: "radial-gradient(at 70% 30%, #1a1a1a 0%, #050505 70%)",
    display: "flex", flexDirection: "column", color: "#fff",
  }}>
    <KioskHeader step={0} totalSteps={8} dark/>
    {/* Yellow gradient spotlight */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(800px 600px at 25% 75%, rgba(245,250,12,0.22) 0%, transparent 60%)",
    }}/>
    {/* Big SVG type behind */}
    <div style={{
      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 460, fontWeight: 900, letterSpacing: -14,
      color: "rgba(245,250,12,0.05)", lineHeight: 1, pointerEvents: "none",
    }}>PHILO</div>

    <main style={{ flex: 1, position: "relative", zIndex: 1, padding: "0 56px",
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        padding: "10px 18px", borderRadius: 999,
        background: "rgba(245,250,12,0.12)",
        color: "var(--pb-primary)",
        fontSize: 15, fontWeight: 600, marginBottom: 28,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: "var(--pb-primary)" }} className="pb-pulse"/>
        Tap anywhere to begin
      </div>

      <h1 style={{
        fontSize: 168, fontWeight: 900, letterSpacing: -6,
        lineHeight: 0.9, margin: 0, color: "#fff",
      }}>
        Smile,<br/>
        <span style={{
          color: "var(--pb-primary)",
          textShadow: "0 0 80px rgba(245,250,12,0.6)",
        }}>print,</span> repeat.
      </h1>
      <p style={{
        fontSize: 22, color: "rgba(255,255,255,0.6)",
        maxWidth: 640, marginTop: 28, lineHeight: 1.5,
      }}>
        Sesi 8 detik, hasil cetak HD, kirim ke HP via QR code. <br/>
        Tekan tombol di bawah untuk mulai.
      </p>

      <button className="pb-btn pb-btn-primary" style={{
        marginTop: 56,
        padding: "36px 96px", fontSize: 34, fontWeight: 700,
        borderRadius: 999, minHeight: 124,
        gap: 18,
        boxShadow: "0 0 0 8px rgba(245,250,12,0.18), 0 16px 48px rgba(245,250,12,0.4)",
      }}>
        <Icon name="camera" size={36}/>
        Mulai sesi
        <Icon name="arrow-right" size={36}/>
      </button>

      <div style={{ display: "flex", gap: 56, marginTop: 64, color: "rgba(255,255,255,0.7)" }}>
        {[
          { i: "frame",  l: "30+ frame" },
          { i: "credit-card", l: "QRIS / Voucher" },
          { i: "printer", l: "Cetak 60 detik" },
          { i: "download", l: "Download digital" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 500 }}>
            <Icon name={s.i} size={20} color="var(--pb-primary)"/>
            {s.l}
          </div>
        ))}
      </div>
    </main>

    <footer style={{ padding: "0 56px 32px", display: "flex", justifyContent: "space-between",
      color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }}>
      <span>v2.1 · Booth #PB-SC-01</span>
      <span>Butuh bantuan? Tekan operator di sebelah kanan.</span>
    </footer>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 2. Pilih ukuran kertas & jumlah print
// ─────────────────────────────────────────────────────────────
const KioskPaperSize = () => {
  const sizes = [
    { id: "4r", title: "4R Single", sub: "10 × 15 cm · 1 lembar", price: "Rp 25.000", featured: false, ratio: "3/4" },
    { id: "4r2", title: "4R Double", sub: "10 × 15 cm · 2 lembar", price: "Rp 50.000", featured: true, ratio: "3/4", tag: "Paling populer" },
    { id: "strip", title: "Photo strip", sub: "5 × 15 cm · 2 strip · 4 pose", price: "Rp 35.000", featured: false, ratio: "1/3" },
    { id: "polaroid", title: "Polaroid", sub: "8.5 × 11 cm · 4 lembar", price: "Rp 45.000", featured: false, ratio: "5/6" },
  ];
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
      <KioskHeader step={7}/>
      <main style={{ flex: 1, padding: "48px 56px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 7</div>
            <h2 style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5, margin: "8px 0 12px" }}>Pilih ukuran cetak</h2>
            <p style={{ fontSize: 20, color: "var(--pb-text-muted)", margin: 0 }}>
              Semua paket sudah termasuk versi digital (download via QR setelah cetak).
            </p>
          </div>
          <div style={{
            background: "#fff", border: "1px solid var(--pb-border)",
            borderRadius: 12, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 16,
            boxShadow: "var(--pb-shadow-sm)",
          }}>
            <span style={{ fontSize: 14, color: "var(--pb-text-muted)" }}>Jumlah set</span>
            <button className="pb-btn pb-btn-secondary pb-btn-icon" style={{ width: 44, height: 44 }}><Icon name="minus" size={20}/></button>
            <span style={{ fontSize: 28, fontWeight: 700, minWidth: 32, textAlign: "center" }}>1</span>
            <button className="pb-btn pb-btn-primary pb-btn-icon" style={{ width: 44, height: 44 }}><Icon name="plus" size={20}/></button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, flex: 1 }}>
          {sizes.map(s => (
            <button key={s.id} style={{
              background: "#fff",
              border: s.featured ? "3px solid var(--pb-primary)" : "1px solid var(--pb-border)",
              borderRadius: 20,
              padding: 28, textAlign: "left",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", flexDirection: "column",
              position: "relative",
              transition: "all .2s",
              boxShadow: s.featured ? "0 8px 32px rgba(245,250,12,0.3)" : "var(--pb-shadow-sm)",
            }}>
              {s.tag && (
                <div style={{
                  position: "absolute", top: -14, left: 24,
                  background: "var(--pb-primary)", color: "#0A0A0A",
                  padding: "6px 12px", borderRadius: 999,
                  fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase",
                }}>{s.tag}</div>
              )}
              <div style={{
                aspectRatio: s.ratio, background: "#FAFAFA",
                borderRadius: 12, marginBottom: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: s.id === "strip" ? "10px 30px" : 16,
              }}>
                {s.id === "strip" ? (
                  <div style={{ display: "flex", gap: 8, width: "100%", height: "100%" }}>
                    {[0,1].map(i => (
                      <div key={i} style={{ flex: 1, display: "grid", gridTemplateRows: "repeat(4, 1fr)", gap: 4 }}>
                        {[0,1,2,3].map(j => <div key={j} style={{ background: "#fff", border: "1px solid var(--pb-border)", borderRadius: 3 }}/>)}
                      </div>
                    ))}
                  </div>
                ) : s.id === "polaroid" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", height: "100%" }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ background: "#fff", border: "1px solid var(--pb-border)", borderRadius: 4, padding: 4, paddingBottom: 14 }}>
                        <div style={{ background: "#E5E5E5", height: "100%", borderRadius: 2 }}/>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ width: "100%", display: "grid", gridTemplateColumns: s.id === "4r2" ? "1fr 1fr" : "1fr", gap: 6 }}>
                    {(s.id === "4r2" ? [0,1] : [0]).map(i => (
                      <div key={i} style={{ aspectRatio: "3/4", background: "#fff", border: "1px solid var(--pb-border)", borderRadius: 6 }}/>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: "var(--pb-text-muted)", marginBottom: 20, flex: 1 }}>{s.sub}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{s.price}</span>
                {s.featured ? (
                  <span style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "var(--pb-primary)", display: "flex", alignItems: "center", justifyContent: "center"
                  }}><Icon name="check" size={20}/></span>
                ) : (
                  <span style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: "2px solid var(--pb-border)"
                  }}/>
                )}
              </div>
            </button>
          ))}
        </div>

        <div style={{
          marginTop: 24, background: "rgba(245,250,12,0.12)",
          border: "1px solid rgba(245,250,12,0.5)",
          borderRadius: 12, padding: 20,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: "var(--pb-primary)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}><Icon name="info" size={22}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Punya voucher hari ulang tahun?</div>
            <div style={{ fontSize: 14, color: "var(--pb-text-muted)", marginTop: 2 }}>
              Diskon &amp; promo bisa di-input di langkah pembayaran. Lanjut dulu, ya.
            </div>
          </div>
        </div>
      </main>
      <KioskFooter helper="Total: Rp 50.000 · 1 set · 4R Double"/>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. Pilih metode pembayaran
// ─────────────────────────────────────────────────────────────
const KioskPayment = () => (
  <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
    <KioskHeader step={1}/>
    <main style={{ flex: 1, padding: "64px 120px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 64, alignItems: "center" }}>
      <div>
        <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 1</div>
        <h2 style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5, margin: "8px 0 12px" }}>Pilih cara bayar</h2>
        <p style={{ fontSize: 20, color: "var(--pb-text-muted)", margin: "0 0 40px" }}>
          Semua metode aman &amp; instan. Voucher bisa redeem 100% nominal.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { id: "qris", icon: "qr", title: "QRIS", sub: "Bayar pakai e-wallet, m-banking, atau kartu kredit", selected: true, tag: "Recommended" },
            { id: "voucher", icon: "ticket", title: "Voucher / Kode promo", sub: "Punya kode dari event atau partner? Masukin di sini.", selected: false },
            { id: "cash", icon: "wallet", title: "Bayar di kasir", sub: "Tunjukkan total ke operator cabang, lalu kembali untuk cetak.", selected: false, disabled: true },
          ].map(m => (
            <button key={m.id} disabled={m.disabled} style={{
              display: "flex", alignItems: "center", gap: 20, padding: 24,
              borderRadius: 16, background: "#fff",
              border: m.selected ? "3px solid var(--pb-primary)" : "1px solid var(--pb-border)",
              boxShadow: m.selected ? "0 8px 28px rgba(245,250,12,0.25)" : "var(--pb-shadow-sm)",
              cursor: m.disabled ? "not-allowed" : "pointer",
              fontFamily: "inherit", textAlign: "left",
              opacity: m.disabled ? 0.45 : 1,
              position: "relative",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: m.selected ? "var(--pb-primary)" : "#FAFAFA",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}><Icon name={m.icon} size={28}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 700 }}>{m.title}</span>
                  {m.tag && (
                    <span style={{
                      background: "var(--pb-ink)", color: "var(--pb-primary)",
                      padding: "3px 10px", borderRadius: 999,
                      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
                    }}>{m.tag}</span>
                  )}
                </div>
                <div style={{ fontSize: 15, color: "var(--pb-text-muted)", marginTop: 4 }}>{m.sub}</div>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: m.selected ? "var(--pb-primary)" : "transparent",
                border: m.selected ? "none" : "2px solid var(--pb-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {m.selected && <Icon name="check" size={18}/>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{
        background: "#fff", borderRadius: 24, padding: 32,
        border: "1px solid var(--pb-border)",
        boxShadow: "var(--pb-shadow)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--pb-text-muted)", marginBottom: 6 }}>Ringkasan sesi</div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>Sesi photobooth · 1×</div>
        <div style={{ height: 1, background: "var(--pb-border)", margin: "24px 0" }}/>
        {[
          { l: "Tarif sesi (6 pose)", v: "Rp 50.000" },
          { l: "Frame + filter", v: "Termasuk" },
          { l: "2 lembar cetak + digital", v: "Termasuk" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 16 }}>
            <span style={{ color: "var(--pb-text-muted)" }}>{r.l}</span>
            <span style={{ fontWeight: 600 }}>{r.v}</span>
          </div>
        ))}
        <div style={{ height: 1, background: "var(--pb-border)", margin: "16px 0" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 16, color: "var(--pb-text-muted)" }}>Total</span>
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>Rp 50.000</span>
        </div>
        <div style={{ fontSize: 12, color: "var(--pb-text-faint)", marginTop: 8 }}>* Bisa tambah lembar cetak di langkah akhir</div>
        <div style={{
          marginTop: 24, padding: 16,
          background: "rgba(22,163,74,0.08)", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Icon name="check-circle" size={20} color="var(--pb-success)"/>
          <span style={{ fontSize: 14, color: "#166534", fontWeight: 500 }}>
            Refund otomatis jika printer gagal — uang kembali utuh.
          </span>
        </div>
      </div>
    </main>
    <KioskFooter next="Lanjut ke pembayaran"/>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 4. QR QRIS screen
// ─────────────────────────────────────────────────────────────
const KioskQRIS = () => (
  <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
    <KioskHeader step={2}/>
    <main style={{ flex: 1, padding: "32px 120px", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "center" }}>
      <div>
        <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 2 · QRIS</div>
        <h2 style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1.4, margin: "8px 0 14px" }}>Scan untuk bayar</h2>
        <p style={{ fontSize: 19, color: "var(--pb-text-muted)", margin: "0 0 32px", lineHeight: 1.5 }}>
          Buka aplikasi e-wallet atau m-banking, lalu scan kode di sebelah kanan.
        </p>

        <div style={{
          background: "#fff", borderRadius: 16, padding: 24,
          border: "1px solid var(--pb-border)", marginBottom: 24,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: "var(--pb-text-muted)" }}>Total dibayar</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>Rp 50.000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: "var(--pb-text-muted)" }}>Order ID</span>
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace" }}>PHB-SC-2842</span>
          </div>
        </div>

        <div style={{
          background: "#fff", borderRadius: 16, padding: "16px 20px",
          border: "1px solid var(--pb-border)", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <Icon name="info" size={20} color="var(--pb-info)"/>
          <div style={{ flex: 1, fontSize: 14, color: "var(--pb-text-muted)" }}>
            Layar lanjut otomatis setelah pembayaran terdeteksi.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--pb-text)" }}>
            <div className="pb-spin" style={{
              width: 14, height: 14, borderRadius: 7,
              border: "2px solid var(--pb-border)", borderTopColor: "var(--pb-ink)"
            }}/>
            menunggu
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          {["GoPay","DANA","OVO","ShopeePay","BCA"].map((w, i) => (
            <div key={i} style={{ fontSize: 13, fontWeight: 700, color: "var(--pb-text-muted)", letterSpacing: 0.5 }}>{w}</div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#fff", borderRadius: 24, padding: 32,
          border: "1px solid var(--pb-border)",
          boxShadow: "0 16px 60px rgba(10,10,10,0.10)",
          textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          {/* QRIS header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{
              padding: "6px 14px", borderRadius: 6, background: "#ED1B24",
              color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: 1,
            }}>QRIS</div>
            <Logo size={26}/>
          </div>
          <div style={{ position: "relative" }}>
            <QR size={420} seed={12}/>
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: 64, height: 64, borderRadius: 12, background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 8, background: "var(--pb-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Icon name="logo" size={28}/></div>
            </div>
          </div>
          <div style={{ marginTop: 18, fontSize: 14, color: "var(--pb-text-muted)" }}>
            Berlaku 5 menit · sisa <strong style={{ color: "var(--pb-ink)" }}>04:43</strong>
          </div>
        </div>
      </div>
    </main>
    <KioskFooter next="Saya sudah bayar" nextIcon="check"/>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 5. Pilih frame
// ─────────────────────────────────────────────────────────────
const KioskFrameSelect = () => {
  const themes = ["Semua","Birthday","Wedding","Anniversary","K-pop","Cute","Doodle","Minimalist"];
  const frames = [
    { i: 0, t: "Confetti Pop", c: "Birthday", featured: true },
    { i: 1, t: "Sunny Strip", c: "Cute" },
    { i: 2, t: "Pastel Heart", c: "Anniversary" },
    { i: 3, t: "Bold Yellow", c: "Minimalist" },
    { i: 4, t: "K-pop Stars", c: "K-pop", new: true },
    { i: 5, t: "Wedding Lace", c: "Wedding" },
    { i: 6, t: "Doodle Friends", c: "Doodle" },
    { i: 7, t: "Polaroid Frame", c: "Minimalist" },
    { i: 8, t: "Cake & Candles", c: "Birthday" },
    { i: 9, t: "Love Confetti", c: "Anniversary" },
    { i: 10, t: "Wedding Gold", c: "Wedding", new: true },
    { i: 11, t: "Hi! Sticker", c: "Cute" },
  ];
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
      <KioskHeader step={4}/>
      <main style={{ flex: 1, padding: "32px 56px 20px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 4</div>
            <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.2, margin: "8px 0 6px" }}>Pilih frame favoritmu</h2>
            <p style={{ fontSize: 18, color: "var(--pb-text-muted)", margin: 0 }}>30+ desain · update setiap bulan</p>
          </div>
          <div style={{ position: "relative", width: 360 }}>
            <Icon name="search" size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--pb-text-faint)" }}/>
            <input className="pb-input" style={{ paddingLeft: 46, paddingTop: 14, paddingBottom: 14, fontSize: 16 }} placeholder="Cari frame, contoh: birthday"/>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {themes.map((t, i) => (
            <button key={t} style={{
              padding: "10px 18px", borderRadius: 999,
              background: i === 1 ? "var(--pb-ink)" : "#fff",
              color: i === 1 ? "#fff" : "var(--pb-ink)",
              border: i === 1 ? "none" : "1px solid var(--pb-border)",
              fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              minHeight: 44,
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, flex: 1, minHeight: 0, overflowY: "auto" }}>
          {frames.map(f => (
            <button key={f.i} style={{
              background: "#fff",
              border: f.featured ? "3px solid var(--pb-primary)" : "1px solid var(--pb-border)",
              borderRadius: 16, padding: 12,
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              boxShadow: f.featured ? "0 8px 28px rgba(245,250,12,0.30)" : "var(--pb-shadow-sm)",
              position: "relative",
            }}>
              {f.new && (
                <span style={{
                  position: "absolute", top: -8, right: 12,
                  background: "var(--pb-ink)", color: "var(--pb-primary)",
                  padding: "3px 9px", borderRadius: 999,
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", zIndex: 1
                }}>Baru</span>
              )}
              <div style={{
                aspectRatio: "3/4", background: "#FAFAFA", borderRadius: 10, marginBottom: 12,
                position: "relative", overflow: "hidden",
              }}>
                <PhotoPH seed={f.i + 1}/>
                {/* Decorative frame overlay */}
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  border: f.i % 3 === 0 ? "6px solid var(--pb-primary)" : f.i % 3 === 1 ? "6px solid #fff" : "none",
                  borderRadius: 10,
                  boxShadow: f.i % 3 === 1 ? "inset 0 0 0 2px #0A0A0A" : "none",
                }}/>
                <div style={{
                  position: "absolute", left: 8, right: 8, bottom: 8,
                  textAlign: "center", fontSize: 10, fontWeight: 700,
                  color: f.i % 3 === 0 ? "#0A0A0A" : "#fff",
                  textShadow: f.i % 3 === 0 ? "none" : "0 1px 2px rgba(0,0,0,0.4)",
                  letterSpacing: 0.8,
                }}>PHILOBOOTH · 2026</div>
                {f.featured && (
                  <div style={{
                    position: "absolute", top: 8, left: 8,
                    width: 28, height: 28, borderRadius: "50%",
                    background: "var(--pb-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name="check" size={16}/></div>
                )}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{f.t}</div>
              <div style={{ fontSize: 12, color: "var(--pb-text-faint)", marginTop: 2 }}>{f.c}</div>
            </button>
          ))}
        </div>
      </main>
      <KioskFooter helper="Frame: Confetti Pop · 1 dipilih" next="Lanjut ke pengambilan foto"/>
    </div>
  );
};

Object.assign(window, {
  KioskHeader, KioskFooter,
  KioskWelcomeA, KioskWelcomeB,
  KioskPaperSize, KioskPayment, KioskQRIS, KioskFrameSelect,
});
