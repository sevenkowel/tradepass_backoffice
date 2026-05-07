"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

interface PasswordInputProps {
  password: string;
  onPasswordChange: (value: string) => void;
  policy?: PasswordPolicy;
  disabled?: boolean;
}

interface RequirementItem {
  label: string;
  test: (pwd: string) => boolean;
}

function getStrengthScore(password: string, policy: PasswordPolicy): number {
  let score = 0;
  if (password.length >= policy.minLength) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  return score;
}

export default function PasswordInput({
  password,
  onPasswordChange,
  policy = DEFAULT_POLICY,
  disabled = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const requirements: RequirementItem[] = useMemo(
    () => [
      { label: `至少 ${policy.minLength} 位字符`, test: (p) => p.length >= policy.minLength },
      ...(policy.requireUppercase ? [{ label: "包含大写字母", test: (p: string) => /[A-Z]/.test(p) }] : []),
      ...(policy.requireLowercase ? [{ label: "包含小写字母", test: (p: string) => /[a-z]/.test(p) }] : []),
      ...(policy.requireNumber ? [{ label: "包含数字", test: (p: string) => /\d/.test(p) }] : []),
      ...(policy.requireSpecial ? [{ label: "包含特殊字符", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) }] : []),
    ],
    [policy]
  );

  const score = useMemo(() => getStrengthScore(password, policy), [password, policy]);
  const maxScore = requirements.length;
  const strengthLabel = score <= 1 ? "弱" : score <= 3 ? "中" : "强";
  const strengthColor = score <= 1 ? "bg-red-500" : score <= 3 ? "bg-yellow-500" : "bg-emerald-500";
  const isValid = score === maxScore && password.length > 0;

  return (
    <div className="space-y-4">
      {/* 密码输入 */}
      <div>
        <label className="text-sm font-medium text-gray-700">
          设置密码 <span className="text-red-500">*</span>
          {isValid && <span className="ml-2 text-xs text-emerald-600 font-medium">✓</span>}
        </label>
        <div className="relative mt-1">
          <Input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={`至少 ${policy.minLength} 位，含大小写+数字+特殊字符`}
            disabled={disabled}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 强度条 */}
      {password.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">密码强度</span>
            <span className={score <= 1 ? "text-red-500" : score <= 3 ? "text-yellow-600" : "text-emerald-600"}>
              {strengthLabel}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: maxScore }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < score ? strengthColor : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* 策略清单 */}
      <div className="space-y-1.5">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <div key={req.label} className="flex items-center gap-1.5 text-xs">
              {passed ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-gray-300" />
              )}
              <span className={passed ? "text-emerald-600" : "text-gray-400"}>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { type PasswordPolicy, DEFAULT_POLICY };
