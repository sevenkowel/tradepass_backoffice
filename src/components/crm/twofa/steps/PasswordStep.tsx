"use client";

import { useState } from "react";
import { Button } from "@/components/crm/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { Loader2, Lock } from "lucide-react";

interface PasswordStepProps {
  onNext: () => void;
}

export function PasswordStep({ onNext }: PasswordStepProps) {
  const [password, setPassword] = useState("");
  const { initSetup, isLoadingAction } = useTwoFAStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoadingAction) return;

    const success = await initSetup(password);
    if (success) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">验证身份</h3>
        <p className="text-sm text-muted-foreground mt-1">
          请输入当前登录密码以继续
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">登录密码</Label>
        <Input
          id="password"
          type="password"
          placeholder="请输入密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoadingAction}
          autoFocus
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!password || isLoadingAction}
      >
        {isLoadingAction ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            验证中...
          </>
        ) : (
          "下一步"
        )}
      </Button>
    </form>
  );
}
