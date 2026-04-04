import { getCardBondSquarePositions, BOND_SQUARE_SIZE, CARD_SIZE } from '../utils/geometry';
import './AtomCard.css';

/**
 * Draggable outer-atom card.
 * Has a single bonding edge (bottom at rotation=0) with bondOrder squares.
 * Non-bond edges are passive; the top edge is a lone-pair drop zone.
 */
export default function AtomCard({
  card,
  isDragging,
  isSnapping,
  onPointerDown,
  onRotateCW,
  onRotateCCW,
  onRemove,
}) {
  const { position, rotation, element, label, color, bondOrder, lonePairs = [] } = card;

  const left = position.x - CARD_SIZE / 2;
  const top  = position.y - CARD_SIZE / 2;

  // Bond squares on the bottom edge (edge index 2)
  const bondSquares = getCardBondSquarePositions(2, bondOrder);

  // Lone-pair dots: rendered at top edge (edge 0), centered
  const lonePairSlots = lonePairs.map((_, i) => ({
    x: CARD_SIZE / 2 - 10 + (i % 3) * 0 - (Math.min(lonePairs.length, 3) - 1) * 6,
    y: 4,
    index: i,
  }));

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
      {/* Element label */}
      <span className="atom-label">{label}</span>

      {/* Bond indicator squares on bottom edge */}
      {bondSquares.map((pos, i) => (
        <div
          key={i}
          className="bond-square"
          style={{ left: pos.x, top: pos.y, width: BOND_SQUARE_SIZE, height: BOND_SQUARE_SIZE }}
        />
      ))}

      {/* Lone pair circles on top edge */}
      {lonePairs.length > 0 &&
        lonePairs.map((_, i) => (
          <div key={i} className="lone-pair-group" style={{ top: 3, left: CARD_SIZE / 2 - 10 + i * 0 }}>
            <div className="lp-circle" />
            <div className="lp-circle" />
          </div>
        ))}

      {/* Lone-pair drop zone hint (top edge) — subtle */}
      <div className="lp-drop-zone" />

      {/* Controls (visible on hover) */}
      {!isSnapping && (
        <div className="card-controls">
          <button
            className="rotate-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRotateCCW(); }}
            title="Rotate CCW"
          >↺</button>
          <button
            className="rotate-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRotateCW(); }}
            title="Rotate CW"
          >↻</button>
          <button
            className="remove-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Remove"
          >×</button>
        </div>
      )}
    </div>
  );
}

function isLightColor(hex) {
  if (!hex) return false;
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
