// ── Target molecules for Practice Mode ───────────────────────────────────────
//
// centralDomains: total electron domains on central atom (bonds + lone pairs)
// bonds: one entry per bonded outer atom {element, bondOrder}
// domainHint: shown when student's domain count is wrong

export const MOLECULES = [
  {
    id: 'water',
    name: 'Water',
    formula: 'H₂O',
    difficulty: 'easy',
    centralElement: 'O',
    centralDomains: 4,
    bonds: [
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'bent',
    polarityReason:
      'The bent shape means the two O–H bond dipoles point in different directions and do not cancel.',
    domainHint:
      'Oxygen in H₂O has 4 electron domains: 2 single bonds to H and 2 lone pairs.',
  },
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    difficulty: 'easy',
    centralElement: 'C',
    centralDomains: 2,
    bonds: [
      { element: 'O', bondOrder: 2 },
      { element: 'O', bondOrder: 2 },
    ],
    isPolar: false,
    geometry: 'linear',
    polarityReason:
      'CO₂ is linear, so the two C=O dipoles point in exactly opposite directions and cancel completely.',
    domainHint:
      'Carbon in CO₂ has 2 electron domains: 2 double bonds, no lone pairs.',
  },
  {
    id: 'ammonia',
    name: 'Ammonia',
    formula: 'NH₃',
    difficulty: 'easy',
    centralElement: 'N',
    centralDomains: 4,
    bonds: [
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'trigonal pyramidal',
    polarityReason:
      'The trigonal pyramidal shape gives a net dipole that points toward the lone pair on nitrogen.',
    domainHint:
      'Nitrogen in NH₃ has 4 electron domains: 3 single bonds to H and 1 lone pair.',
  },
  {
    id: 'methane',
    name: 'Methane',
    formula: 'CH₄',
    difficulty: 'easy',
    centralElement: 'C',
    centralDomains: 4,
    bonds: [
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'tetrahedral',
    polarityReason:
      'CH₄ is perfectly tetrahedral with no lone pairs, so all four C–H bond dipoles cancel symmetrically.',
    domainHint:
      'Carbon in CH₄ has 4 electron domains: 4 single bonds, no lone pairs.',
  },
  {
    id: 'hcl',
    name: 'Hydrogen Chloride',
    formula: 'HCl',
    difficulty: 'easy',
    centralElement: 'Cl',
    centralDomains: 4,
    bonds: [
      { element: 'H', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'linear',
    polarityReason:
      'Cl is much more electronegative than H (3.0 vs 2.1), creating a strong bond dipole along the H–Cl axis.',
    domainHint:
      'Chlorine in HCl has 4 electron domains: 1 bond to H and 3 lone pairs.',
  },
  {
    id: 'bf3',
    name: 'Boron Trifluoride',
    formula: 'BF₃',
    difficulty: 'medium',
    centralElement: 'B',
    centralDomains: 3,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'trigonal planar',
    polarityReason:
      'BF₃ is trigonal planar with no lone pairs on B. The three B–F dipoles point symmetrically outward and cancel.',
    domainHint:
      'Boron in BF₃ has only 3 electron domains (3 bonds, no lone pairs — boron has an incomplete octet here).',
  },
  {
    id: 'ccl4',
    name: 'Carbon Tetrachloride',
    formula: 'CCl₄',
    difficulty: 'medium',
    centralElement: 'C',
    centralDomains: 4,
    bonds: [
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'tetrahedral',
    polarityReason:
      'CCl₄ is perfectly tetrahedral so the four C–Cl bond dipoles cancel symmetrically, giving no net dipole.',
    domainHint:
      'Carbon in CCl₄ has 4 electron domains: 4 single bonds to Cl, no lone pairs.',
  },
  {
    id: 'h2s',
    name: 'Hydrogen Sulfide',
    formula: 'H₂S',
    difficulty: 'medium',
    centralElement: 'S',
    centralDomains: 4,
    bonds: [
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'bent',
    polarityReason:
      'Like water, H₂S has a bent shape with 2 lone pairs on S, so the S–H dipoles do not cancel.',
    domainHint:
      'Sulfur in H₂S has 4 electron domains: 2 single bonds to H and 2 lone pairs.',
  },
  {
    id: 'nf3',
    name: 'Nitrogen Trifluoride',
    formula: 'NF₃',
    difficulty: 'medium',
    centralElement: 'N',
    centralDomains: 4,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'trigonal pyramidal',
    polarityReason:
      'NF₃ is trigonal pyramidal. The lone pair and N–F dipoles combine to give a net dipole (though weaker than NH₃).',
    domainHint:
      'Nitrogen in NF₃ has 4 electron domains: 3 single bonds to F and 1 lone pair.',
  },
  {
    id: 'pcl5',
    name: 'Phosphorus Pentachloride',
    formula: 'PCl₅',
    difficulty: 'hard',
    centralElement: 'P',
    centralDomains: 5,
    bonds: [
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'trigonal bipyramidal',
    polarityReason:
      'PCl₅ has trigonal bipyramidal geometry with no lone pairs, so all five P–Cl dipoles cancel symmetrically.',
    domainHint:
      'Phosphorus in PCl₅ has 5 electron domains: 5 single bonds, no lone pairs (expanded octet). Use the domain slider to set 5.',
  },
  {
    id: 'sf6',
    name: 'Sulfur Hexafluoride',
    formula: 'SF₆',
    difficulty: 'hard',
    centralElement: 'S',
    centralDomains: 6,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'octahedral',
    polarityReason:
      'SF₆ is perfectly octahedral so all six S–F dipoles cancel completely.',
    domainHint:
      'Sulfur in SF₆ has 6 electron domains: 6 single bonds, no lone pairs (expanded octet). Use the domain slider to set 6.',
  },
];
