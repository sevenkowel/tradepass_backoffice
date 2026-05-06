'use client';

import { useState } from 'react';
import { Bell, Plus } from 'lucide-react';
import { usePriceAlerts } from '@/lib/trade/hooks/useMarketData';
import type { PriceAlert } from '@/lib/trade/types';
import { AlertList } from './AlertList';
import { CreateAlertModal } from './CreateAlertModal';

export function AlertsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);

  const {
    alerts,
    isLoading,
    createAlert,
    updateAlert,
    deleteAlert,
    toggleAlert,
  } = usePriceAlerts();

  const handleCreate = (data: {
    symbol: string;
    condition: Parameters<typeof createAlert>[0]['condition'];
    targetValue: number;
    targetPercent?: number;
    channels: Parameters<typeof createAlert>[0]['channels'];
  }) => {
    // 查找产品ID
    const productId = `prod-${data.symbol}`;
    createAlert({
      productId,
      symbol: data.symbol,
      condition: data.condition,
      targetValue: data.targetValue,
      targetPercent: data.targetPercent,
      channels: data.channels,
      isActive: true,
    });
    setIsModalOpen(false);
  };

  const handleEdit = (alert: PriceAlert) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  const activeCount = alerts.filter((a) => a.isActive).length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  价格预警
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  活跃预警 {activeCount} / 总计 {alerts.length}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              创建预警
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <AlertList
          alerts={alerts}
          onToggle={toggleAlert}
          onDelete={deleteAlert}
          onEdit={handleEdit}
        />
      </div>

      {/* Modal */}
      <CreateAlertModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAlert(null);
        }}
        onSubmit={handleCreate}
      />
    </div>
  );
}
