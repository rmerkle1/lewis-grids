// ── Central atom configurations ───────────────────────────────────────────────
//
// bondPattern: array of bond orders for each polygon edge (in vertex order,
//   clockwise from the "first" edge). Use null for edges with no bond.
//
// For n=2 (linear), we render as a square with only right (edge 0) and left
// (edge 2) active, so bondPattern has 4 entries with nulls at index 1 and 3.

export const CENTRAL_ATOM_GROUPS = [
  {
    element: 'B', color: '#e8c547', description: 'Boron',
    configurations: [
      { id: 'B-3', domains: 3, bondPattern: [1, 1, 1],
        label: 'BF₃ / BH₃', hint: '3 single bonds' },
    ],
  },
  {
    element: 'C', color: '#999999', description: 'Carbon',
    configurations: [
      { id: 'C-2a', domains: 2, bondPattern: [2, null, 2, null],
        label: 'CO₂', hint: '2 double bonds' },
      { id: 'C-2b', domains: 2, bondPattern: [3, null, 1, null],
        label: 'HCN', hint: 'triple + single' },
      { id: 'C-3', domains: 3, bondPattern: [1, 1, 2],
        label: 'C=O (formaldehyde)', hint: '2 single + 1 double' },
      { id: 'C-4', domains: 4, bondPattern: [1, 1, 1, 1],
        label: 'CH₄', hint: '4 single bonds' },
    ],
  },
  {
    element: 'N', color: '#5599ff', description: 'Nitrogen',
    configurations: [
      { id: 'N-3', domains: 3, bondPattern: [1, 1, 1],
        label: 'NH₃ style', hint: '3 single bonds' },
      { id: 'N-3b', domains: 3, bondPattern: [1, 1, 2],
        label: 'N=O type', hint: '2 single + 1 double' },
      { id: 'N-4', domains: 4, bondPattern: [1, 1, 1, 1],
        label: 'NH₄⁺', hint: '4 single bonds' },
    ],
  },
  {
    element: 'O', color: '#ff5555', description: 'Oxygen',
    configurations: [
      { id: 'O-2', domains: 2, bondPattern: [1, null, 1, null],
        label: 'H₂O style', hint: '2 single bonds' },
      { id: 'O-2b', domains: 2, bondPattern: [2, null, 2, null],
        label: 'O₃ central', hint: '2 double bonds' },
      { id: 'O-3', domains: 3, bondPattern: [1, 1, 2],
        label: 'O=C type', hint: '2 single + 1 double' },
    ],
  },
  {
    element: 'P', color: '#ff8c42', description: 'Phosphorus',
    configurations: [
      { id: 'P-4', domains: 4, bondPattern: [1, 1, 1, 1],
        label: 'PCl₄⁺ style', hint: '4 single bonds' },
      { id: 'P-5', domains: 5, bondPattern: [1, 1, 1, 1, 1],
        label: 'PCl₅', hint: '5 single bonds' },
    ],
  },
  {
    element: 'S', color: '#ffe066', description: 'Sulfur',
    configurations: [
      { id: 'S-2', domains: 2, bondPattern: [1, null, 1, null],
        label: 'H₂S style', hint: '2 single bonds' },
      { id: 'S-4', domains: 4, bondPattern: [1, 1, 1, 1],
        label: 'SF₄ style', hint: '4 single bonds' },
      { id: 'S-6', domains: 6, bondPattern: [1, 1, 1, 1, 1, 1],
        label: 'SF₆', hint: '6 single bonds' },
    ],
  },
  {
    element: 'Si', color: '#a0c4ff', description: 'Silicon',
    configurations: [
      { id: 'Si-4', domains: 4, bondPattern: [1, 1, 1, 1],
        label: 'SiH₄', hint: '4 single bonds' },
    ],
  },
];

// ── Outer atom configurations ─────────────────────────────────────────────────
// Each entry may have multiple bond-order options (single/double/triple).
// When spawned, each card has ONE active edge (bottom at rotation=0) with the
// chosen bond order.

export const OUTER_ATOM_GROUPS = [
  { element: 'H',  label: 'H',  color: '#ffffff', description: 'Hydrogen',  bondOrders: [1] },
  { element: 'F',  label: 'F',  color: '#66ff99', description: 'Fluorine',  bondOrders: [1] },
  { element: 'Cl', label: 'Cl', color: '#b3ff66', description: 'Chlorine',  bondOrders: [1] },
  { element: 'Br', label: 'Br', color: '#dd8844', description: 'Bromine',   bondOrders: [1] },
  { element: 'O',  label: 'O',  color: '#ff8080', description: 'Oxygen',    bondOrders: [1, 2] },
  { element: 'N',  label: 'N',  color: '#80aaff', description: 'Nitrogen',  bondOrders: [1, 2, 3] },
  { element: 'S',  label: 'S',  color: '#ffe066', description: 'Sulfur',    bondOrders: [1, 2] },
  { element: 'C',  label: 'C',  color: '#aaaaaa', description: 'Carbon',    bondOrders: [1, 2, 3] },
];
