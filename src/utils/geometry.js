export function getStartAngle(n) {
  // Orients polygons so edges (bond sites) face natural compass directions
  switch (n) {
    case 4: return -45;   // square → bonds at E/S/W/N
    case 6: return -60;   // hexagon → flat top, bonds at 30°/90°/150°/210°/270°/330°
    default: return -90;  // triangle, pentagon → vertex at top
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
    // angle pointing outward from polygon center through this edge midpoint
    const angle = Math.atan2(my - cy, mx - cx);
    return { x: mx, y: my, angle, edgeIndex: i };
  });
}

export function polygonPointsStr(vertices) {
  return vertices.map((v) => `${v.x},${v.y}`).join(' ');
}

export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Given a card center position and rotation (deg, CSS clockwise),
// returns the midpoint of the card's primary active edge (the "bottom" at 0°).
export function getCardActiveEdgeMidpoint(cx, cy, rotDeg, cardSize) {
  const r = (rotDeg * Math.PI) / 180;
  // At 0°, active edge midpoint is directly below card center (0, +halfSize).
  // After CW rotation by r: (halfSize*sin(r), halfSize*cos(r))
  const half = cardSize / 2;
  return {
    x: cx + half * Math.sin(r),
    y: cy + half * Math.cos(r),
  };
}
