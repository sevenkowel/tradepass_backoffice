import { create } from "zustand";

interface SidebarState {
  // 侧边栏折叠状态
  sidebarCollapsed: boolean;
  // 切换折叠状态
  toggleSidebar: () => void;
  // 设置折叠状态
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useCrmSidebarStore = create<SidebarState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
