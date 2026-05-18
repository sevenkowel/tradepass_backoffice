"use client";

import { useRef, useEffect, useCallback } from "react";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function OTPInput({
  value,
  onChange,
  length = 6,
  onComplete,
  disabled = false,
  autoFocus = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 确保 value 只包含数字且长度不超过 length
  const normalizedValue = value.replace(/\D/g, "").slice(0, length);
  const digits = normalizedValue.split("");
  while (digits.length < length) digits.push("");

  // 自动聚焦第一个空位
  useEffect(() => {
    if (autoFocus && !disabled) {
      const firstEmpty = digits.findIndex((d) => d === "");
      const focusIndex = firstEmpty === -1 ? length - 1 : firstEmpty;
      inputRefs.current[focusIndex]?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, disabled]);

  // 自动提交
  useEffect(() => {
    if (normalizedValue.length >= 4 && onComplete) {
      onComplete(normalizedValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedValue]);

  const setDigit = useCallback(
    (index: number, digit: string) => {
      const newValue = normalizedValue.slice(0, index) + digit + normalizedValue.slice(index + 1);
      onChange(newValue.slice(0, length));
    },
    [normalizedValue, onChange, length]
  );

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;

    // 处理粘贴多位数字
    if (val.length > 1) {
      const pasted = val.slice(0, length);
      onChange(pasted);
      // 聚焦到粘贴后的位置
      const nextIndex = Math.min(index + pasted.length, length - 1);
      setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
      return;
    }

    setDigit(index, val);
    // 自动跳转到下一格
    if (index < length - 1) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Backspace":
        e.preventDefault();
        if (digits[index]) {
          setDigit(index, "");
        } else if (index > 0) {
          setDigit(index - 1, "");
          inputRefs.current[index - 1]?.focus();
        }
        break;
      case "ArrowLeft":
        if (index > 0) {
          e.preventDefault();
          inputRefs.current[index - 1]?.focus();
        }
        break;
      case "ArrowRight":
        if (index < length - 1) {
          e.preventDefault();
          inputRefs.current[index + 1]?.focus();
        }
        break;
      case "Delete":
        e.preventDefault();
        setDigit(index, "");
        break;
      case "v":
        // Ctrl+V / Cmd+V 粘贴由 onChange 处理
        if (e.ctrlKey || e.metaKey) return;
        break;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, length - 1);
      setTimeout(() => inputRefs.current[focusIdx]?.focus(), 0);
    }
  };

  return (
    <div className="flex items-center gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[index]}
          disabled={disabled}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className={`w-10 h-12 text-center text-lg font-mono font-medium border rounded-lg outline-none transition-all
            ${digits[index] ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-white text-gray-900"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "focus:border-primary focus:ring-2 focus:ring-primary/20"}
          `}
        />
      ))}
    </div>
  );
}
