import { useState, useCallback, useRef } from 'react';
import Workspace from './components/Workspace';
import Palette from './components/Palette';
import './App.css';

export default function App() {
  const [mode, setMode]           = useState('single');
  const [centralAtoms, setCentralAtoms] = useState([]);
  const [cards, setCards]         = useState([]);
  const [lonePairs, setLonePairs] = useState([]);
  const nextId = useRef(1);

  // ── Mode change ──────────────────────────────────────────────────────────

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    // Switching to single: keep only the first central atom (if any)
    if (newMode === 'single') {
      setCentralAtoms((prev) => prev.slice(0, 1));
      // Unsnap cards that were snapped to removed central atoms
      setCards((prev) =>
        prev.map((c) => {
          if (!c.snappedEdge) return c;
          // We don't know remaining centralAtom IDs here yet, so just clear all snaps
          // (acceptable: user can re-snap)
          return { ...c, snappedEdge: null };
        })
      );
    }
  }, []);

  // ── Central atom management ──────────────────────────────────────────────

  const handleSelectCentral = useCallback((config) => {
    const newAtom = {
      id: `ca-${nextId.current++}`,
      ...config,
      position: getSpawnPosition(centralAtoms.length),
    };

    if (mode === 'single') {
      setCentralAtoms([newAtom]);
      // Clear all cards and lone pairs on new central atom selection in single mode
      setCards([]);
      setLonePairs([]);
    } else {
      setCentralAtoms((prev) => [...prev, newAtom]);
    }
  }, [mode, centralAtoms.length]);

  // Called by Workspace on drag — updates position and cascades to snapped objects
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

    // Move all snapped outer atom cards by the same delta
    if (driftX !== 0 || driftY !== 0) {
      setCards((prev) =>
        prev.map((c) =>
          c.snappedEdge?.centralId === id
            ? { ...c, position: { x: c.position.x + driftX, y: c.position.y + driftY } }
            : c
        )
      );
      // Move lone pairs snapped to those cards
      setLonePairs((prev) =>
        prev.map((lp) => {
          if (!lp.snappedTo) return lp;
          // Check if the card this LP is on belongs to the moved central atom
          const parentCard = cards.find(
            (c) => c.id === lp.snappedTo.cardId && c.snappedEdge?.centralId === id
          );
          if (!parentCard) return lp;
          return { ...lp, position: { x: lp.position.x + driftX, y: lp.position.y + driftY } };
        })
      );
    }
  }, [cards]);

  const handleRemoveCentralAtom = useCallback((id) => {
    setCentralAtoms((prev) => prev.filter((ca) => ca.id !== id));
    // Unsnap cards that were attached to it
    setCards((prev) =>
      prev.map((c) => (c.snappedEdge?.centralId === id ? { ...c, snappedEdge: null } : c))
    );
  }, []);

  // ── Card management ──────────────────────────────────────────────────────

  const handleAddCard = useCallback((cardType) => {
    const jitter = () => (Math.random() - 0.5) * 100;
    setCards((prev) => [
      ...prev,
      {
        id: `card-${nextId.current++}`,
        ...cardType,
        position: { x: 400 + jitter(), y: 300 + jitter() },
        rotation: 0,
        snappedEdge: null,
      },
    ]);
  }, []);

  const handleUpdateCard = useCallback((id, updates) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const handleRemoveCard = useCallback((id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    // Remove lone pairs snapped to this card
    setLonePairs((prev) => prev.filter((lp) => lp.snappedTo?.cardId !== id));
  }, []);

  // ── Lone pair management ─────────────────────────────────────────────────

  const handleAddLonePair = useCallback(() => {
    const jitter = () => (Math.random() - 0.5) * 80;
    setLonePairs((prev) => [
      ...prev,
      {
        id: `lp-${nextId.current++}`,
        position: { x: 400 + jitter(), y: 300 + jitter() },
        rotation: 0,
        snappedTo: null,
      },
    ]);
  }, []);

  const handleUpdateLonePair = useCallback((id, updates) => {
    setLonePairs((prev) => prev.map((lp) => (lp.id === id ? { ...lp, ...updates } : lp)));
  }, []);

  const handleRemoveLonePair = useCallback((id) => {
    setLonePairs((prev) => prev.filter((lp) => lp.id !== id));
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">⬡</span>
        <h1 className="app-title">Lewis Grids</h1>
        {centralAtoms.length > 0 && (
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
                setCentralAtoms([]); setCards([]); setLonePairs([]);
              }}>Clear</button>
            )}
          </div>
        )}
      </header>

      <div className="app-body">
        <Palette
          mode={mode}
          onModeChange={handleModeChange}
          onSelectCentral={handleSelectCentral}
          onAddCard={handleAddCard}
          onAddLonePair={handleAddLonePair}
        />
        <Workspace
          centralAtoms={centralAtoms}
          cards={cards}
          lonePairs={lonePairs}
          onUpdateCentralAtom={handleUpdateCentralAtom}
          onUpdateCard={handleUpdateCard}
          onRemoveCard={handleRemoveCard}
          onUpdateLonePair={handleUpdateLonePair}
          onRemoveLonePair={handleRemoveLonePair}
        />
      </div>
    </div>
  );
}

function shapeLabel(n) {
  return { 2: 'Linear', 3: 'Triangle', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon' }[n] || `${n}-gon`;
}

function getSpawnPosition(existingCount) {
  // Spread central atoms across the canvas
  const positions = [
    { x: 420, y: 310 },
    { x: 660, y: 310 },
    { x: 180, y: 310 },
    { x: 420, y: 510 },
    { x: 660, y: 510 },
    { x: 180, y: 510 },
  ];
  return positions[existingCount % positions.length];
}
