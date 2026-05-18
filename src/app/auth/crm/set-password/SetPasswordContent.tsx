"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, Key } from "lucide-react";
import { setPassword } from "@/lib/auth/mock-auth";
import { evaluatePasswordStrength } from "@/lib/auth/password";

export function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = newPassword ? evaluatePasswordStrength(newPassword) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    if (!email) {
      setError("缺少邮箱参数");
      return;
    }
    if (!tempPassword) {
      setError("请输入临时密码");
      return;
    }

    setLoading(true);
    const result = await setPassword({ email, tempPassword, newPassword });
    setLoading(false);

    if (!result.success) {
      setError(result.error || "设置失败");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(`/auth/crm/verify-otp?email=${encodeURIComponent(email)}`);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-amber-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">设置新密码</h1>
            <p className="text-sm text-slate-500 mt-1">首次登录，请设置一个新密码</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700">密码设置成功！</p>
              <p className="text-xs text-slate-500">正在跳转到验证页面...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">邮箱</label>
                <Input value={email} disabled className="mt-1 bg-slate-50" placeholder="your@email.com" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">临时密码 <span className="text-red-500">*</span></label>
                <Input
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="请输入邮件中的临时密码"
                  required
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">新密码 <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少8位，含大小写字母、数字和特殊字符"
                    required
                    minLength={8}
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
                {strength && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          strength.level === "weak" ? "bg-red-500 w-1/4" :
                          strength.level === "medium" ? "bg-amber-500 w-2/4" :
                          strength.level === "strong" ? "bg-blue-500 w-3/4" :
                          "bg-emerald-500 w-full"
                        }`}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${strength.color}`}>{strength.label}</p>
                    {strength.errors.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {strength.errors.map((err, i) => (
                          <li key={i} className="text-xs text-red-500">{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">确认新密码 <span className="text-red-500">*</span></label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  required
                  minLength={8}
                  className="mt-1"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">两次输入的密码不一致</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading || !newPassword || !confirmPassword} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "设置密码并继续"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
