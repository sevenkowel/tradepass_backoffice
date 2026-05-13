"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/crm/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { AlertTriangle, Loader2, ShieldOff } from "lucide-react";

interface Disable2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Disable2FADialog({ open, onOpenChange }: Disable2FADialogProps) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"password" | "code">("password");
  const { disable, isLoadingAction, error, clearError } = useTwoFAStore();

  useEffect(() => {
    if (!open) {
      setPassword("");
      setCode(["", "", "", "", "", ""]);
      setStep("password");
      clearError();
    }
  }, [open, clearError]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      setStep("code");
      clearError();
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`disable-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`disable-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleDisable = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    const success = await disable(password, fullCode);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ShieldOff className="w-5 h-5" />
            禁用双因素认证
          </DialogTitle>
          <DialogDescription>
            禁用 2FA 会降低账户安全性，请谨慎操作
          </DialogDescription>
        </DialogHeader>

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">安全警告</p>
                <p className="mt-0.5">
                  禁用 2FA 后，您的账户将仅通过密码保护。建议保持 2FA 开启。
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disable-password">登录密码</Label>
              <Input
                id="disable-password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-600">{error.message}</p>}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="flex-1"
                disabled={!password}
              >
                继续
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              请输入 Authenticator 应用中的 6 位验证码以确认禁用
            </p>

            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`disable-code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoadingAction}
                  className="w-12 h-14 text-center text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {error && (
              <div className="text-center">
                <p className="text-sm text-red-600">{error.message}</p>
                {error.remainingAttempts !== undefined && (
                  <p className="text-xs text-red-500 mt-1">
                    剩余尝试次数: {error.remainingAttempts}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setStep("password")}
                disabled={isLoadingAction}
              >
                返回
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                disabled={code.some((c) => !c) || isLoadingAction}
                onClick={handleDisable}
              >
                {isLoadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  "确认禁用"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
