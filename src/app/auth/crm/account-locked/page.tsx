"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Lock, Mail } from "lucide-react";

export default function AccountLockedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-red-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">账户已锁定</h1>
            <p className="text-sm text-slate-500 mt-2">
              由于多次登录失败，您的账户已被临时锁定。
            </p>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">锁定原因</p>
                <p className="text-xs mt-1">连续 5 次密码输入错误</p>
                <p className="text-xs mt-2">锁定时间：30 分钟</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push("/auth/crm/login")}>
              返回登录
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/auth/crm/reset-password")}
            >
              <Mail className="w-4 h-4 mr-2" />
              重置密码
            </Button>
          </div>

          <p className="text-xs text-slate-400">
            锁定到期后自动解锁。如需立即解锁，请联系系统管理员
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
