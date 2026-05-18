"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/auth/mock-auth";
import { Logo } from "@/components/ui/Logo";

export function CrmLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login({ email, password });
    setLoading(false);

    if (!result.success) {
      // Check if account is locked
      if (result.lockedUntil) {
        router.push("/auth/crm/account-locked");
        return;
      }
      setError(result.error || "登录失败");
      return;
    }

    if (result.requiresPasswordChange) {
      router.push(`/auth/crm/set-password?email=${encodeURIComponent(email)}`);
      return;
    }

    if (result.requiresOtp) {
      router.push(`/auth/crm/verify-otp?email=${encodeURIComponent(email)}`);
      return;
    }

    router.push("/crm");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size={56} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">CRM 管理后台</h1>
            <p className="text-sm text-slate-500 mt-1">仅支持已授权的员工账户登录</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">邮箱</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">密码</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "登录"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <Link href="/auth/crm/reset-password" className="text-blue-600 hover:underline">
                忘记密码？
              </Link>
            </div>
          </form>

          <p className="text-xs text-center text-slate-400">
            没有账户？请联系系统管理员。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
