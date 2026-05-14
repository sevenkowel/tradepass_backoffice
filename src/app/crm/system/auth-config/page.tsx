"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, RotateCcw, Loader2, Shield, Mail, Smartphone, Lock, FileText } from "lucide-react";
import { PageHeader, Card, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { useToast } from "@/components/ui";
import type { AuthConfig, AuthFormField } from "@/lib/auth-config";
import { defaultAuthConfig } from "@/lib/auth-config";

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export default function AuthConfigPage() {
  return (
    <Suspense fallback={null}>
      <AuthConfigPageInner />
    </Suspense>
  );
}

function AuthConfigPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [tenantId, setTenantId] = useState<string>("");
  const [config, setConfig] = useState<AuthConfig>(defaultAuthConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Get tenantId
  useEffect(() => {
    let t = searchParams.get("tenant");
    if (!t) t = getCookie("portal_tenant");
    if (!t) {
      router.replace("/console");
      return;
    }
    setTenantId(t);
  }, [searchParams, router]);

  // Load config
  const loadConfig = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/config/auth?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
        setHasChanges(false);
      }
    } catch {
      toast({ title: "加载失败", description: "无法读取认证配置", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/config/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...config }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "保存成功", description: "认证配置已更新" });
        setHasChanges(false);
      } else {
        toast({ title: "保存失败", description: data.error || "请稍后重试", variant: "error" });
      }
    } catch {
      toast({ title: "保存失败", description: "网络错误", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(defaultAuthConfig);
    setHasChanges(true);
  };

  const updateConfig = (partial: Partial<AuthConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
    setHasChanges(true);
  };

  const toggleMethod = (methods: ("email" | "phone")[], method: "email" | "phone") => {
    if (methods.includes(method)) {
      return methods.filter((m) => m !== method);
    }
    return [...methods, method];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="认证配置" description="配置注册登录表单和验证策略" />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "系统管理" }, { label: "认证配置" }]} />

      <PageHeader
        title="认证配置"
        description="配置 Portal 注册登录表单、验证方式和协议"
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              恢复默认
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              保存配置
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Methods */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">注册方式</h3>
              <p className="text-sm text-gray-500">允许用户通过哪些方式注册</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.registerMethods.includes("email")}
                onChange={() => updateConfig({ registerMethods: toggleMethod(config.registerMethods, "email") })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">邮箱注册</p>
                <p className="text-sm text-gray-500">用户通过邮箱地址注册账号</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.registerMethods.includes("phone")}
                onChange={() => updateConfig({ registerMethods: toggleMethod(config.registerMethods, "phone") })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">手机注册</p>
                <p className="text-sm text-gray-500">用户通过手机号注册账号</p>
              </div>
            </label>
          </div>
        </Card>

        {/* Login Methods */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">登录方式</h3>
              <p className="text-sm text-gray-500">允许用户通过哪些方式登录</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.loginMethods.includes("email")}
                onChange={() => updateConfig({ loginMethods: toggleMethod(config.loginMethods, "email") })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">邮箱登录</p>
                <p className="text-sm text-gray-500">用户通过邮箱地址登录</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.loginMethods.includes("phone")}
                onChange={() => updateConfig({ loginMethods: toggleMethod(config.loginMethods, "phone") })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">手机登录</p>
                <p className="text-sm text-gray-500">用户通过手机号登录</p>
              </div>
            </label>
          </div>
        </Card>

        {/* Verification Settings */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">验证策略</h3>
              <p className="text-sm text-gray-500">注册时的验证要求</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.emailVerificationRequired}
                onChange={(e) => updateConfig({ emailVerificationRequired: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">注册时要求邮箱验证</p>
                <p className="text-sm text-gray-500">用户注册后需验证邮箱才能激活账号</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.phoneVerificationRequired}
                onChange={(e) => updateConfig({ phoneVerificationRequired: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">注册时要求手机验证</p>
                <p className="text-sm text-gray-500">用户注册后需验证手机号才能激活账号</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowSkipVerification}
                onChange={(e) => updateConfig({ allowSkipVerification: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">允许跳过验证（Demo 模式）</p>
                <p className="text-sm text-gray-500">开发测试时可跳过邮箱/手机验证</p>
              </div>
            </label>
          </div>
        </Card>

        {/* 2FA Settings */}
        <Card className="!p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">双重验证 (2FA)</h3>
              <p className="text-sm text-gray-500">登录时的额外安全验证</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.twoFactorEnabled}
                onChange={(e) => updateConfig({ twoFactorEnabled: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <p className="font-medium text-gray-900">启用 2FA</p>
                <p className="text-sm text-gray-500">用户登录时需输入二次验证码</p>
              </div>
            </label>

            <div>
              <label className="text-sm font-medium text-gray-700">2FA 类型</label>
              <select
                value={config.twoFactorType}
                onChange={(e) => updateConfig({ twoFactorType: e.target.value as "sms" | "email" | "app" })}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="sms">短信验证码</option>
                <option value="email">邮件验证码</option>
                <option value="app"> authenticator App</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Agreements */}
        <Card className="!p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">注册协议</h3>
              <p className="text-sm text-gray-500">用户注册时需要同意的协议列表</p>
            </div>
          </div>

          <div className="space-y-3">
            {config.agreements.map((agr, index) => (
              <div key={agr.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                <input
                  type="checkbox"
                  checked={agr.required}
                  onChange={(e) => {
                    const newAgreements = [...config.agreements];
                    newAgreements[index] = { ...agr, required: e.target.checked };
                    updateConfig({ agreements: newAgreements });
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={agr.title}
                    onChange={(e) => {
                      const newAgreements = [...config.agreements];
                      newAgreements[index] = { ...agr, title: e.target.value };
                      updateConfig({ agreements: newAgreements });
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={() => {
                    const newAgreements = config.agreements.filter((_, i) => i !== index);
                    updateConfig({ agreements: newAgreements });
                  }}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newAgreements = [
                  ...config.agreements,
                  { id: `agr_${Date.now()}`, title: "新协议", required: true },
                ];
                updateConfig({ agreements: newAgreements });
              }}
            >
              + 添加协议
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
