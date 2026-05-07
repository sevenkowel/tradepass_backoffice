"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Camera, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { OCRFieldLocked } from "./OCRFieldLocked";
import { OCRFieldEditable } from "./OCRFieldEditable";
import { DocumentPreview } from "./DocumentPreview";
import {
  getAllFieldConfigs,
  getValidationMessage,
  type FieldConfig,
} from "@/lib/kyc/field-config";
import type { OCRResult, DocumentType } from "@/lib/kyc/types";

// 验证错误类型
interface ValidationError {
  field: string;
  message: string;
}

interface OCRResultEditorProps {
  result: OCRResult;
  frontImage: string;
  backImage?: string | null;
  onConfirm: (data: Partial<OCRResult>, editedFields: string[]) => void;
  onRetry: () => void;
  isProcessing?: boolean;
  // 外部传入的验证错误（来自父组件的实时校验）
  externalErrors?: ValidationError[];
  // 姓名相似度
  nameSimilarity?: number;
}

export function OCRResultEditor({
  result,
  frontImage,
  backImage,
  onConfirm,
  onRetry,
  isProcessing,
  externalErrors = [],
  nameSimilarity,
}: OCRResultEditorProps) {
  // 获取字段配置
  const fieldConfigs = useMemo(
    () => getAllFieldConfigs(result.documentType),
    [result.documentType]
  );

  // 初始化编辑数据
  const [editedData, setEditedData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fieldConfigs.forEach((config) => {
      const value = result[config.key as keyof OCRResult];
      initial[config.key] = value ? String(value) : "";
    });
    return initial;
  });

  // 记录哪些字段被修改过
  const [editedFields, setEditedFields] = useState<string[]>([]);

  // 处理字段变更
  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setEditedData((prev) => ({ ...prev, [key]: value }));

      // 检查是否与原始值不同
      const originalValue = result[key as keyof OCRResult];
      const originalStr = originalValue ? String(originalValue) : "";

      setEditedFields((prev) => {
        const isEdited = value !== originalStr;
        if (isEdited && !prev.includes(key)) {
          return [...prev, key];
        }
        if (!isEdited && prev.includes(key)) {
          return prev.filter((f) => f !== key);
        }
        return prev;
      });
    },
    [result]
  );

  // 获取字段错误
  const getFieldError = useCallback(
    (key: string): string | undefined => {
      return externalErrors.find((e) => e.field === key)?.message;
    },
    [externalErrors]
  );

  // 处理确认
  const handleConfirm = () => {
    const confirmData: Record<string, string> = {};
    fieldConfigs.forEach((config) => {
      // 传递所有字段（包括空字符串），让后端做必填校验
      confirmData[config.key] = editedData[config.key] ?? "";
    });
    onConfirm(confirmData as Partial<OCRResult>, editedFields);
  };

  // 置信度颜色和提示
  const confidenceConfig = useMemo(() => {
    if (result.confidence >= 0.9) {
      return {
        color: "text-green-600",
        bg: "bg-green-50 border-green-200",
        icon: CheckCircle2,
        title: "识别成功",
        message: "高置信度 - 信息识别准确",
      };
    }
    if (result.confidence >= 0.8) {
      return {
        color: "text-[#d97706]",
        bg: "bg-[#fffbeb] border-[#fde68a]",
        icon: AlertCircle,
        title: "请核对信息",
        message: "中等置信度 - 请仔细核对识别结果",
      };
    }
    return {
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      icon: AlertCircle,
      title: "需要修正",
      message: "低置信度 - 请检查并修正识别信息",
    };
  }, [result.confidence]);

  const ConfidenceIcon = confidenceConfig.icon;

  // 是否有验证错误
  const hasErrors = externalErrors.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 置信度提示横幅 */}
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border",
          confidenceConfig.bg
        )}
      >
        <ConfidenceIcon className={cn("w-5 h-5 mt-0.5", confidenceConfig.color)} />
        <div className="flex-1">
          <p className={cn("text-sm font-medium", confidenceConfig.color)}>
            {confidenceConfig.title}
          </p>
          <p className="text-xs text-[rgba(var(--tp-fg-rgb),0.6)] mt-0.5">
            {confidenceConfig.message}
            <span className="ml-2">
              (置信度: {Math.round(result.confidence * 100)}%)
            </span>
          </p>
        </div>
      </div>

      {/* 证件预览 */}
      <DocumentPreview
        frontImage={frontImage}
        backImage={backImage}
        documentType={result.documentType}
      />

      {/* 识别的信息 */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[rgb(var(--tp-fg-rgb))]">
              识别信息确认
            </h3>
            <div className="flex items-center gap-2 text-xs text-[rgba(var(--tp-fg-rgb),0.5)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[rgba(var(--tp-fg-rgb),0.2)]" />
                锁定
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
                可编辑
              </span>
            </div>
          </div>

          {/* 字段网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fieldConfigs.map((config) => {
              const originalValue = result[config.key as keyof OCRResult];
              const currentValue = editedData[config.key];
              const error = getFieldError(config.key);

              return config.editable ? (
                <OCRFieldEditable
                  key={config.key}
                  config={config}
                  originalValue={originalValue ? String(originalValue) : undefined}
                  value={currentValue}
                  onChange={(value) => handleFieldChange(config.key, value)}
                  error={error}
                  similarity={config.key === "fullName" ? nameSimilarity : undefined}
                />
              ) : (
                <OCRFieldLocked
                  key={config.key}
                  config={config}
                  value={originalValue ? String(originalValue) : undefined}
                />
              );
            })}
          </div>

          {/* 底部提示 */}
          {editedFields.length > 0 && (
            <div className="p-3 rounded-lg bg-[#fffbeb] border border-[#fde68a]">
              <p className="text-sm text-[#b45309]">
                您已修改 {editedFields.length} 个字段，请确保信息准确无误
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 全局错误提示 */}
      {hasErrors && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600">
                请修正以下问题后再继续
              </p>
              <ul className="mt-2 space-y-1">
                {externalErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-500">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isProcessing}
          className="flex-1 h-12"
        >
          <Camera className="w-4 h-4 mr-2" />
          重新拍摄
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing || hasErrors}
          className="flex-1 h-12 bg-tp-accent text-white hover:opacity-90"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              处理中...
            </>
          ) : (
            <>
              确认并继续
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
