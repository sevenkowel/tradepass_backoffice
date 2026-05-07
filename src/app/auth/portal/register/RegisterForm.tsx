"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2, Shield, RotateCcw } from "lucide-react";
import EmailInput from "@/components/auth/EmailInput";
import PhoneInput from "@/components/auth/PhoneInput";
import PasswordInput from "@/components/auth/PasswordInput";
import CaptchaChallenge from "@/components/auth/CaptchaChallenge";
import OTPInput from "@/components/auth/OTPInput";
import RegionSelect from "@/components/auth/RegionSelect";
import { useDevConfig } from "@/lib/dev-config";
import type { AuthConfig, RegionConfig } from "@/lib/auth-config";
import { defaultRegions } from "@/lib/auth-config";

// ===== OTP 防刷工具 =====
const OTP_SEND_LIMIT = 5;
const OTP_COOLDOWN = 60;

function getOTPCount(target: string): number {
  if (typeof window === "undefined") return 0;
  const key = `otp_count_${target}`;
  const raw = localStorage.getItem(key);
  if (!raw) return 0;
  const { count, time } = JSON.parse(raw);
  if (Date.now() - time > 3600000) { localStorage.removeItem(key); return 0; }
  return count;
}

function incrementOTPCount(target: string): number {
  const key = `otp_count_${target}`;
  const raw = localStorage.getItem(key);
  const current = raw ? JSON.parse(raw) : { count: 0, time: Date.now() };
  current.count += 1;
  current.time = Date.now();
  localStorage.setItem(key, JSON.stringify(current));
  return current.count;
}

function validateOTP(_target: string, code: string): boolean {
  if (code === "1234") return true;
  const today = `${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;
  return code === today;
}

type OTPChannel = "sms" | "whatsapp" | "voice";

const CHANNEL_CONFIG: Record<OTPChannel, { label: string; desc: string }> = {
  sms: { label: "短信", desc: "通过短信接收验证码" },
  whatsapp: { label: "WhatsApp", desc: "通过 WhatsApp 接收验证码" },
  voice: { label: "语音电话", desc: "通过语音电话接收验证码" },
};

interface OTPField {
  type: "email" | "phone";
  target: string;
  verified: boolean;
  code: string;
  hint: string;
  sending: boolean;
  countdown: number;
  channel: OTPChannel;
}

export default function RegisterForm() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId");
  const portalUrl = "/portal";
  const devConfig = useDevConfig();

  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const [region, setRegion] = useState<RegionConfig>(defaultRegions[0]);
  const [otpState, setOtpState] = useState<Record<string, OTPField>>({});
  const [password, setPassword] = useState("");
  const [agreements, setAgreements] = useState<Record<string, boolean>>({});
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [forceCaptcha, setForceCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  const [emailValue, setEmailValue] = useState("");
  const [phoneValue, setPhoneValue] = useState("");

  // 倒计时
  useEffect(() => {
    const timers = Object.entries(otpState).filter(([, v]) => v.countdown > 0);
    if (timers.length === 0) return;
    const interval = setInterval(() => {
      setOtpState((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(next)) {
          if (v.countdown > 0) next[k] = { ...v, countdown: v.countdown - 1 };
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpState]);

  // 加载配置
  useEffect(() => {
    async function loadConfig() {
      try {
        const url = tenantId ? `/api/config/auth?tenantId=${tenantId}` : "/api/config/auth";
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setConfig(data.data);
          const initAgr: Record<string, boolean> = {};
          data.data.agreements.forEach((a: { id: string }) => { initAgr[a.id] = false; });
          setAgreements(initAgr);
        }
      } catch { /* fallback */ }
      finally { setConfigLoading(false); }
    }
    loadConfig();
  }, [tenantId]);

  // DevTools 强制人机验证
  useEffect(() => {
    const check = () => setForceCaptcha(localStorage.getItem("dev_force_captcha") === "true");
    check();
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  const getRegionConfig = useCallback((code: string): RegionConfig => {
    return defaultRegions.find((r) => r.code === code) || defaultRegions[0];
  }, []);

  const handleRegionChange = (code: string) => {
    const rc = getRegionConfig(code);
    setRegion(rc);
    setOtpState({});
    setError("");
  };

  const getOTPField = (target: string, type: "email" | "phone"): OTPField => {
    return otpState[target] || {
      type, target, verified: false, code: "", hint: "",
      sending: false, countdown: 0,
      channel: type === "phone" ? (region.otpMethods[0] as OTPChannel) : "sms",
    };
  };

  const updateOTPField = (target: string, updates: Partial<OTPField>) => {
    setOtpState((prev) => ({
      ...prev,
      [target]: {
        ...(prev[target] || { type: "email", target, verified: false, code: "", hint: "", sending: false, countdown: 0, channel: "sms" }),
        ...updates,
      },
    }));
  };

  const sendOTP = useCallback(async (target: string, type: "email" | "phone", channel?: OTPChannel) => {
    if (!target) { setError(type === "email" ? "请先填写邮箱" : "请先填写手机号"); return; }

    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(target)) { setError("请输入有效的邮箱地址"); return; }
    }

    const count = getOTPCount(target);
    if (count >= OTP_SEND_LIMIT) {
      if (devConfig.captchaEnabled || forceCaptcha) { setShowCaptcha(true); return; }
      setError("发送过于频繁，请稍后再试"); return;
    }

    updateOTPField(target, { sending: true });
    setError("");

    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, target, action: "register", channel }),
      });
      const data = await res.json();
      if (data.success) {
        incrementOTPCount(target);
        updateOTPField(target, { hint: data.hint || `验证码已发送至 ${target}`, countdown: OTP_COOLDOWN, sending: false, code: "" });
      } else {
        setError(data.error || "发送失败");
        updateOTPField(target, { sending: false });
      }
    } catch {
      setError("网络错误");
      updateOTPField(target, { sending: false });
    }
  }, [devConfig.captchaEnabled, forceCaptcha]);

  const handleOTPComplete = (target: string, code: string) => {
    if (validateOTP(target, code)) {
      updateOTPField(target, { verified: true, code });
      setError("");
    } else if (code.length >= 6) {
      setError("验证码错误，请重新输入");
    }
  };

  const modeFields = useMemo(() => {
    const m = devConfig.registerMode;
    return {
      needEmailVerify: m === "A" || m === "C" || m === "D",
      needPhoneVerify: m === "B" || m === "C" || m === "E",
      needEmailBind: m === "E",
      needPhoneBind: m === "D",
    };
  }, [devConfig.registerMode]);

  const emailField = getOTPField(emailValue, "email");
  const phoneField = getOTPField(phoneValue, "phone");

  const validateForm = (): string | null => {
    if (modeFields.needEmailVerify && !emailField.verified) return "请完成邮箱验证";
    if (modeFields.needPhoneVerify && !phoneField.verified) return "请完成手机验证";
    if (modeFields.needEmailBind && !emailValue) return "请填写邮箱";
    if (modeFields.needPhoneBind && !phoneValue) return "请填写手机号";

    const policy = config?.passwordPolicy || { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumber: true, requireSpecial: true };
    if (password.length < policy.minLength) return `密码至少 ${policy.minLength} 位`;
    if (policy.requireUppercase && !/[A-Z]/.test(password)) return "密码需包含大写字母";
    if (policy.requireLowercase && !/[a-z]/.test(password)) return "密码需包含小写字母";
    if (policy.requireNumber && !/\d/.test(password)) return "密码需包含数字";
    if (policy.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return "密码需包含特殊字符";

    if (config) {
      for (const agr of config.agreements) {
        if (agr.required && !agreements[agr.id]) return `请同意《${agr.title}》`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validateForm();
    if (err) { setError(err); return; }
    if ((devConfig.captchaEnabled || forceCaptcha) && !captchaPassed) { setShowCaptcha(true); return; }

    setLoading(true); setError("");
    const fakeToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fakeTenantId = tenantId || `tenant-${Date.now()}`;
    document.cookie = `token=${fakeToken}; path=/; max-age=604800`;
    document.cookie = `portal_tenant=${fakeTenantId}; path=/; max-age=604800`;
    document.cookie = "onboarding_completed=true; path=/; max-age=604800";
    document.cookie = `mock_user_role=user; path=/; max-age=604800`;
    setLoading(false); setRegistered(true);
    setTimeout(() => (window.location.href = portalUrl), 800);
  };

  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h1 className="text-xl font-bold text-gray-900">注册成功</h1>
            <p className="text-gray-600">正在跳转至交易门户...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const policy = config?.passwordPolicy || { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumber: true, requireSpecial: true };

  // ===== 邮箱验证区域（内联展开 + 视觉隔离） =====
  const EmailVerifySection = () => {
    if (emailField.verified) {
      return (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>邮箱已验证</span>
        </div>
      );
    }

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

    return (
      <div className="space-y-4">
        {/* Step 1: 邮箱输入 */}
        <div>
          <label className="text-sm font-medium text-gray-700">电子邮箱 <span className="text-red-500">*</span></label>
          <div className="mt-1.5">
            <EmailInput value={emailValue} onChange={setEmailValue} placeholder="your@email.com" className="h-11" />
          </div>
        </div>

        {/* Step 2: 发送按钮（有效邮箱后才高亮） */}
        {emailValid && !emailField.hint && (
          <Button
            type="button"
            onClick={() => sendOTP(emailValue, "email")}
            disabled={emailField.sending}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white"
          >
            {emailField.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "发送验证码"}
          </Button>
        )}

        {/* 视觉隔离：发送后展开区域 */}
        {emailField.hint && (
          <div className="space-y-4 pt-3 border-t border-dashed border-gray-200">
            <div className="text-sm text-gray-600">
              验证码已发送至 <span className="font-medium text-gray-900">{emailValue}</span>
            </div>

            <OTPInput
              value={emailField.code}
              onChange={(code) => updateOTPField(emailValue, { code })}
              onComplete={(code) => handleOTPComplete(emailValue, code)}
              autoFocus
            />

            <div className="flex items-center justify-between text-sm">
              {emailField.countdown > 0 ? (
                <span className="text-gray-400">{emailField.countdown}s 后可重新发送</span>
              ) : (
                <button
                  type="button"
                  onClick={() => sendOTP(emailValue, "email")}
                  disabled={emailField.sending}
                  className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重新发送
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== 手机验证区域（内联展开 + 视觉隔离） =====
  const PhoneVerifySection = () => {
    if (phoneField.verified) {
      return (
        <div className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>手机已验证</span>
        </div>
      );
    }

    const availableChannels = region.otpMethods as OTPChannel[];
    const canSend = phoneValue.length >= 7;

    return (
      <div className="space-y-4">
        {/* Step 1: 手机号输入 */}
        <div>
          <label className="text-sm font-medium text-gray-700">手机号 <span className="text-red-500">*</span></label>
          <div className="mt-1.5">
            <PhoneInput value={phoneValue} onChange={setPhoneValue} defaultCountry={region.code} className="h-11" />
          </div>
        </div>

        {/* Step 2: 验证码接收方式（单选框） */}
        {canSend && availableChannels.length > 0 && !phoneField.hint && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">接收验证码方式</label>
            <div className="space-y-1.5">
              {availableChannels.map((ch) => {
                const cfg = CHANNEL_CONFIG[ch];
                const active = phoneField.channel === ch;
                return (
                  <label
                    key={ch}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="phone-otp-channel"
                      checked={active}
                      onChange={() => updateOTPField(phoneValue, { channel: ch })}
                      className="w-4 h-4 text-primary"
                    />
                    <span className={`text-sm ${active ? "text-primary font-medium" : "text-gray-700"}`}>{cfg.label}</span>
                    <span className="text-xs text-gray-400 ml-auto">{cfg.desc}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: 发送按钮 */}
        {canSend && !phoneField.hint && (
          <Button
            type="button"
            onClick={() => sendOTP(phoneValue, "phone", phoneField.channel)}
            disabled={phoneField.sending}
            className="w-full h-11 bg-primary hover:bg-primary/90 text-white"
          >
            {phoneField.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "发送验证码"}
          </Button>
        )}

        {/* 视觉隔离：发送后展开区域 */}
        {phoneField.hint && (
          <div className="space-y-4 pt-3 border-t border-dashed border-gray-200">
            <div className="text-sm text-gray-600">
              验证码已通过 <span className="font-medium">{CHANNEL_CONFIG[phoneField.channel].label}</span> 发送至 <span className="font-medium text-gray-900">{phoneValue}</span>
            </div>

            <OTPInput
              value={phoneField.code}
              onChange={(code) => updateOTPField(phoneValue, { code })}
              onComplete={(code) => handleOTPComplete(phoneValue, code)}
              autoFocus
            />

            <div className="flex items-center justify-between text-sm">
              {phoneField.countdown > 0 ? (
                <span className="text-gray-400">{phoneField.countdown}s 后可重新发送</span>
              ) : (
                <button
                  type="button"
                  onClick={() => sendOTP(phoneValue, "phone", phoneField.channel)}
                  disabled={phoneField.sending}
                  className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重新发送
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-[460px] shadow-lg">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">开通交易账户</h1>
            <p className="text-sm text-gray-400">填写以下信息完成注册</p>
          </div>

          {/* ===== 地区选择 ===== */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">国家/地区 <span className="text-red-500">*</span></label>
            <RegionSelect value={region} options={defaultRegions} onChange={(r) => handleRegionChange(r.code)} />
          </div>

          {/* ===== 邮箱验证 ===== */}
          {(modeFields.needEmailVerify || modeFields.needEmailBind) && (
            <div className={`space-y-3 p-4 rounded-xl border ${emailField.verified ? "bg-emerald-50/40 border-emerald-100" : "bg-gray-50/50 border-gray-100"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {modeFields.needEmailVerify ? "验证邮箱" : "电子邮箱"}
                </span>
              </div>
              <EmailVerifySection />
            </div>
          )}

          {/* ===== 手机验证 ===== */}
          {(modeFields.needPhoneVerify || modeFields.needPhoneBind) && (
            <div className={`space-y-3 p-4 rounded-xl border ${phoneField.verified ? "bg-emerald-50/40 border-emerald-100" : "bg-gray-50/50 border-gray-100"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {modeFields.needPhoneVerify ? "验证手机" : "手机号码"}
                </span>
              </div>
              <PhoneVerifySection />
            </div>
          )}

          {/* ===== 密码设置 ===== */}
          <div className="space-y-3">
            <PasswordInput password={password} onPasswordChange={setPassword} policy={policy} />
          </div>

          {/* ===== 协议 ===== */}
          {config && config.agreements.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">请阅读并同意以下协议：</p>
              {config.agreements.map((agr) => (
                <label key={agr.id} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!agreements[agr.id]}
                    onChange={(e) => setAgreements((prev) => ({ ...prev, [agr.id]: e.target.checked }))}
                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">
                    我已阅读并同意<span className="text-primary hover:underline">《{agr.title}》</span>
                    {agr.required && <span className="text-red-500 ml-0.5">*</span>}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* ===== 人机验证 ===== */}
          {(showCaptcha || forceCaptcha) && !captchaPassed && (
            <CaptchaChallenge
              onVerify={(success) => { if (success) { setCaptchaPassed(true); setShowCaptcha(false); setError(""); } }}
              onCancel={() => setShowCaptcha(false)}
            />
          )}

          {captchaPassed && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-700">
              <Shield className="w-4 h-4" />
              <span>安全验证已通过</span>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 提交按钮 */}
          <Button onClick={handleSubmit} disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-white text-base font-medium">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "完成注册"}
          </Button>

          {/* Footer */}
          <p className="text-center text-sm text-gray-400">
            已有账号？<Link href={`/auth/portal/login${tenantId ? `?tenantId=${tenantId}` : ""}`} className="text-primary hover:underline font-medium">立即登录</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
