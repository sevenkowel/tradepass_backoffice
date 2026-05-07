"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, MapPin, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useKYCStore } from "@/lib/kyc/store";
import { useKYCGuard } from "@/lib/kyc/guard-client";

export default function AddressProofPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const { setAddressProof, kycData } = useKYCStore();
  const { allowed, checking } = useKYCGuard("address-proof");

  if (checking) {
    return <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--tp-accent-rgb))]" /></div>;
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setAddressProof(url, file.type);
      setUploaded(true);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    router.push("/portal/kyc/experience");
  };

  const handleBack = () => router.push("/portal/kyc/liveness");

  return (
    <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Button variant="ghost" onClick={handleBack} className="mb-4 -ml-4 text-[rgba(var(--tp-fg-rgb),0.7)]"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)]"><MapPin className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" /></div>
            <div><h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">地址证明</h1><p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">Step 4 • 上传地址证明文件</p></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <div className="p-6 rounded-xl bg-[rgba(var(--tp-fg-rgb),0.03)] border border-[rgba(var(--tp-fg-rgb),0.08)] text-center">
            <MapPin className="w-12 h-12 text-[rgba(var(--tp-fg-rgb),0.3)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[rgb(var(--tp-fg-rgb))] mb-2">上传地址证明</h3>
            <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)] mb-6">请上传 3 个月内的水电账单、银行对账单或政府信件（支持 PDF/JPG/PNG）</p>
            
            {uploaded ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">✅ 文件已上传</div>
                <Button onClick={handleNext} className="w-full h-11 bg-[var(--tp-accent)] text-white">继续 →</Button>
              </div>
            ) : (
              <label className="inline-flex flex-col items-center gap-3 p-8 rounded-xl border-2 border-dashed border-[rgba(var(--tp-fg-rgb),0.15)] hover:border-[rgb(var(--tp-accent-rgb))] cursor-pointer transition-colors">
                <Upload className="w-8 h-8 text-[rgba(var(--tp-fg-rgb),0.4)]" />
                <span className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">{isUploading ? "上传中..." : "点击选择文件"}</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} disabled={isUploading} className="hidden" />
              </label>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
