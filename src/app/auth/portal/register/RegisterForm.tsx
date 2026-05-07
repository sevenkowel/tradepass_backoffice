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

export type OTPChannel = "sms" | "whatsapp" | "voice";

const CHANNEL_CONFIG: Record<OTPChannel, { label: string; desc: string }> = {
  sms: { label: "短信", desc: "通过短信接收验证码" },
  whatsapp: { label: "WhatsApp", desc: "通过 WhatsApp 接收验证码" },
  voice: { label: "语音电话", desc: "通过语音电话接收验证码" },
};

export interface OTPField {
  type: "email" | "phone";
  target: string;
  verified: boolean;
  code: string;
  hint: string;
  sending: boolean;
  countdown: number;
  channel: OTPChannel;
}

// ===== 邮箱验证区域（独立组件，避免重渲染丢失焦点） =====
function EmailVerifySection({
  emailValue,
  emailField,
  needVerify,
  onEmailChange,
  onSendOTP,
  onUpdateOTP,
  onComplete,
}: {
  emailValue: string;
  emailField: OTPField;
  needVerify: boolean;
  onEmailChange: (v: string) => void;
  onSendOTP: () => void;
  onUpdateOTP: (updates: Partial<OTPField>) => void;
  onComplete: (code: string) => void;
}) {
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
    <div className="space-y-3">
      {/* 邮箱输入 */}
      <div>
        <label className="text-sm font-medium text-gray-700">电子邮箱 <span className="text-red-500">*</span></label>
        <div className="mt-1.5">
          <EmailInput value={emailValue} onChange={onEmailChange} placeholder="your@email.com" className="h-10" />
        </div>
      </div>

      {/* 验证码输入 + 获取按钮 一行（仅验证模式显示） */}
      {needVerify && (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={emailField.code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  onUpdateOTP({ code: val });
                  if (val.length === 4) onComplete(val);
                }}
                placeholder="4位验证码"
                className="w-full h-10 px-3 text-sm text-center tracking-[0.5em] text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <Button
              type="button"
              onClick={onSendOTP}
              disabled={emailField.sending || !emailValid}
              className="h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm whitespace-nowrap disabled:opacity-50"
            >
              {emailField.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : emailField.hint ? "重发" : "获取验证码"}
            </Button>
          </div>

          {/* 提示文字 */}
          {emailField.hint && (
            <p className="text-xs text-gray-500">{emailField.hint}</p>
          )}
        </>
      )}
    </div>
  );
}

// ===== 手机验证区域（独立组件，避免重渲染丢失焦点） =====
function PhoneVerifySection({
  phoneValue,
  phoneField,
  region,
  needVerify,
  onPhoneChange,
  onSendOTP,
  onUpdateOTP,
  onComplete,
}: {
  phoneValue: string;
  phoneField: OTPField;
  region: RegionConfig;
  needVerify: boolean;
  onPhoneChange: (v: string) => void;
  onSendOTP: () => void;
  onUpdateOTP: (updates: Partial<OTPField>) => void;
  onComplete: (code: string) => void;
}) {
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
    <div className="space-y-3">
      {/* 手机号输入 */}
      <div>
        <label className="text-sm font-medium text-gray-700">手机号 <span className="text-red-500">*</span></label>
        <div className="mt-1.5">
          <PhoneInput value={phoneValue} onChange={onPhoneChange} defaultCountry={region.code} className="h-10" />
        </div>
      </div>

      {/* 验证码接收方式（仅验证模式显示） */}
      {needVerify && availableChannels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableChannels.map((ch) => {
            const cfg = CHANNEL_CONFIG[ch];
            const active = phoneField.channel === ch;
            return (
              <label
                key={ch}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-xs transition-colors ${
                  active ? "border-primary bg-primary/5 text-primary font-medium" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="phone-otp-channel"
                  checked={active}
                  onChange={() => onUpdateOTP({ channel: ch })}
                  className="w-3.5 h-3.5 text-primary"
                />
                <span>{cfg.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* 验证码输入 + 获取按钮 一行（仅验证模式显示） */}
      {needVerify && (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={phoneField.code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  onUpdateOTP({ code: val });
                  if (val.length === 4) onComplete(val);
                }}
                placeholder="4位验证码"
                className="w-full h-10 px-3 text-sm text-center tracking-[0.5em] text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <Button
              type="button"
              onClick={onSendOTP}
              disabled={phoneField.sending || !canSend}
              className="h-10 px-4 bg-primary hover:bg-primary/90 text-white text-sm whitespace-nowrap disabled:opacity-50"
            >
              {phoneField.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : phoneField.hint ? "重发" : "获取验证码"}
            </Button>
          </div>

          {/* 提示文字 */}
          {phoneField.hint && (
            <p className="text-xs text-gray-500">{phoneField.hint}</p>
          )}
        </>
      )}
    </div>
  );
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

          {/* ===== 邮箱/手机验证（按优先级排序：需要OTP验证的在前） ===== */}
          {(() => {
            const emailSection = (modeFields.needEmailVerify || modeFields.needEmailBind) ? (
              <div key="email" className={`p-4 rounded-xl border ${emailField.verified ? "bg-emerald-50/40 border-emerald-100" : "bg-gray-50/50 border-gray-100"}`}>
                <EmailVerifySection
                  emailValue={emailValue}
                  emailField={emailField}
                  needVerify={modeFields.needEmailVerify}
                  onEmailChange={setEmailValue}
                  onSendOTP={() => sendOTP(emailValue, "email")}
                  onUpdateOTP={(updates) => updateOTPField(emailValue, updates)}
                  onComplete={(code) => handleOTPComplete(emailValue, code)}
                />
              </div>
            ) : null;

            const phoneSection = (modeFields.needPhoneVerify || modeFields.needPhoneBind) ? (
              <div key="phone" className={`p-4 rounded-xl border ${phoneField.verified ? "bg-emerald-50/40 border-emerald-100" : "bg-gray-50/50 border-gray-100"}`}>
                <PhoneVerifySection
                  phoneValue={phoneValue}
                  phoneField={phoneField}
                  region={region}
                  needVerify={modeFields.needPhoneVerify}
                  onPhoneChange={setPhoneValue}
                  onSendOTP={() => sendOTP(phoneValue, "phone", phoneField.channel)}
                  onUpdateOTP={(updates) => updateOTPField(phoneValue, updates)}
                  onComplete={(code) => handleOTPComplete(phoneValue, code)}
                />
              </div>
            ) : null;

            // 需要OTP验证的排前面；都需要或都不需要时，默认先邮箱后手机
            if (modeFields.needEmailVerify && !modeFields.needPhoneVerify) {
              return <>{emailSection}{phoneSection}</>;
            }
            if (modeFields.needPhoneVerify && !modeFields.needEmailVerify) {
              return <>{phoneSection}{emailSection}</>;
            }
            // 都需要验证（模式C）或都不需要验证：先邮箱后手机
            return <>{emailSection}{phoneSection}</>;
          })()}

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
