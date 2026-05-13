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
import { formatSecret } from "@/lib/backoffice/twofa-utils";
import { RefreshCw, Loader2, ArrowRight, Copy, Check, AlertTriangle } from "lucide-react";

interface Reconfigure2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Reconfigure2FADialog({ open, onOpenChange }: Reconfigure2FADialogProps) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"verify" | "qrcode" | "confirm">("verify");
  const [copied, setCopied] = useState(false);
  const { reconfigure, verifySetup, setupData, backupCodes, isLoadingAction, error, clearError, clearSetup } = useTwoFAStore();

  useEffect(() => {
    if (!open) {
      setPassword("");
      setCode(["", "", "", "", "", ""]);
      setStep("verify");
      setCopied(false);
      clearSetup();
      clearError();
    }
  }, [open, clearSetup, clearError]);

  const handleVerify = async () => {
    if (!password) return;
    const success = await reconfigure(password, code.join(""));
    if (success) {
      setStep("qrcode");
      setCode(["", "", "", "", "", ""]);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`reconfig-code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`reconfig-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyNew = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) return;

    const success = await verifySetup(fullCode);
    if (success) {
      setStep("confirm");
    }
  };

  const handleCopy = async () => {
    if (!setupData?.secret) return;
    await navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleComplete = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            重新配置 2FA
          </DialogTitle>
          <DialogDescription>
            重新配置将生成新的密钥和备份码，旧备份码将失效
          </DialogDescription>
        </DialogHeader>

        {step === "verify" && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">注意</p>
                <p className="mt-0.5">
                  重新配置后，旧备份码将全部失效，请保存新的备份码。
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reconfig-password">登录密码</Label>
              <Input
                id="reconfig-password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>当前 2FA 验证码</Label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`reconfig-code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoadingAction}
                    className="w-12 h-12 text-center text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
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
                type="button"
                className="flex-1"
                disabled={!password || code.some((c) => !c) || isLoadingAction}
                onClick={handleVerify}
              >
                {isLoadingAction ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    验证中...
                  </>
                ) : (
                  <>
                    验证并继续
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "qrcode" && setupData && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              扫描新的二维码完成重新配置
            </p>

            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-lg border">
                <img
                  src={setupData.qrCodeUrl}
                  alt="New 2FA QR Code"
                  className="w-36 h-36"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono text-center">
                {formatSecret(setupData.secret)}
              </code>
              <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>输入新验证码</Label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`new-code-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoadingAction}
                    className="w-12 h-12 text-center text-lg font-semibold border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error.message}</p>}

            <Button
              onClick={handleVerifyNew}
              className="w-full"
              disabled={code.some((c) => !c) || isLoadingAction}
            >
              {isLoadingAction ? "验证中..." : "验证并启用"}
            </Button>
          </div>
        )}

        {step === "confirm" && backupCodes && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-700">
                重新配置成功！
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                请保存新的备份码，旧备份码已失效
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <code
                    key={index}
                    className="text-sm font-mono bg-background px-3 py-2 rounded border text-center"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <Button onClick={handleComplete} className="w-full">
              完成
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
