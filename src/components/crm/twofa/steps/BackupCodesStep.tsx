"use client";

import { useState } from "react";
import { Button } from "@/components/crm/ui";
import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { Check, Download, Copy, AlertTriangle } from "lucide-react";

interface BackupCodesStepProps {
  onComplete: () => void;
}

export function BackupCodesStep({ onComplete }: BackupCodesStepProps) {
  const { backupCodes } = useTwoFAStore();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

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

    setDownloaded(true);
  };

  if (!backupCodes) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">备份码加载失败</p>
        <Button onClick={onComplete} className="mt-4">
          完成
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-green-700">2FA 已成功启用！</h3>
        <p className="text-sm text-muted-foreground mt-1">
          请保存以下备份码，用于手机丢失时恢复账户
        </p>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">重要提示</p>
          <p className="mt-0.5">
            备份码只会显示这一次，每个码只能使用一次。请妥善保存！
          </p>
        </div>
      </div>

      {/* Backup Codes */}
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

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          className="flex-1"
        >
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
        <Button
          type="button"
          variant="secondary"
          onClick={handleDownload}
          className="flex-1"
        >
          <Download className="w-4 h-4 mr-2" />
          下载
        </Button>
      </div>

      <Button type="button" onClick={onComplete} className="w-full">
        完成
      </Button>
    </div>
  );
}
