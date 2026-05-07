"use client";

/**
 * 悬浮开发工具箱 - 支持拖拽
 */

import { useState, useRef, useEffect } from "react";
import { Wrench, X, Eye, ShieldCheck, Wallet, UserPlus, Megaphone, GripVertical } from "lucide-react";
import { PerspectiveSwitcher } from "./PerspectiveSwitcher";
import { KYCDevPanel } from "./KYCDevPanel";
import { AccountCountSwitcher } from "./AccountCountSwitcher";
import { RegisterDevPanel } from "./RegisterDevPanel";
import { BannerDevPanel } from "./BannerDevPanel";

export function FloatingDevToolbox() {
  const [open, setOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPos({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };
    const handleUp = () => {
      dragRef.current.isDragging = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
  };

  const tools = [
    { id: "perspective", name: "用户视角", icon: Eye, component: PerspectiveSwitcher },
    { id: "accounts", name: "账户数量", icon: Wallet, component: AccountCountSwitcher },
    { id: "kyc", name: "KYC 控制", icon: ShieldCheck, component: KYCDevPanel },
    { id: "register", name: "注册控制", icon: UserPlus, component: RegisterDevPanel },
    { id: "banner", name: "Banner 控制", icon: Megaphone, component: BannerDevPanel },
  ];

  const ActiveComponent = activeTool ? tools.find(t => t.id === activeTool)?.component : null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] select-none"
      style={{ 
        right: `${20 - pos.x}px`, 
        bottom: `${84 - pos.y}px`,
      }}
    >
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-gray-900 text-white hover:bg-gray-800"
          title="开发工具箱"
        >
          <Wrench size={20} />
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-72">
          {/* 头部 - 可拖拽 */}
          <div 
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-grab active:cursor-grabbing"
            onMouseDown={startDrag}
          >
            <div className="flex items-center gap-2">
              <GripVertical size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {activeTool ? tools.find(t => t.id === activeTool)?.name : "开发工具箱"}
              </span>
            </div>
            <button onClick={() => { setOpen(false); setActiveTool(null); }}>
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          {/* 内容 */}
          <div className="p-4">
            {ActiveComponent ? (
              <ActiveComponent />
            ) : (
              <div className="space-y-2">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <tool.icon size={18} className="text-gray-500" />
                    <span>{tool.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
