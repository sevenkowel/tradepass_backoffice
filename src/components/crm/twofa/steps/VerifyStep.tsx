"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/crm/ui";
import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { ArrowLeft, ArrowRight, Shield } from "lucide-react";

interface VerifyStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function VerifyStep({ onBack, onNext }: VerifyStepProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verifySetup, isLoadingAction } = useTwoFAStore();

  const handleChange = (index: number, value: string) => {
    // 只接受数字
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // 只取最后一个字符
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
      // 退格且当前为空，聚焦到上一个
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullCode: string) => {
    if (fullCode.length !== 6 || isLoadingAction) return;

    const success = await verifySetup(fullCode);
    if (success) {
      onNext();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      handleSubmit(pasted);
    }
  };

  const isComplete = code.every((c) => c !== "");

  return (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">验证配置</h3>
        <p className="text-sm text-muted-foreground mt-1">
          请输入 Authenticator 应用中的 6 位验证码
        </p>
      </div>

      {/* Code Input */}
      <div className="flex justify-center gap-2">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoadingAction}
            className="w-12 h-14 text-center text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
            autoFocus={index === 0}
          />
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        验证码每 30 秒自动更新
      </p>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          className="flex-1"
          disabled={isLoadingAction}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit(code.join(""))}
          className="flex-1"
          disabled={!isComplete || isLoadingAction}
        >
          {isLoadingAction ? (
            "验证中..."
          ) : (
            <>
              验证
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
