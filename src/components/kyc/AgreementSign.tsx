"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, AlertCircle, PenLine } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "./SignaturePad";
import { cn } from "@/lib/utils";

interface Agreement {
  id: string;
  title: string;
  content: string;
  required: boolean;
}

interface AgreementSignProps {
  agreements: Agreement[];
  onSubmit: (signatures: { agreementId: string; signature: string }[]) => void;
  isSubmitting?: boolean;
}

export function AgreementSign({ agreements, onSubmit, isSubmitting }: AgreementSignProps) {
  const [acceptedAgreements, setAcceptedAgreements] = useState<Set<string>>(new Set());
  const [signature, setSignature] = useState("");
  const [signatureMode, setSignatureMode] = useState<"text" | "handwritten">("text");
  const [scrolledAgreements, setScrolledAgreements] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleAgreementToggle = (agreementId: string, checked: boolean) => {
    setAcceptedAgreements(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(agreementId);
      } else {
        newSet.delete(agreementId);
      }
      return newSet;
    });
    setError(null);
  };

  const handleScroll = (agreementId: string, e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isScrolledToBottom = 
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    
    if (isScrolledToBottom) {
      setScrolledAgreements(prev => new Set([...prev, agreementId]));
    }
  };

  const allRequiredAccepted = agreements
    .filter(a => a.required)
    .every(a => acceptedAgreements.has(a.id));

  const handleSubmit = () => {
    if (!allRequiredAccepted) {
      setError("Please accept all required agreements");
      return;
    }
    
    if (!signature.trim()) {
      setError(signatureMode === "text" ? "请输入您的姓名" : "请完成手写签名");
      return;
    }

    const signatures = Array.from(acceptedAgreements).map(agreementId => ({
      agreementId,
      signature: signature.trim(),
    }));

    onSubmit(signatures);
  };

  return (
    <div className="space-y-6">
      {/* Agreements List */}
      <div className="space-y-4">
        {agreements.map((agreement, index) => {
          const isAccepted = acceptedAgreements.has(agreement.id);
          const isScrolled = scrolledAgreements.has(agreement.id);
          
          return (
            <motion.div
              key={agreement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "border-2 transition-colors",
                isAccepted ? "border-[rgb(var(--tp-accent-rgb))]" : "border-[rgba(var(--tp-fg-rgb),0.1)]"
              )}>
                <CardContent className="p-4 space-y-4">
                  {/* Agreement Header */}
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-[rgb(var(--tp-accent-rgb))] mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-[rgb(var(--tp-fg-rgb))]">
                        {agreement.title}
                        {agreement.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </h3>
                      <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.6)]">
                        {agreement.required ? "Required" : "Optional"}
                      </p>
                    </div>
                    {isAccepted && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {/* Agreement Content */}
                  <div
                    ref={el => {
                      if (el) scrollRefs.current.set(agreement.id, el);
                    }}
                    onScroll={(e) => handleScroll(agreement.id, e)}
                    className="h-40 overflow-y-auto p-4 rounded-lg bg-[rgba(var(--tp-fg-rgb),0.03)] text-sm text-[rgba(var(--tp-fg-rgb),0.8)] leading-relaxed"
                  >
                    {agreement.content}
                  </div>

                  {/* Scroll Indicator */}
                  {!isScrolled && !isAccepted && (
                    <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.5)] text-center">
                      Please scroll to the end to continue
                    </p>
                  )}

                  {/* Accept Checkbox */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={agreement.id}
                      checked={isAccepted}
                      disabled={!isScrolled}
                      onCheckedChange={(checked) => handleAgreementToggle(agreement.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={agreement.id}
                      className={cn(
                        "text-sm font-normal cursor-pointer",
                        !isScrolled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      I have read and agree to the {agreement.title}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Signature Section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <PenLine size={14} /> 签名 <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-1 bg-[rgba(var(--tp-fg-rgb),0.05)] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSignatureMode("text")}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${signatureMode === "text" ? "bg-white shadow-sm text-[rgb(var(--tp-accent-rgb))] font-medium" : "text-gray-500"}`}
                >
                  文本签名
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode("handwritten")}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${signatureMode === "handwritten" ? "bg-white shadow-sm text-[rgb(var(--tp-accent-rgb))] font-medium" : "text-gray-500"}`}
                >
                  手写签名
                </button>
              </div>
            </div>
            {signatureMode === "text" ? (
              <Input
                id="signature"
                value={signature}
                onChange={(e) => { setSignature(e.target.value); setError(null); }}
                placeholder="输入您的姓名"
                className="bg-[rgb(var(--tp-surface-rgb))]"
              />
            ) : (
              <SignaturePad onChange={(dataUrl) => { setSignature(dataUrl); setError(null); }} />
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !allRequiredAccepted || !signature.trim()}
            className="w-full h-12 bg-tp-accent hover:bg-tp-accent-hover text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit KYC Application"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
