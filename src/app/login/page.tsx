"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { login } from "./actions";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="w-full max-w-sm"
    >
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500 shadow-lg shadow-green-500/30">
          <Zap size={22} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-950">LINE OA Dashboard</h1>
          <p className="mt-0.5 text-sm text-stone-400">เข้าสู่ระบบเพื่อจัดการร้าน</p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
        <form action={login} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">อีเมล</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-stone-400 focus:bg-white focus:ring-0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-stone-700">รหัสผ่าน</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-stone-400 focus:bg-white focus:ring-0"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-600"
            >
              อีเมลหรือรหัสผ่านไม่ถูกต้อง
            </motion.p>
          )}

          <button
            type="submit"
            className="mt-1 rounded-xl bg-stone-950 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-[0.98]"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
