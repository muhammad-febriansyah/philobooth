/* admin.jsx — Admin screens for philobooth */

// ─────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────
const LoginScreen = ({ mobile }) => (
  <div className="pb-root" style={{
    width: "100%", height: "100%",
    background: "#FAFAFA",
    display: "grid",
    gridTemplateColumns: mobile ? "1fr" : "1.05fr 1fr",
  }}>
    {/* Left brand panel — yellow on black */}
    {!mobile && (
      <div style={{
        background: "#0A0A0A", color: "#fff",
        padding: 48, display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
      }}>
        <Logo size={32} dark/>
        {/* hero shape */}
        <div style={{
          position: "absolute", right: -120, top: -120,
          width: 460, height: 460, borderRadius: "50%",
          background: "var(--pb-primary)", opacity: 0.18,
        }}/>
        <div style={{
          position: "absolute", left: -60, bottom: -60,
          width: 200, height: 200, borderRadius: "50%",
          background: "var(--pb-primary)", opacity: 0.10,
        }}/>
        <div style={{ marginTop: "auto", maxWidth: 360, position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 10px", borderRadius: 999,
            background: "rgba(245,250,12,0.16)",
            color: "var(--pb-primary)",
            fontSize: 12, fontWeight: 600, letterSpacing: 0.4,
            marginBottom: 24,
          }}>
            <Icon name="sparkles" size={14} color="var(--pb-primary)"/>
            Admin console
          </div>
          <h1 className="pb-display" style={{ margin: 0, color: "#fff" }}>
            Manage every<br/>
            <span style={{
              background: "var(--pb-primary)", color: "#0A0A0A",
              padding: "0 8px", borderRadius: 6,
              display: "inline-block", marginTop: 6,
            }}>booth.</span>
          </h1>
          <p className="pb-body" style={{ marginTop: 16, color: "rgba(255,255,255,0.7)" }}>
            Pantau printer, transaksi, dan revenue lintas cabang dari satu dashboard.
          </p>
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 32, position: "relative" }}>
          {[
            { k: "12", v: "cabang aktif" },
            { k: "248", v: "cetakan / hari" },
            { k: "99.4%", v: "uptime printer" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.4 }}>{s.k}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Right form */}
    <div style={{
      display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: mobile ? "stretch" : "flex-start",
      padding: mobile ? 24 : 64,
    }}>
      <div style={{ maxWidth: 380, width: "100%", margin: mobile ? "auto" : 0 }}>
        {mobile && <div style={{ marginBottom: 24 }}><Logo size={28}/></div>}
        <h2 className="pb-h2" style={{ margin: 0 }}>Selamat datang kembali</h2>
        <p className="pb-body-sm" style={{ margin: "6px 0 28px", color: "var(--pb-text-muted)" }}>
          Masuk ke admin dashboard philobooth.
        </p>

        <label className="pb-caption" style={{ display: "block", marginBottom: 6, color: "var(--pb-text-muted)" }}>EMAIL</label>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <Icon name="mail" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--pb-text-faint)" }}/>
          <input className="pb-input" style={{ paddingLeft: 38 }} defaultValue="admin@philobooth.id"/>
        </div>

        <label className="pb-caption" style={{ display: "block", marginBottom: 6, color: "var(--pb-text-muted)" }}>PASSWORD</label>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <Icon name="lock" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--pb-text-faint)" }}/>
          <input className="pb-input" type="password" style={{ paddingLeft: 38, paddingRight: 38 }} defaultValue="••••••••••"/>
          <Icon name="eye-off" size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--pb-text-faint)" }}/>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--pb-text-muted)" }}>
            <input type="checkbox" defaultChecked style={{ accentColor: "var(--pb-primary)" }}/>
            Ingat saya
          </label>
          <a style={{ fontSize: 13, color: "var(--pb-ink)", fontWeight: 600, textDecoration: "none" }}>Lupa password?</a>
        </div>

        <Btn variant="primary" size="lg" full iconRight="arrow-right">Masuk</Btn>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", color: "var(--pb-text-faint)" }}>
          <div style={{ flex: 1, height: 1, background: "var(--pb-border)" }}/>
          <span style={{ fontSize: 12 }}>atau</span>
          <div style={{ flex: 1, height: 1, background: "var(--pb-border)" }}/>
        </div>

        <Btn variant="secondary" full icon="user">Masuk sebagai operator cabang</Btn>

        <p className="pb-body-sm" style={{ marginTop: 28, color: "var(--pb-text-faint)", textAlign: "center" }}>
          © 2025 philobooth · v2.1
        </p>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Sidebar (shared)
// ─────────────────────────────────────────────────────────────
const AdminSidebar = ({ active = "dashboard", collapsed }) => {
  const items = [
    { id: "dashboard", icon: "layout-dashboard", label: "Dashboard" },
    { id: "cabang",    icon: "store",            label: "Cabang", count: 12 },
    { id: "printer",   icon: "printer",          label: "Printer" },
    { id: "frames",    icon: "frame",            label: "Frame builder" },
    { id: "voucher",   icon: "ticket",           label: "Voucher" },
    { id: "tx",        icon: "receipt",          label: "Transaksi" },
    { id: "users",     icon: "users",            label: "User & role" },
    { id: "pricing",   icon: "tag",              label: "Harga cabang" },
  ];
  return (
    <aside style={{
      width: collapsed ? 72 : 248,
      background: "#fff",
      borderRight: "1px solid var(--pb-border)",
      display: "flex", flexDirection: "column",
      padding: "20px 12px",
      flexShrink: 0,
    }}>
      <div style={{ padding: "0 6px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo size={26} withText={!collapsed}/>
      </div>
      <div style={{ height: 1, background: "var(--pb-border)", margin: "16px -12px 16px" }}/>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map(it => (
          <div key={it.id}
            className={"pb-nav " + (it.id === active ? "pb-nav-active" : "")}
            title={collapsed ? it.label : undefined}>
            <Icon name={it.icon} size={18}/>
            {!collapsed && <span style={{ flex: 1 }}>{it.label}</span>}
            {!collapsed && it.count && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 7px",
                borderRadius: 999, background: "#F4F4F5", color: "#525252"
              }}>{it.count}</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto" }}>
        <div style={{ height: 1, background: "var(--pb-border)", margin: "16px -12px 12px" }}/>
        <div className="pb-nav">
          <Icon name="settings" size={18}/>
          {!collapsed && <span>Settings</span>}
        </div>
        <div className="pb-nav">
          <Icon name="logout" size={18}/>
          {!collapsed && <span>Keluar</span>}
        </div>
        {!collapsed && (
          <div style={{
            marginTop: 14, padding: "10px 12px",
            background: "#FAFAFA", borderRadius: 10,
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #FFE9C7, #FFB37C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13, color: "#7A3E00"
            }}>RA</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Rina Aulia</div>
              <div style={{ fontSize: 11, color: "var(--pb-text-faint)" }}>Super admin</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const AdminTopbar = ({ title }) => (
  <header style={{
    height: 64, borderBottom: "1px solid var(--pb-border)",
    display: "flex", alignItems: "center", gap: 16,
    padding: "0 24px", background: "#fff",
  }}>
    <div style={{ flex: 1, position: "relative", maxWidth: 420 }}>
      <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--pb-text-faint)" }}/>
      <input className="pb-input" style={{ paddingLeft: 38, background: "#FAFAFA", border: "none" }}
        placeholder="Cari transaksi, cabang, voucher…"/>
    </div>
    <button className="pb-btn pb-btn-ghost pb-btn-icon" style={{ position: "relative" }}>
      <Icon name="bell" size={18}/>
      <span style={{
        position: "absolute", top: 6, right: 6,
        width: 7, height: 7, borderRadius: 4,
        background: "var(--pb-danger)"
      }}/>
    </button>
    <Btn variant="primary" icon="plus">Transaksi baru</Btn>
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: "linear-gradient(135deg, #FFE9C7, #FFB37C)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 13, color: "#7A3E00",
    }}>RA</div>
  </header>
);

// Stat card
const Stat = ({ label, value, delta, deltaTone = "up", icon, accent }) => (
  <Card padding={20} style={{ position: "relative", overflow: "hidden" }}>
    {accent && (
      <div style={{
        position: "absolute", top: 16, right: 16,
        width: 38, height: 38, borderRadius: 10,
        background: "rgba(245,250,12,0.16)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon name={icon} size={18}/></div>
    )}
    <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6, marginTop: 8 }}>{value}</div>
    {delta && (
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}
           className={"pb-delta-" + deltaTone}>
        <Icon name={deltaTone === "up" ? "trend-up" : "trend-up"} size={14}
              style={{ transform: deltaTone === "up" ? "none" : "scaleY(-1)" }}/>
        {delta} <span style={{ color: "var(--pb-text-faint)", fontWeight: 400 }}>vs kemarin</span>
      </div>
    )}
  </Card>
);

// ─────────────────────────────────────────────────────────────
// Dashboard Overview
// ─────────────────────────────────────────────────────────────
const DashboardScreen = () => {
  const chartData = [42, 38, 55, 48, 62, 78, 88, 72, 65, 58, 90, 102, 86, 78];
  const printers = [
    { id: "PB-SC-01", branch: "Senayan City",   status: "online",  jobs: 38, paper: 84 },
    { id: "PB-GI-02", branch: "Grand Indonesia", status: "online", jobs: 24, paper: 32 },
    { id: "PB-PIM-01", branch: "Pondok Indah", status: "offline", jobs: 0,  paper: 0  },
    { id: "PB-KG-01", branch: "Kota Kasablanka", status: "online", jobs: 17, paper: 72 },
    { id: "PB-BSD-01", branch: "BSD City Mall", status: "warn",   jobs: 8,  paper: 12 },
  ];
  const tx = [
    { id: "TRX-2842", branch: "Senayan City",   item: "4R · 2 lembar",    method: "QRIS",   amount: "Rp 50.000", time: "2 mnt lalu", status: "paid" },
    { id: "TRX-2841", branch: "Grand Indonesia", item: "Strip · 4 foto",   method: "Voucher", amount: "Rp 35.000", time: "5 mnt lalu", status: "paid" },
    { id: "TRX-2840", branch: "Senayan City",   item: "4R · 1 lembar",    method: "QRIS",   amount: "Rp 25.000", time: "8 mnt lalu", status: "paid" },
    { id: "TRX-2839", branch: "Kota Kasablanka", item: "Strip · 2 foto",  method: "QRIS",   amount: "Rp 20.000", time: "11 mnt", status: "paid" },
    { id: "TRX-2838", branch: "BSD City Mall",  item: "4R · 2 lembar",    method: "Voucher", amount: "Rp 50.000", time: "14 mnt", status: "refund" },
  ];
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", background: "#FAFAFA", display: "flex" }}>
      <AdminSidebar active="dashboard"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AdminTopbar/>
        <main style={{ padding: 32, flex: 1, overflow: "auto" }}>
          <PageHead
            title="Dashboard overview"
            subtitle="Selasa, 22 Mei 2026 · 14:32 WIB"
            actions={<>
              <Btn variant="secondary" icon="calendar">7 hari terakhir</Btn>
              <Btn variant="secondary" icon="download">Ekspor</Btn>
            </>}
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            <Stat label="Revenue hari ini" value="Rp 4.82 jt" delta="+12.4%" icon="wallet" accent/>
            <Stat label="Cetakan" value="248" delta="+8.1%" icon="printer" accent/>
            <Stat label="Transaksi" value="184" delta="+5.6%" icon="receipt" accent/>
            <Stat label="Avg basket" value="Rp 26.2k" delta="-1.2%" deltaTone="down" icon="trend-up" accent/>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
            <Card>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h3 className="pb-h4" style={{ margin: 0 }}>Revenue 14 hari terakhir</h3>
                  <p className="pb-body-sm" style={{ margin: "4px 0 0", color: "var(--pb-text-muted)" }}>Total Rp 58.4 jt · +18.2% vs 14 hari sebelumnya</p>
                </div>
                <div style={{ display: "flex", gap: 4, padding: 3, background: "#F4F4F5", borderRadius: 8 }}>
                  {["Hari","Minggu","Bulan"].map((t, i) => (
                    <button key={i} style={{
                      border: "none", padding: "6px 12px",
                      background: i === 0 ? "#fff" : "transparent",
                      borderRadius: 6, fontSize: 12, fontWeight: 600,
                      color: i === 0 ? "var(--pb-ink)" : "var(--pb-text-muted)",
                      boxShadow: i === 0 ? "var(--pb-shadow-sm)" : "none",
                      cursor: "pointer", fontFamily: "inherit",
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={{ height: 220, position: "relative" }}>
                {/* axis */}
                <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateRows: "repeat(4, 1fr)", pointerEvents: "none" }}>
                  {[0,1,2,3].map(i => <div key={i} style={{ borderTop: "1px dashed #F0F0F1" }}/>)}
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: "100%", position: "relative" }}>
                  {chartData.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: "100%", height: `${(v / 110) * 100}%`,
                        background: i === 11 ? "var(--pb-primary)" : "#171717",
                        borderRadius: "6px 6px 0 0",
                        position: "relative",
                      }}>
                        {i === 11 && (
                          <div style={{
                            position: "absolute", bottom: "100%", left: "50%",
                            transform: "translateX(-50%)", marginBottom: 6,
                            background: "var(--pb-ink)", color: "#fff",
                            padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            whiteSpace: "nowrap"
                          }}>Rp 5.1jt</div>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--pb-text-faint)" }}>{(9 + i)}/05</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="pb-h4" style={{ margin: 0, marginBottom: 4 }}>Top cabang</h3>
              <p className="pb-body-sm" style={{ margin: 0, color: "var(--pb-text-muted)", marginBottom: 18 }}>Berdasarkan revenue hari ini</p>
              {[
                { n: "Senayan City",   v: "Rp 1.42 jt", p: 100, t: 64 },
                { n: "Grand Indonesia",v: "Rp 1.08 jt", p: 76, t: 48 },
                { n: "Kota Kasablanka",v: "Rp 0.96 jt", p: 68, t: 42 },
                { n: "BSD City Mall",  v: "Rp 0.74 jt", p: 52, t: 36 },
                { n: "Pondok Indah",   v: "Rp 0.62 jt", p: 44, t: 28 },
              ].map((b, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{b.n}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{b.v}</span>
                  </div>
                  <div style={{ height: 6, background: "#F4F4F5", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${b.p}%`, height: "100%", background: i === 0 ? "var(--pb-primary)" : "#171717" }}/>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--pb-text-faint)", marginTop: 4 }}>{b.t} transaksi</div>
                </div>
              ))}
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16 }}>
            <Card padding={0}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--pb-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 className="pb-h4" style={{ margin: 0 }}>Status printer</h3>
                  <p className="pb-body-sm" style={{ margin: "4px 0 0", color: "var(--pb-text-muted)" }}>5 dari 12 ditampilkan</p>
                </div>
                <a style={{ fontSize: 13, fontWeight: 600, color: "var(--pb-ink)", textDecoration: "none", cursor: "pointer" }}>Lihat semua →</a>
              </div>
              <div>
                {printers.map((p, i) => (
                  <div key={p.id} style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto auto",
                    gap: 16, alignItems: "center",
                    padding: "14px 22px",
                    borderBottom: i < printers.length - 1 ? "1px solid var(--pb-border-soft)" : "none"
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: "#F4F4F5",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name="printer" size={18}/></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.id}</div>
                      <div style={{ fontSize: 12, color: "var(--pb-text-faint)" }}>{p.branch}</div>
                    </div>
                    <div style={{ width: 100 }}>
                      <div style={{ fontSize: 11, color: "var(--pb-text-faint)", marginBottom: 4 }}>Kertas {p.paper}%</div>
                      <div style={{ height: 4, background: "#F4F4F5", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{
                          width: `${p.paper}%`, height: "100%",
                          background: p.paper < 20 ? "var(--pb-danger)" : p.paper < 40 ? "var(--pb-warning)" : "var(--pb-success)"
                        }}/>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--pb-text-muted)", fontWeight: 500, width: 70, textAlign: "right" }}>{p.jobs} job</div>
                    <Badge tone={p.status === "online" ? "success" : p.status === "warn" ? "warning" : "danger"} dot>
                      {p.status === "online" ? "Online" : p.status === "warn" ? "Kertas tipis" : "Offline"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding={0}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--pb-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 className="pb-h4" style={{ margin: 0 }}>Transaksi terakhir</h3>
                  <p className="pb-body-sm" style={{ margin: "4px 0 0", color: "var(--pb-text-muted)" }}>Update real-time</p>
                </div>
                <a style={{ fontSize: 13, fontWeight: 600, color: "var(--pb-ink)", textDecoration: "none", cursor: "pointer" }}>Lihat semua →</a>
              </div>
              <div>
                {tx.map((t, i) => (
                  <div key={t.id} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12, alignItems: "center",
                    padding: "12px 22px",
                    borderBottom: i < tx.length - 1 ? "1px solid var(--pb-border-soft)" : "none"
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        {t.id}
                        <Badge tone={t.status === "paid" ? "success" : "danger"}>{t.status === "paid" ? "Lunas" : "Refund"}</Badge>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--pb-text-faint)", marginTop: 2 }}>
                        {t.branch} · {t.item} · {t.method}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{t.amount}</div>
                      <div style={{ fontSize: 11, color: "var(--pb-text-faint)" }}>{t.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Dashboard — Mobile
// ─────────────────────────────────────────────────────────────
const DashboardMobile = () => {
  const sparks = [40, 58, 48, 70, 62, 88, 78, 96];
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", background: "#FAFAFA", overflowY: "auto" }}>
      <header style={{
        height: 60, padding: "0 16px", background: "#fff",
        borderBottom: "1px solid var(--pb-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 5,
      }}>
        <button className="pb-btn pb-btn-ghost pb-btn-icon"><Icon name="menu" size={20}/></button>
        <Logo size={24}/>
        <button className="pb-btn pb-btn-ghost pb-btn-icon" style={{ position: "relative" }}>
          <Icon name="bell" size={18}/>
          <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: 3, background: "var(--pb-danger)" }}/>
        </button>
      </header>
      <div style={{ padding: 16 }}>
        <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase" }}>Halo, Rina</div>
        <h1 className="pb-h2" style={{ margin: "4px 0 16px" }}>Hari ini hangat 🔥</h1>

        <Card padding={20} style={{
          background: "linear-gradient(135deg, #0A0A0A 0%, #1f1f1f 100%)",
          border: "none", color: "#fff", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", right: -40, top: -40,
            width: 160, height: 160, borderRadius: "50%",
            background: "var(--pb-primary)", opacity: 0.18,
          }}/>
          <div className="pb-caption" style={{ color: "rgba(255,255,255,0.6)" }}>REVENUE HARI INI</div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.8, margin: "6px 0 4px" }}>Rp 4.82 jt</div>
          <div style={{ fontSize: 12, color: "var(--pb-primary)", fontWeight: 600 }}>+12.4% vs kemarin</div>
          <div style={{ marginTop: 12, position: "relative", zIndex: 1 }}>
            <Sparkbars data={sparks} color="var(--pb-primary)" height={36}/>
          </div>
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {[
            { l: "Cetakan", v: "248", d: "+8.1%" },
            { l: "Transaksi", v: "184", d: "+5.6%" },
            { l: "Cabang aktif", v: "12 / 12", d: "All up" },
            { l: "Avg basket", v: "Rp 26.2k", d: "-1.2%", down: true },
          ].map((s, i) => (
            <Card key={i} padding={14}>
              <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase" }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 700, margin: "4px 0 2px" }}>{s.v}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: s.down ? "#B91C1C" : "#15803D" }}>{s.d}</div>
            </Card>
          ))}
        </div>

        <h2 className="pb-h4" style={{ margin: "24px 0 12px" }}>Status printer</h2>
        <Card padding={0}>
          {[
            { id: "PB-SC-01", branch: "Senayan City", status: "online", paper: 84 },
            { id: "PB-GI-02", branch: "Grand Indonesia", status: "online", paper: 32 },
            { id: "PB-BSD-01", branch: "BSD City Mall", status: "warn", paper: 12 },
            { id: "PB-PIM-01", branch: "Pondok Indah", status: "offline", paper: 0 },
          ].map((p, i, a) => (
            <div key={p.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: 14, borderBottom: i < a.length - 1 ? "1px solid var(--pb-border-soft)" : "none"
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: "#F4F4F5",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Icon name="printer" size={18}/></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.id}</div>
                <div style={{ fontSize: 12, color: "var(--pb-text-faint)" }}>{p.branch} · Kertas {p.paper}%</div>
              </div>
              <Badge tone={p.status === "online" ? "success" : p.status === "warn" ? "warning" : "danger"} dot>
                {p.status === "online" ? "Online" : p.status === "warn" ? "Tipis" : "Offline"}
              </Badge>
            </div>
          ))}
        </Card>

        <h2 className="pb-h4" style={{ margin: "24px 0 12px" }}>Transaksi terakhir</h2>
        <Card padding={0}>
          {[
            { id: "TRX-2842", branch: "Senayan City", amount: "Rp 50.000", time: "2 mnt" },
            { id: "TRX-2841", branch: "Grand Indonesia", amount: "Rp 35.000", time: "5 mnt" },
            { id: "TRX-2840", branch: "Senayan City", amount: "Rp 25.000", time: "8 mnt" },
          ].map((t, i, a) => (
            <div key={t.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: 14, borderBottom: i < a.length - 1 ? "1px solid var(--pb-border-soft)" : "none"
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.id}</div>
                <div style={{ fontSize: 12, color: "var(--pb-text-faint)" }}>{t.branch} · {t.time} lalu</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t.amount}</div>
            </div>
          ))}
        </Card>
        <div style={{ height: 80 }}/>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: "sticky", bottom: 0, background: "#fff",
        borderTop: "1px solid var(--pb-border)",
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
        padding: "8px 0", gap: 4,
      }}>
        {[
          { i: "layout-dashboard", l: "Beranda", active: true },
          { i: "store", l: "Cabang" },
          { i: "printer", l: "Printer" },
          { i: "receipt", l: "Transaksi" },
          { i: "user", l: "Akun" },
        ].map((t, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            color: t.active ? "var(--pb-ink)" : "var(--pb-text-faint)",
            fontSize: 10, fontWeight: 600,
          }}>
            <div style={{
              position: "relative",
              padding: "5px 14px", borderRadius: 999,
              background: t.active ? "var(--pb-primary)" : "transparent",
            }}><Icon name={t.i} size={18}/></div>
            {t.l}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Cabang management
// ─────────────────────────────────────────────────────────────
const CabangScreen = () => {
  const rows = [
    { name: "Senayan City",   loc: "Lt. 3 · Jakarta Pusat", manager: "Dimas P.", printers: 2, revenue: "Rp 1.42 jt", status: "online", hours: "10:00–22:00" },
    { name: "Grand Indonesia", loc: "East Mall L4 · Jakpus", manager: "Sari W.", printers: 2, revenue: "Rp 1.08 jt", status: "online", hours: "10:00–22:00" },
    { name: "Pondok Indah Mall", loc: "PIM 3 Lt. 2 · Jaksel", manager: "Yoga A.", printers: 1, revenue: "—",          status: "offline", hours: "10:00–22:00" },
    { name: "Kota Kasablanka", loc: "Ground Floor · Jaksel",  manager: "Niken S.", printers: 1, revenue: "Rp 0.96 jt", status: "online", hours: "10:00–22:00" },
    { name: "BSD City Mall",   loc: "Lt. 2 · Tangerang",      manager: "Rio H.",   printers: 2, revenue: "Rp 0.74 jt", status: "warn",   hours: "10:00–22:00" },
    { name: "Bintaro Xchange", loc: "Lt. 1 · Tangsel",        manager: "Ayu R.",   printers: 1, revenue: "Rp 0.61 jt", status: "online", hours: "10:00–22:00" },
    { name: "Living World",    loc: "Lt. 2 · Tangerang",      manager: "Indra P.", printers: 1, revenue: "Rp 0.54 jt", status: "online", hours: "10:00–22:00" },
    { name: "Pakuwon Mall",    loc: "Lt. 3 · Surabaya",       manager: "Bagas R.", printers: 2, revenue: "Rp 0.48 jt", status: "online", hours: "10:00–22:00" },
  ];
  const dotColor = (s) => s === "online" ? "var(--pb-success)" : s === "warn" ? "var(--pb-warning)" : "var(--pb-danger)";
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", background: "#FAFAFA", display: "flex" }}>
      <AdminSidebar active="cabang"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AdminTopbar/>
        <main style={{ padding: 32, flex: 1, overflow: "auto" }}>
          <PageHead
            title="Manajemen cabang"
            subtitle="12 cabang aktif di 4 kota"
            actions={<>
              <Btn variant="secondary" icon="download">Ekspor CSV</Btn>
              <Btn variant="primary" icon="plus">Tambah cabang</Btn>
            </>}
          />

          <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative", maxWidth: 360 }}>
              <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--pb-text-faint)" }}/>
              <input className="pb-input" placeholder="Cari nama cabang…" style={{ paddingLeft: 38 }}/>
            </div>
            <Btn variant="secondary" icon="filter">Status: Semua</Btn>
            <Btn variant="secondary" icon="filter">Kota: Semua</Btn>
            <div style={{ flex: 1 }}/>
            <div style={{ display: "flex", gap: 4, padding: 3, background: "#F4F4F5", borderRadius: 8 }}>
              <button style={{ border: "none", padding: "6px 10px", background: "#fff", borderRadius: 6, cursor: "pointer", boxShadow: "var(--pb-shadow-sm)" }}><Icon name="layout-dashboard" size={14}/></button>
              <button style={{ border: "none", padding: "6px 10px", background: "transparent", borderRadius: 6, cursor: "pointer" }}><Icon name="layers" size={14}/></button>
            </div>
          </div>

          <Card padding={0}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA" }}>
                  {["Cabang","Manajer","Printer","Revenue hari ini","Jam operasi","Status",""].map((h, i) => (
                    <th key={i} style={{
                      textAlign: "left", padding: "12px 16px",
                      fontSize: 11, fontWeight: 600, letterSpacing: 0.4,
                      color: "var(--pb-text-muted)", textTransform: "uppercase",
                      borderBottom: "1px solid var(--pb-border)"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.name} style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--pb-border-soft)" : "none" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 8,
                          background: "var(--pb-primary)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, color: "#0A0A0A", fontSize: 14,
                        }}>{r.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                          <div style={{ fontSize: 12, color: "var(--pb-text-faint)" }}>{r.loc}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--pb-text)" }}>{r.manager}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        <Icon name="printer" size={14} color="var(--pb-text-faint)"/>
                        {r.printers}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>{r.revenue}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--pb-text-muted)" }}>{r.hours}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: dotColor(r.status) }}/>
                        {r.status === "online" ? "Online" : r.status === "warn" ? "Perlu cek" : "Offline"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button className="pb-btn pb-btn-ghost pb-btn-icon"><Icon name="more-h" size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--pb-border)" }}>
              <div style={{ fontSize: 13, color: "var(--pb-text-muted)" }}>Menampilkan 1–8 dari 12 cabang</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="pb-btn pb-btn-secondary pb-btn-icon"><Icon name="chevron-left" size={16}/></button>
                <button className="pb-btn pb-btn-primary" style={{ minWidth: 36 }}>1</button>
                <button className="pb-btn pb-btn-secondary" style={{ minWidth: 36 }}>2</button>
                <button className="pb-btn pb-btn-secondary pb-btn-icon"><Icon name="chevron-right" size={16}/></button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Printer per branch
// ─────────────────────────────────────────────────────────────
const PrinterScreen = () => (
  <div className="pb-root" style={{ width: "100%", height: "100%", background: "#FAFAFA", display: "flex" }}>
    <AdminSidebar active="printer"/>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <AdminTopbar/>
      <main style={{ padding: 32, flex: 1, overflow: "auto" }}>
        <PageHead
          title="Manajemen printer"
          subtitle="Kelola printer di setiap cabang, monitor kertas & job queue"
          actions={<>
            <Btn variant="secondary" icon="refresh">Refresh</Btn>
            <Btn variant="primary" icon="plus">Daftarkan printer</Btn>
          </>}
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <Stat label="Online" value="9" icon="wifi" accent/>
          <Stat label="Kertas tipis" value="2" icon="alert" accent/>
          <Stat label="Offline" value="1" icon="x" accent/>
          <Stat label="Antrian job" value="38" icon="package" accent/>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { id: "PB-SC-01", branch: "Senayan City", model: "DNP DS620A", status: "online", paper: 84, ink: 92, jobs: 38, queue: 2, today: 64 },
            { id: "PB-SC-02", branch: "Senayan City", model: "DNP DS620A", status: "online", paper: 56, ink: 88, jobs: 22, queue: 0, today: 48 },
            { id: "PB-GI-01", branch: "Grand Indonesia", model: "DNP DS820A", status: "online", paper: 72, ink: 84, jobs: 18, queue: 1, today: 36 },
            { id: "PB-GI-02", branch: "Grand Indonesia", model: "DNP DS620A", status: "online", paper: 32, ink: 76, jobs: 12, queue: 0, today: 24 },
            { id: "PB-BSD-01", branch: "BSD City Mall", model: "DNP DS620A", status: "warn", paper: 12, ink: 64, jobs: 8, queue: 4, today: 36 },
            { id: "PB-PIM-01", branch: "Pondok Indah", model: "DNP DS820A", status: "offline", paper: 0, ink: 0, jobs: 0, queue: 0, today: 0 },
          ].map(p => (
            <Card key={p.id} padding={0} style={{ overflow: "hidden" }}>
              <div style={{
                padding: "16px 18px 14px",
                borderBottom: "1px solid var(--pb-border)",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start"
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{p.id}</div>
                  <div style={{ fontSize: 12, color: "var(--pb-text-faint)", marginTop: 2 }}>{p.branch} · {p.model}</div>
                </div>
                <Badge tone={p.status === "online" ? "success" : p.status === "warn" ? "warning" : "danger"} dot>
                  {p.status === "online" ? "Online" : p.status === "warn" ? "Tipis" : "Offline"}
                </Badge>
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: "var(--pb-text-muted)" }}>Kertas</span>
                    <span style={{ fontWeight: 600 }}>{p.paper}%</span>
                  </div>
                  <div style={{ height: 6, background: "#F4F4F5", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      width: `${p.paper}%`, height: "100%",
                      background: p.paper < 20 ? "var(--pb-danger)" : p.paper < 40 ? "var(--pb-warning)" : "var(--pb-success)"
                    }}/>
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: "var(--pb-text-muted)" }}>Ribbon / tinta</span>
                    <span style={{ fontWeight: 600 }}>{p.ink}%</span>
                  </div>
                  <div style={{ height: 6, background: "#F4F4F5", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      width: `${p.ink}%`, height: "100%",
                      background: "var(--pb-ink)"
                    }}/>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[
                    { l: "Hari ini", v: p.today },
                    { l: "Antrian",  v: p.queue },
                    { l: "Total job", v: p.jobs },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#FAFAFA", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: "var(--pb-text-faint)", marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="secondary" size={undefined} icon="scan" style={{ flex: 1, fontSize: 12, padding: "8px 10px" }}>Test print</Btn>
                  <Btn variant="secondary" icon="settings" style={{ fontSize: 12, padding: "8px 10px" }}>Setting</Btn>
                  <button className="pb-btn pb-btn-ghost pb-btn-icon"><Icon name="more-v" size={16}/></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Frame Builder
// ─────────────────────────────────────────────────────────────
const FrameBuilderScreen = () => {
  return (
    <div className="pb-root" style={{ width: "100%", height: "100%", background: "#FAFAFA", display: "flex" }}>
      <AdminSidebar active="frames"/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Compact topbar with file controls */}
        <header style={{
          height: 56, borderBottom: "1px solid var(--pb-border)",
          display: "flex", alignItems: "center", padding: "0 20px",
          background: "#fff", gap: 14,
        }}>
          <button className="pb-btn pb-btn-ghost pb-btn-icon"><Icon name="chevron-left" size={18}/></button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Birthday 2026 — Strip 2×6</span>
              <Badge tone="active">Draft</Badge>
            </div>
            <div style={{ fontSize: 11, color: "var(--pb-text-faint)" }}>Auto-saved 2 mnt lalu</div>
          </div>
          <div style={{ flex: 1 }}/>
          <div style={{ display: "flex", gap: 4, padding: 3, background: "#F4F4F5", borderRadius: 8 }}>
            <button style={{ border: "none", padding: "5px 10px", background: "transparent", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--pb-text-muted)", fontFamily: "inherit" }}>50%</button>
            <button style={{ border: "none", padding: "5px 10px", background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, boxShadow: "var(--pb-shadow-sm)", fontFamily: "inherit" }}>100%</button>
            <button style={{ border: "none", padding: "5px 10px", background: "transparent", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--pb-text-muted)", fontFamily: "inherit" }}>150%</button>
          </div>
          <Btn variant="ghost" icon="eye">Preview</Btn>
          <Btn variant="secondary">Simpan draft</Btn>
          <Btn variant="primary" icon="check">Publish</Btn>
        </header>

        {/* Body: left tools, center canvas, right inspector */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 280px", minHeight: 0 }}>
          {/* Left tools */}
          <div style={{ borderRight: "1px solid var(--pb-border)", background: "#fff", display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ padding: 14, borderBottom: "1px solid var(--pb-border)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {[
                  { i: "type", l: "Teks" },
                  { i: "image", l: "Foto" },
                  { i: "shapes", l: "Shape" },
                  { i: "sticker", l: "Sticker" },
                ].map((t, i) => (
                  <button key={i} style={{
                    border: "1px solid var(--pb-border)", background: i === 0 ? "var(--pb-primary)" : "#fff",
                    borderColor: i === 0 ? "var(--pb-primary)" : "var(--pb-border)",
                    borderRadius: 8, padding: "10px 4px", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                  }}>
                    <Icon name={t.i} size={18}/>
                    {t.l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: 14, flex: 1, overflowY: "auto", minHeight: 0 }}>
              <div className="pb-caption" style={{ color: "var(--pb-text-muted)", marginBottom: 10, letterSpacing: 0.5, textTransform: "uppercase" }}>Sticker library</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {["Semua","Birthday","Wedding","K-pop","Cute","Doodle"].map((c, i) => (
                  <span key={i} style={{
                    padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: i === 1 ? "var(--pb-ink)" : "#F4F4F5",
                    color: i === 1 ? "#fff" : "var(--pb-text-muted)",
                    cursor: "pointer",
                  }}>{c}</span>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["🎂","🎉","🎈","🎁","✨","🍰","🥳","🎊","💛","⭐","🌟","🪩"].map((e, i) => (
                  <div key={i} style={{
                    aspectRatio: "1", borderRadius: 8, background: "#FAFAFA",
                    border: "1px solid var(--pb-border-soft)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, cursor: "grab",
                  }}>{e}</div>
                ))}
              </div>
              <div className="pb-caption" style={{ color: "var(--pb-text-muted)", margin: "20px 0 10px", letterSpacing: 0.5, textTransform: "uppercase" }}>Slot foto</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ aspectRatio: "3/4", borderRadius: 8, border: "1.5px dashed var(--pb-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--pb-text-muted)", cursor: "pointer" }}>
                  <Icon name="plus" size={14} style={{ marginRight: 4 }}/>Slot 3:4
                </div>
                <div style={{ aspectRatio: "4/3", borderRadius: 8, border: "1.5px dashed var(--pb-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--pb-text-muted)", cursor: "pointer" }}>
                  <Icon name="plus" size={14} style={{ marginRight: 4 }}/>Slot 4:3
                </div>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div style={{ background: "#FAFAFA", padding: 32, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "auto" }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(rgba(10,10,10,0.06) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              pointerEvents: "none",
            }}/>
            <div style={{
              width: 320, height: 720,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 10px 40px rgba(10,10,10,0.10)",
              position: "relative",
              padding: 20,
              display: "flex", flexDirection: "column", gap: 12,
              zIndex: 1,
            }}>
              {/* Heading inside the strip */}
              <div style={{ textAlign: "center", fontWeight: 700, fontSize: 18 }}>
                <span style={{ background: "var(--pb-primary)", padding: "2px 8px", borderRadius: 4 }}>Happy</span> Birthday 🎂
              </div>
              {/* 4 photo slots */}
              {[0,1,2,3].map(i => (
                <div key={i} style={{ flex: 1, borderRadius: 6, overflow: "hidden", border: i === 1 ? "2px solid var(--pb-primary)" : "none", position: "relative" }}>
                  <PhotoPH seed={i + 2} label={`Slot ${i+1}`}/>
                  {i === 1 && (
                    <>
                      {[{t:0,l:0},{t:0,l:"100%"},{t:"100%",l:0},{t:"100%",l:"100%"}].map((c, j) => (
                        <span key={j} style={{
                          position: "absolute", top: c.t, left: c.l,
                          width: 10, height: 10, borderRadius: 5,
                          background: "var(--pb-primary)", border: "2px solid #fff",
                          transform: "translate(-50%, -50%)",
                        }}/>
                      ))}
                    </>
                  )}
                </div>
              ))}
              <div style={{
                marginTop: 4, textAlign: "center", fontSize: 11, fontWeight: 600,
                color: "var(--pb-text-muted)", letterSpacing: 1
              }}>22 · 05 · 2026 — PHILOBOOTH ✨</div>
            </div>
            {/* Floating ruler hint */}
            <div style={{
              position: "absolute", bottom: 16, left: 16,
              background: "#fff", border: "1px solid var(--pb-border)",
              padding: "8px 12px", borderRadius: 8, fontSize: 11,
              display: "flex", alignItems: "center", gap: 10,
              boxShadow: "var(--pb-shadow-sm)", zIndex: 2,
            }}>
              <Icon name="frame" size={14} color="var(--pb-text-muted)"/>
              <span style={{ color: "var(--pb-text-muted)" }}>2×6" · 300 DPI · 600 × 1800 px</span>
            </div>
          </div>

          {/* Right inspector */}
          <div style={{ borderLeft: "1px solid var(--pb-border)", background: "#fff", padding: 18, overflowY: "auto" }}>
            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Slot foto · 2</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>Slot foto utama</div>

            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", marginTop: 24, marginBottom: 8, letterSpacing: 0.5 }}>Posisi</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["X","Y","W","H"].map((l, i) => (
                <div key={l}>
                  <div className="pb-caption" style={{ color: "var(--pb-text-faint)", marginBottom: 4 }}>{l}</div>
                  <input className="pb-input" defaultValue={[20, 196, 280, 200][i]} style={{ padding: "8px 10px" }}/>
                </div>
              ))}
            </div>

            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", marginTop: 24, marginBottom: 8, letterSpacing: 0.5 }}>Bingkai slot</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div>
                <div className="pb-caption" style={{ color: "var(--pb-text-faint)", marginBottom: 4 }}>Border</div>
                <input className="pb-input" defaultValue="2px" style={{ padding: "8px 10px" }}/>
              </div>
              <div>
                <div className="pb-caption" style={{ color: "var(--pb-text-faint)", marginBottom: 4 }}>Radius</div>
                <input className="pb-input" defaultValue="6" style={{ padding: "8px 10px" }}/>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["#F5FA0C","#0A0A0A","#fff","#FB7185","#34D399"].map((c, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: c, border: c === "#fff" ? "1px solid var(--pb-border)" : "none",
                  cursor: "pointer",
                  boxShadow: i === 0 ? "0 0 0 2px var(--pb-primary), 0 0 0 4px #fff" : "none",
                }}/>
              ))}
            </div>

            <div className="pb-caption" style={{ color: "var(--pb-text-muted)", textTransform: "uppercase", marginTop: 24, marginBottom: 8, letterSpacing: 0.5 }}>Layer</div>
            <div style={{ borderRadius: 8, border: "1px solid var(--pb-border)", overflow: "hidden" }}>
              {[
                { i: "type", l: "Happy Birthday", sub: "Teks · Poppins 24" },
                { i: "image", l: "Slot foto 1", sub: "Foto · 280×200" },
                { i: "image", l: "Slot foto 2 (utama)", sub: "Foto · 280×200", active: true },
                { i: "image", l: "Slot foto 3", sub: "Foto · 280×200" },
                { i: "image", l: "Slot foto 4", sub: "Foto · 280×200" },
                { i: "sticker", l: "🎂 Cake", sub: "Sticker" },
              ].map((it, i, a) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px",
                  background: it.active ? "rgba(245,250,12,0.16)" : "#fff",
                  borderBottom: i < a.length - 1 ? "1px solid var(--pb-border-soft)" : "none",
                  cursor: "pointer",
                }}>
                  <Icon name={it.i} size={14} color="var(--pb-text-muted)"/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: it.active ? 700 : 500 }}>{it.l}</div>
                    <div style={{ fontSize: 10, color: "var(--pb-text-faint)" }}>{it.sub}</div>
                  </div>
                  <Icon name="eye" size={12} color="var(--pb-text-faint)"/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { LoginScreen, DashboardScreen, DashboardMobile, CabangScreen, PrinterScreen, FrameBuilderScreen });
