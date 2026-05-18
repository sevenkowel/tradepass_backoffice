/**
 * CSV 导出通用 helper (P1-14/20).
 *
 * 用法：
 * ```ts
 * exportCsv("funds-user-001.csv", funds, [
 *   { label: "时间", get: (f) => f.createdAt },
 *   { label: "类型", get: (f) => f.type },
 *   { label: "金额", get: (f) => f.amount },
 * ]);
 * ```
 *
 * 设计要点：
 *   - 仅前端 blob 下载，零后端
 *   - UTF-8 BOM 头让 Excel 直接打开不乱码
 *   - 自动 escape: 含 , " \n 的值会被双引号包裹
 */

export interface CsvColumn<T> {
  label: string;
  get: (row: T) => string | number | null | undefined;
}

export function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  if (typeof window === "undefined") return;

  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(c.get(row))).join(","))
    .join("\n");

  // BOM 让 Excel 把 utf-8 当 utf-8 打开
  const csv = "﻿" + header + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // 释放 object URL
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function escape(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** 给文件名加日期后缀。 */
export function withTimestamp(base: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return base.replace(/\.csv$/, `-${stamp}.csv`);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
