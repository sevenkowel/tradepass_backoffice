'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Baby, User, Sparkles, Settings2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeSettingsStore, type TradeMode, type OrderType } from '@/lib/trade/store/tradeSettingsStore';

interface TradeSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TradeSettingsPanel({ isOpen, onClose }: TradeSettingsPanelProps) {
  const {
    tradeMode,
    setTradeMode,
    aiSignalEnabled,
    aiSignalTermsAccepted,
    setAiSignalEnabled,
    defaultOrderType,
    setDefaultOrderType,
    defaultVolume,
    setDefaultVolume,
    autoSLTP,
    setAutoSLTP,
    defaultSLPoints,
    setDefaultSLPoints,
    defaultTPPoints,
    setDefaultTPPoints,
  } = useTradeSettingsStore();

  const [showAiTerms, setShowAiTerms] = useState(false);

  const handleAiToggle = (enabled: boolean) => {
    if (enabled && !aiSignalTermsAccepted) {
      setShowAiTerms(true);
    } else {
      setAiSignalEnabled(enabled);
    }
  };

  const handleAcceptAiTerms = () => {
    useTradeSettingsStore.getState().acceptAiSignalTerms();
    setShowAiTerms(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  交易设置
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Trade Mode */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  交易模式
                </h3>
                <div className="space-y-3">
                  <ModeOption
                    mode="beginner"
                    selected={tradeMode}
                    onSelect={setTradeMode}
                    icon={Baby}
                    title="新手模式"
                    description="AI 辅助决策，简化信息"
                    color="blue"
                  />
                  <ModeOption
                    mode="pro"
                    selected={tradeMode}
                    onSelect={setTradeMode}
                    icon={User}
                    title="专业模式"
                    description="完整数据，快速操作"
                    color="purple"
                  />
                </div>
              </section>

              {/* AI Signal */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    AI 交易信号
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiSignalEnabled}
                      onChange={(e) => handleAiToggle(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                  </label>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {aiSignalEnabled
                    ? 'AI 信号已启用，将在图表上显示交易建议'
                    : '启用后，AI 将提供交易信号和风险提示'}
                </p>
              </section>

              {/* Order Settings - Only in Pro Mode */}
              {tradeMode === 'pro' && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    默认订单设置
                  </h3>

                  {/* Default Order Type */}
                  <div className="mb-4">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">
                      默认订单类型
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['market', 'limit', 'stop'] as OrderType[]).map((type) => (
                        <button
                          key={type}
                          onClick={() => setDefaultOrderType(type)}
                          className={cn(
                            'px-3 py-2 text-xs font-medium rounded-lg border transition-colors',
                            defaultOrderType === type
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          )}
                        >
                          {type === 'market' && '市价'}
                          {type === 'limit' && '限价'}
                          {type === 'stop' && '止损'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Default Volume */}
                  <div className="mb-4">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">
                      默认手数
                    </label>
                    <select
                      value={defaultVolume}
                      onChange={(e) => setDefaultVolume(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {[0.01, 0.05, 0.1, 0.5, 1].map((v) => (
                        <option key={v} value={v}>
                          {v} 手
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Auto SL/TP */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-slate-500 dark:text-slate-400">
                        自动设置止损/止盈
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoSLTP}
                          onChange={(e) => setAutoSLTP(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
                      </label>
                    </div>

                    {autoSLTP && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">
                            止损点数
                          </label>
                          <input
                            type="number"
                            value={defaultSLPoints}
                            onChange={(e) => setDefaultSLPoints(parseInt(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">
                            止盈点数
                          </label>
                          <input
                            type="number"
                            value={defaultTPPoints}
                            onChange={(e) => setDefaultTPPoints(parseInt(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Reset */}
              <section className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    useTradeSettingsStore.getState().resetSettings();
                    onClose();
                  }}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  重置所有设置
                </button>
              </section>
            </div>
          </motion.div>

          {/* AI Terms Modal */}
          {showAiTerms && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    AI 交易信号使用条款
                  </h3>
                </div>

                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 mb-6">
                  <p>在使用 AI 交易信号前，请阅读并同意以下条款：</p>
                  <ul className="list-disc list-inside space-y-2 pl-2">
                    <li>AI 信号仅供参考，不构成投资建议</li>
                    <li>交易风险由您自行承担</li>
                    <li>过往表现不代表未来收益</li>
                    <li>请根据自身情况独立判断</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAiTerms(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAcceptAiTerms}
                    className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    同意并启用
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

// Mode Option Component
interface ModeOptionProps {
  mode: TradeMode;
  selected: TradeMode;
  onSelect: (mode: TradeMode) => void;
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'blue' | 'purple';
}

function ModeOption({ mode, selected, onSelect, icon: Icon, title, description, color }: ModeOptionProps) {
  const isSelected = selected === mode;
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-500',
      icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
    },
  };

  return (
    <button
      onClick={() => onSelect(mode)}
      className={cn(
        'w-full p-4 rounded-xl border-2 text-left transition-all',
        isSelected
          ? `${colorClasses[color].bg} ${colorClasses[color].border}`
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color].icon)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <ChevronRight className={cn('w-5 h-5', isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300')} />
      </div>
    </button>
  );
}
