"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Trash2, AlertTriangle, Check, X } from "lucide-react";
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

export default function DeletePage() {
  const params = useParams();
  const accountId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [agreed, setAgreed] = useState(false);

  // 检查是否可以删除
  const canDelete = mockAccount.balance === 0 && 
                    mockAccount.openPositions === 0 && 
                    mockAccount.pendingOrders === 0;

  const isConfirmed = confirmText === accountId && agreed;

  const handleSubmit = async () => {
    if (!isConfirmed) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
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
        title="删除账户"
        description={`永久删除账户 ${accountId}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-red-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">危险操作</h2>
              <p className="text-sm text-gray-500">此操作不可撤销，请谨慎操作</p>
            </div>
          </div>

          {!canDelete ? (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">无法删除</h4>
                  <p className="text-sm text-red-700">
                    账户存在以下未处理事项，请先处理后再删除：
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
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-1">删除后果</h4>
                    <ul className="space-y-2 text-sm text-red-700">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        账户将被永久删除，无法恢复
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        所有交易历史将被归档，90天后彻底删除
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        关联的只读密码将立即失效
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        账户 ID 将被释放，可能被其他用户注册
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    我已充分了解删除账户的后果，确认要永久删除此账户
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    请输入账户 ID 以确认删除
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={accountId}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-red-500 transition-colors",
                      confirmText && confirmText !== accountId
                        ? "border-red-300"
                        : "border-gray-200"
                    )}
                  />
                  {confirmText && confirmText !== accountId && (
                    <p className="mt-1 text-sm text-red-600">账户 ID 不匹配</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Link
              href="/portal/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium text-center hover:bg-gray-200 transition-colors"
            >
              取消
            </Link>
            {canDelete && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isConfirmed || isSuccess}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-medium text-center transition-all",
                  isSuccess
                    ? "bg-emerald-500 text-white"
                    : "bg-red-600 text-white hover:bg-red-700",
                  (isSubmitting || !isConfirmed) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? "删除中..." : isSuccess ? "删除成功" : "确认删除"}
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

          <div className="bg-amber-50 rounded-2xl border-2 border-amber-200 p-6">
            <h3 className="font-bold text-amber-800 mb-2">建议</h3>
            <p className="text-sm text-amber-700 mb-3">
              如果您只是想暂时停用账户，建议先存档账户而不是删除。存档后账户将进入只读模式，随时可以恢复。
            </p>
            <Link
              href={`/portal/accounts/accounts/${accountId}/archive`}
              className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
            >
              前往存档账户 →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
