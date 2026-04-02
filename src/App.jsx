import { useState, useCallback, useRef } from 'react';
import Workspace from './components/Workspace';
import Palette from './components/Palette';
import './App.css';

export default function App() {
  const [centralAtom, setCentralAtom] = useState(null);
  const [cards, setCards] = useState([]);
  const nextId = useRef(1);

  const handleSelectCentral = useCallback((atom) => {
    setCentralAtom(atom);
    setCards([]);
  }, []);

  const handleAddCard = useCallback((cardType) => {
    const jitter = () => (Math.random() - 0.5) * 80;
    setCards((prev) => [
      ...prev,
      {
        id: `card-${nextId.current++}`,
        type: cardType,
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
  }, []);

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
              {domainShapeName(centralAtom.domains)} · {centralAtom.domains} domains
            </span>
            <button className="btn-clear" onClick={() => handleSelectCentral(null)}>
              Clear
            </button>
          </div>
        )}
      </header>

      <div className="app-body">
        <Palette onSelectCentral={handleSelectCentral} onAddCard={handleAddCard} />
        <Workspace
          centralAtom={centralAtom}
          cards={cards}
          onUpdateCard={handleUpdateCard}
          onRemoveCard={handleRemoveCard}
        />
      </div>
    </div>
  );
}

function domainShapeName(n) {
  const names = { 2: 'Linear', 3: 'Triangle', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon' };
  return names[n] || `${n}-gon`;
}
