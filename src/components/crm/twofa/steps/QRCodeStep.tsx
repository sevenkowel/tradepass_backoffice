"use client";

import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { Button } from "@/components/crm/ui";
import { formatSecret } from "@/lib/backoffice/twofa-utils";
import { Copy, Check, ArrowLeft, ArrowRight, Smartphone } from "lucide-react";
import { useState } from "react";

interface QRCodeStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function QRCodeStep({ onBack, onNext }: QRCodeStepProps) {
  const { setupData } = useTwoFAStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!setupData?.secret) return;
    await navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!setupData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">配置数据加载失败，请返回重试</p>
        <Button onClick={onBack} variant="secondary" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Smartphone className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">扫描二维码</h3>
        <p className="text-sm text-muted-foreground mt-1">
          使用 Authenticator 应用扫描下方二维码
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
        <p>1. 在手机上安装 Google Authenticator 或 Microsoft Authenticator</p>
        <p>2. 打开应用，点击&ldquo;添加账户&rdquo;或&ldquo;+&rdquo;</p>
        <p>3. 扫描二维码或手动输入密钥</p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-3 rounded-lg border">
          <img
            src={setupData.qrCodeUrl}
            alt="2FA QR Code"
            className="w-40 h-40"
          />
        </div>
      </div>

      {/* Secret Key */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground text-center">或手动输入密钥</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono text-center">
            {formatSecret(setupData.secret)}
          </code>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
        <Button type="button" onClick={onNext} className="flex-1">
          下一步
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
