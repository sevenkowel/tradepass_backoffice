"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { sendOtp } from "@/lib/auth/mock-auth";

export function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [step, setStep] = useState<"email" | "sent">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);
    const result = await sendOtp(email);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "发送失败");
      return;
    }

    setStep("sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-amber-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">重置密码</h1>
          </div>

          {step === "sent" ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <p className="text-sm text-slate-700">
                重置链接已发送至 <span className="font-semibold">{email}</span>
              </p>
              <p className="text-xs text-slate-500">请查看邮箱并按照指引操作</p>
              <Button variant="secondary" onClick={() => router.push("/auth/crm/login")}>
                返回登录
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">注册邮箱</label>
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

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading || !email} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "发送重置链接"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/auth/crm/login")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  返回登录
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
