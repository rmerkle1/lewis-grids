import { getEdgeElectronPositions, BOND_SQUARE_SIZE, CARD_SIZE } from '../utils/geometry';
import { getReactiveEdges, getFormalCharge } from '../data/atoms';
import { enToColor, outerOctetCount } from '../utils/overlays';
import './AtomCard.css';

export default function AtomCard({
  card,
  isDragging,
  isSnapping,
  isSelected,
  activeOverlay,
  onPointerDown,
  onRotateCW,
  onRotateCCW,
  onRemove,
  onSelect,
  onShuffle,
}) {
  const { position, rotation, label, element, color, electrons, baseValence, arrangements } = card;

  const left = position.x - CARD_SIZE / 2;
  const top  = position.y - CARD_SIZE / 2;

  const bondOrder     = card.snappedEdge?.bondOrder ?? 0;
  const reactiveEdges = getReactiveEdges(electrons, baseValence, isSnapping, bondOrder);
  const formalCharge  = getFormalCharge(electrons, baseValence);
  const canShuffle    = !isSnapping && arrangements && arrangements.length > 1;

  // Octet: count lone-pair electrons + 2×bondOrder (both bond electrons credited to this atom).
  // Check strictly === 8. H (duet target=2) can never reach 8 → always ✗.
  const octetCount     = outerOctetCount(electrons, isSnapping, bondOrder);
  const octetSatisfied = octetCount === 8;

  const showBlurredLabel = activeOverlay === 'fc' || activeOverlay === 'octet';
  const cardBg = activeOverlay === 'en' ? enToColor(element || label) : (color || '#4f5b6f');

  return (
    <div
      className={[
        'atom-card',
        isDragging ? 'dragging'  : '',
        isSnapping  ? 'snapped'  : '',
        isSelected  ? 'selected' : '',
        formalCharge > 0 ? 'charge-pos' : formalCharge < 0 ? 'charge-neg' : '',
      ].filter(Boolean).join(' ')}
      style={{
        left,
        top,
        width:     CARD_SIZE,
        height:    CARD_SIZE,
        transform: `rotate(${rotation}deg)`,
        background: cardBg,
        '--atom-color': color || '#4f5b6f',
      }}
      onPointerDown={onPointerDown}
      onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
    >
      {/* Element label — blurred when an overlay is active */}
      <span
        className={`atom-label${showBlurredLabel ? ' label-blurred' : ''}`}
        style={{ transform: `rotate(${-rotation}deg)` }}
      >
        {label}
      </span>

      {/* Formal charge overlay */}
      {activeOverlay === 'fc' && (
        <span
          className={`overlay-value fc-value ${formalCharge > 0 ? 'fc-pos' : formalCharge < 0 ? 'fc-neg' : 'fc-zero'}`}
          style={{ transform: `rotate(${-rotation}deg)` }}
        >
          {formalCharge === 0 ? '0' : formalCharge > 0 ? `+${formalCharge}` : `${formalCharge}`}
        </span>
      )}

      {/* Octet rule overlay */}
      {activeOverlay === 'octet' && (
        <span
          className={`overlay-value octet-value ${octetSatisfied ? 'octet-ok' : 'octet-fail'}`}
          style={{ transform: `rotate(${-rotation}deg)` }}
        >
          {octetSatisfied ? '✓' : '✗'}
        </span>
      )}

      {/* Electron squares — all 4 edges */}
      {electrons.map((count, edgeIndex) => {
        if (count === 0) return null;
        if (edgeIndex === 2 && isSnapping) return null;
        const positions = getEdgeElectronPositions(edgeIndex, count);
        const edgeClass =
          edgeIndex === 2 && isSnapping   ? 'bonded' :
          reactiveEdges.has(edgeIndex)    ? 'reactive' :
          '';
        return positions.map((pos, i) => (
          <div
            key={`e-${edgeIndex}-${i}`}
            className={`electron-sq ${edgeClass}`}
            style={{
              left:   pos.x,
              top:    pos.y,
              width:  BOND_SQUARE_SIZE,
              height: BOND_SQUARE_SIZE,
            }}
          />
        ));
      })}

      {/* Controls — shown on hover when not snapped */}
      {!isSnapping && (
        <div className="card-controls">
          {canShuffle && (
            <button
              className="ctrl-btn"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onShuffle?.(); }}
              title="Shuffle electron arrangement"
            >⇄</button>
          )}
          <button
            className="ctrl-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRotateCCW(); }}
          >↺</button>
          <button
            className="ctrl-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRotateCW(); }}
          >↻</button>
          <button
            className="ctrl-btn ctrl-btn--remove"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >×</button>
        </div>
      )}
    </div>
  );
}
