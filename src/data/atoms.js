// Central atom definitions: element, all valid domain counts, and display color
export const CENTRAL_ATOM_CONFIGS = [
  { element: 'B',  domains: [3],        color: '#e8c547', description: 'Boron' },
  { element: 'C',  domains: [2, 3, 4],  color: '#888888', description: 'Carbon' },
  { element: 'N',  domains: [3, 4],     color: '#5599ff', description: 'Nitrogen' },
  { element: 'O',  domains: [2, 3, 4],  color: '#ff5555', description: 'Oxygen' },
  { element: 'P',  domains: [3, 4, 5],  color: '#ff8c42', description: 'Phosphorus' },
  { element: 'S',  domains: [2, 4, 6],  color: '#ffe066', description: 'Sulfur' },
  { element: 'Si', domains: [4],        color: '#a0c4ff', description: 'Silicon' },
];

// Non-central atom cards available in the palette
// activeEdges: which edges are "bonding" edges at rotation 0
//   0 = top, 1 = right, 2 = bottom, 3 = left
export const ATOM_CARDS = [
  { id: 'H',  label: 'H',  color: '#ffffff', activeEdges: [2], description: 'Hydrogen' },
  { id: 'F',  label: 'F',  color: '#66ff99', activeEdges: [2], description: 'Fluorine' },
  { id: 'Cl', label: 'Cl', color: '#b3ff66', activeEdges: [2], description: 'Chlorine' },
  { id: 'Br', label: 'Br', color: '#cc6600', activeEdges: [2], description: 'Bromine' },
  { id: 'O',  label: 'O',  color: '#ff8080', activeEdges: [0, 2], description: 'Oxygen' },
  { id: 'N',  label: 'N',  color: '#80aaff', activeEdges: [0, 2, 3], description: 'Nitrogen' },
  { id: 'S',  label: 'S',  color: '#ffee44', activeEdges: [0, 2], description: 'Sulfur' },
];
