import { useRef, useEffect, useState, useCallback } from 'react';
import './MoleculeViewer3D.css';

// ── VSEPR 3D domain positions (unit vectors) ──────────────────────────────────

const s3 = Math.sqrt(3);

function norm([x, y, z]) {
  const l = Math.sqrt(x * x + y * y + z * z);
  return [x / l, y / l, z / l];
}

const DOMAIN_POS = {
  2: [[0, 0, 1], [0, 0, -1]],
  3: [[0, 1, 0], [-s3 / 2, -0.5, 0], [s3 / 2, -0.5, 0]],
  4: [norm([1, 1, 1]), norm([1, -1, -1]), norm([-1, 1, -1]), norm([-1, -1, 1])],
  5: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-0.5, 0, s3 / 2], [-0.5, 0, -s3 / 2]],
  6: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
};

function edgeToDomainMap(domains) {
  if (domains === 2) return { 0: 0, 2: 1 };
  const m = {};
  for (let i = 0; i < domains; i++) m[i] = i;
  return m;
}

// ── Pauling electronegativity ─────────────────────────────────────────────────

const EN = {
  H: 2.20, He: 0,
  Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98,
  Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Cl: 3.16,
  Br: 2.96, I: 2.66, Se: 2.55, As: 2.18,
};

// ── Rotation helpers ──────────────────────────────────────────────────────────

function rotX([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

function rotY([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

// ── Perspective projection ────────────────────────────────────────────────────

function project([x, y, z], cx, cy, scale = 90) {
  const fov = 6;
  const d = fov / (fov - z);
  return { sx: cx + x * scale * d, sy: cy + y * scale * d, z, d };
}

// ── Default rotations matching standard VSEPR textbook orientations ───────────
//
// DOMAIN_POS vectors (before rotation):
//   n=2: z=±1 (axial)
//   n=3: all z=0, Y-shape in x-y plane
//   n=4: tetrahedral — all |z|=1/√3≈0.577
//   n=5: axial [0,±1,0], equatorial [1,0,0] z=0, [-0.5,0,±√3/2] z=±0.866
//   n=6: equatorial ±x/±y z=0, axial [0,0,±1]
//
// A bond renders flat when |z_after_rotation| < 0.35.
//
// Linear (2):
//   ry=π/2 rotates [0,0,±1] onto ±x-axis → both flat, left-right. ✓
//
// Trigonal planar (3):
//   All atoms already z=0; rx=0,ry=0 gives Y-shape (one bond up, two down-left/right). ✓
//
// Tetrahedral (4):
//   Solve z_final=0 for domains 2=[-1/√3,+1/√3,-1/√3] and 3=[-1/√3,-1/√3,+1/√3]:
//   both equations give a=π/4, b=0.  Result: upper-left flat, lower-left flat,
//   right-wedge (dom 0), right-dash (dom 1). Classic 2-flat/1-wedge/1-dash. ✓
//
// Trigonal bipyramidal (5):
//   Doms 0=[0,1,0], 1=[0,-1,0], 2=[1,0,0] have z=0 → flat up/down/right.
//   Doms 3=[-0.5,0,+√3/2] z=+0.866 (wedge) and 4=[-0.5,0,-√3/2] z=-0.866 (dash)
//   go to the left. rx=0,ry=0 already matches standard trig-bipyramidal image. ✓
//
// Octahedral (6):
//   4 equatorial domains have z=0; axial [0,0,±1] project to the canvas center
//   (x=y=0) and would be hidden.  rx=0.25 tilts axials up/down on screen while
//   keeping all 4 equatorial |z|≈0.25 < 0.35 (still flat).
//   ry=0.2 gives a slight perspective so the square looks more natural. ✓

function idealRotation(nDomains) {
  switch (nDomains) {
    case 2:  return { x: 0,            y: Math.PI / 2 }; // both flat on x-axis
    case 3:  return { x: 0,            y: 0 };           // Y-shape, all 3 flat
    case 4:  return { x: Math.PI / 4,  y: Math.PI / 8 }; // 2 flat left; wedge+dash right, separated
    case 5:  return { x: 0,            y: 0 };           // 3 flat (up/down/right), LP equatorial
    case 6:  return { x: 0.25,         y: 0.2 };         // 4 flat square, wedge up, dash down
    default: return { x: 0.3,          y: 0.5 };
  }
}

// ── Scene builder ─────────────────────────────────────────────────────────────

/** Build atoms/bonds/lonePairs for a single central atom, placing everything
 *  relative to a 3D offset `[ox, oy, oz]`. Returns the atom index assigned
 *  to this CA in the `atoms` array (for CA–CA bond creation). */
function buildSingleCA(ca, cards, centralLinks, offset, atoms, bonds, lonePairs) {
  const caIdx = atoms.length;
  atoms.push({ element: ca.element, pos: offset, isCentral: true });

  const nDomains = ca.domains;
  const domPos = DOMAIN_POS[nDomains];
  if (!domPos) return caIdx;

  const snapped = cards.filter((c) => c.snappedEdge?.centralId === ca.id);

  // Edges occupied by CA–CA links (excluded from lone-pair rendering)
  const linkedEdges = new Set(
    (centralLinks ?? [])
      .filter((l) => l.id1 === ca.id || l.id2 === ca.id)
      .map((l) => (l.id1 === ca.id ? l.edgeIndex1 : l.edgeIndex2))
  );

  if (nDomains === 5) {
    const nLP = nDomains - snapped.length;
    const lpDomains = [4, 3, 2].slice(0, nLP);
    const bondDomains = [0, 1, 2, 3, 4].filter((d) => !lpDomains.includes(d));

    snapped.forEach((card, idx) => {
      const di = bondDomains[idx];
      if (di == null) return;
      const pos = domPos[di].map((v, j) => offset[j] + v * 1.2);
      atoms.push({ element: card.label || card.element, pos, isCentral: false });
      bonds.push({ from: caIdx, to: atoms.length - 1, order: card.snappedEdge.bondOrder ?? 1 });
    });

    for (const di of lpDomains) {
      lonePairs.push(domPos[di].map((v, j) => offset[j] + v * 0.5));
    }
  } else {
    const edgeMap = edgeToDomainMap(nDomains);
    const bondedEdges = new Set(snapped.map((c) => c.snappedEdge.edgeIndex));

    for (const card of snapped) {
      const ei = card.snappedEdge.edgeIndex;
      const di = edgeMap[ei];
      if (di == null) continue;
      const pos = domPos[di].map((v, j) => offset[j] + v * 1.2);
      atoms.push({ element: card.label || card.element, pos, isCentral: false });
      bonds.push({ from: caIdx, to: atoms.length - 1, order: card.snappedEdge.bondOrder ?? 1 });
    }

    for (const [eiStr, val] of Object.entries(ca.bondPattern)) {
      const ei = Number(eiStr);
      if (val == null || bondedEdges.has(ei) || linkedEdges.has(ei)) continue;
      const di = edgeMap[ei];
      if (di == null) continue;
      lonePairs.push(domPos[di].map((v, j) => offset[j] + v * 0.5));
    }
  }

  return caIdx;
}

function buildScene(centralAtoms, cards, centralLinks) {
  if (!centralAtoms.length) return null;

  const atoms = [];
  const bonds = [];
  const lonePairs = [];

  if (centralAtoms.length === 1) {
    // Single-CA: centre at origin
    buildSingleCA(centralAtoms[0], cards, centralLinks, [0, 0, 0], atoms, bonds, lonePairs);
    return { atoms, bonds, lonePairs };
  }

  // Multi-CA: lay central atoms along the x-axis
  const CHAIN_SPACING = 2.4; // scene units centre-to-centre
  const nCAs  = centralAtoms.length;
  const startX = -(nCAs - 1) * CHAIN_SPACING / 2;

  const caAtomIndices = [];
  for (let i = 0; i < nCAs; i++) {
    const offset = [startX + i * CHAIN_SPACING, 0, 0];
    const idx = buildSingleCA(centralAtoms[i], cards, centralLinks, offset, atoms, bonds, lonePairs);
    caAtomIndices.push(idx);
  }

  // CA–CA bonds
  for (const link of (centralLinks ?? [])) {
    const i1 = centralAtoms.findIndex((ca) => ca.id === link.id1);
    const i2 = centralAtoms.findIndex((ca) => ca.id === link.id2);
    if (i1 < 0 || i2 < 0) continue;
    bonds.push({ from: caAtomIndices[i1], to: caAtomIndices[i2], order: link.bondOrder ?? 1 });
  }

  return { atoms, bonds, lonePairs };
}

// ── Resonance bond-order averaging ───────────────────────────────────────────
// When a central atom has multiple bonds to atoms of the SAME element with
// different bond orders (e.g., one C=O and one C–O), those bonds are in
// resonance and should have equal electron density.  Averaging their orders
// (both become 1.5) equalises their polarity contribution so the cloud doesn't
// misleadingly show one end darker than the other.

function resonanceAverageBonds(bonds, atoms) {
  // Group by "centralAtomIndex : outerElement"
  const groups = new Map();
  for (const bond of bonds) {
    const k = `${bond.from}:${atoms[bond.to].element}`;
    if (!groups.has(k)) groups.set(k, { total: 0, count: 0 });
    const g = groups.get(k);
    g.total += bond.order;
    g.count += 1;
  }
  return bonds.map((bond) => {
    const g = groups.get(`${bond.from}:${atoms[bond.to].element}`);
    if (!g || g.count <= 1) return bond;
    return { ...bond, order: g.total / g.count };
  });
}

// ── Partial charge computation ────────────────────────────────────────────────
// Returns float array per atom, normalised to [-1, +1].
// Positive = δ+ (electron-poor), negative = δ- (electron-rich).

function computePartialCharges(scene) {
  const charges = new Array(scene.atoms.length).fill(0);
  // Use resonance-averaged bond orders so a drawn C=O / C–O pair shows equal polarity
  const bonds = resonanceAverageBonds(scene.bonds, scene.atoms);

  for (const bond of bonds) {
    const enFrom = EN[scene.atoms[bond.from].element] ?? 2.5;
    const enTo   = EN[scene.atoms[bond.to].element]   ?? 2.5;
    const diff   = (enTo - enFrom) * bond.order;
    charges[bond.from] += diff;
    charges[bond.to]   -= diff;
  }

  // Use a FIXED scale rather than normalising to per-molecule max.
  // 1.5 EN units ≈ the C–F bond (ΔEN = 1.43), so that maps F to ~-1.0 and
  // Br (ΔEN = 0.41 vs C) to only ~-0.27 — preserving the absolute difference.
  // A power curve (exponent 0.65) then pushes moderate values up so that
  // mid-polarity bonds (C–Cl, C–Br) are still clearly visible.
  const FIXED_SCALE = 1.5;
  const EXPONENT    = 0.65;
  return charges.map((c) => {
    const clamped = Math.max(-1, Math.min(1, c / FIXED_SCALE));
    return Math.sign(clamped) * Math.pow(Math.abs(clamped), EXPONENT);
  });
}

// ── ESP color map ─────────────────────────────────────────────────────────────
// δ- (electron-rich)  : yellow → pink
// neutral             : soft lavender
// δ+ (electron-poor)  : teal → purple

const COLOR_STOPS = [
  [-1.0, [255, 215,   0]],  // yellow  (strong δ-)
  [-0.33,[255,  50, 130]],  // pink
  [ 0.33,[135,  30, 210]],  // purple
  [ 1.0, [ 20, 130, 255]],  // blue    (strong δ+)
];

function chargeToColor(t) {
  const stops = COLOR_STOPS;
  for (let i = 1; i < stops.length; i++) {
    const [t0, c0] = stops[i - 1];
    const [t1, c1] = stops[i];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
    }
  }
  return stops[stops.length - 1][1];
}

// ── Metaball electron cloud ───────────────────────────────────────────────────
// Computes a 2-D scalar density field by summing Gaussians per atom/lone-pair.
// Points above THRESH are the cloud surface; coloured by weighted-average charge.
// The low-res ImageData is scaled up by drawImage so the browser bilinearly
// interpolates it — giving the smooth, merged surface look.

function drawElectronCloud(ctx, atomProj, lpProj, charges, W, H) {
  const GRID   = 84;    // grid resolution — ~4.5 px/cell after upscaling
  const THRESH = 0.055; // iso-surface threshold

  // sigma is anchored to the 3-D bond length projected to screen space
  // (scale=90, bond=1.2 units → ~108 px at d=1). Using sigma_3d=0.58 gives
  // sigma≈52px at d=1, which is ~0.5× bond length — enough for clouds from
  // adjacent outer atoms (up to ~1.7× bond length apart) to merge cleanly.
  const SIGMA_3D = 0.58; // in 3-D scene units
  const BASE_SCALE = 90; // must match project() scale

  const sources = [
    ...atomProj.map((a, i) => ({
      sx: a.proj.sx, sy: a.proj.sy,
      sigma: SIGMA_3D * BASE_SCALE * a.proj.d,
      charge: charges[i] ?? 0,
    })),
    // Lone pairs intentionally excluded: they are non-bonding electrons that
    // don't migrate due to electronegativity and would obscure the polarity signal.
  ];

  const cellW = W / GRID, cellH = H / GRID;
  const density  = new Float32Array(GRID * GRID);
  const chargeWt = new Float32Array(GRID * GRID);

  for (let gy = 0; gy < GRID; gy++) {
    const py = (gy + 0.5) * cellH;
    for (let gx = 0; gx < GRID; gx++) {
      const px = (gx + 0.5) * cellW;
      let dens = 0, chg = 0;
      for (const src of sources) {
        const dx = px - src.sx, dy = py - src.sy;
        const g = Math.exp(-(dx * dx + dy * dy) / (2 * src.sigma * src.sigma));
        dens += g;
        chg  += src.charge * g;
      }
      const idx = gy * GRID + gx;
      density[idx]  = dens;
      chargeWt[idx] = chg;
    }
  }

  // Build ImageData at grid resolution
  const imgData = new ImageData(GRID, GRID);

  for (let i = 0; i < GRID * GRID; i++) {
    const dens = density[i];
    if (dens < THRESH) continue;

    // Weighted average charge at this location
    const chargeVal = Math.max(-1, Math.min(1, chargeWt[i] / dens));
    const [r, g, b] = chargeToColor(chargeVal);

    // Soft edge near the threshold; fully opaque inside
    const edgeT = Math.min((dens - THRESH) / (THRESH * 1.8), 1);
    const alpha  = Math.round(edgeT * 220);

    imgData.data[i * 4]     = r;
    imgData.data[i * 4 + 1] = g;
    imgData.data[i * 4 + 2] = b;
    imgData.data[i * 4 + 3] = alpha;
  }

  // Write to a small offscreen canvas, then scale-blit to main canvas
  const off = document.createElement('canvas');
  off.width = GRID; off.height = GRID;
  off.getContext('2d').putImageData(imgData, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(off, 0, 0, W, H);
  ctx.restore();
}

// ── Draw primitives ───────────────────────────────────────────────────────────

function drawWedge(ctx, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = (-dy / len) * 6, ny = (dx / len) * 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 + nx, y2 + ny);
  ctx.lineTo(x2 - nx, y2 - ny);
  ctx.closePath();
  ctx.fill();
}

function drawDash(ctx, x1, y1, x2, y2) {
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawBond(ctx, x1, y1, x2, y2, z2) {
  const isWedge = z2 > 0.35;
  const isDash  = z2 < -0.35;
  if (isWedge)     drawWedge(ctx, x1, y1, x2, y2);
  else if (isDash) drawDash(ctx, x1, y1, x2, y2);
  else             drawLine(ctx, x1, y1, x2, y2);
}

// ── Main draw function ────────────────────────────────────────────────────────

function drawScene(ctx, scene, rx, ry, W, H, showPolarity) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  if (!scene) {
    ctx.fillStyle = '#aaa';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add a central atom to see 3D structure', W / 2, H / 2);
    return;
  }

  if (scene.bonds.length === 0 && scene.lonePairs.length === 0) {
    ctx.fillStyle = '#aaa';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Snap outer atoms to build the structure', W / 2, H / 2);
  }

  const cx = W / 2, cy = H / 2;
  const transform = (pos) => project(rotY(rotX(pos, rx), ry), cx, cy);

  const atomProj = scene.atoms.map((a) => ({ ...a, proj: transform(a.pos) }));
  const lpProj   = scene.lonePairs.map((p) => transform(p));

  const charges = showPolarity ? computePartialCharges(scene) : null;

  // ── 1. Continuous electron-cloud / ESP surface ────────────────────────────
  if (showPolarity) {
    drawElectronCloud(ctx, atomProj, lpProj, charges, W, H);
  }

  // ── 2. Bonds ──────────────────────────────────────────────────────────────
  const sortedBonds = [...scene.bonds].sort((a, b) => {
    const za = (atomProj[a.from].proj.z + atomProj[a.to].proj.z) / 2;
    const zb = (atomProj[b.from].proj.z + atomProj[b.to].proj.z) / 2;
    return za - zb;
  });

  ctx.strokeStyle = '#111';
  ctx.fillStyle   = '#111';
  ctx.lineWidth   = 2;

  for (const bond of sortedBonds) {
    const { sx: x1, sy: y1 } = atomProj[bond.from].proj;
    const { sx: x2, sy: y2, z: z2 } = atomProj[bond.to].proj;

    if (bond.order === 1) {
      drawBond(ctx, x1, y1, x2, y2, z2);
    } else {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const offsets = bond.order === 2 ? [-3.5, 3.5] : [-5, 0, 5];
      for (const off of offsets) {
        drawBond(ctx, x1 + nx * off, y1 + ny * off, x2 + nx * off, y2 + ny * off, z2);
      }
    }
  }

  // ── 3. Lone pair dots ─────────────────────────────────────────────────────
  for (const lp of lpProj) {
    const { sx, sy, d, z } = lp;
    const r   = 7 * d;
    const gap = r * 1.6;
    const alpha = 0.3 + Math.min(Math.max((z + 1.2) / 2.4, 0), 1) * 0.5;
    ctx.fillStyle = `rgba(80,80,80,${alpha.toFixed(2)})`;
    for (const ox of [-gap / 2, gap / 2]) {
      ctx.beginPath();
      ctx.arc(sx + ox, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── 4. Atoms ──────────────────────────────────────────────────────────────
  const sortedAtoms = [...atomProj].sort((a, b) => a.proj.z - b.proj.z);

  for (const atom of sortedAtoms) {
    const { sx, sy, d, z } = atom.proj;
    const r   = (atom.isCentral ? 22 : 18) * d;
    const fSz = Math.round((atom.isCentral ? 15 : 13) * d);

    const brightness  = Math.round(160 + Math.min(Math.max((z + 1.2) / 2.4, 0), 1) * 95);
    const strokeAlpha = 0.35 + Math.min(Math.max((z + 1.2) / 2.4, 0), 1) * 0.65;

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle   = `rgb(${brightness},${brightness},${brightness})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0,0,0,${strokeAlpha.toFixed(2)})`;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.fillStyle    = `rgba(0,0,0,${strokeAlpha.toFixed(2)})`;
    ctx.font         = `bold ${fSz}px Georgia, serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(atom.element, sx, sy);
  }

}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MoleculeViewer3D({ centralAtoms, centralLinks, cards, onClose }) {
  const W = 380, H = 380;
  const canvasRef               = useRef(null);
  const dragRef                 = useRef(null);
  const [showPolarity, setPolarity] = useState(false);

  const nDomains  = centralAtoms[0]?.domains ?? 4;
  const isMultiCA = centralAtoms.length > 1;
  // Key that changes whenever the molecule identity changes (new CA added/removed or swapped)
  const moleculeKey = centralAtoms.map((ca) => ca.id).join(',');

  const [rot, setRot] = useState(() =>
    isMultiCA ? { x: 0.2, y: 0.5 } : idealRotation(nDomains)
  );

  // Reset to a good orientation whenever the molecule composition changes
  useEffect(() => {
    if (centralAtoms.length > 1) {
      setRot({ x: 0.2, y: 0.5 });
    } else {
      setRot(idealRotation(nDomains));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moleculeKey, nDomains]);

  const scene = buildScene(centralAtoms, cards, centralLinks ?? []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawScene(ctx, scene, rot.x, rot.y, W, H, showPolarity);
  }, [scene, rot, showPolarity]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    dragRef.current = { px: e.clientX, py: e.clientY, rot: { ...rot } };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [rot]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.px;
    const dy = e.clientY - dragRef.current.py;
    setRot({
      x: dragRef.current.rot.x + dy * 0.008,
      y: dragRef.current.rot.y + dx * 0.008,
    });
  }, []);

  const handlePointerUp = useCallback(() => { dragRef.current = null; }, []);

  return (
    <div className="viewer3d" onClick={(e) => e.stopPropagation()}>
      <div className="viewer3d-header">
        <span className="viewer3d-title">3D View</span>
        <span className="viewer3d-hint">drag to rotate</span>
        <button className="viewer3d-close" onClick={onClose}>×</button>
      </div>

      <div className="viewer3d-canvas-wrap">
        <div
          className="polarity-toggle"
          onClick={() => setPolarity((v) => !v)}
          title="Toggle electron cloud / polarity"
        >
          <span className="polarity-toggle-label">Polarity</span>
          <div className={`polarity-switch${showPolarity ? ' on' : ''}`}>
            <div className="polarity-knob" />
          </div>
        </div>

        {showPolarity && (
          <div className="polarity-legend">
            <span className="legend-neg">δ−</span>
            <div className="legend-bar" />
            <span className="legend-pos">δ+</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="viewer3d-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      </div>
    </div>
  );
}
