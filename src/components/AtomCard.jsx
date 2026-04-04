import { getCardBondSquarePositions, BOND_SQUARE_SIZE, CARD_SIZE } from '../utils/geometry';
import './AtomCard.css';

export default function AtomCard({
  card,
  isDragging,
  isSnapping,
  onPointerDown,
  onRotateCW,
  onRotateCCW,
  onRemove,
}) {
  const { position, rotation, label, color, bondOrder } = card;

  const left = position.x - CARD_SIZE / 2;
  const top  = position.y - CARD_SIZE / 2;

  // Bond squares on the bottom edge (edge 2), fully inside the card
  const bondSquares = getCardBondSquarePositions(2, bondOrder);

  return (
    <div
      className={`atom-card ${isDragging ? 'dragging' : ''} ${isSnapping ? 'snapped' : ''}`}
      style={{
        left,
        top,
        width: CARD_SIZE,
        height: CARD_SIZE,
        transform: `rotate(${rotation}deg)`,
        background: color || '#333',
        color: isLightColor(color) ? '#111' : '#fff',
      }}
      onPointerDown={onPointerDown}
    >
      <span className="atom-label">{label}</span>

      {/* Bond squares — inside, touching the bottom edge */}
      {bondSquares.map((pos, i) => (
        <div
          key={i}
          className="bond-square"
          style={{ left: pos.x, top: pos.y, width: BOND_SQUARE_SIZE, height: BOND_SQUARE_SIZE }}
        />
      ))}

      {/* Controls (shown on hover when not snapped) */}
      {!isSnapping && (
        <div className="card-controls">
          <button
            className="rotate-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRotateCCW(); }}
          >↺</button>
          <button
            className="rotate-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRotateCW(); }}
          >↻</button>
          <button
            className="remove-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >×</button>
        </div>
      )}
    </div>
  );
}

function isLightColor(hex) {
  if (!hex) return false;
  const c = hex.replace('#', '');
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 145;
}
