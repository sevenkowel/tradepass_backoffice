"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Mail, Shield } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/auth/mock-auth";

export function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [step, setStep] = useState<"sending" | "input">("sending");
  const [mockOtp, setMockOtp] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-send OTP on mount
  useEffect(() => {
    if (!email) return;
    handleSendOtp();
  }, [email]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    setError("");
    setMockOtp("");
    setStep("sending");
    const result = await sendOtp(email);
    if (!result.success) {
      setError(result.error || "发送失败");
      setStep("input");
      return;
    }
    setOtpSent(true);
    setMockOtp((result as any).mockOtp || "");
    setCooldown(60);
    setStep("input");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;

    setError("");
    setLoading(true);
    const result = await verifyOtp(email, otp);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "验证失败");
      return;
    }

    if (result.requires2faBinding) {
      router.push(`/auth/crm/bind-2fa?email=${encodeURIComponent(email)}`);
      return;
    }

    if (result.requires2faCode) {
      router.push("/crm");
      return;
    }

    router.push("/crm");
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-slate-600">无效的访问链接</p>
            <Button className="mt-4" onClick={() => router.push("/auth/crm/login")}>
              返回登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">验证邮箱</h1>
            <p className="text-sm text-slate-500 mt-1">
              验证码已发送至
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{email}</p>
          </div>

          {step === "sending" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-3 text-sm text-slate-500">发送验证码中...</span>
            </div>
          )}

          {step === "input" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">验证码</label>
                <Input
                  ref={inputRef}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="请输入 6 位验证码"
                  maxLength={6}
                  className="mt-1 text-center text-lg tracking-[0.5em]"
                  autoFocus
                />
                {otpSent && (
                  <p className="text-xs text-slate-400 mt-1">
                    {cooldown > 0
                      ? `${cooldown} 秒后可重新发送`
                      : "验证码已过期？"}
                  </p>
                )}
                {mockOtp && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 text-center">
                    Demo 模式验证码：<span className="font-mono font-bold text-base tracking-widest">{mockOtp}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading || otp.length < 6} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "验证并继续"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={cooldown > 0}
                  className={`text-sm underline ${
                    cooldown > 0 ? "text-slate-300 cursor-not-allowed" : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {cooldown > 0 ? `重新发送 (${cooldown}s)` : "重新发送验证码"}
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-600">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>如果收件箱未找到验证码，请检查垃圾邮件文件夹</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
