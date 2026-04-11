"use client";

import { motion } from "framer-motion";

type StatsCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  index?: number;
};

export function StatsCard({ label, value, sub, index = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
    >
      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-stone-950">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-400">{sub}</p>}
    </motion.div>
  );
}
