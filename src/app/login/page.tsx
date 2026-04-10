import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100">
      <div className="w-full max-w-sm rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_24px_80px_rgba(28,25,23,0.08)]">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-stone-950">
          เข้าสู่ระบบ
        </h1>

        <form action={login} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">
              อีเมล
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-950 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">
              รหัสผ่าน
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-950 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
            />
          </div>

          <ErrorMessage searchParams={searchParams} />

          <button
            type="submit"
            className="mt-2 rounded-full bg-stone-950 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </main>
  );
}

async function ErrorMessage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;

  return (
    <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
      อีเมลหรือรหัสผ่านไม่ถูกต้อง
    </p>
  );
}
