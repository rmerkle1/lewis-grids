import { CENTRAL_ATOM_CATEGORIES, OUTER_ATOM_GROUPS } from '../data/atoms';
import './Palette.css';

export default function Palette({ mode, onModeChange, onSelectCentral, onAddCard }) {
  return (
    <aside className="palette" onClick={(e) => e.stopPropagation()}>
      {/* ── Central atoms ──────────────────────────────────── */}
      <section className="palette-section">
        <div className="central-header">
          <h3 className="palette-heading">Central Atom</h3>
          <div className="mode-toggle" role="group" aria-label="Atom mode">
            <button
              className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
              onClick={() => onModeChange('single')}
              title="Only one central atom at a time"
            >Single</button>
            <button
              className={`mode-btn ${mode === 'multiple' ? 'active' : ''}`}
              onClick={() => onModeChange('multiple')}
              title="Multiple central atoms"
            >Multiple</button>
          </div>
        </div>
        <p className="palette-hint">Click to add · drag slider to adjust shape</p>

        <div className="central-atom-grid">
          {CENTRAL_ATOM_CATEGORIES.map((cat) => (
            <div key={cat.label} className="ca-category">
              <div className="ca-size-label">{cat.label}</div>
              <div className="ca-category-atoms">
                {cat.atoms.map((group) => (
                  <button
                    key={group.element}
                    className="central-atom-btn"
                    title={group.description}
                    onClick={() => onSelectCentral(group)}
                    style={{ '--ca-color': group.color, gridColumn: group.col }}
                  >
                    <span className="ca-btn-symbol" style={{ color: group.color }}>
                      {group.element}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="palette-divider" />

      {/* ── Outer atoms ────────────────────────────────────── */}
      <section className="palette-section">
        <h3 className="palette-heading">Outer Atoms</h3>
        <p className="palette-hint">Click to add · use ⇄ on card to shuffle</p>
        <div className="outer-atom-grid">
          {OUTER_ATOM_GROUPS.map((grp) => (
            <button
              key={grp.element}
              className="outer-atom-btn"
              title={grp.description}
              onClick={() =>
                onAddCard({
                  element:      grp.element,
                  label:        grp.label,
                  color:        grp.color,
                  baseValence:  grp.baseValence,
                  electrons:    [...grp.arrangements[0].electrons],
                  arrangements: grp.arrangements,
                })
              }
              style={{
                color:       grp.color,
                borderColor: grp.color + '55',
                gridColumn:  grp.col,
                gridRow:     grp.row,
              }}
            >
              {grp.label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}
