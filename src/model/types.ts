// ============================================================
// Document Model — the spine of the whole app
// Every node: Document → Page → Frame → Shape
// ============================================================

export type NodeType =
  | 'document'
  | 'page'
  | 'frame'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'text'
  | 'path'
  | 'group';

export interface Transform {
  x: number;       // canvas-space x of the node origin
  y: number;       // canvas-space y
  width: number;
  height: number;
  rotation: number; // degrees, clockwise
  scaleX: number;
  scaleY: number;
}

export interface Fill {
  type: 'solid' | 'none';
  color: string;   // hex e.g. '#ff0000'
  opacity: number; // 0-1
}

export interface Stroke {
  color: string;
  width: number;
  opacity: number;
}

export interface Shadow {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  enabled: boolean;
}

export interface PathPoint {
  x: number;
  y: number;
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface BaseNode {
  id: string;
  type: NodeType;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;  // 0–1, composited
  transform: Transform;
  fill: Fill;
  stroke: Stroke;
  shadow: Shadow;
  cornerRadius: number;
  children?: string[]; // IDs of children (for group/frame)
  parentId?: string;
}

export interface TextNode extends BaseNode {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  color: string;
}

export interface PathNode extends BaseNode {
  type: 'path';
  points: PathPoint[];
  closed: boolean;
}

export type AnyNode = BaseNode | TextNode | PathNode;

// Flat map of all nodes — fast O(1) lookup
export interface Document {
  id: string;
  name: string;
  pages: string[];        // page IDs
  nodes: Record<string, AnyNode>;
  activePageId: string;
}
