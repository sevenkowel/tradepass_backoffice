"use client";

import { useEffect, useState } from "react";
import { BadgeBase, type BadgeTone } from "@/components/crm/ui";
import type { SlaSnapshot, SlaStatus } from "@/types/approval";

function toneFor(status: SlaStatus): BadgeTone {
  if (status === "timeout" || status === "critical") return "error";
  if (status === "warning") return "warning";
  return "success";
}

function fmtRemaining(snap: SlaSnapshot): string {
  const m = snap.remainingMinutes;
  const abs = Math.abs(m);
  const h = Math.floor(abs / 60);
  const rem = abs % 60;
  if (snap.isOverdue) {
    return h > 0 ? `${h}h ${rem}m overdue` : `${rem}m overdue`;
  }
  return h > 0 ? `${h}h ${rem}m left` : `${rem}m left`;
}

export function SlaTimer({ snapshot }: { snapshot?: SlaSnapshot }) {
  const [label, setLabel] = useState(() => (snapshot ? fmtRemaining(snapshot) : "—"));

  useEffect(() => {
    if (!snapshot) {
      setLabel("—");
      return;
    }
    setLabel(fmtRemaining(snapshot));
    const id = setInterval(() => setLabel(fmtRemaining(snapshot)), 60_000);
    return () => clearInterval(id);
  }, [snapshot]);

  if (!snapshot) return <span className="text-slate-400 text-xs">—</span>;

  return (
    <BadgeBase tone={toneFor(snapshot.status)}>
      <span className="tabular-nums">{label}</span>
    </BadgeBase>
  );
}
