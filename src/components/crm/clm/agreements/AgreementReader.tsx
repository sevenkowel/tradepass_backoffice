"use client";

/**
 * AgreementReader — renders an agreement body with reading-control gates.
 *
 * Two unlock conditions, AND-combined:
 *   1. `minReadSeconds` countdown — counts down only while the reader is
 *      mounted (we don't pause on tab-hide because the user could just
 *      stay on the tab; this matches what the production signing page does).
 *   2. `requireScrollToBottom` — fires when the inner scroll container
 *      reaches within 12 px of the bottom. Once tripped it stays unlocked
 *      so the user doesn't have to scroll back down after they see the
 *      sign panel re-render.
 *
 * The component emits `onUnlocked()` exactly once when both conditions
 * clear, and `onTimeUpdate(seconds)` continuously so the parent can
 * persist the elapsed-read-seconds onto the SignatureRecord.
 *
 * The body is rendered as preformatted text with a tiny Markdown-ish
 * heading rule (lines starting with `# ` / `## ` become bold). Real
 * agreements ship Markdown that we'd run through a sanitiser; the
 * preview pane is intentionally restrained.
 */

import { useEffect, useRef, useState } from "react";
import { Clock, ArrowDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReadingControls } from "@/types/clm";

interface Props {
  body: string;
  controls: ReadingControls;
  /** Optional language label shown in the reader's footer. */
  language?: string;
  /** Fires once when both gates clear. */
  onUnlocked?: () => void;
  /** Continuous tick of seconds the document has been on screen. */
  onTimeUpdate?: (seconds: number) => void;
  /** Continuous "did the user reach the bottom" signal. */
  onScrolledBottom?: (yes: boolean) => void;
  className?: string;
}

export function AgreementReader({
  body,
  controls,
  language,
  onUnlocked,
  onTimeUpdate,
  onScrolledBottom,
  className,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [seconds, setSeconds] = useState(0);
  const [scrolledBottom, setScrolledBottom] = useState(
    !controls.requireScrollToBottom
  );
  const unlockedRef = useRef(false);

  // Tick — increments every second while mounted.
  useEffect(() => {
    if (controls.minReadSeconds <= 0) return;
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [controls.minReadSeconds]);

  useEffect(() => {
    onTimeUpdate?.(seconds);
  }, [seconds, onTimeUpdate]);

  // Scroll detection.
  useEffect(() => {
    if (!controls.requireScrollToBottom) return;
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - (el.scrollTop + el.clientHeight);
      if (distanceFromBottom <= 12 && !scrolledBottom) {
        setScrolledBottom(true);
        onScrolledBottom?.(true);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    // Initial check — short documents that fit in the viewport are
    // already at the bottom.
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [controls.requireScrollToBottom, scrolledBottom, onScrolledBottom]);

  // Unlock.
  const timeOk = seconds >= controls.minReadSeconds;
  const scrollOk = !controls.requireScrollToBottom || scrolledBottom;
  const unlocked = timeOk && scrollOk;

  useEffect(() => {
    if (unlocked && !unlockedRef.current) {
      unlockedRef.current = true;
      onUnlocked?.();
    }
  }, [unlocked, onUnlocked]);

  const remaining = Math.max(0, controls.minReadSeconds - seconds);

  return (
    <div className={cn("flex flex-col rounded-lg border border-slate-200 overflow-hidden", className)}>
      {/* Body */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-5 py-4 bg-white"
        style={{ maxHeight: "60vh" }}
      >
        <RenderBody body={body} />
      </div>

      {/* Footer status strip */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs">
        <div className="flex items-center gap-3">
          {controls.minReadSeconds > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                timeOk ? "text-emerald-600" : "text-slate-500"
              )}
            >
              {timeOk ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {timeOk
                ? `Read for ${seconds}s`
                : `Reading… ${remaining}s remaining`}
            </span>
          )}
          {controls.requireScrollToBottom && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                scrollOk ? "text-emerald-600" : "text-slate-500"
              )}
            >
              {scrollOk ? <Check className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              {scrollOk ? "Scrolled to end" : "Scroll to the end"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          {language && <span className="uppercase tracking-wider text-[10px]">{language}</span>}
          {!unlocked && (
            <span className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">
              Sign locked
            </span>
          )}
          {unlocked && (
            <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold">
              Sign unlocked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Render the agreement body. Lines starting with `# ` are level-1
 *  headings, `## ` are level-2; everything else is paragraph text. We
 *  deliberately avoid a full Markdown library — the body is operator-
 *  authored legalese, and we want to keep the surface small. */
function RenderBody({ body }: { body: string }) {
  const lines = body.split("\n");
  return (
    <div className="prose-like space-y-3 text-sm text-slate-700 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="text-sm font-semibold text-slate-900 mt-3">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2 key={i} className="text-base font-bold text-slate-900 mt-2">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.trim() === "") {
          return null;
        }
        return (
          <p key={i} className="text-sm text-slate-700">
            {line}
          </p>
        );
      })}
    </div>
  );
}
