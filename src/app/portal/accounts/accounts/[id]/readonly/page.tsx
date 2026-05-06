"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Eye, Copy, Check, RefreshCw, AlertCircle, Shield } from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ReadonlyPasswordPage() {
  const params = useParams();
  const accountId = params.id as string;
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [readonlyPassword, setReadonlyPassword] = useState("Ro7#kP9$mN2");

  const copyPassword = () => {
    navigator.clipboard.writeText(readonlyPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    setIsResetting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // 生成随机密码
    const newPassword = "Ro" + Math.random().toString(36).substring(2, 10) + "#" + Math.random().toString(36).substring(2, 5);
    setReadonlyPassword(newPassword);
    setIsResetting(false);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
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
        title="只读密码"
        description={`查看或重置账户 ${accountId} 的只读密码`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Eye size={20} className="text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">当前只读密码</h2>
              <p className="text-sm text-gray-500">用于查看账户，无法进行交易</p>
            </div>
          </div>

          {/* 密码显示区域 */}
          <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-lg font-mono font-bold text-gray-800 tracking-wider">
                {readonlyPassword}
              </code>
              <button
                onClick={copyPassword}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-emerald-600" />
                    <span className="text-emerald-600">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 使用说明 */}
          <div className="p-4 bg-violet-50 rounded-xl border border-violet-200 mb-6">
            <h4 className="font-medium text-violet-800 mb-2">使用场景</h4>
            <ul className="space-y-2 text-sm text-violet-700">
              <li className="flex items-start gap-2">
                <span className="text-violet-500">•</span>
                分享给他人查看交易表现，但不暴露交易权限
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500">•</span>
                用于第三方交易分析工具的数据同步
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500">•</span>
                让家人或朋友了解账户情况而不担心误操作
              </li>
            </ul>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Link
              href="/portal/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium text-center hover:bg-gray-200 transition-colors"
            >
              返回
            </Link>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium text-center transition-all flex items-center justify-center gap-2",
                isSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-[var(--tp-accent)] text-white hover:opacity-90",
                isResetting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isResetting ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  重置中...
                </>
              ) : isSuccess ? (
                <>
                  <Check size={18} />
                  重置成功
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  重置密码
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* 安全提示 */}
          <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <Shield size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <h3 className="font-bold text-emerald-800">只读密码安全</h3>
            </div>
            <ul className="space-y-3 text-sm text-emerald-700">
              <li className="flex items-start gap-2">
                <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                只读密码只能查看账户信息，无法下单或修改设置
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                可以随时重置密码，旧密码立即失效
              </li>
              <li className="flex items-start gap-2">
                <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                建议定期更换只读密码以确保安全
              </li>
            </ul>
          </div>

          {/* 使用步骤 */}
          <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle size={20} className="text-gray-600 shrink-0 mt-0.5" />
              <h3 className="font-bold text-gray-800">如何使用</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center shrink-0 font-medium">1</span>
                复制上方只读密码
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center shrink-0 font-medium">2</span>
                在 MT5/MT4 登录时选择"只读登录"
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center shrink-0 font-medium">3</span>
                输入账户 ID 和只读密码即可查看
              </li>
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
