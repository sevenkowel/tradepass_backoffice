"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Loader2, Eye, EyeOff, Mail, Phone } from "lucide-react";
import PhoneInput from "@/components/auth/PhoneInput";
import EmailInput from "@/components/auth/EmailInput";
import type { AuthConfig } from "@/lib/auth-config";

type LoginMethod = "email" | "phone";
type LoginMode = "password" | "otp";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId");
  const portalUrl = "/portal";

  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [loginMode, setLoginMode] = useState<LoginMode>("password");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // 格式：+84 9030912312
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const [otpHint, setOtpHint] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    async function loadConfig() {
      try {
        const url = tenantId ? `/api/config/auth?tenantId=${tenantId}` : "/api/config/auth";
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setConfig(data.data);
          if (data.data.loginMethods.includes("email")) setLoginMethod("email");
          else if (data.data.loginMethods.includes("phone")) setLoginMethod("phone");
          if (data.data.loginModes?.includes("password")) setLoginMode("password");
          else setLoginMode("otp");
        }
      } catch { /* fallback */ }
      finally { setConfigLoading(false); }
    }
    loadConfig();
  }, [tenantId]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const getTargetValue = () => loginMethod === "email" ? email : phone;

  const sendOTP = async () => {
    const target = getTargetValue();
    if (!target) {
      setError(loginMethod === "email" ? "请输入邮箱" : "请输入手机号");
      return;
    }
    setOtpSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "otp", target, action: "login" }),
      });

      // 详细错误处理
      if (!res.ok) {
        const text = await res.text();
        let errMsg = `请求失败 (${res.status})`;
        try {
          const json = JSON.parse(text);
          errMsg = json.error || errMsg;
        } catch { /* not json */ }
        setError(errMsg);
        setOtpSending(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setOtpHint(data.hint || "验证码已发送");
        setCountdown(60);
      } else {
        setError(data.error || "发送失败");
      }
    } catch (err) {
      console.error("OTP send error:", err);
      setError("网络错误，请检查网络连接");
    } finally {
      setOtpSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fakeToken = `mock-token-${Date.now()}`;
      document.cookie = `token=${fakeToken}; path=/; max-age=604800`;
      document.cookie = `portal_tenant=${tenantId || "tenant-demo"}; path=/; max-age=604800`;
      document.cookie = `onboarding_completed=true; path=/; max-age=604800`;
      document.cookie = `mock_user_role=user; path=/; max-age=604800`;
      setLoading(false);
      window.location.href = portalUrl;
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      setError("登录失败，请重试");
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const idLabel = loginMethod === "email" ? "邮箱" : "手机号";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-[400px] shadow-lg">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">登录交易门户</h1>
            <p className="text-sm text-gray-400">访问您的交易账户和资金</p>
          </div>

          {/* 登录方式 */}
          <div className="flex rounded-xl bg-gray-100/80 p-1">
            {["email", "phone"].map((method) => (
              <button key={method} type="button" onClick={() => setLoginMethod(method as LoginMethod)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  loginMethod === method ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {method === "email" ? <Mail className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                {method === "email" ? "邮箱" : "手机"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 登录标识 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">{idLabel}</label>
              {loginMethod === "email" ? (
                <EmailInput value={email} onChange={setEmail}
                  placeholder="your@email.com" required className="h-11" />
              ) : (
                <PhoneInput value={phone} onChange={setPhone} defaultCountry="VN" className="h-11" />
              )}
            </div>

            {loginMode === "password" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">密码</label>
                  <button type="button" onClick={() => { setLoginMode("otp"); setError(""); }}
                    className="text-xs text-primary hover:text-primary/80 transition-colors">使用验证码登录</button>
                </div>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required className="h-11 pr-10" />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {loginMode === "otp" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">验证码</label>
                  <button type="button" onClick={() => { setLoginMode("password"); setError(""); }}
                    className="text-xs text-primary hover:text-primary/80 transition-colors">使用密码登录</button>
                </div>
                <div className="flex gap-2">
                  <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6位数字" maxLength={6}
                    className="h-11 flex-1 text-center text-lg tracking-[0.5em] font-mono" />
                  <Button type="button" variant="outline" onClick={sendOTP}
                    disabled={otpSending || countdown > 0} className="h-11 px-4 whitespace-nowrap text-sm">
                    {otpSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                      countdown > 0 ? `${countdown}s` : "获取验证码"}
                  </Button>
                </div>
                {otpHint && (
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-sm text-blue-700">
                    <p className="font-medium">Demo 模式</p>
                    <p className="text-xs mt-0.5">验证码：<span className="font-mono font-bold text-sm">
                      {String(new Date().getMonth() + 1).padStart(2, "0")}
                      {String(new Date().getDate()).padStart(2, "0")}
                    </span></p>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/20" />
                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">记住我</span>
              </label>
              <Link href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">忘记密码？</Link>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
              </div>
            )}

            <Button type="submit"
              disabled={loading || (loginMode === "otp" && otpCode.length < 4) || (loginMode === "password" && !password)}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium text-base">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>登录 <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400">
            还没有账号？<Link href={`/auth/portal/register${tenantId ? `?tenantId=${tenantId}` : ""}`} className="text-primary hover:underline font-medium">立即注册</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
