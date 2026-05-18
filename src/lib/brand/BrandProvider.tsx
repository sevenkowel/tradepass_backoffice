// 品牌配置 Context Provider
// 用于在服务端获取品牌配置后，传递给客户端组件

"use client";

import { createContext, useContext, ReactNode } from "react";
import { BrandConfig, DEFAULT_BRAND } from "./types";

interface BrandContextValue {
  brand: BrandConfig;
}

const BrandContext = createContext<BrandContextValue>({
  brand: DEFAULT_BRAND,
});

export function BrandProvider({
  children,
  brand,
}: {
  children: ReactNode;
  brand: BrandConfig;
}) {
  return (
    <BrandContext.Provider value={{ brand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  return context.brand;
}
