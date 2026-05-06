"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Archive, AlertTriangle, Check, X } from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";

const mockAccount = {
  id: "MT5-8843201",
  type: "Real",
  balance: 0,
  equity: 0,
  openPositions: 0,
  pendingOrders: 0,
};

export default function ArchivePage() {
  const params = useParams();
  const accountId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // 检查是否可以存档
  const canArchive = mockAccount.balance === 0 && 
                     mockAccount.openPositions === 0 && 
                     mockAccount.pendingOrders === 0;

  const handleSubmit = async () => {
    if (!confirmed) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft size={16} />
        返回 Dashboard
      </Link>

      <PageHeader
        title="存档账户"
        description={`存档账户 ${accountId}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Archive size={20} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">存档确认</h2>
              <p className="text-sm text-gray-500">存档后账户将变为只读状态</p>
            </div>
          </div>

          {!canArchive ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">无法存档</h4>
                  <p className="text-sm text-red-700">
                    账户存在以下未处理事项，请先处理后再存档：
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {mockAccount.balance > 0 && (
                      <li className="flex items-center gap-2">
                        <X size={14} />
                        账户余额不为零 ({formatCurrency(mockAccount.balance)})
                      </li>
                    )}
                    {mockAccount.openPositions > 0 && (
                      <li className="flex items-center gap-2">
                        <X size={14} />
                        存在持仓订单 ({mockAccount.openPositions} 个)
                      </li>
                    )}
                    {mockAccount.pendingOrders > 0 && (
                      <li className="flex items-center gap-2">
                        <X size={14} />
                        存在挂单 ({mockAccount.pendingOrders} 个)
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">存档须知</h4>
                    <ul className="space-y-2 text-sm text-amber-700">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        存档后账户将进入只读模式，无法进行交易
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        历史交易记录和资金记录仍然可以查看
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        可以随时联系客服恢复账户为活跃状态
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500">•</span>
                        存档不影响账户资金安全
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors mb-6">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  我已了解存档账户的影响，确认要存档此账户
                </span>
              </label>
            </>
          )}

          <div className="flex gap-3">
            <Link
              href="/portal/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium text-center hover:bg-gray-200 transition-colors"
            >
              取消
            </Link>
            {canArchive && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !confirmed || isSuccess}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-medium text-center transition-all",
                  isSuccess
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-500 text-white hover:bg-amber-600",
                  (isSubmitting || !confirmed) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? "存档中..." : isSuccess ? "存档成功" : "确认存档"}
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-4">账户状态检查</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-sm text-gray-600">账户余额</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    mockAccount.balance === 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formatCurrency(mockAccount.balance)}
                  </span>
                  {mockAccount.balance === 0 ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <X size={16} className="text-red-600" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-sm text-gray-600">持仓订单</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    mockAccount.openPositions === 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {mockAccount.openPositions} 个
                  </span>
                  {mockAccount.openPositions === 0 ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <X size={16} className="text-red-600" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-sm text-gray-600">挂单</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    mockAccount.pendingOrders === 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {mockAccount.pendingOrders} 个
                  </span>
                  {mockAccount.pendingOrders === 0 ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <X size={16} className="text-red-600" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6">
            <h3 className="font-bold text-blue-800 mb-2">需要帮助？</h3>
            <p className="text-sm text-blue-700 mb-3">
              如果您不确定是否要存档账户，或者有其他疑问，可以联系我们的客服团队。
            </p>
            <Link
              href="/portal/support"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              联系客服 →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
