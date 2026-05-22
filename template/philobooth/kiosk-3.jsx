/* kiosk-3.jsx — additional screens for the corrected kiosk flow:
   Voucher input · Validasi pembayaran · Pilih jumlah print */

// ─────────────────────────────────────────────────────────────
// 3b. Voucher input (alternative to QRIS at step 3)
// ─────────────────────────────────────────────────────────────
const KioskVoucher = () => {
  const pin = ["B","D","9","2"]; // 4 chars filled, 4 empty
  const empty = [null, null, null, null];
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
      <KioskHeader step={2}/>
      <main style={{ flex: 1, padding: "32px 120px", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 80, alignItems: "center" }}>
        <div>
          <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 2 · Voucher</div>
          <h2 style={{ fontSize: 52, fontWeight: 700, letterSpacing: -1.4, margin: "8px 0 14px" }}>Masukkan kode voucher</h2>
          <p style={{ fontSize: 19, color: "var(--pb-text-muted)", margin: "0 0 32px", lineHeight: 1.5 }}>
            Kode 8 digit ada di balik kartu hadiah atau di email konfirmasi event.
          </p>

          {/* Voucher card mock */}
          <div style={{
            background: "linear-gradient(135deg, #0A0A0A 0%, #1f1f1f 100%)",
            color: "#fff", borderRadius: 18, padding: 24,
            display: "flex", alignItems: "center", gap: 18, marginBottom: 20,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", right: -30, top: -30,
              width: 140, height: 140, borderRadius: "50%",
              background: "var(--pb-primary)", opacity: 0.18,
            }}/>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              background: "var(--pb-primary)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              position: "relative", zIndex: 1,
            }}><Icon name="ticket" size={28}/></div>
            <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Voucher partner</div>
              <div style={{ fontSize: 19, fontWeight: 700 }}>Birthday Bash 2026 · Rp 100k</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Berlaku s/d 31 Des 2026 · 1 booth sekali pakai</div>
            </div>
          </div>

          <div style={{
            background: "rgba(245,250,12,0.16)",
            border: "1px solid rgba(245,250,12,0.5)",
            borderRadius: 12, padding: 16,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <Icon name="info" size={20}/>
            <span style={{ fontSize: 14, color: "var(--pb-text)" }}>
              Sisa nominal voucher otomatis tercatat sebagai saldo philobooth.
            </span>
          </div>
        </div>

        <div>
          {/* PIN-style input boxes */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 32 }}>
            {[...pin, ...empty].map((c, i) => (
              <div key={i} style={{
                width: 80, height: 110, borderRadius: 16,
                background: "#fff",
                border: c ? "3px solid var(--pb-primary)" : i === pin.length ? "3px solid var(--pb-ink)" : "1.5px solid var(--pb-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 44, fontWeight: 700, color: "var(--pb-ink)",
                fontFamily: "monospace",
                boxShadow: c ? "0 4px 16px rgba(245,250,12,0.20)" : "var(--pb-shadow-sm)",
                position: "relative",
              }}>
                {c}
                {i === pin.length && (
                  <div className="pb-pulse" style={{
                    width: 3, height: 56, background: "var(--pb-ink)",
                    borderRadius: 2,
                  }}/>
                )}
              </div>
            ))}
          </div>

          {/* On-screen keypad */}
          <div style={{
            background: "#fff", borderRadius: 20, padding: 20,
            border: "1px solid var(--pb-border)",
            boxShadow: "var(--pb-shadow)",
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 8,
          }}>
            {["Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","Z","X","C","V","B","N","M"].map(k => (
              <button key={k} style={{
                aspectRatio: "1/1",
                background: "#FAFAFA",
                border: "1px solid var(--pb-border)",
                borderRadius: 12,
                cursor: "pointer", fontFamily: "Poppins, sans-serif",
                fontSize: 22, fontWeight: 600, color: "var(--pb-ink)",
                minHeight: 56,
              }}>{k}</button>
            ))}
            {["1","2","3","4","5","6","7","8","9","0"].map(k => (
              <button key={k} style={{
                aspectRatio: "1/1",
                background: "#FAFAFA",
                border: "1px solid var(--pb-border)",
                borderRadius: 12,
                cursor: "pointer", fontFamily: "Poppins, sans-serif",
                fontSize: 22, fontWeight: 600, color: "var(--pb-ink)",
                minHeight: 56,
              }}>{k}</button>
            ))}
            <button style={{
              gridColumn: "span 4", height: 56,
              background: "#0A0A0A", color: "#fff",
              border: "none", borderRadius: 12,
              cursor: "pointer", fontFamily: "Poppins, sans-serif",
              fontSize: 15, fontWeight: 600,
            }}>← Hapus</button>
            <button style={{
              gridColumn: "span 4", height: 56,
              background: "var(--pb-primary)", color: "#0A0A0A",
              border: "none", borderRadius: 12,
              cursor: "pointer", fontFamily: "Poppins, sans-serif",
              fontSize: 15, fontWeight: 700,
            }}>Validasi voucher</button>
          </div>
        </div>
      </main>
      <KioskFooter back="← Ganti metode bayar" next="Validasi" nextIcon="check"/>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 4. Validasi pembayaran (success)
// ─────────────────────────────────────────────────────────────
const KioskValidating = () => (
  <div className="pb-root" style={{
    width: "100%", height: "100%", position: "relative", overflow: "hidden",
    background: "radial-gradient(circle at 50% 40%, #FFFEF0 0%, #FAFAFA 70%)",
    display: "flex", flexDirection: "column",
  }}>
    {/* Floating confetti */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {Array.from({ length: 24 }).map((_, i) => {
        const x = (i * 89) % 1900;
        const y = ((i * 137) % 980) + 40;
        const s = (i % 4) + 4;
        const colors = ["#F5FA0C","#0A0A0A","#FB7185","#60A5FA"];
        const c = colors[i % 4];
        const r = (i * 31) % 60;
        const shape = i % 3;
        return shape === 0 ? <circle key={i} cx={x} cy={y} r={s/2} fill={c} opacity={0.5}/>
             : shape === 1 ? <rect key={i} x={x} y={y} width={s} height={s} fill={c} opacity={0.5} transform={`rotate(${r} ${x+s/2} ${y+s/2})`}/>
             : <path key={i} d={`M ${x} ${y-s} L ${x+s} ${y} L ${x} ${y+s} L ${x-s} ${y} Z`} fill={c} opacity={0.5}/>;
      })}
    </svg>

    <KioskHeader step={3} totalSteps={8}/>

    <main style={{ flex: 1, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 56px", textAlign: "center" }}>
      {/* Big animated check */}
      <div style={{
        width: 200, height: 200, borderRadius: "50%",
        background: "var(--pb-primary)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 14px rgba(245,250,12,0.16), 0 0 0 28px rgba(245,250,12,0.08), 0 20px 60px rgba(245,250,12,0.4)",
        marginBottom: 48, position: "relative",
      }}>
        <Icon name="check" size={108} color="#0A0A0A" strokeWidth={4}/>
        {/* Spin ring */}
        <svg style={{ position: "absolute", inset: -8, width: "calc(100% + 16px)", height: "calc(100% + 16px)" }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" fill="none" stroke="#0A0A0A" strokeWidth="1.5" strokeDasharray="2 6" opacity="0.4"/>
        </svg>
      </div>

      <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14, marginBottom: 8 }}>Langkah 3 · Pembayaran berhasil</div>
      <h1 style={{ fontSize: 96, fontWeight: 900, letterSpacing: -3, lineHeight: 0.95, margin: 0 }}>
        Sip, lunas!<br/>
        <span style={{
          background: "var(--pb-primary)", padding: "0 14px",
          borderRadius: 10, fontSize: 64, fontWeight: 700, letterSpacing: -1.5,
          display: "inline-block", marginTop: 12,
        }}>Mulai sesi foto</span>
      </h1>

      {/* Receipt mini */}
      <div style={{
        marginTop: 48, padding: "20px 28px",
        background: "#fff", borderRadius: 16,
        border: "1px solid var(--pb-border)",
        boxShadow: "var(--pb-shadow)",
        display: "flex", gap: 40, alignItems: "center",
      }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, color: "var(--pb-text-muted)" }}>Order ID</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>PHB-SC-2842</div>
        </div>
        <div style={{ width: 1, height: 36, background: "var(--pb-border)" }}/>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, color: "var(--pb-text-muted)" }}>Metode</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>QRIS · GoPay</div>
        </div>
        <div style={{ width: 1, height: 36, background: "var(--pb-border)" }}/>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 13, color: "var(--pb-text-muted)" }}>Total dibayar</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Rp 50.000</div>
        </div>
      </div>

      <p style={{ fontSize: 18, color: "var(--pb-text-muted)", marginTop: 32, maxWidth: 600 }}>
        Lanjut otomatis dalam <strong className="pb-pulse" style={{ display: "inline-block", color: "var(--pb-ink)" }}>3</strong> detik…
      </p>

      <button className="pb-btn pb-btn-primary" style={{
        marginTop: 24,
        padding: "20px 40px", fontSize: 18, fontWeight: 700,
        borderRadius: 14, minHeight: 64, gap: 10,
      }}>
        Lanjut sekarang
        <Icon name="arrow-right" size={20}/>
      </button>
    </main>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 9. Pilih jumlah print
// ─────────────────────────────────────────────────────────────
const KioskPrintQty = () => {
  const sizes = [
    { id: "4r",  title: "4R",        sub: "10×15 cm",  extra: "0", popular: false },
    { id: "strip", title: "Photo strip", sub: "5×15 cm \u00b7 2 strip", extra: "0", popular: true },
    { id: "polaroid", title: "Polaroid",  sub: "8.5×11 cm", extra: "+5.000", popular: false },
  ];
  const qtys = [
    { id: 1, sub: "Termasuk sesi", cost: "Free" },
    { id: 2, sub: "+1 lembar", cost: "+ Rp 10.000", popular: true },
    { id: 4, sub: "+3 lembar", cost: "+ Rp 28.000" },
    { id: 6, sub: "+5 lembar", cost: "+ Rp 42.000", value: "Hemat" },
  ];
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
      <KioskHeader step={7}/>
      <main style={{ flex: 1, padding: "32px 56px 24px", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, fontSize: 14 }}>Langkah 7</div>
            <h2 style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.2, margin: "8px 0 6px" }}>Berapa lembar mau dicetak?</h2>
            <p style={{ fontSize: 18, color: "var(--pb-text-muted)", margin: 0 }}>
              Sesi sudah termasuk 1 lembar strip. Tambah lembar tambahan dengan tarif spesial.
            </p>
          </div>
          <div style={{
            background: "var(--pb-ink)", color: "#fff",
            padding: "14px 22px", borderRadius: 14,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 0.5, textTransform: "uppercase" }}>Total tambahan</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--pb-primary)" }}>Rp 10.000</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 24, flex: 1, minHeight: 0 }}>
          {/* Left: format */}
          <div>
            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14 }}>Format cetak</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {sizes.map(s => (
                <button key={s.id} style={{
                  background: "#fff",
                  border: s.popular ? "3px solid var(--pb-primary)" : "1px solid var(--pb-border)",
                  borderRadius: 14, padding: 20,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 16,
                  position: "relative",
                  boxShadow: s.popular ? "0 6px 24px rgba(245,250,12,0.25)" : "var(--pb-shadow-sm)",
                }}>
                  <div style={{
                    width: 56, height: 80, borderRadius: 6,
                    background: "#FAFAFA",
                    border: "1px solid var(--pb-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {s.id === "strip" ? (
                      <div style={{ display: "grid", gridTemplateRows: "repeat(4, 1fr)", gap: 3, width: "60%", height: "76%" }}>
                        {[0,1,2,3].map(i => <div key={i} style={{ background: "#E5E5E5", borderRadius: 1 }}/>)}
                      </div>
                    ) : s.id === "polaroid" ? (
                      <div style={{ background: "#fff", width: "78%", height: "78%", borderRadius: 2, padding: 4, border: "1px solid var(--pb-border)" }}>
                        <div style={{ background: "#E5E5E5", height: "70%", borderRadius: 1 }}/>
                      </div>
                    ) : (
                      <div style={{ width: "70%", aspectRatio: "3/4", background: "#E5E5E5", borderRadius: 2 }}/>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "var(--pb-text-muted)", marginTop: 2 }}>{s.sub}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: s.extra === "0" ? "var(--pb-success)" : "var(--pb-text)", marginTop: 6 }}>
                      {s.extra === "0" ? "Termasuk" : "Tambahan Rp " + s.extra.replace(/^\+/, "")}
                    </div>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: s.popular ? "var(--pb-primary)" : "transparent",
                    border: s.popular ? "none" : "2px solid var(--pb-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>{s.popular && <Icon name="check" size={16}/>}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: jumlah lembar + preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>Jumlah lembar</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {qtys.map(q => (
                <button key={q.id} style={{
                  background: "#fff",
                  border: q.popular ? "3px solid var(--pb-primary)" : "1px solid var(--pb-border)",
                  borderRadius: 16, padding: "18px 14px",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                  position: "relative",
                  boxShadow: q.popular ? "0 6px 24px rgba(245,250,12,0.25)" : "var(--pb-shadow-sm)",
                }}>
                  {q.value && (
                    <span style={{
                      position: "absolute", top: -10, right: 14,
                      background: "var(--pb-ink)", color: "var(--pb-primary)",
                      padding: "3px 8px", borderRadius: 999,
                      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
                    }}>{q.value}</span>
                  )}
                  <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>{q.id}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--pb-text-muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>LEMBAR</div>
                  <div style={{ fontSize: 12, color: "var(--pb-text-muted)", marginTop: 10 }}>{q.sub}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: q.cost === "Free" ? "var(--pb-success)" : "var(--pb-ink)" }}>{q.cost}</div>
                </button>
              ))}
            </div>

            {/* Strip preview row */}
            <div style={{
              flex: 1, minHeight: 0, marginTop: 8,
              background: "#fff", borderRadius: 16,
              border: "1px solid var(--pb-border)",
              padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
            }}>
              <div>
                <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>Preview cetakan kamu</div>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>2 lembar Photo strip</div>
                <div style={{ fontSize: 14, color: "var(--pb-text-muted)", lineHeight: 1.6 }}>
                  1 lembar sudah termasuk sesi.<br/>
                  1 lembar tambahan <strong>+ Rp 10.000</strong>.
                </div>
                <div style={{
                  marginTop: 18, display: "inline-flex", gap: 8,
                  padding: "8px 14px", borderRadius: 999,
                  background: "rgba(22,163,74,0.10)",
                  color: "#166534", fontSize: 13, fontWeight: 600,
                }}>
                  <Icon name="check-circle" size={16}/>
                  Print bisa diambil sekitar 60 detik
                </div>
              </div>
              <div style={{ display: "flex", gap: 14 }}>
                {[0,1].map(i => (
                  <div key={i} style={{
                    background: "#fff", padding: 8, paddingBottom: 16,
                    borderRadius: 4, width: 100,
                    boxShadow: "0 10px 24px rgba(10,10,10,0.18)",
                    transform: `rotate(${i === 0 ? -3 : 3}deg)`,
                    filter: "sepia(0.55) contrast(0.95) brightness(1.05)",
                  }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      {[2,3,5,6].map(s => (
                        <div key={s} style={{ aspectRatio: "1/1", borderRadius: 1, overflow: "hidden" }}>
                          <PhotoPH seed={s}/>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <KioskFooter helper="2 lembar · Photo strip · +Rp 10.000" next="Lanjut ke final"/>
    </div>
  );
};

Object.assign(window, { KioskVoucher, KioskValidating, KioskPrintQty });
