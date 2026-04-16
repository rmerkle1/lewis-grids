import { EN, EN_MIN, EN_MAX, enToColor } from '../utils/overlays';
import './LayerControls.css';

const LAYERS = [
  { id: 'en',    label: 'Electronegativity' },
  { id: 'fc',    label: 'Formal Charge'     },
  { id: 'octet', label: 'Octet Rule'        },
];

// Elements to label on the EN scale, sorted low→high EN (left→right on bar)
const EN_LABELS = ['Be', 'Si', 'As', 'B', 'H', 'P', 'Se', 'C', 'S', 'I', 'Xe', 'Br', 'N', 'Cl', 'O', 'F'];

function ENLegend() {
  return (
    <div className="en-legend">
      <div className="en-bar" />
      <div className="en-ticks">
        {EN_LABELS.map((el) => {
          const en  = EN[el];
          const pct = ((en - EN_MIN) / (EN_MAX - EN_MIN)) * 100;
          return (
            <div key={el} className="en-tick" style={{ left: `${pct}%` }}>
              <div className="en-tick-line" />
              <span className="en-tick-label" style={{ color: enToColor(el) }}>{el}</span>
            </div>
          );
        })}
      </div>
      <div className="en-range">
        <span style={{ color: enToColor('Be') }}>Low EN ({EN_MIN.toFixed(1)})</span>
        <span style={{ color: enToColor('F') }}>High EN ({EN_MAX.toFixed(1)})</span>
      </div>
    </div>
  );
}

export default function LayerControls({ activeOverlay, onToggle, show2D, onToggle2D, show3D, onToggle3D, disable3D }) {
  return (
    <div className="layer-controls" onClick={(e) => e.stopPropagation()}>
      <div className="layer-controls-row">
        <span className="layer-controls-label">Layers</span>
        {LAYERS.map((layer) => (
          <button
            key={layer.id}
            className={`layer-btn${activeOverlay === layer.id ? ' active' : ''}`}
            onClick={() => onToggle(layer.id)}
            title={`Toggle ${layer.label} overlay`}
          >
            {layer.label}
          </button>
        ))}
        <div className="layer-divider" />
        <button
          className={`layer-btn layer-btn--3d${show2D ? ' active' : ''}`}
          onClick={onToggle2D}
          title="Toggle 2D Lewis structure view"
        >
          2D
        </button>
        <button
          className={`layer-btn layer-btn--3d${show3D && !disable3D ? ' active' : ''}`}
          onClick={onToggle3D}
          disabled={disable3D}
          title={disable3D ? '3D view is only available for single central atom' : 'Toggle 3D view'}
        >
          3D
        </button>
      </div>

      {activeOverlay === 'en' && <ENLegend />}
    </div>
  );
}
