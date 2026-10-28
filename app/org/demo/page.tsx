import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo · Medical Aid',
  description:
    'See how monthly chronic medicine support works — beneficiaries and staff, in 5 minutes.',
  openGraph: {
    title: 'Medical Aid platform demo',
    description: 'Submit · track · renew · pharmacy routing · multi-org chronic support.',
    url: 'https://medical-aid-automation.vercel.app/org/demo',
  },
};

const PUBLIC = [
  {
    n: '1',
    href: '/intake',
    en: 'Submit a request',
    ar: 'قدّم طلب علاج',
    tip: '3–5 min · auto-save · EGP estimate from Egyptian catalog',
  },
  {
    n: '2',
    href: '/request-status',
    en: 'Track status',
    ar: 'تابع الحالة',
    tip: 'Request ID · share link · names masked until verified',
  },
  {
    n: '3',
    href: '/me',
    en: 'Employee profile',
    ar: 'ملف الموظف',
    tip: 'Company + ID · renew for 2027 · reply to staff',
  },
];

const STAFF = [
  { n: '1', href: '/intake-ops', en: 'Queue', ar: 'الطابور' },
  { n: '2', href: '/claims', en: 'Claims', ar: 'المطالبات' },
  { n: '3', href: '/pharmacy', en: 'Pharmacy', ar: 'الصيدلية' },
  { n: '4', href: '/eva-split', en: 'EVA split', ar: 'تقسيم إيفا' },
  { n: '5', href: '/programs', en: 'Programs', ar: 'البرامج' },
  { n: '6', href: '/refills', en: 'Refills', ar: 'الصرف الشهري' },
];

export default function OrgDemoPage() {
  return (
    <main className="min-h-screen text-slate-900 pb-24 md:pb-12">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        <header className="space-y-3 text-center aid-rise">
          <p className="aid-section-label">Live demo · عرض حي</p>
          <h1 className="aid-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Medical Aid in 5 minutes
          </h1>
          <p className="text-slate-600" dir="rtl">
            منصة دعم العلاج الشهري — بدون Google Forms
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Neon as system of record · Egyptian drug catalog · multi-org · privacy-first public
            surface.
          </p>
          <div className="flex flex-wrap gap-2 justify-center pt-1">
            <Link href="/intake" className="aid-cta-primary px-5 py-2.5 text-sm">
              Try submit →
            </Link>
            <Link
              href="/guide"
              className="rounded-2xl border border-white/80 bg-white/90 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-white backdrop-blur"
            >
              Full guide
            </Link>
            <Link
              href="/status"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-900"
            >
              System status
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/90 p-5 space-y-4 backdrop-blur">
          <h2 className="font-bold text-emerald-950 text-lg">For employees & families</h2>
          <p className="text-sm text-emerald-900" dir="rtl">
            للمستفيدين — بدون حساب
          </p>
          <ol className="space-y-3">
            {PUBLIC.map((s) => (
              <li key={s.n}>
                <Link
                  href={s.href}
                  className="flex gap-3 rounded-xl border border-emerald-100 bg-white/90 p-4 hover:border-emerald-300 transition shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
                    {s.n}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-slate-900">
                      {s.en}{' '}
                      <span className="text-slate-400 font-normal" dir="rtl">
                        · {s.ar}
                      </span>
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5">{s.tip}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border-2 border-violet-200 bg-violet-50/90 p-5 space-y-4 backdrop-blur">
          <h2 className="font-bold text-violet-950 text-lg">For staff (ops)</h2>
          <p className="text-sm text-violet-900" dir="rtl">
            لفريق التشغيل — بعد فتح القفل من الرئيسية
          </p>
          <p className="text-xs text-violet-800">
            Unlock on Home with Google (allowlist) or PROCESS_SECRET, then follow:
          </p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {STAFF.map((s) => (
              <li key={s.n}>
                <Link
                  href={s.href}
                  className="flex items-center gap-2 rounded-xl border border-violet-100 bg-white/90 px-3 py-2.5 text-sm hover:border-violet-300 shadow-sm"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-700 text-[11px] font-bold text-white">
                    {s.n}
                  </span>
                  <span className="font-medium">
                    {s.en}{' '}
                    <span className="text-slate-400 font-normal" dir="rtl">
                      · {s.ar}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-white/80 bg-white/90 p-5 space-y-3 shadow-sm backdrop-blur text-sm">
          <h2 className="font-bold text-lg">Why teams switch</h2>
          <ul className="space-y-2 text-slate-600 list-disc pl-5">
            <li>No more fragile Google Forms / sheet macros as the core workflow</li>
            <li>Egyptian catalog (~25k) first · formulary EVA / Not-EVA routing</li>
            <li>Multi-organization isolation + registration for other employers</li>
            <li>Audit trail · rate limits · privacy-masked public status</li>
            <li>Optional WhatsApp, DHIS2, WHO assessment (feature-flagged)</li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/org/register" className="text-emerald-800 font-semibold hover:underline">
              Register your organization →
            </Link>
            <Link href="/guide" className="text-violet-700 font-semibold hover:underline">
              How to use →
            </Link>
            <a
              href="https://github.com/ArmaniousESP/medical-aid-automation"
              className="text-slate-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub →
            </a>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400">
          Live ·{' '}
          <a
            className="text-emerald-700 underline"
            href="https://medical-aid-automation.vercel.app"
          >
            medical-aid-automation.vercel.app
          </a>
        </p>
      </div>
    </main>
  );
}
