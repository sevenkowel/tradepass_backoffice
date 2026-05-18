"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

// Color palette
const COLORS = {
  primary: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  purple: "#8B5CF6",
  gray: "#6B7280",
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.error, COLORS.purple, COLORS.gray];

// Base Chart Props
interface ChartProps {
  data: Record<string, unknown>[];
  height?: number;
  className?: string;
}

// Line Chart
interface LineChartProps extends ChartProps {
  xKey: string;
  yKeys: { key: string; name: string; color?: string }[];
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
}

export function LineChartComponent({
  data,
  xKey,
  yKeys,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  className,
}: LineChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
            />
          )}
          {yKeys.map((yKey) => (
            <Line
              key={yKey.key}
              type="monotone"
              dataKey={yKey.key}
              name={yKey.name}
              stroke={yKey.color || COLORS.primary}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Bar Chart
interface BarChartProps extends ChartProps {
  xKey: string;
  yKeys: { key: string; name: string; color?: string }[];
  layout?: "horizontal" | "vertical";
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
}

export function BarChartComponent({
  data,
  xKey,
  yKeys,
  layout = "horizontal",
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  stacked = false,
  className,
}: BarChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          {layout === "horizontal" ? (
            <>
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
              <YAxis
                dataKey={xKey}
                type="category"
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickLine={false}
                axisLine={{ stroke: "#E5E7EB" }}
              />
            </>
          )}
          {showTooltip && (
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
            />
          )}
          {yKeys.map((yKey) => (
            <Bar
              key={yKey.key}
              dataKey={yKey.key}
              name={yKey.name}
              fill={yKey.color || COLORS.primary}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Area Chart
interface AreaChartProps extends ChartProps {
  xKey: string;
  yKeys: { key: string; name: string; color?: string }[];
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
}

export function AreaChartComponent({
  data,
  xKey,
  yKeys,
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  stacked = false,
  className,
}: AreaChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          {showTooltip && (
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
            />
          )}
          {yKeys.map((yKey) => (
            <Area
              key={yKey.key}
              type="monotone"
              dataKey={yKey.key}
              name={yKey.name}
              stroke={yKey.color || COLORS.primary}
              fill={yKey.color || COLORS.primary}
              fillOpacity={0.1}
              stackId={stacked ? "stack" : undefined}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pie Chart
interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function PieChartComponent({
  data,
  height = 300,
  showLegend = true,
  showTooltip = true,
  className,
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn("w-full flex items-center", className)} style={{ height }}>
      <ResponsiveContainer width="50%" height="100%">
        <PieChart>
          {showTooltip && (
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [
                `$${Number(value).toLocaleString()}`,
                "",
              ]}
            />
          )}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {showLegend && (
        <div className="flex-1 space-y-2">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color || CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-gray-600">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900">
                {((entry.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
