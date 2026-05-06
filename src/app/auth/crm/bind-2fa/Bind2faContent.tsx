"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Shield, Smartphone, Copy, SkipForward } from "lucide-react";
import { bind2fa } from "@/lib/auth/mock-auth";

function generateMockSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret.match(/.{1,4}/g)?.join(" ") || secret;
}

export function Bind2faContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [secret] = useState(generateMockSecret);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;

    setError("");
    setLoading(true);
    const result = await bind2fa(email, code, secret.replace(/\s/g, ""));
    setLoading(false);

    if (!result.success) {
      setError(result.error || "绑定失败");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/crm");
    }, 2000);
  };

  const handleSkip = () => {
    router.push("/crm");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-emerald-50">
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-emerald-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">设置双重验证</h1>
            <p className="text-sm text-slate-500 mt-1">
              使用身份验证器 App 扫描绑定，增强账户安全
            </p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700">2FA 绑定成功！</p>
              <p className="text-xs text-slate-500">即将进入 CRM...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3">
                <div className="w-48 h-48 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Shield className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">二维码预览</p>
                    <p className="text-[10px] text-slate-300 mt-1">
                      (实际项目使用 QR 库)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  打开 Google Authenticator 或 Authy 扫描此二维码
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">手动输入密钥</label>
                <div className="flex gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono text-xs bg-slate-50"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    验证码 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="输入 App 中的 6 位验证码"
                    maxLength={6}
                    className="mt-1 text-center text-lg tracking-[0.5em]"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Demo 模式下验证码为 <span className="font-mono font-bold">123456</span>
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading || code.length < 6} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "确认绑定"}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={handleSkip}
                  className="text-sm text-slate-400 hover:text-slate-600 underline flex items-center gap-1 mx-auto"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  跳过，稍后在设置中绑定
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
