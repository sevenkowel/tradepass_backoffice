"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Key, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/portal/widgets/PageHeader";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PasswordPage() {
  const params = useParams();
  const accountId = params.id as string;
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.oldPassword) {
      newErrors.oldPassword = "请输入原密码";
    }
    if (!formData.newPassword) {
      newErrors.newPassword = "请输入新密码";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "密码至少需要8位";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
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
        title="修改交易密码"
        description={`修改账户 ${accountId} 的交易密码`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Key size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">设置新密码</h2>
              <p className="text-sm text-gray-500">请设置一个安全的交易密码</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 原密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                原密码
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={formData.oldPassword}
                  onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors",
                    errors.oldPassword ? "border-red-300" : "border-gray-200"
                  )}
                  placeholder="输入原密码"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.oldPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.oldPassword}</p>
              )}
            </div>

            {/* 新密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新密码
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors",
                    errors.newPassword ? "border-red-300" : "border-gray-200"
                  )}
                  placeholder="至少8位字符"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                确认新密码
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-blue-500 transition-colors",
                    errors.confirmPassword ? "border-red-300" : "border-gray-200"
                  )}
                  placeholder="再次输入新密码"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Link
              href="/portal/dashboard"
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium text-center hover:bg-gray-200 transition-colors"
            >
              取消
            </Link>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium text-center transition-all",
                isSuccess
                  ? "bg-emerald-500 text-white"
                  : "bg-[var(--tp-accent)] text-white hover:opacity-90",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? "保存中..." : isSuccess ? "修改成功" : "确认修改"}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <h3 className="font-bold text-blue-800">密码安全提示</h3>
          </div>
          <ul className="space-y-3 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
              密码长度至少8位，建议包含大小写字母和数字
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
              避免使用生日、手机号等容易被猜到的信息
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
              定期更换密码可以提高账户安全性
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="text-blue-500 shrink-0 mt-0.5" />
              请勿将密码告知他人或在不安全的环境输入
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
