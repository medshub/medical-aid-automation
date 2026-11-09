import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authorizeRequest, unauthorizedResponse } from '@/lib/auth';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

function defaultPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function countSql(sql: string, params: unknown[] = []): Promise<number> {
  try {
    const r = await query<{ n: string }>(sql, params);
    return Number(r.rows[0]?.n || 0);
  } catch {
    return 0;
  }
}

/** GET /api/ops/summary?period=YYYY-MM&format=pdf|json */
export async function GET(req: NextRequest) {
  try {
    if (!authorizeRequest(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: 'DATABASE_URL not set' },
        { status: 503 }
      );
    }

    const sp = req.nextUrl.searchParams;
    const period = sp.get('period') || defaultPeriod();
    const format = (sp.get('format') || 'json').toLowerCase();
    const autoPrint = sp.get('autoprint') !== '0';

    const [
      queue_waiting,
      queue_enrolled,
      claims_draft,
      claims_submitted,
      programs_active,
      programs_suspended,
      refills_period,
      refills_in_review,
      refills_dispensed,
      release_letters_period,
    ] = await Promise.all([
      countSql(
        `SELECT count(*)::text AS n FROM aid_requests WHERE status = 'submitted'`
      ),
      countSql(
        `SELECT count(*)::text AS n FROM aid_requests WHERE status = 'enrolled'`
      ),
      countSql(
        `SELECT count(*)::text AS n FROM claims WHERE status = 'draft'`
      ),
      countSql(
        `SELECT count(*)::text AS n FROM claims WHERE status IN ('submitted','under_review')`
      ),
      countSql(
        `SELECT count(*)::text AS n FROM chronic_programs WHERE status = 'active'`
      ),
      countSql(
        `SELECT count(*)::text AS n FROM chronic_programs WHERE status = 'suspended'`
      ),
      countSql(
        `SELECT count(*)::text AS n FROM refill_cycles WHERE period = $1`,
        [period]
      ),
      countSql(
        `SELECT count(*)::text AS n FROM refill_cycles WHERE period = $1 AND status = 'in_review'`,
        [period]
      ),
      countSql(
        `SELECT count(*)::text AS n FROM refill_cycles WHERE period = $1 AND status = 'dispensed'`,
        [period]
      ),
      countSql(
        `SELECT count(*)::text AS n FROM release_letters WHERE period = $1`,
        [period]
      ).catch(() => 0),
    ]);

    const summary = {
      ok: true,
      period,
      generated_at: new Date().toISOString(),
      counts: {
        queue_waiting,
        queue_enrolled,
        claims_draft,
        claims_submitted,
        programs_active,
        programs_suspended,
        refills_period,
        refills_in_review,
        refills_dispensed,
        release_letters_period,
      },
    };

    if (format === 'pdf' || format === 'print') {
      const rows = [
        { area: 'Queue · waiting (submitted)', value: queue_waiting },
        { area: 'Queue · enrolled', value: queue_enrolled },
        { area: 'Claims · draft', value: claims_draft },
        { area: 'Claims · submitted / review', value: claims_submitted },
        { area: 'Programs · active', value: programs_active },
        { area: 'Programs · suspended', value: programs_suspended },
        { area: `Refills · ${period} total cycles`, value: refills_period },
        { area: `Refills · ${period} in review`, value: refills_in_review },
        { area: `Refills · ${period} dispensed`, value: refills_dispensed },
        {
          area: `Release letters · ${period}`,
          value: release_letters_period,
        },
      ];

      const html = buildPrintableHtml({
        title: `Monthly ops summary · ${period}`,
        subtitle:
          'ملخص التشغيل الشهري · Save as PDF from the print dialog',
        meta: [
          { label: 'Period', value: period },
          {
            label: 'Generated',
            value: summary.generated_at.slice(0, 16).replace('T', ' ') + ' UTC',
          },
        ],
        columns: [
          { key: 'area', label: 'Area' },
          { key: 'value', label: 'Count', align: 'right' },
        ],
        rows,
        footerNote:
          'Medical Aid Automation · ops snapshot (not financial close)',
        autoPrint,
      });
      return pdfHtmlResponse(html, `ops-summary-${period}.pdf.html`);
    }

    return NextResponse.json(summary);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'summary failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
