import { useState, useCallback, useRef, useEffect } from 'react';
import Workspace from './components/Workspace';
import Palette from './components/Palette';
import AtomEditor from './components/AtomEditor';
import CentralAtomEditor from './components/CentralAtomEditor';
import LayerControls from './components/LayerControls';
import MoleculeViewer3D from './components/MoleculeViewer3D';
import MoleculeViewer2D from './components/MoleculeViewer2D';
import TutorialGuide from './components/TutorialGuide';
import PracticePanel from './components/PracticePanel';
import {
  getPolygonRadius,
  getPolygonVertices,
  getEdgeMidpoints,
  getStartAngle,
  CARD_SIZE,
} from './utils/geometry';
import { autoAdjustElectrons, generateBondPattern } from './data/atoms';
import './App.css';

export default function App() {
  const [mode, setMode]                 = useState('single');
  const [centralAtoms, setCentralAtoms] = useState([]);
  const [centralLinks, setCentralLinks] = useState([]);
  const [cards, setCards]               = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [selectedCentralId, setSelectedCentralId] = useState(null);
  const [show3D, setShow3D] = useState(false);
  const [show2D, setShow2D] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [practiceExpanded, setPracticeExpanded] = useState(false);
  const nextId = useRef(1);

  // Tutorial: null = dismissed, 0 = welcome, 1-5 = guide steps, 6 = completion
  const [tutorialStep, setTutorialStep] = useState(
    () => (localStorage.getItem('lewis-grids-tutorial-seen') ? null : 0)
  );

  const selectedCard    = cards.find((c) => c.id === selectedCardId) ?? null;
  const selectedCentral = centralAtoms.find((ca) => ca.id === selectedCentralId) ?? null;

  // ── Mode change ──────────────────────────────────────────────────────────

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    if (newMode === 'single') {
      setCentralAtoms((prev) => prev.slice(0, 1));
      setCentralLinks([]);
      setCards((prev) => prev.map((c) => ({ ...c, snappedEdge: null })));
    } else {
      // Close 3D view when entering multi-CA mode (not supported there)
      setShow3D(false);
    }
  }, []);

  // ── Central atom management ──────────────────────────────────────────────

  const handleSelectCentral = useCallback((group) => {
    const domains = group.defaultDomains;
    const newAtom = {
      id: `ca-${nextId.current++}`,
      element:      group.element,
      color:        group.color,
      baseValence:  group.baseValence,
      maxDomains:   group.maxDomains,
      domains,
      bondPattern:  generateBondPattern(group.baseValence, domains),
      rotation:     0,
      formalCharge: 0,
      position:     getSpawnPosition(mode === 'single' ? [] : centralAtoms, domains, window.innerWidth - PALETTE_W - practiceW(practiceExpanded)),
    };

    if (mode === 'single') {
      setCentralAtoms([newAtom]);
      setCentralLinks([]);
      setCards([]);
      setSelectedCentralId(newAtom.id);
      setSelectedCardId(null);
    } else {
      // Auto-bond new atom to previous and align its geometry so outer atoms
      // on CA2 face away from CA1 (proper VSEPR spacing)
      if (centralAtoms.length > 0) {
        const prevAtom = centralAtoms[centralAtoms.length - 1];
        const initLink = computeCentralLink(prevAtom, newAtom);
        if (initLink) {
          const polyN1 = prevAtom.domains === 2 ? 4 : prevAtom.domains;
          const R1 = getPolygonRadius(polyN1);
          const verts1 = getPolygonVertices(
            prevAtom.position.x, prevAtom.position.y, R1, polyN1, prevAtom.rotation || 0
          );
          const e1 = getEdgeMidpoints(prevAtom.position.x, prevAtom.position.y, verts1)
            .find((e) => e.edgeIndex === initLink.edgeIndex1);
          if (e1) {
            // Rotate CA2 so its linked edge faces back toward CA1; all other
            // edges face away, giving correct VSEPR geometry from the start
            const polyN2 = newAtom.domains === 2 ? 4 : newAtom.domains;
            const apothem2 = getApothem(polyN2);
            const targetAngle = e1.angle + Math.PI;
            newAtom.rotation = rotationForEdgeAngle(polyN2, initLink.edgeIndex2, targetAngle);
            newAtom.position = {
              x: e1.x + apothem2 * Math.cos(e1.angle),
              y: e1.y + apothem2 * Math.sin(e1.angle),
            };
          }
          setCentralLinks((lnks) => [...lnks, initLink]);
        }
      }
      setCentralAtoms((prev) => [...prev, newAtom]);
      setSelectedCentralId(newAtom.id);
      setSelectedCardId(null);
    }
  }, [mode, centralAtoms, practiceExpanded]);

  const handleUpdateCentralAtom = useCallback((id, newPosition) => {
    let driftX = 0, driftY = 0;

    setCentralAtoms((prev) => {
      const old = prev.find((ca) => ca.id === id);
      if (old) {
        driftX = newPosition.x - old.position.x;
        driftY = newPosition.y - old.position.y;
      }
      return prev.map((ca) => (ca.id === id ? { ...ca, position: newPosition } : ca));
    });

    if (driftX !== 0 || driftY !== 0) {
      setCards((prev) =>
        prev.map((c) =>
          c.snappedEdge?.centralId === id
            ? { ...c, position: { x: c.position.x + driftX, y: c.position.y + driftY } }
            : c
        )
      );
    }
  }, []);

  const handleRotateCentral = useCallback((id, deltaDeg) => {
    setCentralAtoms((prevCAs) => {
      const ca = prevCAs.find((c) => c.id === id);
      if (!ca) return prevCAs;
      const newRotation = ((ca.rotation || 0) + deltaDeg + 360) % 360;
      const polyN = ca.domains === 2 ? 4 : ca.domains;
      const R = getPolygonRadius(polyN);
      const newVerts = getPolygonVertices(ca.position.x, ca.position.y, R, polyN, newRotation);
      const newEdges = getEdgeMidpoints(ca.position.x, ca.position.y, newVerts);

      setCards((prevCards) =>
        prevCards.map((card) => {
          if (card.snappedEdge?.centralId !== id) return card;
          const edge = newEdges.find((e) => e.edgeIndex === card.snappedEdge.edgeIndex);
          if (!edge) return card;
          const half = CARD_SIZE / 2;
          return {
            ...card,
            position: { x: edge.x + half * Math.cos(edge.angle), y: edge.y + half * Math.sin(edge.angle) },
            rotation: (edge.angle * 180) / Math.PI + 90,
          };
        })
      );

      return prevCAs.map((c) => (c.id === id ? { ...c, rotation: newRotation } : c));
    });
  }, []);

  const handleRemoveCentralAtom = useCallback((id) => {
    setCentralAtoms((prev) => prev.filter((ca) => ca.id !== id));
    setCentralLinks((prev) => prev.filter((l) => l.id1 !== id && l.id2 !== id));
    setCards((prev) =>
      prev.map((c) => (c.snappedEdge?.centralId === id ? { ...c, snappedEdge: null } : c))
    );
    setSelectedCentralId((prev) => prev === id ? null : prev);
  }, []);

  const handleUpdateCentralAtomProps = useCallback((id, updates) => {
    const ca = centralAtoms.find((c) => c.id === id);
    if (!ca) return;

    // Compute the fully updated CA state ahead of time
    const updatedCA = { ...ca, ...updates };
    if ('domains' in updates || 'formalCharge' in updates) {
      const electronCount = (updatedCA.baseValence ?? 4) - (updatedCA.formalCharge ?? 0);
      updatedCA.bondPattern = generateBondPattern(Math.max(0, electronCount), updatedCA.domains);
    }

    // Apply the primary update
    setCentralAtoms((prev) => prev.map((c) => (c.id === id ? updatedCA : c)));

    // Unsnap outer atoms on now-inactive edges
    setCards((prev) =>
      prev.map((c) => {
        if (c.snappedEdge?.centralId !== id) return c;
        if (updatedCA.bondPattern[c.snappedEdge.edgeIndex] == null) return { ...c, snappedEdge: null };
        return c;
      })
    );

    // Non-domain changes: just prune links whose edges went inactive
    if (!('domains' in updates)) {
      setCentralLinks((prev) =>
        prev.filter((l) => {
          if (l.id1 === id && updatedCA.bondPattern[l.edgeIndex1] == null) return false;
          if (l.id2 === id && updatedCA.bondPattern[l.edgeIndex2] == null) return false;
          return true;
        })
      );
      return;
    }

    // Domain change: recompute links and reposition any linked CA2 atoms
    if (!centralLinks.length) return;

    const caPositionUpdates = {}; // caId → { position, rotation }
    const cardUpdates       = {}; // cardId → { position, rotation }

    const newLinks = centralLinks.map((link) => {
      if (link.id1 !== id && link.id2 !== id) return link;

      // Resolve both sides – incorporate cascading positional updates from prior iterations
      const ca1Raw = link.id1 === id ? updatedCA : centralAtoms.find((c) => c.id === link.id1);
      const ca2Raw = link.id2 === id ? updatedCA : centralAtoms.find((c) => c.id === link.id2);
      if (!ca1Raw || !ca2Raw) return link;

      const ca1Resolved = caPositionUpdates[link.id1]
        ? { ...ca1Raw, ...caPositionUpdates[link.id1] }
        : ca1Raw;
      const ca2Resolved = caPositionUpdates[link.id2]
        ? { ...ca2Raw, ...caPositionUpdates[link.id2] }
        : ca2Raw;

      // CA1's edge that faces CA2
      const polyN1 = ca1Resolved.domains === 2 ? 4 : ca1Resolved.domains;
      const R1 = getPolygonRadius(polyN1);
      const verts1 = getPolygonVertices(
        ca1Resolved.position.x, ca1Resolved.position.y, R1, polyN1, ca1Resolved.rotation || 0
      );
      const activeEdges1 = getEdgeMidpoints(ca1Resolved.position.x, ca1Resolved.position.y, verts1)
        .filter((e) => ca1Resolved.bondPattern[e.edgeIndex] != null);

      if (!activeEdges1.length) return link;

      const dirToCA2 = Math.atan2(
        ca2Resolved.position.y - ca1Resolved.position.y,
        ca2Resolved.position.x - ca1Resolved.position.x
      );
      const e1 = activeEdges1.reduce((best, e) =>
        angleDiff(e.angle, dirToCA2) < angleDiff(best.angle, dirToCA2) ? e : best
      );

      // CA2's new alignment: its facing edge points back toward CA1
      const polyN2      = ca2Resolved.domains === 2 ? 4 : ca2Resolved.domains;
      const apothem2    = getApothem(polyN2);
      const targetAngle = e1.angle + Math.PI; // direction CA2's edge should face

      const activeEdgesCA2 = Object.keys(ca2Resolved.bondPattern)
        .map(Number)
        .filter((ei) => ca2Resolved.bondPattern[ei] != null);

      if (!activeEdgesCA2.length) return link;

      // Pick the edge whose required rotation is closest to CA2's current rotation
      const curRot2 = (ca2Resolved.rotation || 0) * (Math.PI / 180);
      let bestEdge2 = activeEdgesCA2[0];
      let bestRotDiff = Infinity;
      for (const ei of activeEdgesCA2) {
        const rotNeeded = rotationForEdgeAngle(polyN2, ei, targetAngle) * (Math.PI / 180);
        const diff = angleDiff(rotNeeded, curRot2);
        if (diff < bestRotDiff) { bestRotDiff = diff; bestEdge2 = ei; }
      }

      const newRotCA2 = rotationForEdgeAngle(polyN2, bestEdge2, targetAngle);
      const newPosCA2 = {
        x: e1.x + apothem2 * Math.cos(e1.angle),
        y: e1.y + apothem2 * Math.sin(e1.angle),
      };

      caPositionUpdates[link.id2] = { position: newPosCA2, rotation: newRotCA2 };

      // Reposition any outer atoms snapped to CA2's edges
      const R2 = getPolygonRadius(polyN2);
      const verts2 = getPolygonVertices(newPosCA2.x, newPosCA2.y, R2, polyN2, newRotCA2);
      const edges2 = getEdgeMidpoints(newPosCA2.x, newPosCA2.y, verts2);
      for (const card of cards.filter((c) => c.snappedEdge?.centralId === link.id2)) {
        const edge = edges2.find((e) => e.edgeIndex === card.snappedEdge.edgeIndex);
        if (!edge) continue;
        const half = CARD_SIZE / 2;
        cardUpdates[card.id] = {
          position: {
            x: edge.x + half * Math.cos(edge.angle),
            y: edge.y + half * Math.sin(edge.angle),
          },
          rotation: (edge.angle * 180) / Math.PI + 90,
        };
      }

      return {
        ...link,
        edgeIndex1: e1.edgeIndex,
        edgeIndex2: bestEdge2,
        bondOrder: Math.min(
          ca1Resolved.bondPattern[e1.edgeIndex] ?? 1,
          ca2Resolved.bondPattern[bestEdge2]    ?? 1
        ),
      };
    });

    if (Object.keys(caPositionUpdates).length > 0) {
      setCentralAtoms((prev) =>
        prev.map((c) => caPositionUpdates[c.id] ? { ...c, ...caPositionUpdates[c.id] } : c)
      );
    }
    if (Object.keys(cardUpdates).length > 0) {
      setCards((prev) =>
        prev.map((c) => (cardUpdates[c.id] ? { ...c, ...cardUpdates[c.id] } : c))
      );
    }
    setCentralLinks(newLinks);
  }, [centralAtoms, centralLinks, cards]);

  const handleTransferBond = useCallback((centralId, fromEdge, toEdge) => {
    const ca = centralAtoms.find((c) => c.id === centralId);
    if (!ca) return;
    const bp = ca.bondPattern;
    if ((bp[fromEdge] ?? 0) < 2) return;      // keep at least 1 on source
    if (bp[toEdge] == null) return;             // target must be active
    if ((bp[toEdge] ?? 0) >= 3) return;        // can't exceed triple bond
    const newBp = [...bp];
    newBp[fromEdge]--;
    newBp[toEdge]++;
    setCentralAtoms((prev) =>
      prev.map((c) => (c.id === centralId ? { ...c, bondPattern: newBp } : c))
    );
    setCards((prev) =>
      prev.map((c) => {
        if (c.snappedEdge?.centralId !== centralId) return c;
        const ei = c.snappedEdge.edgeIndex;
        if (ei === fromEdge) return { ...c, snappedEdge: { ...c.snappedEdge, bondOrder: newBp[fromEdge] } };
        if (ei === toEdge)   return { ...c, snappedEdge: { ...c.snappedEdge, bondOrder: newBp[toEdge] } };
        return c;
      })
    );
    // Keep link bondOrder in sync when a linked edge changes
    setCentralLinks((prev) =>
      prev.map((link) => {
        const isId1 = link.id1 === centralId;
        const isId2 = link.id2 === centralId;
        if (!isId1 && !isId2) return link;
        const myEdge    = isId1 ? link.edgeIndex1 : link.edgeIndex2;
        const otherEdge = isId1 ? link.edgeIndex2 : link.edgeIndex1;
        if (myEdge !== fromEdge && myEdge !== toEdge) return link;
        const otherCA = centralAtoms.find((c) => c.id === (isId1 ? link.id2 : link.id1));
        const otherOrder = otherCA?.bondPattern?.[otherEdge] ?? 1;
        return { ...link, bondOrder: Math.max(1, Math.min(newBp[myEdge], otherOrder)) };
      })
    );
  }, [centralAtoms]);

  // ── Card management ──────────────────────────────────────────────────────

  const handleAddCard = useCallback((cardType) => {
    const wsW = window.innerWidth  - PALETTE_W - practiceW(practiceExpanded);
    const wsH = window.innerHeight - HEADER_H;
    const pad = CARD_SIZE / 2 + 12; // keep cards fully on-screen
    const MIN_DIST = CARD_SIZE + 10;

    // Anchor candidates around the nearest central atom so cards stay close
    const anchor = centralAtoms.length > 0
      ? centralAtoms[centralAtoms.length - 1].position
      : { x: wsW / 2, y: wsH / 2 };
    const MAX_DIST = 320; // max distance from central atom center
    const MIN_INNER = CARD_SIZE + 40; // clear the central atom polygon

    // Keep-out zones for the two floating panels (expanded by card half-size).
    // LayerControls: top-center, up to ~400×130 (includes EN legend).
    // AtomEditor / CentralAtomEditor: bottom-center, ~260×220.
    const half = CARD_SIZE / 2;
    const midX = wsW / 2;
    const AVOID_ZONES = [
      { x1: midX - 200 - half, x2: midX + 200 + half, y1: -half,          y2: 130 + half },
      { x1: midX - 130 - half, x2: midX + 130 + half, y1: wsH - 220 - half, y2: wsH + half },
    ];
    const inPanel = (cx, cy) =>
      AVOID_ZONES.some((z) => cx > z.x1 && cx < z.x2 && cy > z.y1 && cy < z.y2);

    // Try random positions within MAX_DIST of the anchor
    let position = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const r     = MIN_INNER + Math.random() * (MAX_DIST - MIN_INNER);
      const candidate = {
        x: Math.max(pad, Math.min(wsW - pad, anchor.x + r * Math.cos(angle))),
        y: Math.max(pad, Math.min(wsH - pad, anchor.y + r * Math.sin(angle))),
      };
      const tooCloseToCard = cards.some((c) => {
        const dx = c.position.x - candidate.x;
        const dy = c.position.y - candidate.y;
        return Math.sqrt(dx * dx + dy * dy) < MIN_DIST;
      });
      if (!tooCloseToCard && !inPanel(candidate.x, candidate.y)) {
        position = candidate;
        break;
      }
    }
    // Fallback: any non-overlapping spot in the workspace
    if (!position) {
      position = {
        x: pad + Math.random() * (wsW - pad * 2),
        y: pad + Math.random() * (wsH - pad * 2),
      };
    }

    setCards((prev) => [
      ...prev,
      {
        id: `card-${nextId.current++}`,
        ...cardType,
        position,
        rotation: 0,
        snappedEdge: null,
        arrangementIdx: 0,
      },
    ]);
  }, [centralAtoms, cards, practiceExpanded]);

  const handleUpdateCard = useCallback((id, updates) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const handleRemoveCard = useCallback((id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (selectedCardId === id) setSelectedCardId(null);
  }, [selectedCardId]);

  const handleShuffleCard = useCallback((id) => {
    setCards((prev) => prev.map((card) => {
      if (card.id !== id || !card.arrangements?.length) return card;
      const nextIdx = ((card.arrangementIdx ?? 0) + 1) % card.arrangements.length;
      let newElectrons = [...card.arrangements[nextIdx].electrons];
      if (card.snappedEdge) {
        const ca = centralAtoms.find((c) => c.id === card.snappedEdge.centralId);
        const bondOrder = ca?.bondPattern?.[card.snappedEdge.edgeIndex] ?? 1;
        newElectrons = autoAdjustElectrons(newElectrons, bondOrder);
      }
      return { ...card, electrons: newElectrons, arrangementIdx: nextIdx };
    }));
  }, [centralAtoms]);

  const handleToggleOverlay = useCallback((id) => {
    setActiveOverlay((prev) => prev === id ? null : id);
  }, []);

  // ── Practice panel ────────────────────────────────────────────────────────

  const handlePracticeToggle = useCallback(() => {
    const willExpand = !practiceExpanded;
    const oldWsW = window.innerWidth - PALETTE_W - practiceW(practiceExpanded);
    const newWsW = window.innerWidth - PALETTE_W - practiceW(willExpand);
    const dx = newWsW / 2 - oldWsW / 2;

    if (dx !== 0) {
      // Temporarily inject CSS transitions so atoms glide with the panel
      const styleEl = document.createElement('style');
      styleEl.textContent =
        '.atom-card{transition:left 0.24s cubic-bezier(0.4,0,0.2,1),top 0.24s cubic-bezier(0.4,0,0.2,1)!important}' +
        '.ca-overlay{transition:left 0.24s cubic-bezier(0.4,0,0.2,1),top 0.24s cubic-bezier(0.4,0,0.2,1)!important}';
      document.head.appendChild(styleEl);

      setCentralAtoms((prev) =>
        prev.map((ca) => ({ ...ca, position: { x: ca.position.x + dx, y: ca.position.y } }))
      );
      setCards((prev) =>
        prev.map((c) => ({ ...c, position: { x: c.position.x + dx, y: c.position.y } }))
      );

      setTimeout(() => document.head.removeChild(styleEl), 260);
    }

    setPracticeExpanded(willExpand);
  }, [practiceExpanded]);

  // ── Tutorial auto-advance (11-step H2O walkthrough) ──────────────────────

  // Step 1 → 2: central atom added
  useEffect(() => {
    if (tutorialStep === 1 && centralAtoms.length > 0) setTutorialStep(2);
  }, [centralAtoms.length, tutorialStep]);

  // Step 2: Next button only — editor opens automatically, user reads the domain count

  // Step 3 → 4: both H cards added
  useEffect(() => {
    if (tutorialStep === 3 && cards.length >= 2) setTutorialStep(4);
  }, [cards.length, tutorialStep]);

  // Step 4 → 5: user clicks an H card (outer atom editor opens)
  useEffect(() => {
    if (tutorialStep === 4 && selectedCardId) setTutorialStep(5);
  }, [selectedCardId, tutorialStep]);

  // Step 5 → 6: both H cards snapped to O
  const snappedCount = cards.filter((c) => c.snappedEdge).length;
  useEffect(() => {
    if (tutorialStep === 5 && snappedCount >= 2) setTutorialStep(6);
  }, [snappedCount, tutorialStep]);

  // Step 6 → 7: Formal Charge overlay active
  useEffect(() => {
    if (tutorialStep === 6 && activeOverlay === 'fc') setTutorialStep(7);
  }, [activeOverlay, tutorialStep]);

  // Step 7 → 8: Octet Rule overlay active
  useEffect(() => {
    if (tutorialStep === 7 && activeOverlay === 'octet') setTutorialStep(8);
  }, [activeOverlay, tutorialStep]);

  // Step 8 → 9: 2D view opened
  useEffect(() => {
    if (tutorialStep === 8 && show2D) setTutorialStep(9);
  }, [show2D, tutorialStep]);

  // Step 9 → 10: 3D view opened
  useEffect(() => {
    if (tutorialStep === 9 && show3D) setTutorialStep(10);
  }, [show3D, tutorialStep]);

  // Step 10: Next button only (polarity toggle is inside 3D viewer, not detectable here)

  // Step 11 → 12: practice panel expanded
  useEffect(() => {
    if (tutorialStep === 11 && practiceExpanded) setTutorialStep(12);
  }, [practiceExpanded, tutorialStep]);

  // Step 12: "Finish Tutorial" button → advances to step 13 (completion toast)

  function dismissTutorial() {
    localStorage.setItem('lewis-grids-tutorial-seen', '1');
    setTutorialStep(null);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="app" onClick={() => { setSelectedCardId(null); setSelectedCentralId(null); }}>
      <header className="app-header" onClick={(e) => e.stopPropagation()}>
        <span className="app-logo">⬡</span>
        <h1 className="app-title">Lewis Grids</h1>
        {(centralAtoms.length > 0 || cards.length > 0) && (
          <div className="app-status">
            {centralAtoms.map((ca) => (
              <span key={ca.id} className="status-chip">
                <span className="status-atom" style={{ color: ca.color }}>{ca.element}</span>
                <span className="status-shape">{shapeLabel(ca.domains)}</span>
                <button
                  className="btn-remove-ca"
                  onClick={() => handleRemoveCentralAtom(ca.id)}
                  title="Remove this central atom"
                >×</button>
              </span>
            ))}
            {mode === 'single' && (
              <button className="btn-clear" onClick={() => {
                setCentralAtoms([]); setCentralLinks([]); setCards([]);
                setSelectedCardId(null); setSelectedCentralId(null);
                setShow3D(false); setShow2D(false);
              }}>Clear</button>
            )}
          </div>
        )}
        <button
          className="btn-tutorial"
          onClick={() => setTutorialStep(0)}
          title="Replay tutorial"
        >
          Tutorial
        </button>
      </header>

      <div className="app-body">
        <Palette
          mode={mode}
          onModeChange={handleModeChange}
          onSelectCentral={handleSelectCentral}
          onAddCard={handleAddCard}
        />
        <div className="workspace-area">
          <Workspace
            centralAtoms={centralAtoms}
            centralLinks={centralLinks}
            cards={cards}
            selectedCardId={selectedCardId}
            activeOverlay={activeOverlay}
            onUpdateCentralAtom={handleUpdateCentralAtom}
            onRotateCentralAtom={handleRotateCentral}
            onRemoveCentralAtom={handleRemoveCentralAtom}
            onUpdateCard={handleUpdateCard}
            onRemoveCard={handleRemoveCard}
            onSelectCard={(id) => { setSelectedCentralId(null); setSelectedCardId(id); }}
            onShuffleCard={handleShuffleCard}
            onSelectCentral={(id) => { setSelectedCardId(null); setSelectedCentralId(id); }}
            onTransferBond={handleTransferBond}
          />
          {selectedCard && (
            <AtomEditor
              card={selectedCard}
              onUpdate={handleUpdateCard}
              onClose={() => setSelectedCardId(null)}
            />
          )}
          {selectedCentral && (
            <CentralAtomEditor
              centralAtom={selectedCentral}
              onUpdate={handleUpdateCentralAtomProps}
              onClose={() => setSelectedCentralId(null)}
            />
          )}
          {centralAtoms.length > 0 && (
            <LayerControls
              activeOverlay={activeOverlay}
              onToggle={handleToggleOverlay}
              show2D={show2D}
              onToggle2D={() => setShow2D((v) => !v)}
              show3D={show3D}
              onToggle3D={() => { if (mode !== 'multiple') setShow3D((v) => !v); }}
              disable3D={mode === 'multiple'}
            />
          )}
        </div>
        <PracticePanel
          centralAtoms={centralAtoms}
          cards={cards}
          expanded={practiceExpanded}
          onToggle={handlePracticeToggle}
        />
      </div>

      {show2D && (
        <MoleculeViewer2D
          centralAtoms={centralAtoms}
          centralLinks={centralLinks}
          cards={cards}
          onClose={() => setShow2D(false)}
        />
      )}

      {tutorialStep !== null && (
        <TutorialGuide
          step={tutorialStep}
          onStart={() => {
            // Reset workspace and all layers to defaults before starting
            setCentralAtoms([]);
            setCentralLinks([]);
            setCards([]);
            setSelectedCardId(null);
            setSelectedCentralId(null);
            setShow2D(false);
            setShow3D(false);
            setActiveOverlay(null);
            setPracticeExpanded(false);
            setTutorialStep(1);
          }}
          onNext={() => setTutorialStep((s) => s + 1)}
          onSkip={dismissTutorial}
          onDone={dismissTutorial}
        />
      )}

      {show3D && (
        <MoleculeViewer3D
          centralAtoms={centralAtoms}
          centralLinks={centralLinks}
          cards={cards}
          onClose={() => setShow3D(false)}
        />
      )}
    </div>
  );
}

function shapeLabel(n) {
  return { 2: 'Linear', 3: 'Triangle', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon' }[n] || `${n}-gon`;
}

const PALETTE_W           = 260;
const HEADER_H            = 48;
const PRACTICE_COLLAPSED_W = 36;
const PRACTICE_EXPANDED_W  = 300;

function practiceW(expanded) {
  return expanded ? PRACTICE_EXPANDED_W : PRACTICE_COLLAPSED_W;
}

function getSpawnPosition(existingAtoms, newDomains, wsW) {
  if (existingAtoms.length === 0) {
    // Position is in workspace-container coordinates (origin = top-left of workspace area)
    return {
      x: wsW / 2,
      y: (window.innerHeight - HEADER_H) / 2,
    };
  }
  const last = existingAtoms[existingAtoms.length - 1];
  const lastPolyN = last.domains === 2 ? 4 : last.domains;
  const newPolyN  = newDomains   === 2 ? 4 : newDomains;
  const lastR = getPolygonRadius(lastPolyN);
  const newR  = getPolygonRadius(newPolyN);
  // Space by apothems so the atoms' edges are close, not far
  const lastApothem = lastR * Math.cos(Math.PI / lastPolyN);
  const newApothem  = newR  * Math.cos(Math.PI / newPolyN);
  return { x: last.position.x + lastApothem + newApothem + 8, y: last.position.y };
}

// ── Multi-CA geometry helpers ─────────────────────────────────────────────────

/** Smallest angular difference between two angles (radians). Returns [0, π]. */
function angleDiff(a, b) {
  const d = ((a - b) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  return Math.abs(d);
}

/** Natural outward angle (rad) of edge i for an n-gon polygon at rotation = 0. */
function naturalEdgeAngle0(n, i) {
  const startRad = (getStartAngle(n) * Math.PI) / 180;
  return startRad + i * (2 * Math.PI / n) + Math.PI / n;
}

/** Rotation in [0, 360) degrees so that edge `edgeIndex` of an n-gon faces `targetAngleRad`. */
function rotationForEdgeAngle(n, edgeIndex, targetAngleRad) {
  const delta = targetAngleRad - naturalEdgeAngle0(n, edgeIndex);
  return ((delta * 180 / Math.PI) % 360 + 360) % 360;
}

/** Distance from center to edge midpoint of a regular n-gon with circumradius R. */
function getApothem(polyN) {
  return getPolygonRadius(polyN) * Math.cos(Math.PI / polyN);
}

/**
 * Find the directionally-correct active-edge pair between two central atoms.
 * Picks the edge of atom1 most facing atom2, and the edge of atom2 most facing atom1.
 */
function computeCentralLink(atom1, atom2) {
  const polyN1 = atom1.domains === 2 ? 4 : atom1.domains;
  const R1 = getPolygonRadius(polyN1);
  const verts1 = getPolygonVertices(atom1.position.x, atom1.position.y, R1, polyN1, atom1.rotation || 0);
  const edges1 = getEdgeMidpoints(atom1.position.x, atom1.position.y, verts1)
    .filter((e) => atom1.bondPattern[e.edgeIndex] != null);

  const polyN2 = atom2.domains === 2 ? 4 : atom2.domains;
  const R2 = getPolygonRadius(polyN2);
  const verts2 = getPolygonVertices(atom2.position.x, atom2.position.y, R2, polyN2, atom2.rotation || 0);
  const edges2 = getEdgeMidpoints(atom2.position.x, atom2.position.y, verts2)
    .filter((e) => atom2.bondPattern[e.edgeIndex] != null);

  if (!edges1.length || !edges2.length) return null;

  // Direction atom1 → atom2
  const dir12 = Math.atan2(
    atom2.position.y - atom1.position.y,
    atom2.position.x - atom1.position.x
  );
  const dir21 = dir12 + Math.PI;

  // Edge of atom1 whose outward angle is closest to pointing toward atom2
  const e1 = edges1.reduce((best, e) =>
    angleDiff(e.angle, dir12) < angleDiff(best.angle, dir12) ? e : best
  );
  // Edge of atom2 whose outward angle is closest to pointing toward atom1
  const e2 = edges2.reduce((best, e) =>
    angleDiff(e.angle, dir21) < angleDiff(best.angle, dir21) ? e : best
  );

  return {
    id1:        atom1.id,
    edgeIndex1: e1.edgeIndex,
    id2:        atom2.id,
    edgeIndex2: e2.edgeIndex,
    bondOrder:  Math.min(
      atom1.bondPattern[e1.edgeIndex] ?? 1,
      atom2.bondPattern[e2.edgeIndex] ?? 1,
    ),
  };
}
