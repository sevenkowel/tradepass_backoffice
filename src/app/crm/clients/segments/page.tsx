"use client";

import { useState, useEffect } from "react";
import { Users, Filter, ArrowRight } from "lucide-react";
import { Card, PageHeader, Button } from "@/components/crm/ui";
import { Breadcrumb } from "@/components/crm/layout";
import { clientService } from "@/lib/crm/services/client.service";
import type { ClientSegment } from "@/types/backoffice/user";

export default function SegmentsPage() {
  const [segments, setSegments] = useState<ClientSegment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientService.listSegments().then((data) => {
      setSegments(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Clients" }, { label: "Segments" }]} />

      <PageHeader
        title="Client Segments"
        description="Dynamic and static client groupings for targeted operations"
        actions={
          <Button>
            <Filter className="w-4 h-4" />
            Create Segment
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Total Segments</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{segments.length}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Dynamic</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {segments.filter((s) => s.isDynamic).length}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Static</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {segments.filter((s) => !s.isDynamic).length}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-slate-500">Total Users</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">
            {segments.reduce((sum, s) => sum + s.userCount, 0)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {segments.map((segment) => (
          <Card key={segment.id} className="!p-5 hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-slate-900">{segment.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{segment.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    segment.isDynamic ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {segment.isDynamic ? "Dynamic" : "Static"}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-600">
                    <Users className="w-4 h-4" />
                    {segment.userCount} users
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
