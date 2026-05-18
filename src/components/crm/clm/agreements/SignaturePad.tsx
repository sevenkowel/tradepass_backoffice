"use client";

/**
 * SignaturePad — handwritten-signature capture on a `<canvas>`.
 *
 * Captures pointer events (mouse + touch + stylus through PointerEvent)
 * and renders a smooth ink-stroke. On `getDataURL()` it serialises the
 * canvas to a base64 PNG that callers can persist alongside the
 * SignatureRecord audit row.
 *
 * Implementation notes:
 *   - The canvas backing-store is sized for `devicePixelRatio` so strokes
 *     stay crisp on high-DPI screens. The CSS size stays fixed for layout.
 *   - `useImperativeHandle` exposes `getDataURL` and `clear` so the parent
 *     drawer can drive submit / reset without juggling state in this file.
 *   - `onChange(empty)` fires once the first stroke lands and once the
 *     pad is cleared, so the parent can disable / enable Sign accordingly.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SignaturePadHandle {
  /** Returns the captured signature as a base64 PNG, or null if blank. */
  getDataURL: () => string | null;
  /** Wipes the canvas and emits `onChange(true)`. */
  clear: () => void;
  /** True if no strokes have been drawn yet. */
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
  /** Stroke colour. Defaults to slate-900. */
  ink?: string;
  /** Fires whenever the empty state changes. */
  onChange?: (empty: boolean) => void;
  className?: string;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    { width = 480, height = 160, ink = "#0f172a", onChange, className },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const [empty, setEmpty] = useState(true);

    // Size the canvas for devicePixelRatio. Re-runs only on mount + size
    // change because the parent CSS size is fixed.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = ink;
    }, [width, height, ink]);

    const announce = (next: boolean) => {
      if (next === empty) return;
      setEmpty(next);
      onChange?.(next);
    };

    const getPos = (
      ev: React.PointerEvent<HTMLCanvasElement>
    ): { x: number; y: number } => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
      };
    };

    const handlePointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
      ev.preventDefault();
      canvasRef.current?.setPointerCapture(ev.pointerId);
      isDrawingRef.current = true;
      lastPointRef.current = getPos(ev);
    };

    const handlePointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx || !lastPointRef.current) return;
      const next = getPos(ev);
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
      lastPointRef.current = next;
      if (empty) announce(false);
    };

    const handlePointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      lastPointRef.current = null;
      canvasRef.current?.releasePointerCapture(ev.pointerId);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      announce(true);
    };

    useImperativeHandle(
      ref,
      () => ({
        getDataURL: () => {
          if (empty) return null;
          return canvasRef.current?.toDataURL("image/png") ?? null;
        },
        clear: handleClear,
        isEmpty: () => empty,
      }),
      [empty]
    );

    return (
      <div className={cn("inline-block", className)}>
        <div className="relative bg-white border border-slate-300 rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            style={{ width, height, touchAction: "none" }}
            className="block cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          {empty && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-300 pointer-events-none select-none">
              Sign here
            </p>
          )}
          {/* Baseline guide — subtle dashed line so users align their signature. */}
          <span
            aria-hidden
            className="absolute left-3 right-3 bottom-6 border-t border-dashed border-slate-200 pointer-events-none"
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <p className="text-[10px] text-slate-400">
            Use mouse, finger, or stylus
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 hover:underline"
          >
            <Eraser className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>
    );
  }
);
