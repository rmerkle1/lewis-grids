import { useState, useEffect } from 'react';
import './TutorialModal.css';

const STORAGE_KEY = 'lewis-grids-tutorial-seen';

// ── Polygon geometry ──────────────────────────────────────────────────────────

const POLY_START_DEG = { 3: -90, 4: -45, 5: -90, 6: -60 };
const BSQ = 5;    // bond square side length
const BSG = 3.5;  // gap between squares

function polyVerts(cx, cy, R, n) {
  const start = ((POLY_START_DEG[n] ?? -90) * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const a = start + i * (2 * Math.PI / n);
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
}

function edgeMids(cx, cy, verts) {
  return verts.map((v, i) => {
    const w = verts[(i + 1) % verts.length];
    const mx = (v.x + w.x) / 2, my = (v.y + w.y) / 2;
    return { x: mx, y: my, angle: Math.atan2(my - cy, mx - cx) };
  });
}

// ── SVG primitives ────────────────────────────────────────────────────────────

function BondSquares({ edge, order, fill = 'rgba(255,255,255,0.88)' }) {
  const { x: ex, y: ey, angle: ea } = edge;
  const inX = -Math.cos(ea), inY = -Math.sin(ea);
  const tx  =  Math.cos(ea + Math.PI / 2), ty = Math.sin(ea + Math.PI / 2);
  const bx  = ex + (BSQ / 2) * inX, by = ey + (BSQ / 2) * inY;
  const total = order * BSQ + (order - 1) * BSG;
  const deg = (ea * 180 / Math.PI).toFixed(1);
  return Array.from({ length: order }, (_, j) => {
    const off = -total / 2 + BSQ / 2 + j * (BSQ + BSG);
    const sx = bx + off * tx, sy = by + off * ty;
    return (
      <rect key={j}
        x={sx - BSQ / 2} y={sy - BSQ / 2} width={BSQ} height={BSQ}
        fill={fill} rx="1"
        transform={`rotate(${deg},${sx.toFixed(1)},${sy.toFixed(1)})`}
      />
    );
  });
}

function MiniAtom({ cx, cy, R, n, element, color, bondPattern }) {
  const verts = polyVerts(cx, cy, R, n);
  const edges = edgeMids(cx, cy, verts);
  const pts   = verts.map(v => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ');
  return (
    <g>
      <polygon points={pts} fill={color} />
      {bondPattern.map((order, i) =>
        order ? <BondSquares key={i} edge={edges[i]} order={order} /> : null
      )}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={n === 3 ? 12 : 13} fontWeight="bold"
        fontFamily="Georgia,serif">
        {element}
      </text>
    </g>
  );
}

// Shared illustration wrappers
function IRow({ children }) {
  return <div className="tutorial-illus-row">{children}</div>;
}
function IItem({ children, label }) {
  return (
    <div className="tutorial-illus-item">
      <div className="tutorial-illus-frame">{children}</div>
      {label && <span className="tutorial-illus-label">{label}</span>}
    </div>
  );
}
function ISvg({ w, h, children }) {
  return <svg width={w} height={h} style={{ display: 'block' }}>{children}</svg>;
}

// ── Step 2 illustration: C with 2, 3, 4 domains ───────────────────────────────

function Step2Illus() {
  return (
    <IRow>
      <IItem label="2 domains">
        <ISvg w={70} h={70}>
          {/* domains=2 uses polyN=4; only edges 0 (right) and 2 (left) are active */}
          <MiniAtom cx={35} cy={35} R={21} n={4} element="C" color="#e9177a"
            bondPattern={[2, null, 2, null]} />
        </ISvg>
      </IItem>
      <IItem label="3 domains">
        <ISvg w={70} h={70}>
          <MiniAtom cx={35} cy={35} R={23} n={3} element="C" color="#e9177a"
            bondPattern={[2, 1, 1]} />
        </ISvg>
      </IItem>
      <IItem label="4 domains">
        <ISvg w={70} h={70}>
          <MiniAtom cx={35} cy={35} R={21} n={4} element="C" color="#e9177a"
            bondPattern={[1, 1, 1, 1]} />
        </ISvg>
      </IItem>
    </IRow>
  );
}

// ── Step 3 illustration: electron redistribution on C (2 domains) ─────────────

function Step3Illus() {
  return (
    <IRow>
      <IItem label="double · double">
        <ISvg w={80} h={72}>
          <MiniAtom cx={40} cy={36} R={21} n={4} element="C" color="#e9177a"
            bondPattern={[2, null, 2, null]} />
        </ISvg>
      </IItem>
      <IItem label="single · triple">
        <ISvg w={80} h={72}>
          <MiniAtom cx={40} cy={36} R={21} n={4} element="C" color="#e9177a"
            bondPattern={[1, null, 3, null]} />
        </ISvg>
      </IItem>
    </IRow>
  );
}

// ── Step 4 illustration: H card + C(4) → bonded C–H ──────────────────────────
//
// Proportions match the app:
//   • Mini card size = mini edge length = 30 px  (app: CARD_SIZE = EDGE_LENGTH = 100)
//   • C polygon R=21, apothem = 21·cos(45°) ≈ 14.85 → edge0 midpoint at cx+14.85
//   • App bridge: rectW=14, rectH=28, rotated -90° → ends up 28×14 in screen space,
//     centred at edge midpoint, extending ±14px along bond axis (into both atoms).
//   • Mini bridge scale 0.3 → ±4px each side, so 8×5 px, centred at edge midpoint.
//   • H card left edge sits at edge midpoint (same as app: card centre = edge + CARD/2).

function Step4Illus() {
  // Standalone H card — square (30×30), matches size used in bonded illustration
  const hCard = (
    <ISvg w={42} h={42}>
      <rect x={6} y={6} width={30} height={30} fill="#17b29e" rx={3} />
      <text x={21} y={19} textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={13} fontWeight="bold" fontFamily="Georgia,serif">H</text>
      {/* bond electron square flush with card bottom */}
      <rect x={18.5} y={31} width={5} height={5} fill="rgba(255,255,255,0.88)" rx={1} />
    </ISvg>
  );

  // C with 4 domains alone — 30px card-equivalent size
  const cAtom = (
    <ISvg w={70} h={70}>
      <MiniAtom cx={35} cy={35} R={21} n={4} element="C" color="#e9177a"
        bondPattern={[1, 1, 1, 1]} />
    </ISvg>
  );

  // Bonded C–H
  //   C centre (28, 35); edge0 midpoint at (28+14.85 ≈ 43, 35)
  //   H card: left edge at x=43 (edge midpoint), centre at (43+15, 35)=(58,35), size 30×30
  //   Bridge: centred at edge midpoint (43,35), 8px wide × 5px tall, drawn LAST so it
  //           overlaps the polygon on the left and the card on the right — same as the app.
  const bonded = (
    <ISvg w={84} h={70}>
      {/* C polygon: edge0 occupied, no squares there */}
      <MiniAtom cx={28} cy={35} R={21} n={4} element="C" color="#e9177a"
        bondPattern={[null, 1, 1, 1]} />
      {/* H card: left edge at x=43 (the edge midpoint) */}
      <rect x={43} y={20} width={30} height={30} fill="#17b29e" rx={3} />
      <text x={58} y={35} textAnchor="middle" dominantBaseline="central"
        fill="#fff" fontSize={13} fontWeight="bold" fontFamily="Georgia,serif">H</text>
      {/* Grey bridge drawn on top — centred at edge midpoint, overlaps both atoms */}
      <rect x={39} y={32.5} width={8} height={5} fill="#3a4554" rx={1} />
    </ISvg>
  );

  return (
    <IRow>
      <IItem label="outer atom">{hCard}</IItem>
      <span className="tutorial-illus-sep">+</span>
      <IItem label="central atom">{cAtom}</IItem>
      <span className="tutorial-illus-sep">→</span>
      <IItem label="bonded">{bonded}</IItem>
    </IRow>
  );
}

// ── Inline UI label pill ──────────────────────────────────────────────────────

function Pill({ children, dim }) {
  return <span className={`tutorial-pill${dim ? ' tutorial-pill--dim' : ''}`}>{children}</span>;
}

// ── Steps data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: 1,
    icon: '⬡',
    title: 'Add a Central Atom',
    body: (
      <>
        In the <Pill>Central Atom</Pill> panel on the left, click any element symbol
        — C, N, O, S, and more. The atom appears in the workspace as a polygon whose
        shape reflects its electron-domain geometry.
      </>
    ),
  },
  {
    num: 2,
    icon: '◈',
    title: 'Set the Steric Number',
    body: (
      <>
        Click the polygon to select it, then use the bottom editor to change the{' '}
        <em>number of electron domains</em>. The polygon shape updates to match —
        and the white squares on each edge show the electron pairs available for bonding.
      </>
    ),
    illus: <Step2Illus />,
  },
  {
    num: 3,
    icon: '⇄',
    title: 'Redistribute Electrons',
    body: (
      <>
        <strong>Drag a white square</strong> from one edge to another to transfer bond
        order — turning a double bond into a single + triple, for example.
      </>
    ),
    illus: <Step3Illus />,
  },
  {
    num: 4,
    icon: '◻',
    title: 'Snap Outer Atoms into Bonds',
    body: (
      <>
        Click any element in the <Pill>Outer Atoms</Pill> panel, then{' '}
        <strong>drag the card</strong> toward a polygon edge — it snaps in to form a bond.
        The <Pill>⇄</Pill> button cycles through valid electron arrangements.
      </>
    ),
    illus: <Step4Illus />,
  },
  {
    num: 5,
    icon: '◑',
    title: 'Explore the Layers',
    body: (
      <>
        Once assembled, the <Pill>Layers</Pill> toolbar at the top unlocks five views:
        <ul className="tutorial-layer-list">
          <li><Pill dim>Electronegativity</Pill> — color-codes every atom by EN value.</li>
          <li><Pill dim>Formal Charge</Pill> — shows the formal charge on each atom.</li>
          <li><Pill dim>Octet Rule</Pill> — flags ✓ / ✗ whether each atom satisfies its octet.</li>
          <li><Pill dim>2D</Pill> — opens a clean 2D Lewis structure diagram.</li>
          <li><Pill dim>3D</Pill> — renders the VSEPR 3D geometry (single central atom only).</li>
        </ul>
      </>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TutorialModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="tutorial-overlay" onClick={dismiss}>
      <div className="tutorial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-header">
          <span className="tutorial-logo">⬡</span>
          <div>
            <h2 className="tutorial-title">Welcome to Lewis Grids</h2>
            <p className="tutorial-subtitle">A quick guide to building Lewis structures</p>
          </div>
        </div>

        <div className="tutorial-steps">
          {STEPS.map((step) => (
            <div key={step.num} className="tutorial-step">
              <div className="tutorial-step-badge">{step.num}</div>
              <div className="tutorial-step-content">
                <h3 className="tutorial-step-title">
                  <span className="tutorial-step-icon">{step.icon}</span>
                  {step.title}
                </h3>
                <div className="tutorial-step-body">{step.body}</div>
                {step.illus && <div className="tutorial-step-illus">{step.illus}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="tutorial-footer">
          <button className="tutorial-btn" onClick={dismiss}>
            Got it — Let's start!
          </button>
          <p className="tutorial-footer-hint">Click anywhere outside to close</p>
        </div>
      </div>
    </div>
  );
}
