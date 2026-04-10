import Link from "next/link";
import { logout } from "@/app/login/actions";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <nav className="flex items-center gap-6">
            <span className="text-sm font-semibold text-stone-950">
              LINE OA
            </span>
            <Link
              href="/dashboard/orders"
              className="text-sm text-stone-600 hover:text-stone-950 transition"
            >
              ออเดอร์
            </Link>
            <Link
              href="/dashboard/products"
              className="text-sm text-stone-600 hover:text-stone-950 transition"
            >
              สินค้า
            </Link>
          </nav>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
