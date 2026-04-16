import { getFormalCharge, addElectron, removeElectron } from '../data/atoms';
import './AtomEditor.css';

export default function AtomEditor({ card, onUpdate, onClose }) {
  if (!card) return null;

  const { electrons, baseValence, element, label, color } = card;
  const formalCharge = getFormalCharge(electrons, baseValence);
  const total = electrons.reduce((a, b) => a + b, 0);

  const handleAdd = () => {
    if (total >= 8) return;
    onUpdate(card.id, { electrons: addElectron(electrons) });
  };

  const handleRemove = () => {
    if (total <= 0) return;
    onUpdate(card.id, { electrons: removeElectron(electrons) });
  };

  const chargeLabel = formalCharge === 0 ? 'neutral'
    : formalCharge > 0 ? `+${formalCharge} (cation)`
    : `${formalCharge} (anion)`;

  return (
    <div className="atom-editor" onClick={(e) => e.stopPropagation()}>
      <div className="ae-header">
        <span className="ae-symbol" style={{ color }}>{label}</span>
        <span className="ae-name">{element} — Electron Editor</span>
        <button className="ae-close" onClick={onClose}>×</button>
      </div>

      <div className="ae-body">
        {/* Charge display */}
        <div className={`ae-charge ${formalCharge > 0 ? 'pos' : formalCharge < 0 ? 'neg' : ''}`}>
          <span className="ae-charge-label">Formal charge:</span>
          <span className="ae-charge-value">{chargeLabel}</span>
        </div>

        {/* Electron count + ionize buttons */}
        <div className="ae-count-row">
          <button
            className="ae-ion-btn remove"
            onClick={handleRemove}
            disabled={total <= 0}
            title="Remove one electron (oxidize)"
          >− e⁻</button>

          <div className="ae-count">
            <span className="ae-count-num">{total}</span>
            <span className="ae-count-sub">electrons</span>
          </div>

          <button
            className="ae-ion-btn add"
            onClick={handleAdd}
            disabled={total >= 8}
            title="Add one electron (reduce)"
          >+ e⁻</button>
        </div>

      </div>
    </div>
  );
}
