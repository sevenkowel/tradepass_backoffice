"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { RefreshCw, ShieldCheck } from "lucide-react";

interface CaptchaChallengeProps {
  onVerify: (success: boolean) => void;
  onCancel?: () => void;
}

function generateCaptchaCode(length = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function drawCaptcha(canvas: HTMLCanvasElement, code: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = 160;
  const height = 56;
  canvas.width = width;
  canvas.height = height;

  // 背景
  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, width, height);

  // 干扰线
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(${100 + Math.random() * 100}, ${100 + Math.random() * 100}, ${100 + Math.random() * 100}, 0.4)`;
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  // 干扰点
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${100 + Math.random() * 100}, ${100 + Math.random() * 100}, ${100 + Math.random() * 100}, 0.3)`;
    ctx.beginPath();
    ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 文字
  const chars = code.split("");
  const charWidth = width / (chars.length + 1);
  chars.forEach((char, i) => {
    ctx.save();
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = `rgb(${50 + Math.random() * 100}, ${50 + Math.random() * 100}, ${50 + Math.random() * 100})`;
    const x = charWidth * (i + 0.8);
    const y = height / 2 + 10;
    const angle = (Math.random() - 0.5) * 0.6;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });

  // 边框
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);
}

export default function CaptchaChallenge({ onVerify, onCancel }: CaptchaChallengeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    const newCode = generateCaptchaCode();
    setCode(newCode);
    setInput("");
    setError(false);
    if (canvasRef.current) {
      drawCaptcha(canvasRef.current, newCode);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleVerify = () => {
    if (input.toUpperCase() === code) {
      setError(false);
      onVerify(true);
    } else {
      setError(true);
      setInput("");
      refresh();
    }
  };

  return (
    <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span className="font-medium">安全验证</span>
      </div>

      <div className="flex items-center gap-3">
        <canvas
          ref={canvasRef}
          className="rounded-md"
          style={{ width: 160, height: 56 }}
        />
        <button
          type="button"
          onClick={refresh}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="刷新验证码"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
          placeholder="输入验证码"
          maxLength={4}
          className="h-10 text-center text-lg tracking-[0.5em] font-mono uppercase flex-1"
          error={error ? "验证码错误，请重试" : undefined}
        />
        <Button type="button" variant="outline" onClick={handleVerify} className="h-10 px-4">
          验证
        </Button>
      </div>

      {onCancel && (
        <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600">
          取消验证
        </button>
      )}
    </div>
  );
}
