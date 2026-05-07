"use client";

import { useState, useEffect } from "react";
import { UserPlus, Globe, Shield, ChevronDown, RotateCcw, Smartphone, Mail, AlertTriangle } from "lucide-react";
import { useDevConfig, RegisterMode } from "@/lib/dev-config";
import { cn } from "@/lib/utils";

const MODE_LABELS: Record<RegisterMode, string> = {
  A: "邮箱 OTP + 密码",
  B: "手机 OTP + 密码",
  C: "邮箱 OTP + 手机 OTP + 密码",
  D: "邮箱 OTP + 手机号 + 密码",
  E: "手机 OTP + 邮箱 + 密码",
};

const MODE_DESCRIPTIONS: Record<RegisterMode, string> = {
  A: "验证邮箱后设置密码",
  B: "验证手机后设置密码",
  C: "邮箱和手机双 OTP 验证",
  D: "验证邮箱，手机仅绑定",
  E: "验证手机，邮箱仅绑定",
};

export function RegisterDevPanel() {
  const devConfig = useDevConfig();
  const [forceCaptcha, setForceCaptcha] = useState(false);

  useEffect(() => {
    const val = localStorage.getItem("dev_force_captcha") === "true";
    setForceCaptcha(val);
  }, []);

  const toggleForceCaptcha = () => {
    const next = !forceCaptcha;
    setForceCaptcha(next);
    localStorage.setItem("dev_force_captcha", String(next));
    window.dispatchEvent(new StorageEvent("storage", { key: "dev_force_captcha" }));
  };

  return (
    <div className="space-y-4">
      {/* 注册模式选择 */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 mb-2">
          <UserPlus size={14} />
          注册模式
        </div>
        <div className="space-y-1.5">
          {(Object.keys(MODE_LABELS) as RegisterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => devConfig.setRegisterMode(mode)}
              className={cn(
                "w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left transition-all",
                "border text-xs",
                devConfig.registerMode === mode
                  ? "bg-primary/5 border-primary/20 text-primary font-medium"
                  : "bg-white border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    devConfig.registerMode === mode
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {mode}
                  </span>
                  <span className="font-medium">{MODE_LABELS[mode]}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 ml-7">{MODE_DESCRIPTIONS[mode]}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 人机验证开关 */}
      <div className="pt-3 border-t border-gray-100">
        <div className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
          <Shield size={14} />
          安全控制
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">人机验证（OTP 防刷）</span>
          <button
            onClick={() => devConfig.setCaptchaEnabled(!devConfig.captchaEnabled)}
            className={cn(
              "relative w-9 h-5 rounded-full transition-colors duration-200",
              devConfig.captchaEnabled ? "bg-primary" : "bg-gray-200"
            )}
          >
            <span className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
              devConfig.captchaEnabled && "translate-x-4"
            )} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          OTP 发送超 5 次/小时后触发图形验证码
        </p>

        {/* 强制显示人机验证 */}
        <div className="mt-3 pt-3 border-t border-dashed border-gray-100">
          <button
            onClick={toggleForceCaptcha}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
              forceCaptcha
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
            )}
          >
            <AlertTriangle size={12} />
            {forceCaptcha ? "已强制显示人机验证" : "🧪 强制显示人机验证"}
          </button>
          <p className="text-[10px] text-gray-400 mt-1 text-center">
            {forceCaptcha ? "注册页面将立即显示验证码挑战" : "点击后注册页立即弹出验证码（无需触发防刷）"}
          </p>
        </div>
      </div>

      {/* OTP 配置说明 */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div className="text-xs font-semibold text-gray-800 mb-1">OTP 说明</div>
        <div className="flex items-start gap-2 text-[10px] text-gray-500">
          <Smartphone size={12} className="mt-0.5 shrink-0" />
          <span>手机 OTP 支持 SMS / WhatsApp / Voice（根据地区配置）</span>
        </div>
        <div className="flex items-start gap-2 text-[10px] text-gray-500">
          <Mail size={12} className="mt-0.5 shrink-0" />
          <span>Demo 验证码：1234 或当天日期（MMDD）</span>
        </div>
        <div className="flex items-start gap-2 text-[10px] text-gray-500">
          <RotateCcw size={12} className="mt-0.5 shrink-0" />
          <span>60s 倒计时冷却，1h 最多 5 次</span>
        </div>
      </div>
    </div>
  );
}
