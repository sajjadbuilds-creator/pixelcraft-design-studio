// ============================================================
// defaults.ts — factory helpers for every node type
// ============================================================
import { nanoid } from 'nanoid';
import type { AnyNode, Fill, Stroke, Shadow, Transform } from './types';

const defaultFill: Fill = { type: 'solid', color: '#5B8DEF', opacity: 1 };
const defaultStroke: Stroke = { color: '#1a1a2e', width: 0, opacity: 1 };
const defaultShadow: Shadow = {
  x: 0, y: 4, blur: 12, spread: 0, color: '#000000', opacity: 0.15, enabled: false
};
const defaultTransform = (x = 100, y = 100, w = 150, h = 100): Transform => ({
  x, y, width: w, height: h, rotation: 0, scaleX: 1, scaleY: 1,
});

function base(type: AnyNode['type'], name: string, t?: Partial<Transform>): AnyNode {
  return {
    id: nanoid(),
    type,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    transform: { ...defaultTransform(), ...t },
    fill: { ...defaultFill },
    stroke: { ...defaultStroke },
    shadow: { ...defaultShadow },
    cornerRadius: 0,
  } as AnyNode;
}

export function makeRect(x?: number, y?: number, w?: number, h?: number): AnyNode {
  return base('rectangle', 'Rectangle', { x, y, width: w, height: h });
}

export function makeEllipse(x?: number, y?: number, w?: number, h?: number): AnyNode {
  const n = base('ellipse', 'Ellipse', { x, y, width: w, height: h });
  n.fill = { type: 'solid', color: '#FF7E5F', opacity: 1 };
  return n;
}

export function makeLine(x?: number, y?: number, w?: number): AnyNode {
  const n = base('line', 'Line', { x, y, width: w ?? 150, height: 2 });
  n.fill = { type: 'none', color: 'transparent', opacity: 0 };
  n.stroke = { color: '#1a1a2e', width: 2, opacity: 1 };
  return n;
}

export function makeText(x?: number, y?: number): AnyNode {
  const n = base('text', 'Text', { x, y, width: 200, height: 40 }) as any;
  n.content = 'Double-click to edit';
  n.fontSize = 18;
  n.fontFamily = 'Inter, sans-serif';
  n.fontWeight = '400';
  n.textAlign = 'left';
  n.color = '#1a1a2e';
  n.fill = { type: 'none', color: 'transparent', opacity: 0 };
  return n;
}

export function makePath(): AnyNode {
  const n = base('path', 'Path');
  (n as any).points = [];
  (n as any).closed = false;
  n.fill = { type: 'none', color: 'transparent', opacity: 0 };
  n.stroke = { color: '#5B8DEF', width: 2, opacity: 1 };
  return n;
}

export function makeGroup(children: string[]): AnyNode {
  const n = base('group', 'Group');
  n.children = children;
  n.fill = { type: 'none', color: 'transparent', opacity: 0 };
  n.stroke = { color: 'transparent', width: 0, opacity: 0 };
  return n;
}
