"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DayStat = {
  date: string; // "1 เม.ย."
  revenue: number;
  orders: number;
};

function formatBaht(value: number) {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export function SalesChart({ data }: { data: DayStat[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#a8a29e" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatBaht}
          tick={{ fontSize: 11, fill: "#a8a29e" }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip
          formatter={(value) => [formatBaht(Number(value ?? 0)), "ยอดขาย"]}
          labelStyle={{ color: "#1c1917", fontWeight: 600 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e7e5e4",
            fontSize: 13,
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#10b981" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
