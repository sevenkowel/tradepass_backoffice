"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/crm/ui";
import { useTwoFAStore } from "@/store/crm/twoFAStore";
import { PasswordStep } from "./steps/PasswordStep";
import { QRCodeStep } from "./steps/QRCodeStep";
import { VerifyStep } from "./steps/VerifyStep";
import { BackupCodesStep } from "./steps/BackupCodesStep";
import { Loader2 } from "lucide-react";

interface Enable2FADialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "password" | "qrcode" | "verify" | "backup";

export function Enable2FADialog({ open, onOpenChange }: Enable2FADialogProps) {
  const [step, setStep] = useState<Step>("password");
  const { isLoadingAction, error, clearError, clearSetup } = useTwoFAStore();

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("password");
      clearSetup();
      clearError();
    }, 300);
  };

  const handleNext = () => {
    clearError();
    if (step === "password") setStep("qrcode");
    else if (step === "qrcode") setStep("verify");
    else if (step === "verify") setStep("backup");
  };

  const handleBack = () => {
    clearError();
    if (step === "qrcode") setStep("password");
    else if (step === "verify") setStep("qrcode");
  };

  const handleComplete = () => {
    handleClose();
  };

  const steps = [
    { id: "password", label: "验证身份", number: 1 },
    { id: "qrcode", label: "扫描二维码", number: 2 },
    { id: "verify", label: "验证配置", number: 3 },
    { id: "backup", label: "保存备份码", number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>启用双因素认证</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.number}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 ${
                    index < currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[280px]">
          {step === "password" && (
            <PasswordStep onNext={handleNext} />
          )}
          {step === "qrcode" && (
            <QRCodeStep onBack={handleBack} onNext={handleNext} />
          )}
          {step === "verify" && (
            <VerifyStep onBack={handleBack} onNext={handleNext} />
          )}
          {step === "backup" && (
            <BackupCodesStep onComplete={handleComplete} />
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error.message}</p>
            {error.remainingAttempts !== undefined && (
              <p className="text-xs text-red-500 mt-1">
                剩余尝试次数: {error.remainingAttempts}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
