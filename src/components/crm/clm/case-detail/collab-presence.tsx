"use client";

/**
 * CollabPresence (P2-C3) — 协作冲突提醒（mock）.
 *
 * 真实场景需要 WebSocket / Realtime（presence channel）。这里 mock 一个
 * 静态横条：~25% 概率显示"还有一位同事在看这个 case"，
 * deterministic by caseId 保证截图稳定。
 *
 * 接入真后端时把 useMockPresence 换成 useRealtimePresence(caseId) 即可。
 */

import { useMemo } from "react";
import { Eye } from "lucide-react";
import { mockStaff } from "@/lib/backoffice/mock-staff";

interface PresenceViewer {
  id: string;
  name: string;
  initial: string;
  enteredAt: string; // ISO
}

export function CollabPresence({
  caseId, currentStaffId,
}: {
  caseId: string;
  currentStaffId?: string;
}) {
  const viewers = useMockPresence(caseId, currentStaffId);
  if (viewers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-sky-50 border border-sky-200 text-[11px] text-sky-800">
      <Eye className="w-3 h-3 flex-shrink-0" />
      <div className="flex -space-x-1.5 flex-shrink-0">
        {viewers.map((v) => (
          <span
            key={v.id}
            className="w-4 h-4 rounded-full bg-sky-200 text-sky-800 ring-2 ring-white text-[9px] font-bold flex items-center justify-center"
            title={v.name}
          >
            {v.initial}
          </span>
        ))}
      </div>
      <span className="truncate">
        {viewers.length === 1
          ? <><b>{viewers[0].name}</b> is also viewing this case</>
          : <><b>{viewers.length}</b> colleagues are also viewing this case</>}
      </span>
    </div>
  );
}

function useMockPresence(caseId: string, currentStaffId?: string): PresenceViewer[] {
  return useMemo(() => {
    // FNV-1a hash on caseId
    let h = 2166136261 >>> 0;
    for (let i = 0; i < caseId.length; i++) {
      h = (h ^ caseId.charCodeAt(i)) >>> 0;
      h = Math.imul(h, 16777619) >>> 0;
    }
    // ~ 25% of cases have a co-viewer
    if ((h % 4) !== 0) return [];

    // Pick 1-2 reviewers other than current operator, deterministic by hash
    const pool = mockStaff.filter((s) => s.id !== currentStaffId);
    if (pool.length === 0) return [];
    const count = ((h >>> 8) % 4 === 0) ? 2 : 1; // ~25% of those get 2 viewers
    const idx1 = (h >>> 4) % pool.length;
    const idx2 = ((h >>> 16) % pool.length + 1) % pool.length;
    const indices = count === 2 && idx1 !== idx2 ? [idx1, idx2] : [idx1];
    return indices.map((i) => {
      const s = pool[i];
      return {
        id: s.id,
        name: s.fullName,
        initial: s.fullName.charAt(0).toUpperCase(),
        enteredAt: new Date().toISOString(),
      };
    });
  }, [caseId, currentStaffId]);
}
