"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, FileCheck, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AgreementSign } from "@/components/kyc/AgreementSign";
import { useKYCStore } from "@/lib/kyc/store";
import { useKYCGuard } from "@/lib/kyc/guard-client";
import { devFetch } from "@/lib/kyc/dev-fetch";

// Mock agreements - in production, fetch from API
const agreements = [
  {
    id: "client_agreement",
    title: "Client Agreement",
    content: `CLIENT AGREEMENT

This Client Agreement ("Agreement") is entered into between you ("Client") and TradePass ("Company").

1. SERVICES
The Company provides online trading services for foreign exchange, commodities, indices, and other financial instruments.

2. ACCOUNT OPENING
By opening an account with the Company, you confirm that:
- You are at least 18 years of age
- You have the legal capacity to enter into this Agreement
- All information provided is accurate and complete
- You understand the risks involved in trading

3. TRADING RISKS
You acknowledge that:
- Trading leveraged products carries a high level of risk
- You may lose all your invested capital
- Past performance is not indicative of future results
- You should not trade with money you cannot afford to lose

4. DEPOSITS AND WITHDRAWALS
- All deposits must come from accounts in your name
- Withdrawals will be processed to the original source where possible
- The Company reserves the right to request additional documentation

5. FEES AND CHARGES
- Spreads and commissions as outlined on the website
- Overnight financing charges may apply
- Inactivity fees after 12 months of no trading

6. TERMINATION
Either party may terminate this Agreement with written notice. Upon termination, all open positions may be closed.

By accepting this Agreement, you confirm that you have read, understood, and agree to be bound by these terms.`,
    required: true,
  },
  {
    id: "risk_disclosure",
    title: "Risk Disclosure Statement",
    content: `RISK DISCLOSURE STATEMENT

IMPORTANT: PLEASE READ CAREFULLY

Trading foreign exchange, contracts for differences, and other financial instruments on margin carries a HIGH LEVEL OF RISK and may not be suitable for all investors.

KEY RISKS:

1. LEVERAGE RISK
Leverage allows you to control a large position with a relatively small deposit. While this can magnify profits, it also magnifies losses. You may lose more than your initial investment.

2. MARKET RISK
Financial markets are volatile and unpredictable. Prices can change rapidly due to economic events, political developments, or market sentiment.

3. LIQUIDITY RISK
In certain market conditions, you may not be able to close positions at desired prices.

4. TECHNOLOGY RISK
System failures, internet connectivity issues, or platform malfunctions may affect your ability to trade.

5. COUNTERPARTY RISK
The Company is your counterparty for all trades. If the Company becomes insolvent, you may lose your funds.

6. CURRENCY RISK
Trading in currencies other than your base currency exposes you to exchange rate fluctuations.

ACKNOWLEDGMENT:
By accepting this Risk Disclosure, you confirm that:
- You understand the risks involved in trading
- You have sufficient knowledge and experience to trade
- You can afford to lose your entire investment
- You have sought independent financial advice if necessary`,
    required: true,
  },
  {
    id: "privacy_policy",
    title: "Privacy Policy",
    content: `PRIVACY POLICY

1. DATA COLLECTION
We collect personal information including:
- Identity information (name, date of birth, ID documents)
- Contact information (address, phone, email)
- Financial information (income, net worth, trading history)
- Technical information (IP address, device information)

2. DATA USE
Your information is used for:
- Account verification and KYC compliance
- Providing trading services
- Fraud prevention and security
- Regulatory compliance
- Marketing communications (with your consent)

3. DATA SHARING
We may share your information with:
- Regulatory authorities as required by law
- Service providers who assist our operations
- Payment processors for transactions
- Credit reference agencies

4. DATA SECURITY
We implement appropriate technical and organizational measures to protect your personal data.

5. YOUR RIGHTS
You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data (subject to legal requirements)
- Object to processing for marketing purposes
- Withdraw consent at any time

6. DATA RETENTION
We retain your data for as long as necessary to fulfill the purposes outlined in this policy and to comply with legal obligations.

7. COOKIES
Our website uses cookies to enhance user experience and analyze website traffic.

By accepting this Privacy Policy, you acknowledge that you have read and understood how we collect, use, and protect your personal information.`,
    required: true,
  },
  {
    id: "aml_policy",
    title: "Anti-Money Laundering Policy",
    content: `ANTI-MONEY LAUNDERING (AML) POLICY

1. COMPLIANCE COMMITMENT
TradePass is committed to preventing money laundering and terrorist financing activities. We comply with all applicable AML laws and regulations.

2. CUSTOMER DUE DILIGENCE
We conduct thorough identity verification for all clients, including:
- Identity document verification
- Proof of address verification
- Source of funds verification
- Ongoing transaction monitoring

3. PROHIBITED ACTIVITIES
The following activities are strictly prohibited:
- Using the platform for money laundering
- Structuring transactions to avoid reporting thresholds
- Using third-party accounts for deposits/withdrawals
- Providing false or misleading information

4. TRANSACTION MONITORING
All transactions are monitored for suspicious activity. We may:
- Request additional documentation
- Delay or refuse transactions
- Report suspicious activity to authorities
- Terminate accounts violating AML policies

5. RECORD KEEPING
We maintain records of all transactions and client information for the period required by law.

6. TRAINING
Our staff receives regular AML training to ensure compliance.

7. REPORTING
We report suspicious transactions to relevant financial intelligence units as required by law.

By accepting this AML Policy, you confirm that:
- You will not use our services for illegal activities
- All funds deposited are from legitimate sources
- You will provide accurate and truthful information
- You understand we may report suspicious activities`,
    required: true,
  },
];

export default function AgreementsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    setAgreementSignatures,
    setStatus,
    kycData,
    regionCode,
  } = useKYCStore();

  // Step guard
  const { allowed, checking } = useKYCGuard("agreement");

  if (checking) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--tp-accent-rgb))]" />
      </div>
    );
  }

  const handleSubmit = async (signatures: { agreementId: string; signature: string }[]) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Save signatures to store
      const fullSignatures = signatures.map(sig => ({
        ...sig,
        agreementName: agreements.find(a => a.id === sig.agreementId)?.title || "",
        version: "1.0",
        signedAt: new Date().toISOString(),
        ipAddress: "", // Would be filled by server
        userAgent: navigator.userAgent,
      }));

      setAgreementSignatures(fullSignatures);

      // Build complete submit payload from store data
      const payload = {
        regionCode,
        kycLevel: kycData?.kycLevel || "basic",
        documents: {
          type: kycData?.documentType,
          frontUrl: kycData?.documentFrontUrl,
          backUrl: kycData?.documentBackUrl,
          selfieUrl: kycData?.selfieUrl,
        },
        personalInfo: kycData?.personalInfo,
        ocrConfidence: kycData?.ocrConfidence || 0.9,
        livenessPassed: kycData?.livenessPassed || false,
      };

      // Submit KYC application
      const response = await devFetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `提交失败 (${response.status})`);
      }

      const data = await response.json();
      setStatus(data.status || "submitted");
      setIsSuccess(true);

      // Redirect to status page after a delay
      setTimeout(() => {
        router.push("/portal/kyc/status");
      }, 2000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "提交失败，请稍后重试";
      setSubmitError(message);
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[rgb(var(--tp-bg-rgb))] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))] mb-2">
            Application Submitted!
          </h2>
          <p className="text-[rgba(var(--tp-fg-rgb),0.7)] mb-6">
            Your KYC application has been submitted successfully.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[rgba(var(--tp-fg-rgb),0.5)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to status page...
          </div>
        </motion.div>
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
            onClick={() => router.push("/portal/kyc/personal-info")}
            className="mb-4 -ml-4 text-[rgba(var(--tp-fg-rgb),0.7)]"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[rgba(var(--tp-accent-rgb),0.1)]">
              <FileCheck className="w-6 h-6 text-[rgb(var(--tp-accent-rgb))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--tp-fg-rgb))]">
                Agreements
              </h1>
              <p className="text-sm text-[rgba(var(--tp-fg-rgb),0.6)]">
                Step 4 of 4 • Review and sign agreements
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
            <div className="h-full w-full bg-[rgb(var(--tp-accent-rgb))] rounded-full" />
          </div>
          <div className="flex justify-between mt-2 text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">
            <span className="text-[rgb(var(--tp-accent-rgb))]">Document</span>
            <span className="text-[rgb(var(--tp-accent-rgb))]">Liveness</span>
            <span className="text-[rgb(var(--tp-accent-rgb))]">Personal Info</span>
            <span className="text-[rgb(var(--tp-accent-rgb))] font-medium">Agreement</span>
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
              <CardTitle>Review & Sign Agreements</CardTitle>
              <CardDescription>
                Please read through the following agreements carefully. You must accept all required agreements to complete your KYC application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">提交失败</p>
                    <p className="text-xs text-red-600">{submitError}</p>
                  </div>
                </div>
              )}
              <AgreementSign
                agreements={agreements}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
