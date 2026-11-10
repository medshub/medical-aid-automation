import Link from 'next/link';
import { Suspense } from 'react';
import { neonAuthConfigured } from '@/lib/auth/server';
import { getAllowedStaffEmails } from '@/lib/staffAccess';
import { featureFlagsStatus } from '@/lib/featureFlags';
import { AdminPanelClient } from './AdminPanelClient';
import { AdminSearch } from './AdminSearch';
import { LearningBootstrap } from './LearningBootstrap';
import { AuditLogPanel } from './AuditLogPanel';
import { OrgRequestsPanel } from './OrgRequestsPanel';
import { OrgsListPanel } from './OrgsListPanel';
import { OrgMembersPanel } from './OrgMembersPanel';
import { MonthlyRunPanel } from './MonthlyRunPanel';

export const dynamic = 'force-dynamic';

/** Matches FlowSteps staff path 1–6 */
const OPS_PATH = [
  { href: '/intake-ops', n: '1', label: 'Queue', ar: 'الطابور' },
  { href: '/claims', n: '2', label: 'Claims', ar: 'المطالبات' },
  { href: '/pharmacy', n: '3', label: 'Pharmacy', ar: 'الصيدلية' },
  { href: '/eva-split', n: '4', label: 'EVA', ar: 'إيفا' },
  { href: '/programs', n: '5', label: 'Programs', ar: 'البرامج' },
  { href: '/refills', n: '6', label: 'Refills', ar: 'الصرف' },
] as const;

function periodNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminPage() {
  const neonOk = neonAuthConfigured();
  const allowlist = getAllowedStaffEmails();
  const flags = featureFlagsStatus();
  const period = periodNow();

  return (
    <main
      className="min-h-screen p-4 sm:p-6 pb-28 md:pb-16"
      style={{ color: 'var(--aid-ink)' }}
    >
      <div className="mx-auto max-w-xl space-y-5">
        <header className="space-y-1 text-center sm:text-left">
          <p className="aid-section-label">Staff only · Admin</p>
          <h1 className="aid-display text-3xl sm:text-4xl font-semibold tracking-tight">
            Admin
          </h1>
          <p className="text-sm" style={{ color: 'var(--aid-muted)' }} dir="rtl">
            لوحة التشغيل · تسجيل الدخول · الأدوار · الأعلام
          </p>
        </header>

        <div
          className="rounded-2xl border p-3 shadow-sm"
          style={{
            background: 'var(--aid-surface)',
            borderColor: 'var(--aid-line)',
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-wide mb-2 px-1"
            style={{ color: 'var(--aid-muted)' }}
          >
            Monthly path · 1–6 · المسار الشهري
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {OPS_PATH.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-xl border px-1 py-2 text-center transition hover:opacity-90"
                style={{
                  borderColor: 'var(--aid-line)',
                  background: 'var(--aid-paper)',
                }}
              >
                <div
                  className="text-[10px] font-bold"
                  style={{ color: 'var(--aid-emerald)' }}
                >
                  {s.n}
                </div>
                <div className="text-[10px] font-semibold leading-tight">
                  {s.label}
                </div>
                <div
                  className="text-[9px]"
                  style={{ color: 'var(--aid-muted)' }}
                  dir="rtl"
                >
                  {s.ar}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <Link
              href="/guide#for-staff"
              className="font-medium hover:underline"
              style={{ color: 'var(--aid-emerald)' }}
            >
              Staff guide
            </Link>
            <span style={{ color: 'var(--aid-muted)' }}>·</span>
            <Link href="/status" className="hover:underline">
              System status
            </Link>
            <span style={{ color: 'var(--aid-muted)' }}>·</span>
            <Link href="/notifications" className="hover:underline">
              WhatsApp
            </Link>
          </div>
        </div>

        <MonthlyRunPanel />

        <div
          className="rounded-2xl border-2 p-3 shadow-sm space-y-2"
          style={{
            borderColor: '#ddd6fe',
            background: 'linear-gradient(135deg,#f5f3ff 0%,#ffffff 100%)',
          }}
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <div>
              <p className="text-sm font-semibold text-violet-950">
                Reports hub · مركز التقارير
              </p>
              <p className="text-[11px] text-violet-800/80">
                Printable PDFs · open → Save as PDF · {period}
              </p>
            </div>
            <Link
              href="/reports"
              className="rounded-lg bg-violet-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-800"
            >
              Open
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            <a
              href="/api/ops/summary?format=pdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-violet-200 bg-white px-2 py-2 text-center text-[11px] font-semibold text-violet-950 hover:bg-violet-50"
            >
              Ops summary
              <span className="block text-[9px] font-normal text-violet-700" dir="rtl">
                ملخص التشغيل
              </span>
            </a>
            <a
              href="/api/admin/audit?format=pdf&report=1&limit=200"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-violet-200 bg-white px-2 py-2 text-center text-[11px] font-semibold text-violet-950 hover:bg-violet-50"
            >
              Staff report
              <span className="block text-[9px] font-normal text-violet-700" dir="rtl">
                تقرير النشاط
              </span>
            </a>
            <a
              href="/api/admin/org-requests?format=pdf&status=pending"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-violet-200 bg-white px-2 py-2 text-center text-[11px] font-semibold text-violet-950 hover:bg-violet-50"
            >
              Org requests
              <span className="block text-[9px] font-normal text-violet-700" dir="rtl">
                طلبات المؤسسات
              </span>
            </a>
            <a
              href={`/api/reports/monthly?period=${period}&format=pdf`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-violet-200 bg-white px-2 py-2 text-center text-[11px] font-semibold text-violet-950 hover:bg-violet-50"
            >
              Monthly meds
              <span className="block text-[9px] font-normal text-violet-700" dir="rtl">
                صرف شهري
              </span>
            </a>
            <a
              href="/api/reports/medications?format=pdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-violet-200 bg-white px-2 py-2 text-center text-[11px] font-semibold text-violet-950 hover:bg-violet-50"
            >
              Chronic catalog
              <span className="block text-[9px] font-normal text-violet-700" dir="rtl">
                كتالوج مزمن
              </span>
            </a>
            <a
              href="/api/intake?status=submitted&format=pdf&limit=200"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-violet-200 bg-white px-2 py-2 text-center text-[11px] font-semibold text-violet-950 hover:bg-violet-50"
            >
              Queue PDF
              <span className="block text-[9px] font-normal text-violet-700" dir="rtl">
                طابور الانتظار
              </span>
            </a>
          </div>
        </div>

        <AdminSearch />

        <Suspense fallback={null}>
          <AdminPanelClient
            neonConfigured={neonOk}
            allowlistCount={allowlist.length}
            flags={flags}
          />
        </Suspense>

        <OrgsListPanel />

        <OrgMembersPanel />

        <OrgRequestsPanel />

        <AuditLogPanel />

        <LearningBootstrap />

        <p className="text-center text-xs" style={{ color: 'var(--aid-muted)' }}>
          <Link
            href="/"
            className="hover:underline font-medium"
            style={{ color: 'var(--aid-emerald)' }}
          >
            Home
          </Link>
          {' · '}
          <Link href="/sign-in" className="hover:underline">
            Sign in
          </Link>
          {' · '}
          <Link href="/admin/roles" className="hover:underline">
            Roles
          </Link>
          {' · '}
          <Link href="/org/register" className="hover:underline">
            Org register
          </Link>
          {' · '}
          <Link href="/reports" className="hover:underline">
            Reports
          </Link>
        </p>
      </div>
    </main>
  );
}
