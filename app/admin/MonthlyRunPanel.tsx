'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type RunResult = {
  ok?: boolean;
  partial?: boolean;
  dryRun?: boolean;
  period?: string;
  steps?: Record<string, unknown>;
  errors?: Array<{ step: string; error: string; code?: string }>;
  manual_next?: string[];
  error?: string;
};

type LastRun = {
  at: string;
  actor: string | null;
  period?: string;
  ok?: boolean;
};

export function MonthlyRunPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);

  const loadLast = useCallback(async () => {
    try {
      const res = await fetch(
        '/api/admin/audit?action=ops.monthly_run&limit=1',
        { credentials: 'include' }
      );
      if (!res.ok) return;
      const data = await res.json();
      const ev = (data.events || [])[0];
      if (!ev) return;
      const meta = (ev.meta || {}) as Record<string, unknown>;
      setLastRun({
        at: String(ev.at || '').replace('T', ' ').slice(0, 19),
        actor: ev.actor,
        period: meta.period ? String(meta.period) : undefined,
        ok: meta.ok !== false,
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadLast();
  }, [loadLast]);

  async function run(dryRun: boolean) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ops/monthly-run', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = (await res.json()) as RunResult;
      if (!res.ok && !data.steps) {
        setResult({ error: data.error || 'Run failed', ok: false });
      } else {
        setResult(data);
        if (!dryRun) loadLast();
      }
    } catch (e: unknown) {
      setResult({
        ok: false,
        error: e instanceof Error ? e.message : 'Error',
      });
    } finally {
      setLoading(false);
    }
  }

  const intake = result?.steps?.process_intake as
    | { processed?: number; enrolled?: number; claims_created?: number }
    | undefined;
  const refills = result?.steps?.refills as
    | { created?: number; skipped?: number; period?: string; reason?: string }
    | undefined;

  return (
    <section
      id="start-automation"
      className="rounded-2xl border-2 p-4 shadow-sm space-y-3 scroll-mt-24"
      style={{
        borderColor: '#6ee7b7',
        background: 'linear-gradient(135deg,#d1fae5 0%,#ffffff 55%)',
      }}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
          One click · نقرة واحدة
        </p>
        <h2 className="text-lg font-bold text-emerald-950">
          Start monthly automation
        </h2>
        <p className="text-sm font-medium text-emerald-900" dir="rtl">
          ابدأ الأتمتة الشهرية
        </p>
        <p className="text-xs text-emerald-900/80 mt-1.5">
          Processes the waiting queue (enroll + claim drafts), generates this
          month's refills, and takes a report snapshot. Does{' '}
          <strong>not</strong> submit claims or dispense medicines.
        </p>
        {lastRun && (
          <p className="mt-2 text-[11px] text-emerald-800/90 rounded-lg bg-white/70 border border-emerald-200 px-2 py-1.5">
            Last run:{' '}
            <span className="font-mono">{lastRun.at}</span>
            {lastRun.period ? ` · ${lastRun.period}` : ''}
            {lastRun.actor ? ` · ${lastRun.actor}` : ''}
            {lastRun.ok === false ? ' · failed' : ' · ok'}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => run(false)}
        className="w-full rounded-2xl bg-emerald-700 px-4 py-4 text-base font-bold text-white shadow-lg shadow-emerald-700/25 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span>Running automation… · جاري التشغيل…</span>
        ) : (
          <span>▶ Start automation · ابدأ الأتمتة</span>
        )}
      </button>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => run(true)}
          className="flex-1 min-w-[8rem] rounded-xl border-2 border-emerald-400 bg-white px-3 py-2.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-50 disabled:opacity-50"
        >
          Dry run first · تجربة بدون حفظ
        </button>
        <Link
          href="/claims"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Claims →
        </Link>
        <Link
          href="/pharmacy"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Pharmacy →
        </Link>
        <Link
          href="/refills"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Refills →
        </Link>
      </div>

      {result?.error && (
        <p className="text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1.5">
          {result.error}
        </p>
      )}

      {result && !result.error && (
        <div className="rounded-xl border border-emerald-200 bg-white/95 p-3 text-xs space-y-2">
          <p className="font-semibold text-emerald-950">
            {result.dryRun ? 'Dry run result' : 'Live run result'} ·{' '}
            {result.period} {result.ok ? '✓' : '✗'}
            {result.partial ? ' (partial)' : ''}
          </p>
          {intake && (
            <p>
              Intake: processed {String(intake.processed ?? '—')} · enrolled{' '}
              {String(intake.enrolled ?? '—')} · claim drafts{' '}
              {String(intake.claims_created ?? '—')}
            </p>
          )}
          {refills && (
            <p>
              Refills:{' '}
              {refills.reason
                ? `skipped (${refills.reason})`
                : `created ${String(refills.created ?? 0)} · skipped ${String(refills.skipped ?? 0)}`}
            </p>
          )}
          {result.errors && result.errors.length > 0 && (
            <ul className="text-amber-900 space-y-0.5">
              {result.errors.map((e, i) => (
                <li key={i}>
                  <span className="font-mono">{e.step}</span>: {e.error}
                </li>
              ))}
            </ul>
          )}
          {result.manual_next && result.manual_next.length > 0 && (
            <div className="pt-1 border-t border-emerald-100">
              <p className="font-medium text-slate-700 mb-1">Still manual:</p>
              <ul className="list-disc pl-4 text-slate-600 space-y-0.5">
                {result.manual_next.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-emerald-800/70">
        Scheduled automatically: day 1 of month · 05:15 UTC ·{' '}
        <code className="bg-white/80 px-1 rounded">/api/ops/monthly-run</code>
      </p>
    </section>
  );
}
