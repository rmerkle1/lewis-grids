import { useRef } from 'react';
import './AtomCard.css';

// Edge indices: 0=top, 1=right, 2=bottom, 3=left
const EDGE_NAMES = ['top', 'right', 'bottom', 'left'];

export const CARD_SIZE = 80;

export default function AtomCard({
  card,
  isDragging,
  isSnapping,
  onPointerDown,
  onRotateCW,
  onRotateCCW,
  onRemove,
}) {
  const { position, rotation, type } = card;
  const { label, color, activeEdges } = type;

  const left = position.x - CARD_SIZE / 2;
  const top = position.y - CARD_SIZE / 2;

  const borderStyles = {};
  EDGE_NAMES.forEach((name, idx) => {
    const isActive = activeEdges.includes(idx);
    borderStyles[`--border-${name}`] = isActive
      ? '3px solid #44aaff'
      : '1.5px solid rgba(255,255,255,0.2)';
  });

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
        ...borderStyles,
      }}
      onPointerDown={onPointerDown}
    >
      <span className="atom-label">{label}</span>

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

      {/* Active edge highlight overlays */}
      {EDGE_NAMES.map((name, idx) =>
        activeEdges.includes(idx) ? (
          <div key={name} className={`active-edge active-edge--${name}`} />
        ) : null
      )}
    </div>
  );
}
