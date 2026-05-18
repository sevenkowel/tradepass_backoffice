"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  status: string;
  kycStatus: string | null;
}

// Demo 模式默认用户
const DEMO_USER: User = {
  id: "demo-user-id",
  email: "demo@tradepass.com",
  name: "Demo User",
  status: "active",
  kycStatus: "approved",
};

export function useUser({ redirectTo = "/auth/login" }: { redirectTo?: string } = {}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo 模式：如果不需要重定向，直接返回默认用户
    if (!redirectTo) {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => {
        router.push(redirectTo);
      })
      .finally(() => setLoading(false));
  }, [router, redirectTo]);

  return { user, loading };
}
