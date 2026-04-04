import { useState, useCallback, useRef } from 'react';
import Workspace from './components/Workspace';
import Palette from './components/Palette';
import './App.css';

export default function App() {
  const [centralAtom, setCentralAtom] = useState(null);
  const [cards, setCards]             = useState([]);
  const [lonePairs, setLonePairs]     = useState([]);
  const nextId = useRef(1);

  const handleSelectCentral = useCallback((atom) => {
    setCentralAtom(atom);
    setCards([]);
    setLonePairs([]);
  }, []);

  // Add outer-atom card near workspace center with jitter
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
        lonePairs: [],
      },
    ]);
  }, []);

  // Add a free-floating lone pair
  const handleAddLonePair = useCallback(() => {
    const jitter = () => (Math.random() - 0.5) * 80;
    setLonePairs((prev) => [
      ...prev,
      {
        id: `lp-${nextId.current++}`,
        position: { x: 400 + jitter(), y: 300 + jitter() },
        snappedTo: null,
      },
    ]);
  }, []);

  const handleUpdateCard = useCallback((id, updates) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const handleRemoveCard = useCallback((id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleUpdateLonePair = useCallback((id, updates) => {
    setLonePairs((prev) => prev.map((lp) => (lp.id === id ? { ...lp, ...updates } : lp)));
  }, []);

  const handleRemoveLonePair = useCallback((id) => {
    setLonePairs((prev) => prev.filter((lp) => lp.id !== id));
  }, []);

  const shapeLabel = (n) =>
    ({ 2: 'Linear', 3: 'Triangle', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon' }[n] || `${n}-gon`);

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">⬡</span>
        <h1 className="app-title">Lewis Grids</h1>
        {centralAtom && (
          <div className="app-status">
            <span className="status-atom" style={{ color: centralAtom.color }}>
              {centralAtom.element}
            </span>
            <span className="status-shape">
              {shapeLabel(centralAtom.domains)} · {centralAtom.label}
            </span>
            <button className="btn-clear" onClick={() => handleSelectCentral(null)}>
              Clear
            </button>
          </div>
        )}
      </header>

      <div className="app-body">
        <Palette
          onSelectCentral={handleSelectCentral}
          onAddCard={handleAddCard}
          onAddLonePair={handleAddLonePair}
        />
        <Workspace
          centralAtom={centralAtom}
          cards={cards}
          lonePairs={lonePairs}
          onUpdateCard={handleUpdateCard}
          onRemoveCard={handleRemoveCard}
          onUpdateLonePair={handleUpdateLonePair}
          onRemoveLonePair={handleRemoveLonePair}
        />
      </div>
    </div>
  );
}
