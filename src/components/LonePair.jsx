import './LonePair.css';

export const LONE_PAIR_W = 44;
export const LONE_PAIR_H = 24;

/**
 * Draggable lone-pair tile: two side-by-side circles.
 * When snapped, it's rotated to lie along the target card edge.
 */
export default function LonePair({ lp, isDragging, isSnapping, onPointerDown, onRemove }) {
  const { position, rotation = 0 } = lp;

  return (
    <div
      className={`lone-pair-tile ${isDragging ? 'dragging' : ''} ${isSnapping ? 'snapped' : ''}`}
      style={{
        left:      position.x - LONE_PAIR_W / 2,
        top:       position.y - LONE_PAIR_H / 2,
        width:     LONE_PAIR_W,
        height:    LONE_PAIR_H,
        transform: `rotate(${rotation}deg)`,
      }}
      onPointerDown={onPointerDown}
    >
      <div className="lp-dot" />
      <div className="lp-dot" />

      {!isSnapping && (
        <button
          className="lp-remove"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >×</button>
      )}
    </div>
  );
}
