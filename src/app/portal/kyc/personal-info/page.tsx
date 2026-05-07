"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PersonalInfoForm } from "@/components/kyc/PersonalInfoForm";
import { useKYCStore } from "@/lib/kyc/store";
import { useKYCGuard } from "@/lib/kyc/guard-client";
import { devFetch } from "@/lib/kyc/dev-fetch";
import { getRegionConfig } from "@/lib/kyc/region-config";
import type { PersonalInfo } from "@/lib/kyc/types";
import type { RegionKYCConfig } from "@/lib/kyc/region-config";

export default function PersonalInfoPage() {
  const router = useRouter();
  const [regionConfig, setRegionConfig] = useState<RegionKYCConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    setPersonalInfo,
    setCurrentStep,
    regionCode,
    kycData,
  } = useKYCStore();

  // Step guard
  const { allowed, checking: guardChecking } = useKYCGuard("experience");

  useEffect(() => {
    if (regionCode) {
      try {
        const config = getRegionConfig(regionCode);
        setRegionConfig(config);
      } catch (error) {
        console.error("Error loading region config:", error);
      }
    }
    setIsLoading(false);
  }, [regionCode]);

  const handleSubmit = async (data: PersonalInfo) => {
    setPersonalInfo(data);
    setCurrentStep(4);

    // 自动保存步骤到数据库
    try {
      await devFetch("/api/kyc/save-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 3,
          data: {
            personalInfo: data,
          },
        }),
      });
    } catch (saveErr) {
      console.warn("Auto-save step 3 failed:", saveErr);
    }

    router.push("/portal/kyc/agreements");
  };

  // Extract initial data from OCR result
  const getInitialData = (): Partial<PersonalInfo> => {
    if (!kycData?.ocrData) return {};
    
    return {
      fullName: kycData.ocrData.fullName,
      dateOfBirth: kycData.ocrData.dateOfBirth,
      nationality: kycData.ocrData.nationality,
      address: kycData.ocrData.address,
    };
  };

  if (isLoading || guardChecking) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--tp-accent-rgb))]" />
      </div>
    );
  }

  if (!regionConfig) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[rgba(var(--tp-fg-rgb),0.7)]">Please select your region first.</p>
          <Button 
            onClick={() => router.push("/portal/kyc")}
            className="mt-4"
          >
            Go to KYC Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/portal/kyc/liveness")}
            className="mb-4 -ml-4 text-[rgba(var(--tp-fg-rgb),0.7)]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)]">
              <User className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">
                Personal Information
              </h1>
              <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">
                Step 3 of 4 • Complete your profile
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
            <div className="h-full w-3/4 bg-[rgb(var(--tp-accent-rgb))] rounded-full" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">
            <span className="text-[rgb(var(--tp-accent-rgb))]">Document</span>
            <span className="text-[rgb(var(--tp-accent-rgb))]">Liveness</span>
            <span className="text-[rgb(var(--tp-accent-rgb))] font-medium">Personal Info</span>
            <span>Agreement</span>
          </div>
        </motion.div>

        {/* Region Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(var(--tp-accent-rgb),0.1)] text-[rgb(var(--tp-accent-rgb))] text-sm">
            <span className="font-medium">Region:</span>
            <span>{regionConfig.regionName}</span>
            <span className="text-[rgba(var(--tp-fg-rgb),0.5)]">|</span>
            <span className="font-medium">KYC Level:</span>
            <span className="capitalize">{regionConfig.kycLevel}</span>
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
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                Please provide accurate information. Some fields may be pre-filled from your document OCR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalInfoForm
                regionConfig={regionConfig}
                onSubmit={handleSubmit}
                initialData={getInitialData()}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
