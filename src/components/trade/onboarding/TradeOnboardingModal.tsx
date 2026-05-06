'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Baby, User, X, Sparkles, TrendingUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTradeSettingsStore, type TradeMode } from '@/lib/trade/store/tradeSettingsStore';

interface TradeOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TradeOnboardingModal({ isOpen, onClose }: TradeOnboardingModalProps) {
  const [selectedMode, setSelectedMode] = useState<TradeMode | null>(null);
  const [step, setStep] = useState<'mode' | 'ai_terms'>('mode');
  const { setTradeMode, completeOnboarding, acceptAiSignalTerms } = useTradeSettingsStore();

  const handleModeSelect = (mode: TradeMode) => {
    setSelectedMode(mode);
    setTradeMode(mode);
  };

  const handleContinue = () => {
    if (selectedMode === 'beginner') {
      // Beginner mode shows AI terms
      setStep('ai_terms');
    } else {
      // Pro mode skips AI terms (can enable later)
      completeOnboarding();
      onClose();
    }
  };

  const handleAcceptAiTerms = () => {
    acceptAiSignalTerms();
    completeOnboarding();
    onClose();
  };

  const handleSkipAi = () => {
    completeOnboarding();
    onClose();
  };

  const handleLater = () => {
    completeOnboarding();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {step === 'mode' ? '选择您的交易经验' : 'AI 交易信号'}
              </h2>
              <button
                onClick={handleLater}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'mode' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                    根据您的经验，我们将为您定制最适合的界面和功能
                  </p>

                  {/* Beginner Mode Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleModeSelect('beginner')}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left transition-all',
                      selectedMode === 'beginner'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Baby className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                          我是新手
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          刚开始接触交易，需要 AI 辅助决策和简化信息
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            AI 信号
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            自动计算
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            简化界面
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  {/* Pro Mode Option */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleModeSelect('pro')}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 text-left transition-all',
                      selectedMode === 'pro'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                          我是专业交易者
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          有丰富的交易经验，需要完整数据和快速操作
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                            完整指标
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                            高级订单
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                            快速操作
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                      启用 AI 交易信号
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      AI 信号基于技术分析和市场数据生成，帮助您做出更明智的交易决策
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          智能分析
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          实时分析技术指标和市场情绪
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          风险管理
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          自动建议止损和止盈点位
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                    <p>使用条款：</p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      <li>AI 信号仅供参考，不构成投资建议</li>
                      <li>交易风险由您自行承担</li>
                      <li>过往表现不代表未来收益</li>
                      <li>请根据自身情况独立判断</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between">
              {step === 'mode' ? (
                <>
                  <button
                    onClick={handleLater}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    稍后设置
                  </button>
                  <button
                    onClick={handleContinue}
                    disabled={!selectedMode}
                    className={cn(
                      'px-6 py-2 rounded-lg font-medium text-sm transition-colors',
                      selectedMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    )}
                  >
                    继续
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSkipAi}
                    className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    暂不启用
                  </button>
                  <button
                    onClick={handleAcceptAiTerms}
                    className="px-6 py-2 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    同意并启用
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
