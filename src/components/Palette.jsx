import { useState } from 'react';
import { CENTRAL_ATOM_CONFIGS, ATOM_CARDS } from '../data/atoms';
import './Palette.css';

export default function Palette({ onSelectCentral, onAddCard }) {
  const [expandedElement, setExpandedElement] = useState(null);

  return (
    <aside className="palette">
      <section className="palette-section">
        <h3 className="palette-heading">Central Atom</h3>
        <p className="palette-hint">Choose element & shape</p>
        {CENTRAL_ATOM_CONFIGS.map((config) => (
          <div key={config.element} className="central-atom-group">
            <button
              className="central-atom-toggle"
              style={{ borderLeft: `4px solid ${config.color}` }}
              onClick={() =>
                setExpandedElement((prev) =>
                  prev === config.element ? null : config.element
                )
              }
            >
              <span className="ca-symbol" style={{ color: config.color }}>
                {config.element}
              </span>
              <span className="ca-name">{config.description}</span>
              <span className="ca-chevron">
                {expandedElement === config.element ? '▲' : '▼'}
              </span>
            </button>

            {expandedElement === config.element && (
              <div className="domain-options">
                {config.domains.map((n) => (
                  <button
                    key={n}
                    className="domain-btn"
                    onClick={() =>
                      onSelectCentral({ element: config.element, domains: n, color: config.color })
                    }
                  >
                    {domainShapeName(n)} ({n} domains)
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="palette-divider" />

      <section className="palette-section">
        <h3 className="palette-heading">Atoms</h3>
        <p className="palette-hint">Click to add to workspace</p>
        <div className="atom-card-grid">
          {ATOM_CARDS.map((cardType) => (
            <button
              key={cardType.id}
              className="palette-card"
              style={{ background: cardType.color }}
              onClick={() => onAddCard(cardType)}
              title={cardType.description}
            >
              {cardType.label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

function domainShapeName(n) {
  const names = { 2: 'Linear', 3: 'Triangle', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon' };
  return names[n] || `${n}-gon`;
}
