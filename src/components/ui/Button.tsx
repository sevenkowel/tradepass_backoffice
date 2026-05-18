"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for buttons across the CRM.
 *
 * Variant aliases (kept for backward compatibility, prefer the canonical name):
 *   primary  →  default      (brand primary action)
 *   danger   →  destructive  (destructive action)
 *   md       →  default      (medium size)
 *
 * Visual contract:
 *   - rounded-xl across all sizes (matches existing CRM look)
 *   - tokens (bg-primary / text-primary-foreground) — reacts to theme changes
 *   - 200ms ease transitions
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
        primary:
          "bg-primary text-primary-foreground hover:opacity-90 shadow-sm",
        secondary:
          "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
        outline:
          "border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-50",
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        link:
          "text-primary underline-offset-4 hover:underline shadow-none",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        danger:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5",
        default: "h-10 px-4 text-sm gap-2",
        md: "h-10 px-4 text-sm gap-2",
        lg: "h-12 px-6 text-base gap-2",
        icon: "h-10 w-10 gap-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild: _asChild, loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
