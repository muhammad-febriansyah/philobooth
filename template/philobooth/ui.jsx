/* ui.jsx — shared UI primitives + icons for philobooth */

// Inline lucide-style icons (stroke 2)
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 2, style }) => {
  const paths = {
    // navigation / dashboard
    "layout-dashboard": <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
    "store": <><path d="M3 9l2-5h14l2 5"/><path d="M4 9v11h16V9"/><path d="M9 22V12h6v10"/></>,
    "printer": <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></>,
    "frame": <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></>,
    "ticket": <><path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M13 7v2M13 13v2M13 17v2M13 3v2"/></>,
    "receipt": <><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 2V2H4z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/></>,
    "users": <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    "tag": <><path d="M20.59 13.41 13.41 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/></>,
    "settings": <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.16.65.41.86.71.21.3.34.66.34 1.04"/></>,
    "logout": <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    "bell": <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    "search": <><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.65" y2="16.65"/></>,
    "menu": <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    "chevron-down": <polyline points="6 9 12 15 18 9"/>,
    "chevron-up": <polyline points="18 15 12 9 6 15"/>,
    "chevron-left": <polyline points="15 18 9 12 15 6"/>,
    "chevron-right": <polyline points="9 18 15 12 9 6"/>,
    "arrow-right": <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    "arrow-up": <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
    "plus": <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    "minus": <line x1="5" y1="12" x2="19" y2="12"/>,
    "x": <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    "check": <polyline points="20 6 9 17 4 12"/>,
    "check-circle": <><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></>,
    "info": <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    "alert": <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    "camera": <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
    "image": <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
    "download": <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    "qr": <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v3M14 17v4M17 21h4M21 17h-1v4M17 17v.01"/></>,
    "credit-card": <><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></>,
    "play": <polygon points="6 4 20 12 6 20 6 4"/>,
    "pause": <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
    "filter": <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
    "trash": <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></>,
    "edit": <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    "copy": <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    "refresh": <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>,
    "sparkles": <><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M19 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" opacity=".7"/><path d="M5 4l.7 2 2 .7-2 .7L5 9.5l-.7-2-2-.7 2-.7z" opacity=".7"/></>,
    "wifi": <><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></>,
    "package": <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
    "calendar": <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    "more-h": <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
    "more-v": <><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>,
    "shapes": <><circle cx="6" cy="17" r="4"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M13 6l4-4 4 4-4 4z"/></>,
    "type": <><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></>,
    "sticker": <><path d="M21 12V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7"/><path d="M21 12l-9 9"/><path d="M21 12h-5a4 4 0 0 0-4 4v5"/></>,
    "layers": <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    "eye": <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    "eye-off": <><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
    "scan": <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></>,
    "heart": <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
    "lock": <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    "mail": <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
    "user": <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    "trend-up": <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    "wallet": <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></>,
    "circle": <circle cx="12" cy="12" r="10"/>,
    "square": <rect x="3" y="3" width="18" height="18" rx="2"/>,
    "scissors": <><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></>,
    "logo": <><circle cx="12" cy="12" r="10" fill={color === "currentColor" ? "var(--pb-primary)" : color} stroke="none"/><circle cx="12" cy="12" r="4" fill="none" stroke="#0A0A0A" strokeWidth="2"/><circle cx="18" cy="6" r="1.5" fill="#0A0A0A" stroke="none"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...style }}>
      {paths[name] || <circle cx="12" cy="12" r="9"/>}
    </svg>
  );
};

// philobooth logo
const Logo = ({ size = 28, withText = true, dark = false }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: "var(--pb-primary)",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
      boxShadow: "inset 0 0 0 2px rgba(10,10,10,0.92)"
    }}>
      <div style={{
        width: size * 0.42, height: size * 0.42, borderRadius: "50%",
        border: `${Math.max(2, size * 0.08)}px solid #0A0A0A`,
      }}/>
      <div style={{
        position: "absolute", top: size*0.12, right: size*0.12,
        width: size*0.16, height: size*0.16, borderRadius: "50%",
        background: "#0A0A0A"
      }}/>
    </div>
    {withText && <span style={{
      fontSize: size * 0.65, fontWeight: 700, letterSpacing: -0.4,
      color: dark ? "#fff" : "var(--pb-ink)"
    }}>philobooth</span>}
  </div>
);

// Button
const Btn = ({ variant = "primary", size, children, icon, iconRight, style, onClick, full, ...rest }) => {
  const cls = ["pb-btn", `pb-btn-${variant}`, size === "lg" ? "pb-btn-lg" : "", size === "xl" ? "pb-btn-xl" : ""].filter(Boolean).join(" ");
  return (
    <button className={cls} onClick={onClick} style={{ width: full ? "100%" : undefined, ...style }} {...rest}>
      {icon && <Icon name={icon} size={size === "xl" ? 22 : size === "lg" ? 18 : 16}/>}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "xl" ? 22 : size === "lg" ? 18 : 16}/>}
    </button>
  );
};

const Badge = ({ tone = "neutral", children, dot }) => (
  <span className={`pb-badge pb-badge-${tone}`}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: 3, background: "currentColor" }}/>}
    {children}
  </span>
);

const Card = ({ children, style, padding = 24 }) => (
  <div className="pb-card" style={{ padding, ...style }}>{children}</div>
);

// Inline mini bar chart
const Sparkbars = ({ data, color = "var(--pb-primary)", height = 40 }) => {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, width: "100%" }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${(v / max) * 100}%`,
          background: color,
          borderRadius: 3,
          minHeight: 3,
        }}/>
      ))}
    </div>
  );
};

// Photo placeholder — random pleasant gradient + camera icon
const PhotoPH = ({ seed = 0, label, style }) => {
  const palettes = [
    ["#FFE9C7", "#FFB37C"],
    ["#E7D6FF", "#A78BFA"],
    ["#D2F4E5", "#34D399"],
    ["#FFD4DE", "#FB7185"],
    ["#D7E8FF", "#60A5FA"],
    ["#FFF1A8", "#FBBF24"],
    ["#FFCBC1", "#F97373"],
    ["#CCE9D9", "#10B981"],
  ];
  const [a, b] = palettes[seed % palettes.length];
  return (
    <div style={{
      width: "100%", height: "100%",
      background: `linear-gradient(135deg, ${a}, ${b})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 8,
      color: "rgba(10,10,10,0.55)",
      ...style
    }}>
      <Icon name="image" size={28}/>
      {label && <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>}
    </div>
  );
};

// QR placeholder — pseudo-real-looking QR via deterministic checker grid
const QR = ({ size = 200, seed = 7 }) => {
  const N = 25;
  const cells = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inFinder =
        (x < 7 && y < 7) || (x >= N-7 && y < 7) || (x < 7 && y >= N-7);
      const finderDot =
        (x < 7 && y < 7 && (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4))) ||
        (x >= N-7 && y < 7 && ((x === N-7) || (x === N-1) || (y === 0) || (y === 6) || (x >= N-5 && x <= N-3 && y >= 2 && y <= 4))) ||
        (x < 7 && y >= N-7 && ((x === 0) || (x === 6) || (y === N-7) || (y === N-1) || (x >= 2 && x <= 4 && y >= N-5 && y <= N-3)));
      let on = false;
      if (inFinder) on = finderDot;
      else {
        // pseudo random based on seed + position
        const h = ((x * 9301 + y * 49297 + seed * 233280) % 233280) / 233280;
        on = h > 0.52;
      }
      cells.push({ x, y, on });
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${N} ${N}`} style={{ background: "#fff", display: "block" }}>
      {cells.map((c, i) => c.on && <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="#0A0A0A"/>)}
    </svg>
  );
};

// Section heading row for admin
const PageHead = ({ title, subtitle, actions }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
    <div>
      <h1 className="pb-h2" style={{ margin: 0 }}>{title}</h1>
      {subtitle && <p className="pb-body-sm" style={{ margin: "4px 0 0", color: "var(--pb-text-muted)" }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
  </div>
);

Object.assign(window, { Icon, Logo, Btn, Badge, Card, Sparkbars, PhotoPH, QR, PageHead });
