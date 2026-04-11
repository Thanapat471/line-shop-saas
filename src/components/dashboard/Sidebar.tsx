"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Package,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart2,
  CreditCard,
} from "lucide-react";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/dashboard/orders", label: "ออเดอร์", icon: ShoppingBag },
  { href: "/dashboard/products", label: "สินค้า", icon: Package },
  { href: "/dashboard/customers", label: "ลูกค้า", icon: Users },
  { href: "/dashboard/reports", label: "รายงาน", icon: BarChart2 },
  { href: "/dashboard/billing", label: "แผนการใช้งาน", icon: CreditCard },
  { href: "/dashboard/settings", label: "ตั้งค่า", icon: Settings },
];

function Label({ open, children }: { open: boolean; children: string }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden whitespace-nowrap text-sm font-medium"
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: open ? 240 : 64 }}
      initial={false}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex h-screen shrink-0 flex-col bg-stone-950 overflow-hidden"
    >
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center border-b border-stone-800/60 px-3">
        {open ? (
          /* Open state: logo + name + close button */
          <>
            <div className="flex flex-1 items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-500">
                <Zap size={13} className="text-white" />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap text-sm font-semibold text-white"
              >
                LINE OA
              </motion.span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-800 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          /* Closed state: just expand button centered */
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-800 hover:text-white mx-auto"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 transition-colors ${
                active
                  ? "bg-stone-800 text-white"
                  : "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <Label open={open}>{label}</Label>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-stone-800/60 px-2 py-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-stone-400 transition-colors hover:bg-stone-800/50 hover:text-stone-200"
          >
            <LogOut size={18} className="shrink-0" />
            <Label open={open}>ออกจากระบบ</Label>
          </button>
        </form>
      </div>
    </motion.aside>
  );
}
