'use client';

import { useState } from 'react';
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

export function MonthlyRunPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

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
      className="rounded-2xl border-2 p-4 shadow-sm space-y-3"
      style={{
        borderColor: '#a7f3d0',
        background: 'linear-gradient(135deg,#ecfdf5 0%,#ffffff 100%)',
      }}
    >
      <div>
        <h2 className="font-semibold text-emerald-950">
          Monthly automation · أتمتة شهرية
        </h2>
        <p className="text-xs text-emerald-900/80 mt-1">
          Safe steps only: process queue → enroll + claim drafts → generate
          refills → report snapshot. Does <strong>not</strong> submit claims or
          dispense.
        </p>
        <p className="text-[11px] text-emerald-800/70 mt-1" dir="rtl">
          آمن: معالجة الطابور ومسودات المطالبات وتوليد الصرف — بدون إرسال
          المطالبات أو الصرف الفعلي
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => run(false)}
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run monthly automation'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => run(true)}
          className="rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 disabled:opacity-50"
        >
          Dry run
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
      </div>

      {result?.error && (
        <p className="text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1.5">
          {result.error}
        </p>
      )}

      {result && !result.error && (
        <div className="rounded-xl border border-emerald-200 bg-white/90 p-3 text-xs space-y-2">
          <p className="font-semibold text-emerald-950">
            {result.dryRun ? 'Dry run' : 'Live run'} · {result.period}{' '}
            {result.ok ? '✓' : '✗'}
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

      <p className="text-[10px] text-emerald-800/60">
        Also scheduled: day 1 · 05:15 UTC ·{' '}
        <code className="bg-white/80 px-1 rounded">/api/ops/monthly-run</code>
      </p>
    </section>
  );
}
