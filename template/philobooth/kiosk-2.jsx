/* kiosk-2.jsx — Kiosk flow part 2: capture → thanks */

// ─────────────────────────────────────────────────────────────
// 6. Capture screen — webcam mock + countdown
// ─────────────────────────────────────────────────────────────
const KioskCapture = () => {
  const shots = [
    { idx: 1, status: "done",   seed: 4 },
    { idx: 2, status: "done",   seed: 7 },
    { idx: 3, status: "live",   seed: 0 },
    { idx: 4, status: "wait",   seed: 0 },
  ];
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#050505", color: "#fff", position: "relative", overflow: "hidden" }}>
      <KioskHeader step={5} dark/>
      <main style={{ flex: 1, padding: "24px 56px 24px", display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 32, minHeight: 0 }}>
        {/* Camera viewport */}
        <div style={{
          background: "#0A0A0A",
          borderRadius: 24, overflow: "hidden",
          position: "relative", border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Live cam mock — soft gradient with subjects */}
          <div className="pb-cam" style={{
            flex: 1,
            background: "radial-gradient(circle at 45% 45%, #FFD9C0 0%, #C97D5C 40%, #2a1810 90%)",
            position: "relative",
          }}>
            {/* Silhouette subjects */}
            <svg viewBox="0 0 100 60" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
              <circle cx="38" cy="32" r="6" fill="rgba(40,20,10,0.55)"/>
              <path d="M 26 60 Q 26 42 38 42 Q 50 42 50 60 Z" fill="rgba(40,20,10,0.55)"/>
              <circle cx="58" cy="30" r="6.5" fill="rgba(40,20,10,0.6)"/>
              <path d="M 46 60 Q 46 41 58 41 Q 72 41 72 60 Z" fill="rgba(40,20,10,0.6)"/>
            </svg>
            {/* Frame guides */}
            <div style={{
              position: "absolute", inset: "8% 12%",
              border: "2px dashed rgba(245,250,12,0.6)", borderRadius: 18,
            }}/>
            {[
              { t: 16, l: 24 }, { t: 16, r: 24 }, { b: 24, l: 24 }, { b: 24, r: 24 }
            ].map((c, i) => (
              <div key={i} style={{
                position: "absolute", top: c.t, left: c.l, right: c.r, bottom: c.b,
                width: 28, height: 28,
                borderTop: c.t != null ? "3px solid var(--pb-primary)" : "none",
                borderBottom: c.b != null ? "3px solid var(--pb-primary)" : "none",
                borderLeft: c.l != null ? "3px solid var(--pb-primary)" : "none",
                borderRight: c.r != null ? "3px solid var(--pb-primary)" : "none",
              }}/>
            ))}

            {/* Big countdown */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 280, fontWeight: 900, color: "var(--pb-primary)",
              textShadow: "0 8px 40px rgba(0,0,0,0.4)", letterSpacing: -10,
              lineHeight: 1,
            }} className="pb-countdown">3</div>

            {/* Recording dot */}
            <div style={{
              position: "absolute", top: 20, left: 20,
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(0,0,0,0.6)", padding: "8px 14px",
              borderRadius: 999, fontSize: 13, fontWeight: 600,
              backdropFilter: "blur(8px)",
            }}>
              <span className="pb-pulse" style={{ width: 10, height: 10, borderRadius: 5, background: "#ff3b30" }}/>
              LIVE
            </div>
            <div style={{
              position: "absolute", top: 20, right: 20,
              background: "rgba(0,0,0,0.6)", padding: "8px 14px",
              borderRadius: 999, fontSize: 13, fontWeight: 600,
              backdropFilter: "blur(8px)",
            }}>1920 × 1080 · 30fps</div>
          </div>

          {/* Cam controls */}
          <div style={{
            padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#0A0A0A",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button className="pb-btn pb-btn-ghost" style={{ color: "#fff", padding: "10px 16px" }}>
                <Icon name="refresh" size={18}/> Ulangi semua
              </button>
              <div style={{ height: 20, width: 1, background: "rgba(255,255,255,0.12)" }}/>
              <button className="pb-btn pb-btn-ghost" style={{ color: "#fff", padding: "10px 16px" }}>
                <Icon name="settings" size={18}/> Penyesuaian
              </button>
            </div>
            <div style={{
              padding: "8px 16px", borderRadius: 999,
              background: "rgba(245,250,12,0.16)",
              color: "var(--pb-primary)", fontSize: 14, fontWeight: 600,
            }}>Foto 3 dari 4 · Strike pose!</div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div className="pb-caption" style={{ color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 13 }}>Langkah 5</div>
            <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1, margin: "8px 0 6px", color: "#fff" }}>Strike a pose!</h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", margin: 0 }}>Foto otomatis tiap 4 detik. Total 4 pose.</p>
          </div>

          {/* Shot tray */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginTop: 4 }}>
            {shots.map(s => (
              <div key={s.idx} style={{
                aspectRatio: "3/4", borderRadius: 12, overflow: "hidden",
                position: "relative",
                border: s.status === "live" ? "3px solid var(--pb-primary)" : "1px solid rgba(255,255,255,0.12)",
                background: s.status === "done" ? "#fff" : "rgba(255,255,255,0.04)",
              }}>
                {s.status === "done" && <PhotoPH seed={s.seed}/>}
                {s.status === "live" && (
                  <div style={{
                    height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: "radial-gradient(circle, rgba(245,250,12,0.18) 0%, rgba(245,250,12,0.03) 70%)",
                    color: "var(--pb-primary)", fontSize: 40, fontWeight: 700,
                  }}>3</div>
                )}
                {s.status === "wait" && (
                  <div style={{
                    height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.3)", fontSize: 32, fontWeight: 700,
                  }}>4</div>
                )}
                {s.status === "done" && (
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    width: 28, height: 28, borderRadius: "50%", background: "var(--pb-primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name="check" size={16}/></div>
                )}
                <div style={{
                  position: "absolute", bottom: 8, left: 12,
                  fontSize: 12, fontWeight: 700, color: s.status === "done" ? "#fff" : "rgba(255,255,255,0.4)",
                  textShadow: s.status === "done" ? "0 1px 2px rgba(0,0,0,0.5)" : "none",
                }}>Pose {s.idx}</div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 18,
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--pb-primary)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Tips foto bagus</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.75)" }}>
              <li>Jaga jarak ~1 meter dari lensa</li>
              <li>Lihat ke arah lampu kuning di atas kamera</li>
              <li>Variasi pose tiap shot biar lebih hidup</li>
            </ul>
          </div>

          <button className="pb-btn pb-btn-secondary" style={{
            background: "rgba(255,255,255,0.06)", color: "#fff",
            borderColor: "rgba(255,255,255,0.16)", padding: "14px 18px",
            fontSize: 15,
          }}>
            <Icon name="pause" size={18}/> Jeda sesi
          </button>
        </div>
      </main>

      {/* Flash overlay */}
      <div className="pb-flash" style={{
        position: "absolute", inset: 0, background: "#fff",
        opacity: 0, pointerEvents: "none",
      }}/>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 7. Preview + retake
// ─────────────────────────────────────────────────────────────
const KioskPreview = () => (
  <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
    <KioskHeader step={6}/>
    <main style={{ flex: 1, padding: "32px 56px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
      <div>
        <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 6</div>
        <h2 style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5, margin: "8px 0 14px" }}>Pilih 4 foto terbaikmu</h2>
        <p style={{ fontSize: 19, color: "var(--pb-text-muted)", margin: "0 0 28px", lineHeight: 1.5 }}>
          Kamu ambil 6 pose. Pilih 4 yang paling kamu suka — atau ulangi sesi kalau mau coba lagi.
        </p>

        {/* Grid of all shots — selectable */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[0,1,2,3,4,5].map(i => {
            const selected = [0, 1, 3, 4].includes(i);
            const order = selected ? [0,1,3,4].indexOf(i) + 1 : null;
            return (
              <div key={i} style={{
                aspectRatio: "3/4", borderRadius: 14, overflow: "hidden", position: "relative",
                cursor: "pointer",
                border: selected ? "3px solid var(--pb-primary)" : "2px solid var(--pb-border)",
                boxShadow: selected ? "0 6px 24px rgba(245,250,12,0.25)" : "none",
              }}>
                <PhotoPH seed={i + 2}/>
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  width: 36, height: 36, borderRadius: "50%",
                  background: selected ? "var(--pb-primary)" : "rgba(255,255,255,0.85)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 16,
                  border: selected ? "none" : "2px solid #fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}>{order ?? ""}</div>
                {!selected && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.55)" }}/>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <Btn variant="secondary" icon="refresh" size="lg" style={{ flex: 1 }}>Ulang ambil foto</Btn>
          <Btn variant="ghost" icon="trash" size="lg" style={{ flex: 1 }}>Hapus pilihan</Btn>
        </div>
      </div>

      {/* Right — composed strip preview */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>
        <div className="pb-caption" style={{ color: "var(--pb-text-muted)", letterSpacing: 0.6 }}>PREVIEW · CONFETTI POP FRAME</div>
        <div style={{
          background: "#fff", padding: 20, paddingBottom: 50,
          borderRadius: 12, position: "relative",
          width: 280,
          boxShadow: "0 24px 80px rgba(10,10,10,0.18), 0 4px 12px rgba(10,10,10,0.08)",
          transform: "rotate(-1.5deg)",
        }}>
          {/* Confetti decorations */}
          <svg width="100%" height="40" viewBox="0 0 280 40" style={{ position: "absolute", top: 8, left: 0 }}>
            <circle cx="40" cy="12" r="4" fill="#F5FA0C"/>
            <circle cx="80" cy="22" r="3" fill="#0A0A0A"/>
            <rect x="120" y="6" width="6" height="6" fill="#F5FA0C" transform="rotate(20 123 9)"/>
            <circle cx="170" cy="20" r="3" fill="#FB7185"/>
            <path d="M 200 10 L 208 18 L 200 26 L 192 18 Z" fill="#F5FA0C"/>
            <circle cx="240" cy="14" r="3" fill="#0A0A0A"/>
          </svg>
          <div style={{ display: "grid", gap: 8, marginTop: 32 }}>
            {[0,1,3,4].map(i => (
              <div key={i} style={{ aspectRatio: "1/1", borderRadius: 4, overflow: "hidden" }}>
                <PhotoPH seed={i + 2}/>
              </div>
            ))}
          </div>
          <div style={{
            position: "absolute", bottom: 16, left: 0, right: 0,
            textAlign: "center", fontWeight: 700, fontSize: 14,
            letterSpacing: 1.4, color: "var(--pb-ink)"
          }}>
            <span style={{ background: "var(--pb-primary)", padding: "2px 8px", borderRadius: 3 }}>HAPPY</span> · 22·05·26
          </div>
        </div>
        <div style={{ fontSize: 14, color: "var(--pb-text-muted)" }}>
          Strip 2 × 6" · 4 pose · cetak 2 lembar
        </div>
      </div>
    </main>
    <KioskFooter helper="4 dari 4 foto dipilih · siap lanjut" next="Lanjut ke filter"/>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 8. Filter selection
// ─────────────────────────────────────────────────────────────
const KioskFilter = () => {
  const filters = [
    { id: "original", label: "Original", filter: "none", tone: "Original" },
    { id: "warm",     label: "Warm pop",   filter: "saturate(1.2) sepia(0.18) brightness(1.04)", tone: "Hangat" },
    { id: "filmnoir", label: "Film noir",  filter: "grayscale(1) contrast(1.15)", tone: "Hitam putih" },
    { id: "pastel",   label: "Pastel",     filter: "saturate(0.78) brightness(1.08) contrast(0.96)", tone: "Lembut" },
    { id: "y2k",      label: "Y2K", filter: "saturate(1.6) hue-rotate(-15deg) contrast(1.05)", tone: "Vivid" },
    { id: "vintage",  label: "Vintage",    filter: "sepia(0.55) contrast(0.95) brightness(1.05)", tone: "Lawas", active: true },
    { id: "fresh",    label: "Fresh",      filter: "saturate(1.15) brightness(1.08) hue-rotate(5deg)", tone: "Cerah" },
  ];
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
      <KioskHeader step={7}/>
      <main style={{ flex: 1, padding: "32px 56px 20px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 7</div>
          <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.2, margin: "8px 0 6px" }}>Tambahkan filter</h2>
          <p style={{ fontSize: 18, color: "var(--pb-text-muted)", margin: 0 }}>Filter berlaku untuk semua 4 foto.</p>
        </div>

        {/* Big preview */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28, minHeight: 0 }}>
          {[2,3,5,6].map((s, i) => (
            <div key={i} style={{
              aspectRatio: "3/4", borderRadius: 16, overflow: "hidden",
              border: "1px solid var(--pb-border)",
              position: "relative",
            }}>
              <div style={{ width: "100%", height: "100%", filter: "sepia(0.55) contrast(0.95) brightness(1.05)" }}>
                <PhotoPH seed={s}/>
              </div>
              <div style={{
                position: "absolute", top: 10, left: 12,
                padding: "4px 10px", borderRadius: 999,
                background: "rgba(0,0,0,0.55)", color: "#fff",
                fontSize: 11, fontWeight: 600,
                backdropFilter: "blur(8px)",
              }}>Pose {i + 1}</div>
            </div>
          ))}
        </div>

        {/* Filter carousel */}
        <div style={{ overflowX: "auto", paddingBottom: 12 }}>
          <div style={{ display: "flex", gap: 16, width: "max-content", paddingRight: 56 }}>
            {filters.map(f => (
              <button key={f.id} style={{
                width: 180, padding: 12,
                background: "#fff",
                border: f.active ? "3px solid var(--pb-primary)" : "1px solid var(--pb-border)",
                borderRadius: 16,
                cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                boxShadow: f.active ? "0 8px 24px rgba(245,250,12,0.3)" : "var(--pb-shadow-sm)",
                position: "relative",
                flexShrink: 0,
              }}>
                <div style={{ aspectRatio: "1/1", borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ width: "100%", height: "100%", filter: f.filter }}>
                    <PhotoPH seed={2}/>
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{f.label}</div>
                <div style={{ fontSize: 12, color: "var(--pb-text-muted)", marginTop: 2 }}>{f.tone}</div>
                {f.active && (
                  <div style={{
                    position: "absolute", top: -8, right: 12,
                    background: "var(--pb-primary)",
                    color: "#0A0A0A",
                    padding: "3px 9px", borderRadius: 999,
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
                  }}>Dipilih</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
      <KioskFooter helper="Filter: Vintage" next="Lanjut konfirmasi"/>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 9. Konfirmasi & generate
// ─────────────────────────────────────────────────────────────
const KioskConfirm = () => (
  <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
    <KioskHeader step={8}/>
    <main style={{ flex: 1, padding: "32px 120px", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 64, alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Final composed strip */}
        <div style={{
          background: "#fff", padding: 28, paddingBottom: 64,
          borderRadius: 12, position: "relative",
          width: 360,
          boxShadow: "0 32px 80px rgba(10,10,10,0.16), 0 4px 12px rgba(10,10,10,0.06)",
        }}>
          <svg width="100%" height="50" viewBox="0 0 360 50" style={{ position: "absolute", top: 10, left: 0 }}>
            <circle cx="50" cy="22" r="5" fill="#F5FA0C"/>
            <circle cx="110" cy="32" r="4" fill="#0A0A0A"/>
            <rect x="160" y="14" width="8" height="8" fill="#F5FA0C" transform="rotate(20 164 18)"/>
            <circle cx="220" cy="28" r="4" fill="#FB7185"/>
            <path d="M 270 16 L 280 26 L 270 36 L 260 26 Z" fill="#F5FA0C"/>
            <circle cx="320" cy="22" r="4" fill="#0A0A0A"/>
          </svg>
          <div style={{ display: "grid", gap: 10, marginTop: 40, filter: "sepia(0.55) contrast(0.95) brightness(1.05)" }}>
            {[2,3,5,6].map(i => (
              <div key={i} style={{ aspectRatio: "1/1", borderRadius: 4, overflow: "hidden" }}>
                <PhotoPH seed={i}/>
              </div>
            ))}
          </div>
          <div style={{
            position: "absolute", bottom: 20, left: 0, right: 0,
            textAlign: "center", fontWeight: 700, fontSize: 16,
            letterSpacing: 1.6, color: "var(--pb-ink)"
          }}>
            <span style={{ background: "var(--pb-primary)", padding: "3px 10px", borderRadius: 4 }}>HAPPY</span> · 22·05·26
          </div>
        </div>
      </div>

      <div>
        <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 8 · Generate hasil final</div>
        <h2 style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1.4, margin: "8px 0 14px" }}>Siap dicetak?</h2>
        <p style={{ fontSize: 19, color: "var(--pb-text-muted)", margin: "0 0 36px", lineHeight: 1.5 }}>
          Cek detail di bawah. Setelah ditekan cetak, foto tidak bisa diubah lagi.
        </p>

        <div style={{
          background: "#fff", border: "1px solid var(--pb-border)",
          borderRadius: 16, overflow: "hidden", marginBottom: 28,
        }}>
          {[
            { l: "Paket", v: "4R Double · 2 lembar" },
            { l: "Frame", v: "Confetti Pop · Birthday" },
            { l: "Filter", v: "Vintage" },
            { l: "Foto", v: "4 pose dipilih dari 6" },
            { l: "Format digital", v: "JPG · 300 DPI · download via QR" },
          ].map((r, i, a) => (
            <div key={i} style={{
              padding: "16px 22px", display: "flex", justifyContent: "space-between",
              borderBottom: i < a.length - 1 ? "1px solid var(--pb-border-soft)" : "none",
              fontSize: 16,
            }}>
              <span style={{ color: "var(--pb-text-muted)" }}>{r.l}</span>
              <span style={{ fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>

        <div style={{
          background: "var(--pb-ink)", color: "#fff",
          borderRadius: 16, padding: "20px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>Sudah lunas via QRIS</span>
          <span style={{ fontSize: 28, fontWeight: 700 }}>Rp 50.000</span>
        </div>

        <button className="pb-btn pb-btn-primary" style={{
          width: "100%", padding: "24px", fontSize: 24, fontWeight: 700,
          minHeight: 84, gap: 14, borderRadius: 16,
          boxShadow: "0 12px 32px rgba(245,250,12,0.4)"
        }}>
          <Icon name="printer" size={26}/>
          Cetak foto sekarang
          <Icon name="arrow-right" size={26}/>
        </button>
        <button className="pb-btn pb-btn-ghost" style={{
          width: "100%", marginTop: 10, padding: "12px",
          fontSize: 14, color: "var(--pb-text-muted)",
        }}>
          ← Kembali pilih filter
        </button>
      </div>
    </main>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 10. Printing loading
// ─────────────────────────────────────────────────────────────
const KioskPrinting = () => (
  <div className="pb-root" style={{
    width: "100%", height: "100%", display: "flex", flexDirection: "column",
    background: "radial-gradient(at 50% 30%, #1f1f1f 0%, #050505 80%)",
    color: "#fff", position: "relative", overflow: "hidden",
  }}>
    <KioskHeader step={0} dark/>
    {/* Yellow spotlight */}
    <div style={{
      position: "absolute", left: "50%", top: "55%", transform: "translate(-50%, -50%)",
      width: 800, height: 800, borderRadius: "50%",
      background: "radial-gradient(rgba(245,250,12,0.18) 0%, transparent 60%)",
      pointerEvents: "none",
    }}/>
    <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 56px", position: "relative", zIndex: 1 }}>
      {/* Printer + strip emerging */}
      <div style={{ position: "relative", marginBottom: 64 }}>
        <svg width="320" height="200" viewBox="0 0 320 200">
          {/* paper coming out */}
          <g style={{ transform: "translateY(-12px)" }}>
            <rect x="120" y="-180" width="80" height="200" rx="4" fill="#fff"/>
            <rect x="130" y="-170" width="60" height="40" rx="2" fill="#FFE9C7"/>
            <rect x="130" y="-120" width="60" height="40" rx="2" fill="#E7D6FF"/>
            <rect x="130" y="-70" width="60" height="40" rx="2" fill="#D2F4E5"/>
            <rect x="130" y="-20" width="60" height="40" rx="2" fill="#FFD4DE"/>
          </g>
          {/* printer body */}
          <rect x="40" y="80" width="240" height="100" rx="14" fill="#fff" stroke="#0A0A0A" strokeWidth="3"/>
          <rect x="100" y="80" width="120" height="14" rx="1" fill="#0A0A0A"/>
          <rect x="116" y="80" width="88" height="6" rx="1" fill="#F5FA0C"/>
          <circle cx="60" cy="120" r="8" fill="#F5FA0C"/>
          <circle cx="60" cy="120" r="3" fill="#0A0A0A"/>
          <rect x="80" y="140" width="160" height="24" rx="4" fill="#FAFAFA"/>
          <text x="160" y="158" textAnchor="middle" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="13" fill="#0A0A0A">DNP DS620A</text>
        </svg>
        {/* Pulsing ring under */}
        <div className="pb-pulse" style={{
          position: "absolute", left: "50%", bottom: -32, transform: "translateX(-50%)",
          width: 240, height: 24, borderRadius: 12,
          background: "radial-gradient(ellipse, rgba(245,250,12,0.45) 0%, transparent 70%)",
        }}/>
      </div>

      <h2 style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.4, margin: "0 0 14px", textAlign: "center" }}>
        Sedang mencetak<span className="pb-pulse" style={{ display: "inline-block" }}>…</span>
      </h2>
      <p style={{ fontSize: 19, color: "rgba(255,255,255,0.65)", margin: "0 0 56px", textAlign: "center", maxWidth: 540 }}>
        Foto kamu lagi diolah. Ini biasanya butuh sekitar 45–60 detik.
      </p>

      {/* Progress */}
      <div style={{ width: "min(600px, 80%)", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14, fontWeight: 600 }}>
          <span style={{ color: "var(--pb-primary)" }}>Mencetak lembar 1 dari 2</span>
          <span>62%</span>
        </div>
        <div style={{ height: 12, background: "rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
          <div style={{
            width: "62%", height: "100%",
            background: "linear-gradient(90deg, var(--pb-primary), #FFEA00)",
            borderRadius: 6,
            boxShadow: "0 0 24px rgba(245,250,12,0.6)",
          }}/>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", gap: 32 }}>
        {[
          { l: "Render frame",      done: true },
          { l: "Kirim ke printer",   done: true },
          { l: "Cetak lembar 1",     active: true },
          { l: "Cetak lembar 2",     done: false },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14,
            color: s.active ? "#fff" : s.done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
            fontWeight: s.active ? 600 : 500 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: s.done ? "var(--pb-primary)" : s.active ? "transparent" : "rgba(255,255,255,0.08)",
              border: s.active ? "2px solid var(--pb-primary)" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {s.done && <Icon name="check" size={14} color="#0A0A0A"/>}
              {s.active && <div className="pb-spin" style={{ width: 12, height: 12, borderRadius: 6, border: "2px solid var(--pb-primary)", borderTopColor: "transparent" }}/>}
            </div>
            {s.l}
          </div>
        ))}
      </div>
    </main>

    <footer style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 14, position: "relative", zIndex: 1 }}>
      Jangan tinggalkan booth — ambil foto di slot keluaran setelah selesai cetak.
    </footer>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 11. Download QR + receipt
// ─────────────────────────────────────────────────────────────
const KioskDownload = () => (
  <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
    <KioskHeader step={0}/>
    <main style={{ flex: 1, padding: "32px 56px", display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr", gap: 40, alignItems: "stretch" }}>
      {/* Big QR */}
      <div style={{
        background: "#fff", borderRadius: 24, padding: 36,
        border: "1px solid var(--pb-border)",
        boxShadow: "var(--pb-shadow)",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ marginBottom: 28 }}>
          <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Versi digital</div>
          <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1.2, margin: "8px 0 10px" }}>
            Scan untuk simpan ke HP
          </h2>
          <p style={{ fontSize: 17, color: "var(--pb-text-muted)", margin: 0, lineHeight: 1.5 }}>
            Termasuk versi tanpa frame untuk repost di IG · link aktif 7 hari.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32, flex: 1 }}>
          <div style={{
            background: "#fff", borderRadius: 16,
            border: "2px solid var(--pb-ink)", padding: 18,
            position: "relative",
          }}>
            <QR size={300} seed={42}/>
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 56, height: 56, borderRadius: 12,
              background: "var(--pb-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "4px solid #fff",
            }}><Icon name="logo" size={32}/></div>
          </div>
          <div>
            <div className="pb-caption" style={{ color: "var(--pb-text-faint)", letterSpacing: 0.4 }}>LINK CADANGAN</div>
            <div style={{
              fontFamily: "monospace", fontSize: 16, fontWeight: 700, marginTop: 6, marginBottom: 24,
              background: "#FAFAFA", padding: "10px 14px", borderRadius: 8,
              border: "1px solid var(--pb-border)",
            }}>philo.id/d/9KX42T</div>

            <div className="pb-caption" style={{ color: "var(--pb-text-faint)", letterSpacing: 0.4, marginTop: 16 }}>BERISI</div>
            <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: "var(--pb-text)" }}>
              <li>4 foto resolusi tinggi · JPG</li>
              <li>1 strip dengan frame · PNG</li>
              <li>1 boomerang animasi · MP4 ✨</li>
            </ul>
          </div>
        </div>

        <div style={{
          marginTop: 24, padding: 16,
          background: "rgba(245,250,12,0.16)", borderRadius: 12,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Icon name="info" size={20}/>
          <span style={{ fontSize: 14 }}>Tag <strong>@philobooth.id</strong> di IG biar bisa direpost ✨</span>
        </div>
      </div>

      {/* Print preview */}
      <div style={{
        background: "#fff", borderRadius: 24, padding: 28,
        border: "1px solid var(--pb-border)",
        display: "flex", flexDirection: "column", alignItems: "center",
        boxShadow: "var(--pb-shadow)",
      }}>
        <div style={{ alignSelf: "stretch", marginBottom: 18 }}>
          <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Cetakan kamu</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>2 lembar siap diambil</div>
        </div>
        <div style={{
          background: "#fff", padding: 16, paddingBottom: 38,
          borderRadius: 8, position: "relative",
          width: 220,
          boxShadow: "0 16px 48px rgba(10,10,10,0.18)",
          transform: "rotate(-2deg)",
        }}>
          <div style={{ display: "grid", gap: 6, filter: "sepia(0.55) contrast(0.95) brightness(1.05)" }}>
            {[2,3,5,6].map(i => (
              <div key={i} style={{ aspectRatio: "1/1", borderRadius: 3, overflow: "hidden" }}>
                <PhotoPH seed={i}/>
              </div>
            ))}
          </div>
          <div style={{
            position: "absolute", bottom: 14, left: 0, right: 0,
            textAlign: "center", fontWeight: 700, fontSize: 11,
            letterSpacing: 1, color: "var(--pb-ink)"
          }}>
            <span style={{ background: "var(--pb-primary)", padding: "1px 5px", borderRadius: 2 }}>HAPPY</span> · 22·05·26
          </div>
        </div>

        <div style={{
          marginTop: "auto", paddingTop: 24,
          alignSelf: "stretch", display: "flex", alignItems: "center", gap: 12,
          padding: "16px 18px", background: "#FAFAFA", borderRadius: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: "var(--pb-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Icon name="arrow-up" size={18}/></div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Ambil di slot keluaran</div>
            <div style={{ fontSize: 12, color: "var(--pb-text-muted)" }}>Di bagian bawah booth</div>
          </div>
        </div>
      </div>

      {/* Receipt */}
      <div style={{
        background: "#fff", borderRadius: 24, padding: 28,
        border: "1px solid var(--pb-border)",
        boxShadow: "var(--pb-shadow)",
        display: "flex", flexDirection: "column",
        position: "relative",
      }}>
        <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Struk digital</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, marginBottom: 24 }}>TRX-2842</div>

        {/* Mini logo */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <Logo size={32}/>
        </div>

        <div style={{ fontSize: 13, lineHeight: 1.9, color: "var(--pb-text)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--pb-text-muted)" }}>Tanggal</span>
            <span style={{ fontWeight: 600 }}>22 Mei 2026, 14:38</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--pb-text-muted)" }}>Cabang</span>
            <span style={{ fontWeight: 600 }}>Senayan City</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--pb-text-muted)" }}>Booth</span>
            <span style={{ fontWeight: 600 }}>PB-SC-01</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--pb-text-muted)" }}>Metode</span>
            <span style={{ fontWeight: 600 }}>QRIS · GoPay</span>
          </div>
        </div>

        <div style={{
          margin: "16px 0", height: 1,
          background: "repeating-linear-gradient(90deg, var(--pb-border) 0 6px, transparent 6px 12px)"
        }}/>

        <div style={{ fontSize: 13, lineHeight: 1.9 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>4R Double × 1</span>
            <span>Rp 50.000</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--pb-text-muted)" }}>
            <span>Frame Confetti Pop</span>
            <span>Free</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--pb-text-muted)" }}>
            <span>Download digital</span>
            <span>Free</span>
          </div>
        </div>

        <div style={{
          margin: "12px 0 16px", height: 1,
          background: "repeating-linear-gradient(90deg, var(--pb-border) 0 6px, transparent 6px 12px)"
        }}/>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 700 }}>Rp 50.000</span>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 18, display: "flex", gap: 8 }}>
          <Btn variant="secondary" icon="mail" style={{ flex: 1, padding: "10px", fontSize: 12 }}>Email</Btn>
          <Btn variant="secondary" icon="download" style={{ flex: 1, padding: "10px", fontSize: 12 }}>PDF</Btn>
        </div>
      </div>
    </main>
    <KioskFooter back="Cetak ulang struk" next="Selesai" nextIcon="check" hideBack/>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 12. Thank you
// ─────────────────────────────────────────────────────────────
const KioskThanks = () => (
  <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0A0A0A", color: "#fff", position: "relative", overflow: "hidden" }}>
    {/* Background dots */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(circle at 30% 40%, rgba(245,250,12,0.16) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(245,250,12,0.12) 0%, transparent 50%)",
    }}/>

    {/* Floating confetti */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {Array.from({ length: 22 }).map((_, i) => {
        const x = (i * 73) % 1900;
        const y = ((i * 137) % 980) + 40;
        const s = (i % 4) + 4;
        const colors = ["#F5FA0C","#fff","#FB7185","#60A5FA"];
        const c = colors[i % 4];
        const r = (i * 31) % 60;
        const shape = i % 3;
        return shape === 0 ? <circle key={i} cx={x} cy={y} r={s/2} fill={c} opacity={0.7}/>
             : shape === 1 ? <rect key={i} x={x} y={y} width={s} height={s} fill={c} opacity={0.7} transform={`rotate(${r} ${x+s/2} ${y+s/2})`}/>
             : <path key={i} d={`M ${x} ${y-s} L ${x+s} ${y} L ${x} ${y+s} L ${x-s} ${y} Z`} fill={c} opacity={0.7}/>;
      })}
    </svg>

    <main style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 56px", textAlign: "center" }}>
      {/* Big check */}
      <div style={{
        width: 160, height: 160, borderRadius: "50%",
        background: "var(--pb-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 14px rgba(245,250,12,0.16), 0 16px 60px rgba(245,250,12,0.4)",
        marginBottom: 40,
      }}>
        <Icon name="check" size={86} color="#0A0A0A" strokeWidth={3.5}/>
      </div>

      <h1 style={{ fontSize: 140, fontWeight: 900, letterSpacing: -6, lineHeight: 0.9, margin: 0 }}>
        <span style={{ color: "var(--pb-primary)" }}>Sampai</span><br/>
        jumpa lagi!
      </h1>
      <p style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", marginTop: 32, maxWidth: 700, lineHeight: 1.5 }}>
        Ambil foto di slot keluaran &amp; scan QR di belakang booth untuk versi digital.
      </p>

      <div style={{ display: "flex", gap: 20, marginTop: 56 }}>
        <button className="pb-btn pb-btn-primary" style={{ padding: "20px 36px", fontSize: 19, minHeight: 70, gap: 12, borderRadius: 16 }}>
          <Icon name="camera" size={22}/>
          Sesi baru
        </button>
        <button className="pb-btn pb-btn-secondary" style={{
          padding: "20px 36px", fontSize: 19, minHeight: 70, gap: 12,
          background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.16)", color: "#fff", borderRadius: 16,
        }}>
          <Icon name="heart" size={22} color="#FB7185"/>
          Beri rating sesi
        </button>
      </div>
    </main>

    <footer style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 14, position: "relative", zIndex: 1 }}>
      Kembali ke layar awal dalam <strong style={{ color: "var(--pb-primary)" }}>15 detik</strong>
    </footer>
  </div>
);

Object.assign(window, {
  KioskCapture, KioskPreview, KioskFilter, KioskConfirm,
  KioskPrinting, KioskDownload, KioskThanks,
});
