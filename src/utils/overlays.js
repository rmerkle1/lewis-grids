// ── Shared overlay utilities ───────────────────────────────────────────────

// Rounded textbook EN values (Pauling scale, OpenStax conventions)
export const EN = {
  // Central atoms
  Be: 1.5, Si: 1.8,
  B:  2.0, As: 2.0,
  H:  2.1, P:  2.1,
  C:  2.5, S:  2.5, Se: 2.4, I: 2.5, Xe: 2.6,
  Br: 2.8,
  N:  3.0, Cl: 3.0,
  O:  3.5,
  F:  4.0,
};

export const EN_MIN = 1.5; // Be
export const EN_MAX = 4.0; // F

// ── Color map — matches the 3D viewer's ESP gradient exactly ─────────────────
// δ-  (high EN, electron-rich) → yellow
// mid (low-mid EN)             → pink → purple
// δ+  (low EN, electron-poor)  → blue
const COLOR_STOPS = [
  [-1.0, [255, 215,   0]],  // yellow  (high EN, δ-)
  [-0.33,[255,  50, 130]],  // pink
  [ 0.33,[135,  30, 210]],  // purple
  [ 1.0, [ 20, 130, 255]],  // blue    (low EN, δ+)
];

function chargeToColor(t) {
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    const [t0, c0] = COLOR_STOPS[i - 1];
    const [t1, c1] = COLOR_STOPS[i];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return c0.map((v, j) => Math.round(v + f * (c1[j] - v)));
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1][1];
}

/**
 * Map an element's EN to the same color as the 3D ESP viewer.
 * High EN (F=4.0) → yellow.  Low EN (Be=1.5) → blue.
 */
export function enToColor(element) {
  const en    = EN[element] ?? 2.5;
  // Map EN range [EN_MIN, EN_MAX] onto charge range [1.0, -1.0]
  const t     = 1 - 2 * (en - EN_MIN) / (EN_MAX - EN_MIN);
  const [r, g, b] = chargeToColor(t);
  return `rgb(${r},${g},${b})`;
}

/**
 * Compute the octet-rule electron count for an OUTER atom card.
 *
 * When snapped: lone pairs on non-bond edges + 2 × bondOrder
 * (both halves of every bonding pair are credited to this atom).
 * When not snapped: sum of all electrons on the card.
 */
export function outerOctetCount(electrons, isSnapped, bondOrder) {
  if (!isSnapped) {
    return electrons.reduce((a, b) => a + b, 0);
  }
  // Edge 2 is the bond edge; exclude it, then add 2 × bondOrder for the full bond
  const lonePairs = electrons[0] + electrons[1] + electrons[3];
  return lonePairs + 2 * bondOrder;
}

/**
 * Compute the octet-rule electron count for a CENTRAL atom.
 *
 * Formula: electronCount (own valence electrons) +
 *          sum of bondPattern[i] for each occupied (bonded) edge.
 *
 * Why: the central atom owns `electronCount` electrons distributed across its
 * domains. For each bonded domain, the outer atom partner contributes its
 * matching share (= bondPattern[i]) toward the central atom's octet.
 *
 * Examples:
 *   N in NO₃⁻ (formalCharge=+1, bondPattern=[2,1,1], all 3 occupied):
 *     electronCount = 5-1 = 4,  partner contrib = 2+1+1 = 4,  total = 8 ✓
 *
 *   N in NH₃ (bondPattern=[2,1,1,1], edges 1,2,3 occupied, edge 0 = lone pair):
 *     electronCount = 5,  partner contrib = 1+1+1 = 3,  total = 8 ✓
 *
 *   B in BF₃ (bondPattern=[1,1,1], all 3 occupied):
 *     electronCount = 3,  partner contrib = 1+1+1 = 3,  total = 6 ✗
 */
export function centralOctetCount(electronCount, bondPattern, occupiedEdges) {
  const partnerContrib = (occupiedEdges ?? [])
    .reduce((sum, ei) => sum + (bondPattern[ei] ?? 0), 0);
  return electronCount + partnerContrib;
}
