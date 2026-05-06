"use client";

import type { LucideIcon } from "lucide-react";
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink, 
  Wallet, 
  TrendingUp, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  ArrowLeftRight,
  Settings,
  Key,
  Eye,
  EyeOff,
  FileText,
  Archive,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { UserPerspective } from "@/types/user";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";

interface TradingAccountsProps {
  user: UserPerspective;
}

interface AccountMenuProps {
  accountId: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

// 更多操作菜单组件 - 使用 fixed 定位
function AccountMenu({ accountId, isOpen, onClose, triggerRef }: AccountMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // 计算菜单位置
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 176, // 菜单宽度 176px，右对齐
      });
    }
  }, [isOpen, triggerRef]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // 点击菜单外部且不是触发按钮时关闭
      if (
        menuRef.current && 
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const menuItems: Array<{ icon: LucideIcon; label: string; href: string; color: string; danger?: boolean } | { divider: true }> = [
    { icon: ArrowLeftRight, label: "账户间转账", href: `/portal/wallet/transfer?from=${accountId}`, color: "text-slate-700" },
    { icon: Settings, label: "调整杠杆", href: `/portal/accounts/accounts/${accountId}/leverage`, color: "text-slate-700" },
    { icon: Key, label: "交易密码", href: `/portal/accounts/accounts/${accountId}/password`, color: "text-slate-700" },
    { icon: Eye, label: "只读密码", href: `/portal/accounts/accounts/${accountId}/readonly`, color: "text-slate-700" },
    { icon: FileText, label: "查看详情", href: `/portal/accounts/accounts/${accountId}`, color: "text-slate-700" },
    { divider: true },
    { icon: Archive, label: "存档账户", href: `/portal/accounts/accounts/${accountId}/archive`, color: "text-slate-500" },
    { icon: Trash2, label: "删除账户", href: `/portal/accounts/accounts/${accountId}/delete`, color: "text-red-600", danger: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.12 }}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            zIndex: 9999,
          }}
          className="w-44 bg-white rounded-xl border border-slate-100 shadow-xl py-1"
        >
          {menuItems.map((item, index) => 
            'divider' in item ? (
              <div key={`divider-${index}`} className="my-1 border-t border-slate-100" />
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${item.danger ? 'hover:bg-red-50' : ''}`}
              >
                <item.icon size={16} className={item.color} />
                <span className={item.color}>{item.label}</span>
              </Link>
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 货币符号映射
const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  JPY: "¥",
  GBP: "£",
  CNY: "¥",
};

export function TradingAccounts({ user }: TradingAccountsProps) {
  const { accounts } = user;
  const hasAccounts = accounts.length > 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  // 存储每个账户按钮的 ref
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  // 金额显示/隐藏状态
  const [showAmount, setShowAmount] = useState(true);

  const setButtonRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) {
      buttonRefs.current.set(id, el);
    } else {
      buttonRefs.current.delete(id);
    }
  }, []);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      const page = Math.round(scrollLeft / clientWidth);
      setCurrentPage(page);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.85;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  useEffect(() => {
    checkScroll();
  }, [accounts.length]);

  if (!hasAccounts) {
    return (
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">交易账户</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Wallet size={28} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-2">还没有交易账户</p>
            <p className="text-sm text-slate-400 mb-4">创建账户后即可开始交易</p>
            <Link
              href="/portal/accounts/open-account"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Plus size={16} />
              立即开户
            </Link>
          </div>
        </div>
      </motion.section>
    );
  }

  const totalPages = Math.ceil(accounts.length / 2);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">我的交易账户</h3>
            <p className="text-sm text-slate-500 mt-0.5">共 {accounts.length} 个账户</p>
          </div>
          <div className="flex items-center gap-2">
            {/* 金额显示/隐藏切换 */}
            <button
              onClick={() => setShowAmount(!showAmount)}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title={showAmount ? "隐藏金额" : "显示金额"}
            >
              {showAmount ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {/* 滚动控制按钮（多账户时显示） */}
            {accounts.length > 2 && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => scroll("left")}
                  disabled={!canScrollLeft}
                  className={`p-1.5 rounded-lg transition-colors ${
                    canScrollLeft 
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-600" 
                      : "bg-slate-50 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => scroll("right")}
                  disabled={!canScrollRight}
                  className={`p-1.5 rounded-lg transition-colors ${
                    canScrollRight 
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-600" 
                      : "bg-slate-50 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <Link
              href="/portal/accounts/open-account"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Plus size={16} />
              添加账户
            </Link>
          </div>
        </div>

        {/* 账户卡片 - 横向滚动/网格布局 */}
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className={`flex gap-4 ${accounts.length > 2 ? 'overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide' : ''}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {accounts.map((account, index) => {
            const currencySymbol = currencySymbols[account.currency] || "$";
            return (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex-shrink-0 ${accounts.length === 1 ? 'w-full' : accounts.length === 2 ? 'w-[calc(50%-8px)]' : 'w-[calc(50%-8px)] md:w-[380px]'}`}
              >
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 h-full">
                  {/* 账户头部信息 - 紧凑单行 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-sm font-mono min-w-0">
                      <span className="text-slate-700 truncate">
                        MT5-{account.id}-{account.accountType || 'Standard'}-
                        {showAmount ? (
                          <span className="font-semibold text-slate-900 whitespace-nowrap">
                            {currencySymbol}{formatCurrency(account.equity, account.currency).replace(/[$€¥£]/g, '')}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-900 tracking-wider">****</span>
                        )}
                      </span>
                    </div>

                    {/* 更多操作按钮 */}
                    <div className="relative ml-3 shrink-0">
                      <button
                        ref={(el) => setButtonRef(account.id, el)}
                        onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      <AccountMenu
                        accountId={account.id}
                        isOpen={openMenuId === account.id}
                        onClose={() => setOpenMenuId(null)}
                        triggerRef={{ current: buttonRefs.current.get(account.id) || null }}
                      />
                    </div>
                  </div>

                  {/* 可用余额 + 杠杆 */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-slate-400" />
                      <span className="text-slate-500">可用</span>
                      {showAmount ? (
                        <span className="font-medium text-slate-700">
                          {currencySymbol}{formatCurrency(account.freeMargin, account.currency).replace(/[$€¥£]/g, '')}
                        </span>
                      ) : (
                        <span className="font-medium text-slate-700 tracking-wider">****</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BarChart3 size={14} className="text-slate-400" />
                      <span className="text-slate-500">{account.leverage}:1</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Link
                      href="/portal/fund/deposit"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <ArrowUpRight size={14} />
                      入金
                    </Link>
                    <Link
                      href="/portal/wallet/withdraw"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <ArrowDownRight size={14} />
                      出金
                    </Link>
                    <Link
                      href="/portal/accounts"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <ExternalLink size={14} />
                      交易
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 分页指示器（多账户时显示） */}
        {accounts.length > 2 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                      left: index * scrollRef.current.clientWidth * 0.85,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentPage === index ? 'bg-slate-900' : 'bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
