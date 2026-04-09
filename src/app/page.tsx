export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 py-16 text-stone-950">
      <section className="w-full max-w-4xl rounded-[32px] border border-stone-200 bg-white p-8 shadow-[0_24px_80px_rgba(28,25,23,0.08)] sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-800">
              LINE Shop SaaS
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Backend foundation is ready for Supabase and LINE webhook work.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                The project now has a documented schema, environment template,
                and shared Supabase helpers so we can move into webhook
                implementation without guessing structure later.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] bg-stone-950 p-6 text-stone-50">
            <h2 className="text-lg font-semibold">Next build steps</h2>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
              <li>1. Fill in the environment variables from `.env.example`.</li>
              <li>2. Apply the initial schema in Supabase.</li>
              <li>3. Build the LINE webhook route.</li>
              <li>4. Save incoming events into `line_webhook_events`.</li>
              <li>5. Upsert customers and create orders.</li>
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}
