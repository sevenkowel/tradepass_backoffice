"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SubmittedSuccessProps {
  onReset: () => void;
}

export function SubmittedSuccess({ onReset }: SubmittedSuccessProps) {
  useEffect(() => {
    const timer = setTimeout(() => { window.location.href = "/portal/fund/history"; }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6 min-h-[60vh] flex items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">提交成功</h2>
        <p className="text-slate-500 mb-2">您的存款订单已提交，系统将尽快处理。</p>
        <p className="text-xs text-slate-400 mb-6">3 秒后自动跳转到交易记录...</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onReset}>再存一笔</Button>
          <Link href="/portal/fund/history">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">查看记录</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
