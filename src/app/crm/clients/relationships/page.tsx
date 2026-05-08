"use client";

import { useState, useEffect } from "react";
import { Users, Network, ArrowRight } from "lucide-react";
import { Card, PageHeader } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import type { BackofficeUser } from "@/types/backoffice/user";

export default function RelationshipsPage() {
  const [clients, setClients] = useState<BackofficeUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientService.list().then((res) => {
      setClients(res.items);
      setLoading(false);
    });
  }, []);

  const clientsWithRelations = clients.filter((c) => c.relatedUserIds && c.relatedUserIds.length > 0);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Clients" }, { label: "Relationships" }]} />

      <PageHeader
        title="Client Relationships"
        description="Multi-account associations via shared IP, device, or bank card"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Clients with Relations</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{clientsWithRelations.length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Relation Links</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {clientsWithRelations.reduce((sum, c) => sum + (c.relatedUserIds?.length || 0), 0)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Avg Device/IP</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">
            {(clients.reduce((sum, c) => sum + (c.deviceCount || 0), 0) / (clients.length || 1)).toFixed(1)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Suspicious Groups</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {clients.filter((c) => (c.deviceCount || 0) > 3 || (c.ipCount || 0) > 5).length}
          </p>
        </Card>
      </div>

      {/* Relation Graph */}
      <Card className="!p-6">
        <h3 className="text-sm font-medium text-slate-700 mb-4">Relation Map</h3>
        <div className="space-y-4">
          {clientsWithRelations.map((client) => (
            <div key={client.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm">
                  {client.name.slice(0, 1)}
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">{client.name}</p>
                  <p className="text-xs text-slate-500">{client.uid}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Network className="w-4 h-4" />
                <span className="text-xs">linked to</span>
              </div>

              <div className="flex items-center gap-2">
                {client.relatedUserIds?.map((rid) => {
                  const related = clients.find((c) => c.id === rid);
                  if (!related) return null;
                  return (
                    <div key={rid} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                        {related.name.slice(0, 1)}
                      </div>
                      <span className="text-sm text-slate-700">{related.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="ml-auto text-xs text-slate-500">
                Devices: {client.deviceCount} | IPs: {client.ipCount}
              </div>
            </div>
          ))}

          {clientsWithRelations.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-400">No related clients found</div>
          )}
        </div>
      </Card>
    </div>
  );
}
