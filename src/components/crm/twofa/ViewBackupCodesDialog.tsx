"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/crm/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { Loader2, Lock, Eye, Download, Copy, Check } from "lucide-react";

interface ViewBackupCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewBackupCodesDialog({ open, onOpenChange }: ViewBackupCodesDialogProps) {
  const [password, setPassword] = useState("");
  const [showCodes, setShowCodes] = useState(false);
  const [copied, setCopied] = useState(false);
  const { viewBackupCodes, backupCodes, isLoadingAction, error, clearError } = useTwoFAStore();

  useEffect(() => {
    if (!open) {
      setPassword("");
      setShowCodes(false);
      clearError();
    }
  }, [open, clearError]);

  const handleVerify = async () => {
    if (!password) return;
    const codes = await viewBackupCodes(password);
    if (codes) {
      setShowCodes(true);
    }
  };

  const handleCopy = async () => {
    if (!backupCodes) return;
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!backupCodes) return;
    const content = [
      "TradePass 2FA 备份码",
      "生成时间: " + new Date().toLocaleString(),
      "",
      "这些备份码每个只能使用一次，请妥善保存！",
      "",
      ...backupCodes,
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tradepass-backup-codes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>查看备份码</DialogTitle>
        </DialogHeader>

        {!showCodes ? (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                请输入登录密码以查看备份码
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-password">登录密码</Label>
              <Input
                id="view-password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoadingAction}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error.message}</p>
            )}

            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={!password || isLoadingAction}
            >
              {isLoadingAction ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  验证中...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  查看备份码
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              您的备份码（每个只能使用一次）
            </p>

            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes?.map((code, index) => (
                  <code
                    key={index}
                    className="text-sm font-mono bg-background px-3 py-2 rounded border text-center"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleCopy} className="flex-1">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={handleDownload} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                下载
              </Button>
            </div>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              关闭
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
