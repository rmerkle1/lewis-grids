import { useState } from 'react';
import { CENTRAL_ATOM_GROUPS, OUTER_ATOM_GROUPS } from '../data/atoms';
import ConfigPreview from './ConfigPreview';
import './Palette.css';

const BOND_LABEL = { 1: '×1', 2: '×2', 3: '×3' };

export default function Palette({ onSelectCentral, onAddCard, onAddLonePair }) {
  const [expandedElement, setExpandedElement] = useState(null);

  return (
    <aside className="palette">
      {/* ── Central atoms ──────────────────────────────────────── */}
      <section className="palette-section">
        <h3 className="palette-heading">Central Atom</h3>
        <p className="palette-hint">Choose element then configuration</p>

        {CENTRAL_ATOM_GROUPS.map((group) => (
          <div key={group.element} className="central-group">
            <button
              className="central-toggle"
              style={{ borderLeft: `4px solid ${group.color}` }}
              onClick={() =>
                setExpandedElement((p) => (p === group.element ? null : group.element))
              }
            >
              <span className="ca-symbol" style={{ color: group.color }}>{group.element}</span>
              <span className="ca-name">{group.description}</span>
              <span className="ca-chevron">{expandedElement === group.element ? '▲' : '▼'}</span>
            </button>

            {expandedElement === group.element && (
              <div className="config-list">
                {group.configurations.map((cfg) => (
                  <button
                    key={cfg.id}
                    className="config-btn"
                    onClick={() =>
                      onSelectCentral({
                        element: group.element,
                        color: group.color,
                        domains: cfg.domains,
                        bondPattern: cfg.bondPattern,
                        label: cfg.label,
                      })
                    }
                  >
                    <ConfigPreview
                      domains={cfg.domains}
                      bondPattern={cfg.bondPattern}
                      color={group.color}
                    />
                    <div className="config-text">
                      <span className="config-label">{cfg.label}</span>
                      <span className="config-hint">{cfg.hint}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      <div className="palette-divider" />

      {/* ── Outer atoms ────────────────────────────────────────── */}
      <section className="palette-section">
        <h3 className="palette-heading">Outer Atoms</h3>
        <p className="palette-hint">Click bond-order to add</p>

        <div className="outer-atom-list">
          {OUTER_ATOM_GROUPS.map((grp) => (
            <div key={grp.element} className="outer-atom-row">
              <span
                className="outer-symbol"
                style={{
                  color: isLightColor(grp.color) ? '#111' : grp.color,
                  background: isLightColor(grp.color) ? grp.color : 'transparent',
                }}
              >
                {grp.label}
              </span>
              <div className="bond-order-btns">
                {grp.bondOrders.map((order) => (
                  <button
                    key={order}
                    className="bond-order-btn"
                    title={`${grp.description} – ${orderName(order)} bond`}
                    onClick={() =>
                      onAddCard({
                        element: grp.element,
                        label: grp.label,
                        color: grp.color,
                        bondOrder: order,
                      })
                    }
                  >
                    {BOND_LABEL[order]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="palette-divider" />

      {/* ── Lone pairs ─────────────────────────────────────────── */}
      <section className="palette-section">
        <h3 className="palette-heading">Lone Pairs</h3>
        <p className="palette-hint">Drag onto atom top edge</p>
        <button className="lone-pair-spawn-btn" onClick={onAddLonePair}>
          <span className="lp-dot-preview" />
          <span className="lp-dot-preview" />
          <span className="lp-spawn-label">Add lone pair</span>
        </button>
      </section>
    </aside>
  );
}

function orderName(n) {
  return ['', 'single', 'double', 'triple'][n] || `${n}×`;
}

function isLightColor(hex) {
  if (!hex || hex === 'transparent') return false;
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}
