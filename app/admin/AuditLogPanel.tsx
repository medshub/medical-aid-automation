'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AuditEvent = {
  id: string;
  at: string;
  actor: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  org_code: string | null;
  meta: Record<string, unknown> | null;
};

export function AuditLogPanel() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [org, setOrg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ limit: '50' });
      if (action.trim()) qs.set('action', action.trim());
      if (org.trim()) qs.set('org', org.trim());
      const res = await fetch(`/api/admin/audit?${qs}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load audit');
      setEvents(data.events || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [action, org]);

  useEffect(() => {
    load();
  }, [load]);

  const reportHref = useMemo(() => {
    const qs = new URLSearchParams({
      format: 'pdf',
      limit: '200',
      report: '1',
    });
    if (action.trim()) qs.set('action', action.trim());
    if (org.trim()) qs.set('org', org.trim());
    return `/api/admin/audit?${qs.toString()}`;
  }, [action, org]);

  return (
    <section className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900">Staff activity log</h2>
          <p className="text-xs text-slate-500" dir="rtl">
            سجل نشاط الموظفين · enroll / claims / pharmacy / orgs
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={reportHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-800"
            title="Open printable staff activity report"
          >
            <span aria-hidden>📋</span>
            Report · تقرير
          </a>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
          >
            {loading ? '…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2.5 flex flex-wrap items-center gap-2">
        <p className="text-[11px] text-violet-900 flex-1 min-w-[12rem]">
          Generate a printable report of recent staff actions (respects filters).
          <span className="block text-violet-800/80" dir="rtl">
            تقرير قابل للطباعة · احفظه كـ PDF من نافذة الطباعة
          </span>
        </p>
        <a
          href={reportHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-800"
        >
          Open report
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Filter action…"
          className="flex-1 min-w-[8rem] rounded-xl border border-slate-200 px-3 py-2 text-xs"
        />
        <input
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          placeholder="Org code…"
          className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono uppercase"
        />
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-semibold"
        >
          Apply
        </button>
        <a
          href={reportHref}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border-2 border-violet-300 bg-white px-3 py-2 text-xs font-semibold text-violet-900 hover:bg-violet-50"
        >
          Report PDF
        </a>
      </div>

      {error && (
        <p className="text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1.5">{error}</p>
      )}
      {!events.length && !loading && !error && (
        <p className="text-xs text-slate-400">
          No events yet — submit or process a request.
        </p>
      )}
      {events.length > 0 && (
        <p className="text-[11px] text-slate-500">
          Showing {events.length} event{events.length === 1 ? '' : 's'}
          {action.trim() || org.trim() ? ' (filtered)' : ''} · report exports up to
          200
        </p>
      )}
      <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
        {events.map((ev) => (
          <li key={ev.id} className="py-2 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-slate-400">
                {ev.at?.replace('T', ' ').slice(0, 19)}
              </span>
              <span className="rounded-full bg-violet-50 text-violet-800 px-2 py-0.5 font-medium">
                {ev.action}
              </span>
              {ev.org_code && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-600">
                  {ev.org_code}
                </span>
              )}
            </div>
            <div className="text-slate-600">
              {ev.actor || '—'} · {ev.entity_type || 'entity'}
              {ev.entity_id ? (
                <span className="font-mono text-[10px] text-slate-400">
                  {' '}
                  {ev.entity_id.slice(0, 8)}…
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
