import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import PolygonAtom from './PolygonAtom';
import AtomCard, { CARD_SIZE } from './AtomCard';
import {
  getPolygonVertices,
  getEdgeMidpoints,
  dist,
  getCardActiveEdgeMidpoint,
} from '../utils/geometry';
import './Workspace.css';

const POLYGON_RADIUS = 64;
const SNAP_THRESHOLD = 80;

export default function Workspace({ centralAtom, cards, onUpdateCard, onRemoveCard }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [dragState, setDragState] = useState(null);
  const [snapHoverEdge, setSnapHoverEdge] = useState(null);

  // Track container size via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const cx = size.w / 2;
  const cy = size.h / 2;

  // Compute polygon edge midpoints whenever centralAtom or canvas size changes
  const edgeMidpoints = useMemo(() => {
    if (!centralAtom) return [];
    const verts = getPolygonVertices(cx, cy, POLYGON_RADIUS, centralAtom.domains);
    return getEdgeMidpoints(cx, cy, verts);
  }, [centralAtom, cx, cy]);

  const occupiedEdges = useMemo(
    () => cards.filter((c) => c.snappedEdge !== null).map((c) => c.snappedEdge),
    [cards]
  );

  // Find the nearest snappable edge for a card at given pos/rotation
  const findSnapEdge = useCallback(
    (cardId, pos, rotation) => {
      if (!edgeMidpoints.length) return null;
      const edgePt = getCardActiveEdgeMidpoint(pos.x, pos.y, rotation, CARD_SIZE);
      let best = null;
      let bestD = SNAP_THRESHOLD;
      for (const edge of edgeMidpoints) {
        if (cards.some((c) => c.id !== cardId && c.snappedEdge === edge.edgeIndex)) continue;
        const d = dist(edgePt.x, edgePt.y, edge.x, edge.y);
        if (d < bestD) {
          bestD = d;
          best = edge;
        }
      }
      return best;
    },
    [edgeMidpoints, cards]
  );

  // Compute the snapped card position from an edge
  const snapPositionFromEdge = useCallback((edge) => {
    return {
      x: edge.x + (CARD_SIZE / 2) * Math.cos(edge.angle),
      y: edge.y + (CARD_SIZE / 2) * Math.sin(edge.angle),
      rotDeg: (edge.angle * 180) / Math.PI + 90,
    };
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleCardPointerDown = useCallback(
    (e, cardId) => {
      e.preventDefault();
      e.stopPropagation();
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;

      const rect = containerRef.current.getBoundingClientRect();
      setDragState({
        cardId,
        offsetX: e.clientX - rect.left - card.position.x,
        offsetY: e.clientY - rect.top - card.position.y,
      });

      if (card.snappedEdge !== null) {
        onUpdateCard(cardId, { snappedEdge: null });
      }

      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [cards, onUpdateCard]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragState) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPos = {
        x: e.clientX - rect.left - dragState.offsetX,
        y: e.clientY - rect.top - dragState.offsetY,
      };
      onUpdateCard(dragState.cardId, { position: newPos, snappedEdge: null });

      // Preview nearest snap edge
      const card = cards.find((c) => c.id === dragState.cardId);
      const rotation = card?.rotation ?? 0;
      const snapEdge = findSnapEdge(dragState.cardId, newPos, rotation);
      setSnapHoverEdge(snapEdge ? snapEdge.edgeIndex : null);
    },
    [dragState, cards, findSnapEdge, onUpdateCard]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!dragState) return;
      const card = cards.find((c) => c.id === dragState.cardId);
      if (card) {
        const snapEdge = findSnapEdge(dragState.cardId, card.position, card.rotation);
        if (snapEdge) {
          const { x, y, rotDeg } = snapPositionFromEdge(snapEdge);
          onUpdateCard(dragState.cardId, {
            position: { x, y },
            rotation: rotDeg,
            snappedEdge: snapEdge.edgeIndex,
          });
        }
      }
      setDragState(null);
      setSnapHoverEdge(null);
    },
    [dragState, cards, findSnapEdge, snapPositionFromEdge, onUpdateCard]
  );

  const handleRotate = useCallback(
    (cardId, deltaDeg) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.snappedEdge !== null) return;
      onUpdateCard(cardId, { rotation: (card.rotation + deltaDeg + 360) % 360 });
    },
    [cards, onUpdateCard]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="workspace-container" ref={containerRef}>
      {/* SVG: polygon, snap guides, bond indicators */}
      <svg
        className="workspace-svg"
        width={size.w}
        height={size.h}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <DotGrid width={size.w} height={size.h} />

        {/* Faint bond lines from polygon center to snapped card positions */}
        {centralAtom &&
          cards
            .filter((c) => c.snappedEdge !== null)
            .map((c) => (
              <line
                key={c.id}
                x1={cx}
                y1={cy}
                x2={c.position.x}
                y2={c.position.y}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
            ))}

        {centralAtom ? (
          <PolygonAtom
            cx={cx}
            cy={cy}
            n={centralAtom.domains}
            element={centralAtom.element}
            color={centralAtom.color}
            occupiedEdges={occupiedEdges}
            snapHoverEdge={snapHoverEdge}
          />
        ) : (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.15)"
            fontSize="15"
            fontFamily="sans-serif"
          >
            ← Select a central atom to begin
          </text>
        )}
      </svg>

      {/* Draggable atom cards */}
      <div
        className="workspace-cards"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      >
        {cards.map((card) => (
          <AtomCard
            key={card.id}
            card={card}
            isDragging={dragState?.cardId === card.id}
            isSnapping={card.snappedEdge !== null}
            onPointerDown={(e) => handleCardPointerDown(e, card.id)}
            onRotateCW={() => handleRotate(card.id, 90)}
            onRotateCCW={() => handleRotate(card.id, -90)}
            onRemove={() => onRemoveCard(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Subtle dot-grid background rendered in SVG
function DotGrid({ width, height }) {
  const spacing = 40;
  const dots = [];
  for (let x = spacing; x < width; x += spacing) {
    for (let y = spacing; y < height; y += spacing) {
      dots.push(
        <circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill="rgba(255,255,255,0.055)" />
      );
    }
  }
  return <g>{dots}</g>;
}
