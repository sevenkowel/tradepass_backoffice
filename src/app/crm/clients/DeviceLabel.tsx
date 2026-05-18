"use client";

/**
 * DeviceLabel — the registration-device cell in the client list.
 *
 * Shows the short label inline (e.g. "Chrome 124 on Windows 11") and
 * pops a detailed UA breakdown on hover (or click on touch devices).
 *
 * The detail panel is synthesised deterministically from `seed`
 * (`user.id`) so the same client always shows the same full UA / build
 * / resolution — screenshot-safe, demo-stable.
 *
 * The popover renders through `createPortal` to `document.body` so it
 * doesn't get clipped by the table's `overflow-x-auto` scroll container
 * or the page's sticky chrome.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** Short label, e.g. "Chrome 124 on Windows 11". */
  device: string;
  /** Stable seed for deterministic detail synthesis — pass `user.id`. */
  seed: string;
}

const HOVER_CLOSE_DELAY = 120;
const POPOVER_WIDTH = 320;

export function DeviceLabel({ device, seed }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | null>(null);

  const reposition = () => {
    const a = anchorRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    // Keep the popover from running off the right edge.
    const left = Math.min(
      window.innerWidth - POPOVER_WIDTH - 12,
      r.left,
    );
    setPos({ top: r.bottom + 4, left: Math.max(12, left) });
  };

  const openNow = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    reposition();
    setOpen(true);
  };
  const closeSoon = () => {
    if (closeTimer.current != null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  };

  // Reposition on scroll / resize while open.
  useEffect(() => {
    if (!open) return;
    const handler = () => reposition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  const details = expandDevice(device, seed);

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        onClick={(e) => {
          e.stopPropagation();
          if (open) {
            setOpen(false);
          } else {
            openNow();
          }
        }}
        className="inline-flex items-center text-xs text-slate-600 truncate cursor-default border-b border-dashed border-slate-300 hover:border-slate-500"
        title={device}
      >
        {device}
      </span>

      {open && typeof document !== "undefined" && createPortal(
        <div
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          className="fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-xl text-xs"
          style={{ top: pos.top, left: pos.left, width: POPOVER_WIDTH }}
        >
          <div className="px-3 pt-3 pb-2 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Device details
            </p>
            <p className="font-medium text-slate-800 truncate">{device}</p>
          </div>
          <dl className="px-3 py-2 space-y-1.5">
            <Row label="Browser">{details.browserFull}</Row>
            <Row label="Engine">{details.engine}</Row>
            <Row label="OS">{details.osFull}</Row>
            <Row label="Type">{details.type}</Row>
            <Row label="Screen">{details.screen}</Row>
            <Row label="Lang">{details.language}</Row>
          </dl>
          <div className="px-3 py-2 border-t border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              User Agent
            </p>
            <p className="font-mono text-[10px] text-slate-600 break-all leading-snug">
              {details.ua}
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-400 text-[11px]">{label}</dt>
      <dd className="text-slate-800 text-right tabular-nums truncate max-w-[210px]">
        {children}
      </dd>
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* UA detail synthesis                                                   */
/* --------------------------------------------------------------------- */

interface DeviceDetails {
  browserFull: string;
  engine: string;
  osFull: string;
  type: "Desktop" | "Mobile" | "Tablet";
  screen: string;
  language: string;
  ua: string;
}

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h ^ s.charCodeAt(i)) >>> 0) * 16777619;
  }
  return Math.abs(h | 0);
}
const pick = <T,>(seed: string, salt: string, arr: readonly T[]): T =>
  arr[hashSeed(`${seed}:${salt}`) % arr.length];

/** Parse a short label like "Chrome 124 on Windows 11" into full UA details. */
function expandDevice(short: string, seed: string): DeviceDetails {
  const [browserPart, osPart] = short.split(" on ");
  const browser = browserPart ?? "Chrome 124";
  const os = osPart ?? "macOS 14";
  const isMobile = /Mobile/i.test(browser) || /iOS|Android/i.test(os);

  /* --- Browser version expansion --- */
  let browserFull = browser;
  let engine = "Blink";
  if (/Chrome/i.test(browser)) {
    const patch = pick(seed, "chrome.patch", ["0.6367.91", "0.6367.118", "0.6478.55", "0.6478.114"]);
    browserFull = browser.replace(/(\d+)/, `$1.${patch}`);
    engine = "Blink";
  } else if (/Safari/i.test(browser)) {
    browserFull = browser.replace(/(\d+)/, (m) => `${m}.${pick(seed, "safari.patch", ["3", "5", "6"])}`);
    engine = "WebKit";
  } else if (/Firefox/i.test(browser)) {
    browserFull = browser.replace(/(\d+)/, (m) => `${m}.${pick(seed, "ff.patch", ["0", "0.2", "0.3"])}`);
    engine = "Gecko";
  } else if (/Edge/i.test(browser)) {
    const patch = pick(seed, "edge.patch", ["0.2478.49", "0.2478.97"]);
    browserFull = browser.replace(/(\d+)/, `$1.${patch}`);
    engine = "Blink";
  }

  /* --- OS expansion --- */
  let osFull = os;
  if (/macOS/i.test(os)) {
    osFull = `${os}.${pick(seed, "mac.minor", ["2.1", "3", "3.1", "4"])}`;
  } else if (/Windows/i.test(os)) {
    osFull = `${os} ${pick(seed, "win.edition", ["Pro 23H2", "Home 23H2", "Pro 22H2"])} (Build ${pick(seed, "win.build", ["22631", "22621", "22000"])})`;
  } else if (/iOS/i.test(os)) {
    osFull = `${os}.${pick(seed, "ios.minor", ["1", "2", "3", "3.1"])}`;
  } else if (/Android/i.test(os)) {
    osFull = `${os} (${pick(seed, "android.build", ["TQ3A.230901.001", "UD1A.230803.022", "UQ1A.240105.004"])})`;
  }

  /* --- Device type & resolution --- */
  const type: "Desktop" | "Mobile" | "Tablet" = isMobile ? "Mobile" : "Desktop";
  const screen = isMobile
    ? pick(seed, "screen.mobile", ["390×844", "393×873", "414×896", "428×926", "360×800"])
    : pick(seed, "screen.desktop", ["1920×1080", "2560×1440", "1440×900", "1680×1050", "3840×2160"]);

  const language = pick(seed, "lang", ["zh-CN", "en-US", "ja-JP", "ko-KR", "en-GB", "es-ES", "fr-FR"]);

  /* --- Full UA string --- */
  const ua = buildUaString(browserFull, osFull, engine, isMobile);

  return { browserFull, engine, osFull, type, screen, language, ua };
}

function buildUaString(browser: string, os: string, engine: string, isMobile: boolean): string {
  const bMatch = browser.match(/^(\S+)\s+([\d.]+)/);
  const bName = bMatch?.[1] ?? "Chrome";
  const bVer = bMatch?.[2] ?? "124.0.0.0";

  if (bName === "Safari" && /iOS/i.test(os)) {
    const iosVer = os.replace(/iOS\s*/, "").split(" ")[0].replace(/\./g, "_");
    return `Mozilla/5.0 (iPhone; CPU iPhone OS ${iosVer} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${bVer.split(".")[0]} Mobile/15E148 Safari/604.1`;
  }
  if (bName === "Safari" && /macOS/i.test(os)) {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${bVer} Safari/605.1.15`;
  }
  if (bName === "Chrome" && isMobile && /Android/i.test(os)) {
    return `Mozilla/5.0 (Linux; Android 14; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${bVer} Mobile Safari/537.36`;
  }
  if (bName === "Chrome" && /Windows/i.test(os)) {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${bVer} Safari/537.36`;
  }
  if (bName === "Chrome" && /macOS/i.test(os)) {
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${bVer} Safari/537.36`;
  }
  if (bName === "Firefox" && /Linux/i.test(os)) {
    return `Mozilla/5.0 (X11; Linux x86_64; rv:${bVer.split(".")[0]}.0) Gecko/20100101 Firefox/${bVer}`;
  }
  if (bName === "Firefox") {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${bVer.split(".")[0]}.0) Gecko/20100101 Firefox/${bVer}`;
  }
  if (bName === "Edge") {
    return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${bVer} Safari/537.36 Edg/${bVer}`;
  }
  // Generic fallback
  void engine;
  return `Mozilla/5.0 (compatible; ${bName}/${bVer}; ${os})`;
}
