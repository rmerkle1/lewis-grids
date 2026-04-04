// ── Polygon geometry ─────────────────────────────────────────────────────────

export const EDGE_LENGTH = 80; // All polygon edges are this length (matches card size)

export function getPolygonRadius(n) {
  if (n <= 2) return EDGE_LENGTH / 2;
  return EDGE_LENGTH / (2 * Math.sin(Math.PI / n));
}

export function getStartAngle(n) {
  switch (n) {
    case 4: return -45;
    case 6: return -60;
    default: return -90;
  }
}

export function getPolygonVertices(cx, cy, R, n) {
  const startAngle = getStartAngle(n);
  return Array.from({ length: n }, (_, i) => {
    const angle = ((startAngle + i * (360 / n)) * Math.PI) / 180;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
}

export function getEdgeMidpoints(cx, cy, vertices) {
  const n = vertices.length;
  return vertices.map((v, i) => {
    const next = vertices[(i + 1) % n];
    const mx = (v.x + next.x) / 2;
    const my = (v.y + next.y) / 2;
    const angle = Math.atan2(my - cy, mx - cx);
    return { x: mx, y: my, angle, edgeIndex: i };
  });
}

export function polygonPointsStr(vertices) {
  return vertices.map((v) => `${v.x},${v.y}`).join(' ');
}

// ── Card geometry ─────────────────────────────────────────────────────────────

export const CARD_SIZE = 80;

/**
 * CSS rotation is clockwise in screen space. For a card center at (cx, cy)
 * rotated by rotDeg°, the bottom-edge midpoint (local offset: dx=0, dy=+half)
 * transforms to world as:
 *   x' = dx*cos(r) - dy*sin(r)  →  -half*sin(r)
 *   y' = dx*sin(r) + dy*cos(r)  →  +half*cos(r)
 */
export function getCardActiveEdgeMidpoint(cx, cy, rotDeg) {
  const r = (rotDeg * Math.PI) / 180;
  const half = CARD_SIZE / 2;
  return {
    x: cx - half * Math.sin(r),
    y: cy + half * Math.cos(r),
  };
}

/**
 * World position of any card edge midpoint.
 * edgeIndex: 0=top, 1=right, 2=bottom(bond), 3=left
 */
export function getCardEdgeWorld(cardCx, cardCy, rotDeg, edgeIndex) {
  const half = CARD_SIZE / 2;
  const LOCAL = [
    { dx: 0,     dy: -half }, // 0 top
    { dx: half,  dy: 0     }, // 1 right
    { dx: 0,     dy: half  }, // 2 bottom
    { dx: -half, dy: 0     }, // 3 left
  ];
  const { dx, dy } = LOCAL[edgeIndex];
  const r = (rotDeg * Math.PI) / 180;
  return {
    x: cardCx + dx * Math.cos(r) - dy * Math.sin(r),
    y: cardCy + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

/**
 * Snap info for a lone pair landing on a non-bond edge (0, 1, or 3).
 * Returns { x, y } world center of the LP tile and { rotation } in CSS degrees.
 */
export function getLonePairSnapInfo(cardCx, cardCy, rotDeg, edgeIndex) {
  const half = CARD_SIZE / 2;
  const LP_INSET = LONE_PAIR_H / 2; // how far inside the card the LP center sits

  // Local position of LP center (relative to card center)
  const LOCAL_LP = {
    0: { lx: 0,           ly: -(half - LP_INSET) }, // top → go inward (down)
    1: { lx: half - LP_INSET, ly: 0              }, // right → go inward (left)
    3: { lx: -(half - LP_INSET), ly: 0           }, // left → go inward (right)
  }[edgeIndex];

  const r = (rotDeg * Math.PI) / 180;
  const worldX = cardCx + LOCAL_LP.lx * Math.cos(r) - LOCAL_LP.ly * Math.sin(r);
  const worldY = cardCy + LOCAL_LP.lx * Math.sin(r) + LOCAL_LP.ly * Math.cos(r);

  // LP at rotation 0° has circles horizontal. Align width to edge direction:
  // Edge 0 (horizontal edge) → LP rotation = card rotation
  // Edges 1, 3 (vertical edges) → LP rotation = card rotation + 90°
  const lpRotation = edgeIndex === 0 ? rotDeg : rotDeg + 90;

  return { x: worldX, y: worldY, rotation: lpRotation };
}

export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ── Bond indicator squares ────────────────────────────────────────────────────

export const BOND_SQUARE_SIZE = 14;
export const LONE_PAIR_H = 24; // imported here to avoid circular dep
const BOND_GAP = 10;

/**
 * Bond squares for polygon edges — positioned INSIDE the polygon, touching the
 * edge from inside. Returns { cx, cy, angleDeg } so SVG can rotate each rect.
 *
 * @param mx, my   edge midpoint (world)
 * @param edgeAngle outward normal angle (radians)
 * @param bondOrder 1 | 2 | 3
 */
export function getBondSquarePositions(mx, my, edgeAngle, bondOrder) {
  const S = BOND_SQUARE_SIZE;
  // Shift center inward by S/2 so square's outer face = edge line
  const inwardX = -Math.cos(edgeAngle);
  const inwardY = -Math.sin(edgeAngle);
  const baseCx  = mx + (S / 2) * inwardX;
  const baseCy  = my + (S / 2) * inwardY;

  const tangentAngle = edgeAngle + Math.PI / 2;
  const total = bondOrder * S + (bondOrder - 1) * BOND_GAP;
  const angleDeg = (edgeAngle * 180) / Math.PI;

  return Array.from({ length: bondOrder }, (_, i) => {
    const offset = -total / 2 + S / 2 + i * (S + BOND_GAP);
    return {
      cx: baseCx + offset * Math.cos(tangentAngle),
      cy: baseCy + offset * Math.sin(tangentAngle),
      angleDeg,
    };
  });
}

/**
 * Bond squares for card edges in the card's LOCAL coordinate system (before CSS
 * rotation). Squares are fully INSIDE the card, flush against the active edge.
 * edgeIndex 2 = bottom (the bond edge for outer-atom cards).
 */
export function getCardBondSquarePositions(edgeIndex, bondOrder) {
  const S  = CARD_SIZE;
  const sq = BOND_SQUARE_SIZE;
  const total = bondOrder * sq + (bondOrder - 1) * BOND_GAP;
  const positions = [];

  for (let i = 0; i < bondOrder; i++) {
    const offset = -total / 2 + sq / 2 + i * (sq + BOND_GAP);
    let x, y;
    switch (edgeIndex) {
      case 0: // top — squares touch top edge from inside
        x = S / 2 + offset - sq / 2;
        y = 0;
        break;
      case 1: // right — squares touch right edge from inside
        x = S - sq;
        y = S / 2 + offset - sq / 2;
        break;
      case 2: // bottom (bond edge) — squares touch bottom edge from inside
        x = S / 2 + offset - sq / 2;
        y = S - sq;
        break;
      case 3: // left — squares touch left edge from inside
        x = 0;
        y = S / 2 + offset - sq / 2;
        break;
    }
    positions.push({ x, y });
  }
  return positions; // top-left corners in card local coords
}
