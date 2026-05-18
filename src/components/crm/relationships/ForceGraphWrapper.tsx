"use client";

import dynamic from "next/dynamic";

// 动态导入 ForceGraph2D，禁用 SSR
const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[700px] flex items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading relationship graph...</p>
        </div>
      </div>
    )
  }
);

export default ForceGraph2D;
