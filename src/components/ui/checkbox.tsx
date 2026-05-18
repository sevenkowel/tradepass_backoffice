"use client";

import React, { useState } from "react";

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 自定义复选框
 * 支持受控（checked）和非受控（defaultChecked）两种模式
 */
export function Checkbox({
  id,
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className = "",
}: CheckboxProps) {
  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleClick = () => {
    if (disabled) return;
    const next = !checked;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center justify-center h-4 w-4 shrink-0 rounded-[4px] border-2 transition-all duration-150 ease-in-out cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${
        checked
          ? "bg-tp-accent border-[var(--tp-accent)]"
          : "bg-white border-slate-300 hover:border-slate-400"
      } ${className}`}
      onClick={handleClick}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
    >
      {checked && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="block"
        >
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}
