// ── Polygon geometry ─────────────────────────────────────────────────────────

export const EDGE_LENGTH = 80; // All polygon edges are this length (matches card size)

// Circumradius so that all polygon edges equal EDGE_LENGTH
export function getPolygonRadius(n) {
  if (n <= 2) return EDGE_LENGTH / 2; // special-cased; use square for n=2
  return EDGE_LENGTH / (2 * Math.sin(Math.PI / n));
}

// Start angle per polygon so edges face natural compass directions
export function getStartAngle(n) {
  switch (n) {
    case 4: return -45;   // square → edges at E/S/W/N
    case 6: return -60;   // hexagon → flat-top
    default: return -90;  // triangle, pentagon → vertex at top
  }
}

// Returns vertices of a regular n-gon centered at (cx, cy) with circumradius R
export function getPolygonVertices(cx, cy, R, n) {
  const startAngle = getStartAngle(n);
  return Array.from({ length: n }, (_, i) => {
    const angle = ((startAngle + i * (360 / n)) * Math.PI) / 180;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
}

// Returns edge midpoints with outward angle for each edge
export function getEdgeMidpoints(cx, cy, vertices) {
  const n = vertices.length;
  return vertices.map((v, i) => {
    const next = vertices[(i + 1) % n];
    const mx = (v.x + next.x) / 2;
    const my = (v.y + next.y) / 2;
    const angle = Math.atan2(my - cy, mx - cx); // outward angle (radians)
    return { x: mx, y: my, angle, edgeIndex: i };
  });
}

// Convenience: get edge midpoints for a polygon centered at (cx,cy) with n sides
export function getPolygonEdges(cx, cy, n) {
  const R = getPolygonRadius(n);
  const verts = getPolygonVertices(cx, cy, R, n);
  return getEdgeMidpoints(cx, cy, verts);
}

export function polygonPointsStr(vertices) {
  return vertices.map((v) => `${v.x},${v.y}`).join(' ');
}

// ── Card geometry ─────────────────────────────────────────────────────────────

export const CARD_SIZE = 80;

// Active edge "bottom" at rotation 0. Returns its midpoint in workspace coordinates.
export function getCardActiveEdgeMidpoint(cx, cy, rotDeg) {
  const r = (rotDeg * Math.PI) / 180;
  const half = CARD_SIZE / 2;
  return {
    x: cx + half * Math.sin(r),
    y: cy + half * Math.cos(r),
  };
}

export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ── Bond square positions ─────────────────────────────────────────────────────

export const BOND_SQUARE_SIZE = 10;
const BOND_GAP = 14; // gap between squares for double/triple

/**
 * Returns positions (top-left corner) for bond indicator squares centered on
 * an edge midpoint. Squares are spaced along the edge (tangential direction).
 *
 * @param mx, my  - edge midpoint in SVG/workspace coords
 * @param edgeAngle - outward normal angle (radians)
 * @param bondOrder - 1, 2, or 3
 */
export function getBondSquarePositions(mx, my, edgeAngle, bondOrder) {
  const tangentAngle = edgeAngle + Math.PI / 2;
  const S = BOND_SQUARE_SIZE;
  const total = bondOrder * S + (bondOrder - 1) * BOND_GAP;
  const positions = [];

  for (let i = 0; i < bondOrder; i++) {
    const offset = -total / 2 + S / 2 + i * (S + BOND_GAP);
    positions.push({
      x: mx + offset * Math.cos(tangentAngle) - S / 2,
      y: my + offset * Math.sin(tangentAngle) - S / 2,
    });
  }
  return positions; // top-left corners
}

/**
 * Bond square positions for a card edge in the card's LOCAL coordinate system
 * (before CSS rotation). cardSize = 80. Edge indices: 0=top, 1=right, 2=bottom, 3=left.
 */
export function getCardBondSquarePositions(edgeIndex, bondOrder) {
  const S = CARD_SIZE;
  const sq = BOND_SQUARE_SIZE;
  const total = bondOrder * sq + (bondOrder - 1) * BOND_GAP;
  const positions = [];

  for (let i = 0; i < bondOrder; i++) {
    const offset = -total / 2 + sq / 2 + i * (sq + BOND_GAP);
    let x, y;
    switch (edgeIndex) {
      case 0: // top edge — squares along x-axis centered at (S/2, 0)
        x = S / 2 + offset - sq / 2;
        y = -sq / 2; // straddle top edge
        break;
      case 1: // right edge — squares along y-axis centered at (S, S/2)
        x = S - sq / 2; // straddle right edge
        y = S / 2 + offset - sq / 2;
        break;
      case 2: // bottom edge — squares along x-axis centered at (S/2, S)
        x = S / 2 + offset - sq / 2;
        y = S - sq / 2; // straddle bottom edge
        break;
      case 3: // left edge — squares along y-axis centered at (0, S/2)
        x = -sq / 2; // straddle left edge
        y = S / 2 + offset - sq / 2;
        break;
    }
    positions.push({ x, y });
  }
  return positions;
}
