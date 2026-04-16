// ── Color scheme — by typical bonds formed (column grouping) ─────────────────
// Col 1 (4 bonds): C, Si            → pink   #e9177a
// Col 2 (3 bonds): B, N, P, As      → green  #85c441
// Col 3 (2 bonds): Be, O, S, Se     → blue   #00addb
// Col 4 (1 bond):  H, F, Cl, Br, I  → teal   #17b29e
// Col 5 (0 bonds): Xe               → grey   #4f5b6f

const COL1_COLOR = '#e9177a'; // pink  — 4 bonds
const COL2_COLOR = '#85c441'; // green — 3 bonds
const COL3_COLOR = '#00addb'; // blue  — 2 bonds
const COL4_COLOR = '#17b29e'; // teal  — 1 bond
const COL5_COLOR = '#4f5b6f'; // grey  — 0 bonds

export function atomColor(baseValence) {
  const octet  = baseValence <= 2 ? 2 : 8;
  const needed = octet - baseValence;
  const MAP = { 1: COL4_COLOR, 2: COL3_COLOR, 3: COL2_COLOR, 4: COL1_COLOR, 5: COL2_COLOR };
  return MAP[needed] ?? COL5_COLOR;
}

// ── Central atom configurations ───────────────────────────────────────────────

// col = palette column (1=4bonds, 2=3bonds, 3=2bonds, 4=1bond, 5=0bonds)
export const CENTRAL_ATOM_CATEGORIES = [
  {
    label: 'Small',
    atoms: [
      { element: 'B',  col: 2, color: COL2_COLOR, description: 'Boron',     baseValence: 3, defaultDomains: 3, maxDomains: 3 },
      { element: 'Be', col: 3, color: COL3_COLOR, description: 'Beryllium', baseValence: 2, defaultDomains: 2, maxDomains: 2 },
    ],
  },
  {
    label: 'Mid',
    atoms: [
      { element: 'C',  col: 1, color: COL1_COLOR, description: 'Carbon',   baseValence: 4, defaultDomains: 4, maxDomains: 4 },
      { element: 'N',  col: 2, color: COL2_COLOR, description: 'Nitrogen', baseValence: 5, defaultDomains: 4, maxDomains: 4 },
      { element: 'O',  col: 3, color: COL3_COLOR, description: 'Oxygen',   baseValence: 6, defaultDomains: 4, maxDomains: 4 },
      { element: 'F',  col: 4, color: COL4_COLOR, description: 'Fluorine', baseValence: 7, defaultDomains: 4, maxDomains: 4 },
    ],
  },
  {
    label: 'Large',
    atoms: [
      // Row 1: Si–Cl
      { element: 'Si', col: 1, color: COL1_COLOR, description: 'Silicon',    baseValence: 4, defaultDomains: 4, maxDomains: 4 },
      { element: 'P',  col: 2, color: COL2_COLOR, description: 'Phosphorus', baseValence: 5, defaultDomains: 4, maxDomains: 6 },
      { element: 'S',  col: 3, color: COL3_COLOR, description: 'Sulfur',     baseValence: 6, defaultDomains: 4, maxDomains: 6 },
      { element: 'Cl', col: 4, color: COL4_COLOR, description: 'Chlorine',   baseValence: 7, defaultDomains: 4, maxDomains: 6 },
      // Row 2: As–Br
      { element: 'As', col: 2, color: COL2_COLOR, description: 'Arsenic',    baseValence: 5, defaultDomains: 4, maxDomains: 6 },
      { element: 'Se', col: 3, color: COL3_COLOR, description: 'Selenium',   baseValence: 6, defaultDomains: 4, maxDomains: 6 },
      { element: 'Br', col: 4, color: COL4_COLOR, description: 'Bromine',    baseValence: 7, defaultDomains: 4, maxDomains: 6 },
      // Row 3: I, Xe
      { element: 'I',  col: 4, color: COL4_COLOR, description: 'Iodine',     baseValence: 7, defaultDomains: 4, maxDomains: 6 },
      { element: 'Xe', col: 5, color: COL5_COLOR, description: 'Xenon',      baseValence: 8, defaultDomains: 4, maxDomains: 6 },
    ],
  },
];

export const CENTRAL_ATOM_GROUPS = CENTRAL_ATOM_CATEGORIES.flatMap((cat) => cat.atoms);

/**
 * Generate a bond pattern for a central atom given its available electron count and domain count.
 * The sum of active bond slots equals electronCount (all valence electrons shown as bond squares).
 *
 * Returns a 4-element array for domains=2 (linear: slots 0 and 2 active, 1 and 3 null).
 * Returns an n-element array for domains >= 3.
 */
export function generateBondPattern(electronCount, domains) {
  const isLinear = domains === 2;
  const slotCount = isLinear ? 2 : domains;
  const electrons = Math.max(0, electronCount);

  // Assign each slot at least 1 (if enough electrons), then distribute the rest
  const bonds = [];
  let remaining = electrons;

  for (let i = 0; i < slotCount; i++) {
    if (remaining > 0) { bonds.push(1); remaining--; }
    else                { bonds.push(0); }
  }
  // Upgrade slots from 1→2→3 until electrons are all placed
  let idx = 0;
  while (remaining > 0) {
    if (bonds[idx % slotCount] > 0 && bonds[idx % slotCount] < 3) {
      bonds[idx % slotCount]++;
      remaining--;
    }
    idx++;
    if (idx > slotCount * 6) break; // safety
  }

  if (isLinear) {
    return [bonds[0] || null, null, bonds[1] || null, null];
  }
  return bonds.map(b => b === 0 ? null : b);
}

// ── Outer atom electron arrangements ─────────────────────────────────────────
// electrons: [top, right, bottom, left]  — 0=empty, 1=single e⁻, 2=lone pair, 3=triple
// Edge 2 (bottom) is the BOND EDGE — faces the central atom when snapped.

// col + row place each atom explicitly in the 5-column periodic-table-style grid
export const OUTER_ATOM_GROUPS = [
  // Row 1: H alone
  {
    element: 'H',  label: 'H',  col: 4, row: 1, color: COL4_COLOR, description: 'Hydrogen',
    baseValence: 1,
    arrangements: [
      { id: 'H-1', electrons: [0, 0, 1, 0], hint: '1 bond' },
    ],
  },
  // Row 2: N, O, F
  {
    element: 'N',  label: 'N',  col: 2, row: 2, color: COL2_COLOR, description: 'Nitrogen',
    baseValence: 5,
    arrangements: [
      { id: 'N-3', electrons: [2, 1, 1, 1], hint: '3 bonds + 1 LP' },
      { id: 'N-1', electrons: [2, 2, 1, 0], hint: '1 bond + 2 LP' },
    ],
  },
  {
    element: 'O',  label: 'O',  col: 3, row: 2, color: COL3_COLOR, description: 'Oxygen',
    baseValence: 6,
    arrangements: [
      { id: 'O-s', electrons: [2, 2, 1, 1], hint: '2 bonds + 2 LP' },
      { id: 'O-d', electrons: [2, 0, 2, 2], hint: 'double bond + 2 LP' },
    ],
  },
  {
    element: 'F',  label: 'F',  col: 4, row: 2, color: COL4_COLOR, description: 'Fluorine',
    baseValence: 7,
    arrangements: [
      { id: 'F-1', electrons: [2, 2, 1, 2], hint: '1 bond + 3 LP' },
    ],
  },
  // Row 3: P, S, Cl
  {
    element: 'P',  label: 'P',  col: 2, row: 3, color: COL2_COLOR, description: 'Phosphorus',
    baseValence: 5,
    arrangements: [
      { id: 'P-3', electrons: [2, 1, 1, 1], hint: '3 bonds + 1 LP' },
      { id: 'P-1', electrons: [2, 2, 1, 0], hint: '1 bond + 2 LP' },
    ],
  },
  {
    element: 'S',  label: 'S',  col: 3, row: 3, color: COL3_COLOR, description: 'Sulfur',
    baseValence: 6,
    arrangements: [
      { id: 'S-s', electrons: [2, 2, 1, 1], hint: '2 bonds + 2 LP' },
      { id: 'S-d', electrons: [2, 0, 2, 2], hint: 'double bond + 2 LP' },
    ],
  },
  {
    element: 'Cl', label: 'Cl', col: 4, row: 3, color: COL4_COLOR, description: 'Chlorine',
    baseValence: 7,
    arrangements: [
      { id: 'Cl-1', electrons: [2, 2, 1, 2], hint: '1 bond + 3 LP' },
    ],
  },
  // Row 4: As, Se, Br
  {
    element: 'As', label: 'As', col: 2, row: 4, color: COL2_COLOR, description: 'Arsenic',
    baseValence: 5,
    arrangements: [
      { id: 'As-3', electrons: [2, 1, 1, 1], hint: '3 bonds + 1 LP' },
      { id: 'As-1', electrons: [2, 2, 1, 0], hint: '1 bond + 2 LP' },
    ],
  },
  {
    element: 'Se', label: 'Se', col: 3, row: 4, color: COL3_COLOR, description: 'Selenium',
    baseValence: 6,
    arrangements: [
      { id: 'Se-s', electrons: [2, 2, 1, 1], hint: '2 bonds + 2 LP' },
      { id: 'Se-d', electrons: [2, 0, 2, 2], hint: 'double bond + 2 LP' },
    ],
  },
  {
    element: 'Br', label: 'Br', col: 4, row: 4, color: COL4_COLOR, description: 'Bromine',
    baseValence: 7,
    arrangements: [
      { id: 'Br-1', electrons: [2, 2, 1, 2], hint: '1 bond + 3 LP' },
    ],
  },
  // Row 5: I alone
  {
    element: 'I',  label: 'I',  col: 4, row: 5, color: COL4_COLOR, description: 'Iodine',
    baseValence: 7,
    arrangements: [
      { id: 'I-1', electrons: [2, 2, 1, 2], hint: '1 bond + 3 LP' },
    ],
  },
];

// ── Electron helpers ──────────────────────────────────────────────────────────

/**
 * Returns the set of edge indices whose electrons should glow (amber — "needs pairing").
 *
 * Calculates how many electrons the atom still needs to satisfy its octet/duet,
 * accounting for any bond already formed (isSnapped + bondOrder).
 * Highlights unpaired (single) electrons first, then lone pairs if more needed.
 * When snapped, edge 2 is already shown as cyan "bonded" so it is excluded here.
 */
export function getReactiveEdges(electrons, baseValence, isSnapped = false, bondOrder = 0) {
  const octet = baseValence <= 2 ? 2 : 8;
  // Count own electrons + partner's bond contribution toward the octet
  const effectiveCount = electrons.reduce((a, b) => a + b, 0) + (isSnapped ? bondOrder : 0);
  let stillNeeded = Math.max(0, octet - effectiveCount);

  const highlighted = new Set();
  if (stillNeeded === 0) return highlighted;

  // Edge order: for unsnapped include edge 2 first; for snapped skip edge 2 (it's cyan)
  const order = isSnapped ? [0, 1, 3] : [2, 0, 1, 3];

  // Phase 1: unpaired (single) electrons — each satisfies 1 need
  for (const i of order) {
    if (stillNeeded <= 0) break;
    if (electrons[i] === 1) { highlighted.add(i); stillNeeded--; }
  }

  // Phase 2: lone pairs — each satisfies 2 needs
  for (const i of order) {
    if (stillNeeded <= 0) break;
    if (electrons[i] === 2 && !highlighted.has(i)) {
      highlighted.add(i);
      stillNeeded -= 2;
    }
  }

  return highlighted;
}

/**
 * Formal charge = baseValence − total electrons on card.
 */
export function getFormalCharge(electrons, baseValence) {
  return baseValence - electrons.reduce((a, b) => a + b, 0);
}

/**
 * Auto-adjust a card's electron layout when snapping to a bond of given order.
 * Edge 2 (bond edge) is set to exactly bondOrder electrons.
 * Remaining electrons are distributed as lone pairs on non-bond edges.
 */
export function autoAdjustElectrons(electrons, bondOrder) {
  const total = electrons.reduce((a, b) => a + b, 0);
  const newE  = [0, 0, 0, 0];
  newE[2] = Math.min(bondOrder, total, 3);
  let remaining = total - newE[2];
  for (const i of [0, 1, 3]) {
    if (remaining <= 0) break;
    const take = Math.min(2, remaining);
    newE[i] = take;
    remaining -= take;
  }
  return newE;
}

/** Add one electron (ionize: −1 charge). Non-bond edges prioritized. */
export function addElectron(electrons) {
  const e = [...electrons];
  const order = [0, 1, 3, 2];
  for (const i of order) { if (e[i] === 1) { e[i] = 2; return e; } }
  for (const i of order) { if (e[i] === 0) { e[i] = 1; return e; } }
  return e;
}

/** Remove one electron (ionize: +1 charge). Non-bond edges prioritized. */
export function removeElectron(electrons) {
  const e = [...electrons];
  const order = [0, 1, 3, 2];
  for (const i of order) { if (e[i] === 1) { e[i] = 0; return e; } }
  for (const i of order) { if (e[i] === 2) { e[i] = 1; return e; } }
  return e;
}
