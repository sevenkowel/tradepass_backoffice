"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Settings, AlertCircle, Check } from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const leverageOptions = [
  { value: "1:1", label: "1:1", risk: "low", description: "无杠杆，适合保守交易" },
  { value: "1:10", label: "1:10", risk: "low", description: "低风险，适合初学者" },
  { value: "1:20", label: "1:20", risk: "low", description: "低风险，适合初学者" },
  { value: "1:50", label: "1:50", risk: "medium", description: "中等风险，平衡收益" },
  { value: "1:100", label: "1:100", risk: "medium", description: "中等风险，常用杠杆" },
  { value: "1:200", label: "1:200", risk: "high", description: "高风险，需要经验" },
  { value: "1:500", label: "1:500", risk: "high", description: "极高风险，专业交易" },
];

const mockAccount = {
  id: "MT5-8843201",
  type: "Real",
  currentLeverage: "1:100",
};

export default function LeveragePage() {
  const params = useParams();
  const accountId = params.id as string;
  const [selectedLeverage, setSelectedLeverage] = useState(mockAccount.currentLeverage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // 模拟 API 调用
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low":
        return "低风险";
      case "medium":
        return "中等风险";
      case "high":
        return "高风险";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        返回 Dashboard
      </Link>

      <PageHeader
        title="调整杠杆"
        description={`修改账户 ${accountId} 的杠杆倍数`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 杠杆选择 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl border-2 border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Settings size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">选择杠杆倍数</h2>
              <p className="text-sm text-gray-500">当前杠杆: {mockAccount.currentLeverage}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {leverageOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedLeverage(option.value)}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectedLeverage === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800">{option.label}</span>
                  {selectedLeverage === option.value && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded border", getRiskColor(option.risk))}>
                  {getRiskLabel(option.risk)}
                </span>
              </button>
            ))}
          </div>

          {/* 选中详情 */}
          {selectedLeverage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <p className="text-sm text-gray-600">
                {leverageOptions.find((o) => o.value === selectedLeverage)?.description}
              </p>
            </motion.div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 mt-6">
            <Link
              href="/portal/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium text-center hover:bg-gray-200 transition-colors"
            >
              取消
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedLeverage === mockAccount.currentLeverage}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium text-center transition-all",
                isSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-[var(--tp-accent)] text-white hover:opacity-90",
                (isSubmitting || selectedLeverage === mockAccount.currentLeverage) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? "保存中..." : isSuccess ? "保存成功" : "确认修改"}
            </button>
          </div>
        </motion.div>

        {/* 风险提示 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <h3 className="font-bold text-amber-800">风险提示</h3>
          </div>
          <ul className="space-y-3 text-sm text-amber-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              杠杆越高，潜在收益越大，但风险也越高
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              高杠杆可能导致快速亏损，请谨慎选择
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              修改杠杆后，现有持仓的保证金要求会相应变化
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              建议新手从低杠杆开始，逐步积累经验
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
