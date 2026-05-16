// ── Target molecules for Practice Mode ───────────────────────────────────────
//
// centralDomains: total electron domains on central atom (bonds + lone pairs)
// bonds: one entry per bonded outer atom { element, bondOrder }
//   bondOrder must match what generateBondPattern produces for that atom's
//   edge positions — verified against generateBondPattern(electronCount, domains).
// domainHint: shown when student's domain count is wrong
//
// Difficulty tiers:
//   easy   — 2–3 total atoms, standard octets
//   medium — 4–5 total atoms, standard octets
//   hard   — expanded octets on central atom OR polyatomic ions

export const MOLECULES = [

  // ── EASY ──────────────────────────────────────────────────────────────────

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
      'Carbon in CO₂ has 2 electron domains: 2 double bonds to O, no lone pairs. Set the slider to 2.',
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
    id: 'hf',
    name: 'Hydrogen Fluoride',
    formula: 'HF',
    difficulty: 'easy',
    centralElement: 'F',
    centralDomains: 4,
    bonds: [
      { element: 'H', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'linear',
    polarityReason:
      'F is the most electronegative element (4.0), creating the largest possible bond dipole along the H–F axis.',
    domainHint:
      'Fluorine in HF has 4 electron domains: 1 bond to H and 3 lone pairs.',
  },
  {
    id: 'hbr',
    name: 'Hydrogen Bromide',
    formula: 'HBr',
    difficulty: 'easy',
    centralElement: 'Br',
    centralDomains: 4,
    bonds: [
      { element: 'H', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'linear',
    polarityReason:
      'Br is significantly more electronegative than H (2.8 vs 2.1), giving a bond dipole along the H–Br axis.',
    domainHint:
      'Bromine in HBr has 4 electron domains: 1 bond to H and 3 lone pairs.',
  },
  {
    id: 'h2s',
    name: 'Hydrogen Sulfide',
    formula: 'H₂S',
    difficulty: 'easy',
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
    id: 'cs2',
    name: 'Carbon Disulfide',
    formula: 'CS₂',
    difficulty: 'easy',
    centralElement: 'C',
    centralDomains: 2,
    bonds: [
      { element: 'S', bondOrder: 2 },
      { element: 'S', bondOrder: 2 },
    ],
    isPolar: false,
    geometry: 'linear',
    polarityReason:
      'CS₂ is linear, so the two C=S dipoles point in opposite directions and cancel completely.',
    domainHint:
      'Carbon in CS₂ has 2 electron domains: 2 double bonds to S, no lone pairs. Set the slider to 2.',
  },
  {
    id: 'becl2',
    name: 'Beryllium Dichloride',
    formula: 'BeCl₂',
    difficulty: 'easy',
    centralElement: 'Be',
    centralDomains: 2,
    bonds: [
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'linear',
    polarityReason:
      'BeCl₂ is linear with no lone pairs on Be. The two Be–Cl dipoles point in opposite directions and cancel.',
    domainHint:
      'Beryllium in BeCl₂ has only 2 electron domains (2 bonds, no lone pairs — Be has an incomplete octet). The slider is already at its maximum of 2.',
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  {
    id: 'ammonia',
    name: 'Ammonia',
    formula: 'NH₃',
    difficulty: 'medium',
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
    difficulty: 'medium',
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
      'Carbon in CH₄ has 4 electron domains: 4 single bonds to H, no lone pairs.',
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
      'Boron in BF₃ has only 3 electron domains (3 bonds, no lone pairs — boron has an incomplete octet here). Set the slider to 3.',
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
      'CCl₄ is perfectly tetrahedral so the four C–Cl bond dipoles cancel symmetrically.',
    domainHint:
      'Carbon in CCl₄ has 4 electron domains: 4 single bonds to Cl, no lone pairs.',
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
      'NF₃ is trigonal pyramidal. The lone pair on N and the N–F bond dipoles combine to give a net dipole.',
    domainHint:
      'Nitrogen in NF₃ has 4 electron domains: 3 single bonds to F and 1 lone pair.',
  },
  {
    id: 'ph3',
    name: 'Phosphine',
    formula: 'PH₃',
    difficulty: 'medium',
    centralElement: 'P',
    centralDomains: 4,
    bonds: [
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
      { element: 'H', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'trigonal pyramidal',
    polarityReason:
      'PH₃ is trigonal pyramidal. The lone pair on P creates an asymmetric structure with a net dipole.',
    domainHint:
      'Phosphorus in PH₃ has 4 electron domains: 3 single bonds to H and 1 lone pair.',
  },
  {
    id: 'pcl3',
    name: 'Phosphorus Trichloride',
    formula: 'PCl₃',
    difficulty: 'medium',
    centralElement: 'P',
    centralDomains: 4,
    bonds: [
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'trigonal pyramidal',
    polarityReason:
      'PCl₃ is trigonal pyramidal. The lone pair on P and the P–Cl bond dipoles combine to give a net dipole.',
    domainHint:
      'Phosphorus in PCl₃ has 4 electron domains: 3 single bonds to Cl and 1 lone pair.',
  },
  {
    id: 'of2',
    name: 'Oxygen Difluoride',
    formula: 'OF₂',
    difficulty: 'medium',
    centralElement: 'O',
    centralDomains: 4,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'bent',
    polarityReason:
      'OF₂ is bent with 2 lone pairs on O. The O–F bond dipoles point in the same general direction and do not cancel.',
    domainHint:
      'Oxygen in OF₂ has 4 electron domains: 2 single bonds to F and 2 lone pairs.',
  },
  {
    id: 'scl2',
    name: 'Sulfur Dichloride',
    formula: 'SCl₂',
    difficulty: 'medium',
    centralElement: 'S',
    centralDomains: 4,
    bonds: [
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'bent',
    polarityReason:
      'SCl₂ is bent with 2 lone pairs on S. The two S–Cl bond dipoles do not cancel.',
    domainHint:
      'Sulfur in SCl₂ has 4 electron domains: 2 single bonds to Cl and 2 lone pairs.',
  },
  {
    id: 'so2',
    name: 'Sulfur Dioxide',
    formula: 'SO₂',
    difficulty: 'medium',
    centralElement: 'S',
    centralDomains: 3,
    bonds: [
      { element: 'O', bondOrder: 2 },
      { element: 'O', bondOrder: 2 },
    ],
    isPolar: true,
    geometry: 'bent',
    polarityReason:
      'SO₂ is bent due to a lone pair on S. The two S=O dipoles point in the same general direction and do not cancel.',
    domainHint:
      'Sulfur in SO₂ has 3 electron domains: 2 double bonds to O and 1 lone pair. Set the slider to 3. Each active edge will show 2 bond squares — snap O to any two edges and leave the third empty (that is the lone pair).',
  },
  {
    id: 'so3',
    name: 'Sulfur Trioxide',
    formula: 'SO₃',
    difficulty: 'medium',
    centralElement: 'S',
    centralDomains: 3,
    bonds: [
      { element: 'O', bondOrder: 2 },
      { element: 'O', bondOrder: 2 },
      { element: 'O', bondOrder: 2 },
    ],
    isPolar: false,
    geometry: 'trigonal planar',
    polarityReason:
      'SO₃ is trigonal planar with 3 S=O double bonds and no lone pairs on S. The three dipoles cancel symmetrically.',
    domainHint:
      'Sulfur in SO₃ has 3 electron domains: 3 double bonds to O, no lone pairs (expanded octet). Set the slider to 3, then snap three O atoms — each edge shows 2 bond squares.',
  },
  {
    id: 'cf4',
    name: 'Carbon Tetrafluoride',
    formula: 'CF₄',
    difficulty: 'medium',
    centralElement: 'C',
    centralDomains: 4,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'tetrahedral',
    polarityReason:
      'CF₄ is perfectly tetrahedral. The four C–F bond dipoles cancel symmetrically despite each bond being highly polar.',
    domainHint:
      'Carbon in CF₄ has 4 electron domains: 4 single bonds to F, no lone pairs.',
  },
  {
    id: 'sih4',
    name: 'Silane',
    formula: 'SiH₄',
    difficulty: 'medium',
    centralElement: 'Si',
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
      'SiH₄ is tetrahedral with no lone pairs. All four Si–H bond dipoles cancel symmetrically.',
    domainHint:
      'Silicon in SiH₄ has 4 electron domains: 4 single bonds to H, no lone pairs.',
  },
  {
    id: 'bcl3',
    name: 'Boron Trichloride',
    formula: 'BCl₃',
    difficulty: 'medium',
    centralElement: 'B',
    centralDomains: 3,
    bonds: [
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
      { element: 'Cl', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'trigonal planar',
    polarityReason:
      'BCl₃ is trigonal planar with no lone pairs on B. The three B–Cl dipoles cancel symmetrically.',
    domainHint:
      'Boron in BCl₃ has 3 electron domains: 3 single bonds to Cl, no lone pairs (incomplete octet on B). Set the slider to 3.',
  },
  {
    id: 'sicl4',
    name: 'Silicon Tetrachloride',
    formula: 'SiCl₄',
    difficulty: 'medium',
    centralElement: 'Si',
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
      'SiCl₄ is perfectly tetrahedral so the four Si–Cl bond dipoles cancel symmetrically.',
    domainHint:
      'Silicon in SiCl₄ has 4 electron domains: 4 single bonds to Cl, no lone pairs.',
  },

  // ── HARD — expanded octets ────────────────────────────────────────────────

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
      'Phosphorus in PCl₅ has 5 electron domains: 5 single bonds to Cl, no lone pairs (expanded octet). Use the domain slider to set 5.',
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
      'Sulfur in SF₆ has 6 electron domains: 6 single bonds to F, no lone pairs (expanded octet). Use the domain slider to set 6.',
  },
  {
    id: 'xef2',
    name: 'Xenon Difluoride',
    formula: 'XeF₂',
    difficulty: 'hard',
    centralElement: 'Xe',
    centralDomains: 5,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'linear',
    polarityReason:
      'XeF₂ is linear (the two F atoms occupy axial positions with 3 lone pairs in equatorial positions). The two Xe–F dipoles cancel.',
    domainHint:
      'Xenon in XeF₂ has 5 electron domains: 2 single bonds to F and 3 lone pairs (expanded octet). Set the slider to 5. Snap F atoms only to the edges showing 1 bond square — the edges with 2 squares represent lone pairs on Xe.',
  },
  {
    id: 'xef4',
    name: 'Xenon Tetrafluoride',
    formula: 'XeF₄',
    difficulty: 'hard',
    centralElement: 'Xe',
    centralDomains: 6,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'square planar',
    polarityReason:
      'XeF₄ is square planar with 2 lone pairs on Xe occupying axial positions. The four Xe–F bond dipoles cancel symmetrically.',
    domainHint:
      'Xenon in XeF₄ has 6 electron domains: 4 single bonds to F and 2 lone pairs (expanded octet). Set the slider to 6. Snap F atoms to the four edges showing 1 bond square — the two edges with 2 squares are lone pairs.',
  },
  {
    id: 'clf3',
    name: 'Chlorine Trifluoride',
    formula: 'ClF₃',
    difficulty: 'hard',
    centralElement: 'Cl',
    centralDomains: 5,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'T-shaped',
    polarityReason:
      'ClF₃ is T-shaped with 2 lone pairs on Cl. The arrangement of bond dipoles is asymmetric, giving a net dipole.',
    domainHint:
      'Chlorine in ClF₃ has 5 electron domains: 3 single bonds to F and 2 lone pairs (expanded octet). Set the slider to 5. Snap F atoms only to edges showing 1 bond square — the two edges with 2 squares are lone pairs on Cl.',
  },
  {
    id: 'sf4',
    name: 'Sulfur Tetrafluoride',
    formula: 'SF₄',
    difficulty: 'hard',
    centralElement: 'S',
    centralDomains: 5,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'seesaw',
    polarityReason:
      'SF₄ has seesaw geometry due to 1 lone pair on S. The bond dipoles do not cancel, giving a net dipole.',
    domainHint:
      'Sulfur in SF₄ has 5 electron domains: 4 single bonds to F and 1 lone pair (expanded octet). Set the slider to 5. Snap F to the four edges showing 1 bond square — the edge with 2 squares is the lone pair on S.',
  },
  {
    id: 'if5',
    name: 'Iodine Pentafluoride',
    formula: 'IF₅',
    difficulty: 'hard',
    centralElement: 'I',
    centralDomains: 6,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'square pyramidal',
    polarityReason:
      'IF₅ is square pyramidal with 1 lone pair on I. The five I–F bond dipoles do not cancel, giving a net dipole pointing toward the lone pair.',
    domainHint:
      'Iodine in IF₅ has 6 electron domains: 5 single bonds to F and 1 lone pair (expanded octet). Set the slider to 6. Snap F to the five edges showing 1 bond square — the edge with 2 squares is the lone pair.',
  },
  {
    id: 'brf3',
    name: 'Bromine Trifluoride',
    formula: 'BrF₃',
    difficulty: 'hard',
    centralElement: 'Br',
    centralDomains: 5,
    bonds: [
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
      { element: 'F', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'T-shaped',
    polarityReason:
      'BrF₃ is T-shaped with 2 lone pairs on Br. The asymmetric arrangement of bond dipoles gives a net dipole.',
    domainHint:
      'Bromine in BrF₃ has 5 electron domains: 3 single bonds to F and 2 lone pairs (expanded octet). Set the slider to 5. Snap F only to edges showing 1 bond square — the two edges with 2 squares are lone pairs.',
  },

  // ── HARD — polyatomic ions ────────────────────────────────────────────────

  {
    id: 'nh4+',
    name: 'Ammonium Ion',
    formula: 'NH₄⁺',
    difficulty: 'hard',
    centralElement: 'N',
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
      'NH₄⁺ is tetrahedral with four identical N–H bonds and no lone pairs. All bond dipoles cancel symmetrically.',
    domainHint:
      'Nitrogen in NH₄⁺ has 4 electron domains: 4 single bonds to H, no lone pairs. First set N\'s formal charge to +1 using the central atom editor — this removes one electron from N and makes all four bond sites equal (1 bond square each). Then snap four H atoms.',
  },
  {
    id: 'no2-',
    name: 'Nitrite Ion',
    formula: 'NO₂⁻',
    difficulty: 'hard',
    centralElement: 'N',
    centralDomains: 3,
    bonds: [
      { element: 'O', bondOrder: 2 },
      { element: 'O', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'bent',
    polarityReason:
      'NO₂⁻ is bent with a lone pair on N. The asymmetric arrangement of bond dipoles gives a net dipole.',
    domainHint:
      'Nitrogen in NO₂⁻ has 3 electron domains: 2 bonds to O and 1 lone pair. Set N to 3 domains. The bond pattern will show two edges with 2 squares and one with 1 square. Snap one O to an edge with 2 squares (double bond) and one O to the edge with 1 square (single bond). Leave the remaining 2-square edge empty — that is N\'s lone pair.',
  },
  {
    id: 'no3-',
    name: 'Nitrate Ion',
    formula: 'NO₃⁻',
    difficulty: 'hard',
    centralElement: 'N',
    centralDomains: 3,
    bonds: [
      { element: 'O', bondOrder: 2 },
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'trigonal planar',
    polarityReason:
      'NO₃⁻ is trigonal planar (no lone pairs on N). The three bond dipoles cancel symmetrically.',
    domainHint:
      'Nitrogen in NO₃⁻ has 3 electron domains: 3 bonds to O, no lone pairs on N. Set N to 3 domains, then set N\'s formal charge to +1 in the central atom editor. This adjusts the bond pattern to show one edge with 2 squares (double bond) and two with 1 square (single bonds). Snap three O atoms accordingly.',
  },
  {
    id: 'co3-2',
    name: 'Carbonate Ion',
    formula: 'CO₃²⁻',
    difficulty: 'hard',
    centralElement: 'C',
    centralDomains: 3,
    bonds: [
      { element: 'O', bondOrder: 2 },
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'trigonal planar',
    polarityReason:
      'CO₃²⁻ is trigonal planar with no lone pairs on C. The three bond dipoles cancel symmetrically.',
    domainHint:
      'Carbon in CO₃²⁻ has 3 electron domains: 3 bonds to O (one double, two single in one resonance form), no lone pairs. Set C to 3 domains — the bond pattern shows one edge with 2 squares and two edges with 1 square. Snap three O atoms: one to the double-bond edge, two to the single-bond edges.',
  },
  {
    id: 'so4-2',
    name: 'Sulfate Ion',
    formula: 'SO₄²⁻',
    difficulty: 'hard',
    centralElement: 'S',
    centralDomains: 4,
    bonds: [
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'tetrahedral',
    polarityReason:
      'SO₄²⁻ is tetrahedral with no lone pairs on S. The four S–O bond dipoles cancel symmetrically.',
    domainHint:
      'Sulfur in SO₄²⁻ has 4 electron domains: 4 single bonds to O, no lone pairs. In the strict Lewis structure, S carries a +2 formal charge. Set S\'s formal charge to +2 in the central atom editor — this gives all four bond sites 1 bond square each. Then snap four O atoms.',
  },
  {
    id: 'clo3-',
    name: 'Chlorate Ion',
    formula: 'ClO₃⁻',
    difficulty: 'hard',
    centralElement: 'Cl',
    centralDomains: 4,
    bonds: [
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
    ],
    isPolar: true,
    geometry: 'trigonal pyramidal',
    polarityReason:
      'ClO₃⁻ is trigonal pyramidal with a lone pair on Cl. The asymmetric arrangement of bond dipoles gives a net dipole.',
    domainHint:
      'Chlorine in ClO₃⁻ has 4 electron domains: 3 single bonds to O and 1 lone pair. Set Cl\'s formal charge to +2 — this produces one edge with 2 bond squares (the lone pair site) and three edges with 1 square (bond sites). Snap three O atoms to the single-bond edges.',
  },
  {
    id: 'po4-3',
    name: 'Phosphate Ion',
    formula: 'PO₄³⁻',
    difficulty: 'hard',
    centralElement: 'P',
    centralDomains: 4,
    bonds: [
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
      { element: 'O', bondOrder: 1 },
    ],
    isPolar: false,
    geometry: 'tetrahedral',
    polarityReason:
      'PO₄³⁻ is tetrahedral with no lone pairs on P. The four P–O bond dipoles cancel symmetrically.',
    domainHint:
      'Phosphorus in PO₄³⁻ has 4 electron domains: 4 single bonds to O, no lone pairs. In the strict Lewis structure, P carries a +1 formal charge. Set P\'s formal charge to +1 — this gives all four bond sites 1 bond square each. Then snap four O atoms.',
  },
];
