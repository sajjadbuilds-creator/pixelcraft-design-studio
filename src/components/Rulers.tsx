// ============================================================
// Rulers.tsx — Top and Left Canvas Rulers
// Displays dynamic coordinates matching viewport zoom & pan
// ============================================================
import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';

interface RulersProps {
  cursorCoords: { x: number; y: number };
}

export const Rulers: React.FC<RulersProps> = ({ cursorCoords }) => {
  const topCanvasRef = useRef<HTMLCanvasElement>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const { viewport, showRulers } = useEditorStore();

  useEffect(() => {
    if (!showRulers) return;

    // Draw Top Ruler
    const topCanvas = topCanvasRef.current;
    if (topCanvas) {
      topCanvas.width = topCanvas.offsetWidth * window.devicePixelRatio;
      topCanvas.height = topCanvas.offsetHeight * window.devicePixelRatio;
      const ctx = topCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        const width = topCanvas.offsetWidth;
        const height = topCanvas.offsetHeight;

        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#3b3e52';
        ctx.fillStyle = '#7a7f9a';
        ctx.font = '9px Inter, sans-serif';

        const step = viewport.zoom < 0.5 ? 200 : viewport.zoom < 1 ? 100 : 50;
        const startX = Math.floor((-viewport.panX / viewport.zoom) / step) * step;
        const endX = startX + (width / viewport.zoom) + step;

        for (let x = startX; x <= endX; x += step) {
          const sx = x * viewport.zoom + viewport.panX;
          if (sx < 0 || sx > width) continue;

          ctx.beginPath();
          ctx.moveTo(sx, height - 8);
          ctx.lineTo(sx, height);
          ctx.stroke();

          ctx.fillText(String(x), sx + 2, 10);
        }

        // Draw cursor tick
        const cursorScreenX = cursorCoords.x * viewport.zoom + viewport.panX;
        if (cursorScreenX >= 0 && cursorScreenX <= width) {
          ctx.strokeStyle = '#5B8DEF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cursorScreenX, 0);
          ctx.lineTo(cursorScreenX, height);
          ctx.stroke();
        }
      }
    }

    // Draw Left Ruler
    const leftCanvas = leftCanvasRef.current;
    if (leftCanvas) {
      leftCanvas.width = leftCanvas.offsetWidth * window.devicePixelRatio;
      leftCanvas.height = leftCanvas.offsetHeight * window.devicePixelRatio;
      const ctx = leftCanvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        const width = leftCanvas.offsetWidth;
        const height = leftCanvas.offsetHeight;

        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#3b3e52';
        ctx.fillStyle = '#7a7f9a';
        ctx.font = '9px Inter, sans-serif';

        const step = viewport.zoom < 0.5 ? 200 : viewport.zoom < 1 ? 100 : 50;
        const startY = Math.floor((-viewport.panY / viewport.zoom) / step) * step;
        const endY = startY + (height / viewport.zoom) + step;

        for (let y = startY; y <= endY; y += step) {
          const sy = y * viewport.zoom + viewport.panY;
          if (sy < 0 || sy > height) continue;

          ctx.beginPath();
          ctx.moveTo(width - 8, sy);
          ctx.lineTo(width, sy);
          ctx.stroke();

          ctx.save();
          ctx.translate(10, sy + 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(String(y), 0, 0);
          ctx.restore();
        }

        // Draw cursor tick
        const cursorScreenY = cursorCoords.y * viewport.zoom + viewport.panY;
        if (cursorScreenY >= 0 && cursorScreenY <= height) {
          ctx.strokeStyle = '#5B8DEF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, cursorScreenY);
          ctx.lineTo(width, cursorScreenY);
          ctx.stroke();
        }
      }
    }
  }, [viewport, showRulers, cursorCoords]);

  if (!showRulers) return null;

  return (
    <>
      <div className="ruler-corner" />
      <canvas ref={topCanvasRef} className="ruler-top" />
      <canvas ref={leftCanvasRef} className="ruler-left" />
    </>
  );
};
