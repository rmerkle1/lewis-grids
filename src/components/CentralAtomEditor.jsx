import './AtomEditor.css';
import './CentralAtomEditor.css';

const SHAPE_NAMES = { 2: 'Linear', 3: 'Trigonal', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon' };

const HYBRIDIZATION = {
  2: 'sp',
  3: 'sp²',
  4: 'sp³',
  5: 'sp³d',
  6: 'sp³d²',
};

export default function CentralAtomEditor({ centralAtom, onUpdate, onClose }) {
  if (!centralAtom) return null;

  const { id, element, color, formalCharge = 0, domains, maxDomains = 6, baseValence } = centralAtom;

  const chargeLabel = formalCharge === 0 ? 'neutral'
    : formalCharge > 0 ? `+${formalCharge} (cation)`
    : `${formalCharge} (anion)`;

  const handleAdd    = () => onUpdate(id, { formalCharge: formalCharge - 1 });
  const handleRemove = () => onUpdate(id, { formalCharge: formalCharge + 1 });

  const effectiveDomains = Math.max(2, Math.min(domains, maxDomains));

  return (
    <div className="atom-editor" onClick={(e) => e.stopPropagation()}>
      <div className="ae-header">
        <span className="ae-symbol" style={{ color }}>{element}</span>
        <span className="ae-name">{element} — Shape &amp; Charge</span>
        <button className="ae-close" onClick={onClose}>×</button>
      </div>

      <div className="ae-body">
        {/* Domain slider */}
        <div className="ae-domain-section">
          <div className="ae-domain-label-row">
            <span className="ae-charge-label">Shape</span>
            <span className="ae-domain-shape">{SHAPE_NAMES[effectiveDomains] ?? `${effectiveDomains}-gon`}</span>
            <span className="ae-domain-count">{effectiveDomains} domains</span>
          </div>
          <div className="ae-slider-row">
            <span className="ae-slider-tick">2</span>
            <input
              type="range"
              className="ae-domain-slider"
              min={2}
              max={maxDomains}
              value={effectiveDomains}
              onChange={(e) => onUpdate(id, { domains: parseInt(e.target.value) })}
            />
            <span className="ae-slider-tick">{maxDomains}</span>
          </div>
          <div className="ae-hybridization-row">
            <span
              className="ae-hybridization"
              style={{
                left: `calc(${((effectiveDomains - 2) / Math.max(1, maxDomains - 2)) * 100}% - 20px)`,
              }}
            >
              {HYBRIDIZATION[effectiveDomains]}
            </span>
          </div>
        </div>

        {/* Charge display */}
        <div className={`ae-charge ${formalCharge > 0 ? 'pos' : formalCharge < 0 ? 'neg' : ''}`}>
          <span className="ae-charge-label">Formal charge:</span>
          <span className="ae-charge-value">{chargeLabel}</span>
        </div>

        {/* Ionize buttons */}
        <div className="ae-count-row">
          <button
            className="ae-ion-btn remove"
            onClick={handleRemove}
            title="Remove one electron (oxidize)"
          >− e⁻</button>

          <div className="ae-count">
            <span className="ae-count-num">{formalCharge > 0 ? `+${formalCharge}` : formalCharge}</span>
            <span className="ae-count-sub">charge</span>
          </div>

          <button
            className="ae-ion-btn add"
            onClick={handleAdd}
            title="Add one electron (reduce)"
          >+ e⁻</button>
        </div>
      </div>
    </div>
  );
}
