"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ScanFace, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LivenessCheck } from "@/components/kyc/LivenessCheck";
import { useKYCStore } from "@/lib/kyc/store";
import { useKYCGuard } from "@/lib/kyc/guard-client";
import { devFetch } from "@/lib/kyc/dev-fetch";
import { getRegionConfig } from "@/lib/kyc/region-config";

export default function LivenessPage() {
  const router = useRouter();
  const { setLivenessResult, setCurrentStep, regionCode } = useKYCStore();

  // Step guard
  const { allowed, checking } = useKYCGuard("liveness");

  if (checking) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--tp-accent-rgb))]" />
      </div>
    );
  }

  // Check if liveness is required for this region
  const isLivenessRequired = regionCode
    ? getRegionConfig(regionCode).features.livenessRequired
    : true;

  const handleComplete = async (success: boolean, videoData?: string) => {
    if (success) {
      setLivenessResult(true, videoData);
      setCurrentStep(3);

      // 自动保存步骤到数据库
      try {
        await devFetch("/api/kyc/save-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: 2,
            data: {
              livenessPassed: true,
              livenessVideoUrl: videoData,
            },
          }),
        });
      } catch (saveErr) {
        console.warn("Auto-save step 2 failed:", saveErr);
      }

      router.push("/portal/kyc/personal-info");
    }
  };

  const handleSkip = () => {
    // Skip liveness if not required
    setLivenessResult(true);
    setCurrentStep(3);
    router.push("/portal/kyc/personal-info");
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/portal/kyc/document")}
            className="mb-4 -ml-4 text-[rgba(var(--tp-fg-rgb),0.7)]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)]">
              <ScanFace className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">
                Liveness Check
              </h1>
              <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">
                Step 2 of 4 • Verify you are a real person
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className="mb-8"
        >
          <div className="h-2 bg-[rgba(var(--tp-fg-rgb),0.1)] rounded-full overflow-hidden">
            <div className="h-full w-2/4 bg-[rgb(var(--tp-accent-rgb))] rounded-full" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">
            <span className="text-[rgb(var(--tp-accent-rgb))]">Document</span>
            <span className="text-[rgb(var(--tp-accent-rgb))] font-medium">Liveness</span>
            <span>Personal Info</span>
            <span>Agreement</span>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Face Verification</CardTitle>
              <CardDescription>
                {isLivenessRequired 
                  ? "Please follow the on-screen instructions to verify your identity. This helps us ensure you are a real person."
                  : "Liveness check is optional for your region. You can skip this step if you prefer."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LivenessCheck
                onComplete={handleComplete}
                onSkip={!isLivenessRequired ? handleSkip : undefined}
                maxAttempts={3}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          <div className="p-4 rounded-xl bg-[rgba(var(--tp-fg-rgb),0.05)]">
            <h4 className="text-sm font-medium text-[rgb(var(--tp-fg-rgb))] mb-1">Good Lighting</h4>
            <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.6)]">Make sure your face is well lit</p>
          </div>
          <div className="p-4 rounded-xl bg-[rgba(var(--tp-fg-rgb),0.05)]">
            <h4 className="text-sm font-medium text-[rgb(var(--tp-fg-rgb))] mb-1">Clear View</h4>
            <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.6)]">Remove glasses, masks, or hats</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
