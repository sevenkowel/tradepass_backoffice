"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/crm/ui";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Loader2, KeyRound, ArrowLeft } from "lucide-react";

interface TwoFactorLoginProps {
  username: string;
  onVerify: (code: string, useBackupCode: boolean, rememberDevice: boolean) => Promise<boolean>;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function TwoFactorLogin({
  username,
  onVerify,
  onBack,
  isLoading,
  error,
}: TwoFactorLoginProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // 只接受数字和大写字母（备份码可能包含字母）
    if (!/^[\dA-Z]*$/i.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1).toUpperCase();
    setCode(newCode);

    // 自动聚焦到下一个输入框
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 如果填满了，自动提交
    if (index === 5 && value) {
      const fullCode = [...newCode.slice(0, 5), value].join("");
      if (fullCode.length === 6) {
        handleSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^\dA-Z]/gi, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.toUpperCase().split("");
      setCode(newCode);
      handleSubmit(pasted.toUpperCase());
    }
  };

  const handleSubmit = async (fullCode: string) => {
    if (fullCode.length !== 6 || isLoading) return;
    await onVerify(fullCode, useBackupCode, rememberDevice);
  };

  const isComplete = code.every((c) => c !== "");

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">双因素认证</h2>
        <p className="text-muted-foreground">
          欢迎回来，<span className="font-medium text-foreground">{username}</span>
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setCode(["", "", "", "", "", ""]);
          }}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {useBackupCode ? (
            <>
              <Shield className="w-4 h-4" />
              使用 Authenticator 验证码
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              使用备份码登录
            </>
          )}
        </button>
      </div>

      {/* Code Input */}
      <div className="space-y-3">
        <p className="text-sm text-center text-muted-foreground">
          {useBackupCode
            ? "请输入 12 位备份码"
            : "请输入 Authenticator 应用中的 6 位验证码"}
        </p>

        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode={useBackupCode ? "text" : "numeric"}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading}
              className="w-12 h-14 text-center text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 uppercase"
              autoFocus={index === 0}
            />
          ))}
        </div>

        {!useBackupCode && (
          <p className="text-xs text-center text-muted-foreground">
            验证码每 30 秒自动更新
          </p>
        )}
      </div>

      {/* Remember Device */}
      <div className="flex items-center justify-center gap-2">
        <Checkbox
          id="remember"
          checked={rememberDevice}
          onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
        />
        <label
          htmlFor="remember"
          className="text-sm text-muted-foreground cursor-pointer"
        >
          在此设备上记住我（7天）
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={() => handleSubmit(code.join(""))}
          className="w-full"
          disabled={!isComplete || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              验证中...
            </>
          ) : (
            "验证"
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="w-full"
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回登录
        </Button>
      </div>

      {/* Help */}
      <div className="text-center text-sm text-muted-foreground">
        <p>无法访问 Authenticator？</p>
        <p className="mt-1">
          使用{" "}
          <button
            type="button"
            onClick={() => {
              setUseBackupCode(true);
              setCode(["", "", "", "", "", ""]);
            }}
            className="text-primary hover:underline"
          >
            备份码
          </button>{" "}
          登录
        </p>
      </div>
    </div>
  );
}
