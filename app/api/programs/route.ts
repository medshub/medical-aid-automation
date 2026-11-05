import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { authorizeRequest, unauthorizedResponse } from '@/lib/auth';
import { resolveOrgScope } from '@/lib/orgScope';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

/** GET /api/programs?status=active&format=pdf */
export async function GET(req: NextRequest) {
  try {
    if (!authorizeRequest(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }
    const sp = new URL(req.url).searchParams;
    const status = sp.get('status') || 'active';
    const format = (sp.get('format') || 'json').toLowerCase();
    const autoPrint = sp.get('autoprint') !== '0';
    const q = (sp.get('q') || '').trim();

    const scope = await resolveOrgScope(req);
    const params: unknown[] = [];
    const where: string[] = [];

    if (status && status !== 'all' && status !== '') {
      params.push(status);
      where.push(`cp.status = $${params.length}::program_status`);
    }

    if (q) {
      params.push(`%${q}%`);
      const i = params.length;
      where.push(
        `(cp.program_code ILIKE $${i} OR e.full_name ILIKE $${i} OR e.external_employee_id ILIKE $${i} OR d.full_name ILIKE $${i})`
      );
    }

    let orgFilter = '';
    if (!scope.all) {
      if (!scope.org_ids.length) {
        if (format === 'pdf' || format === 'print') {
          const html = buildPrintableHtml({
            title: 'Programs',
            subtitle: 'No rows in org scope',
            columns: [{ key: 'n', label: 'Note' }],
            rows: [{ n: 'Empty scope' }],
            autoPrint,
          });
          return pdfHtmlResponse(html, 'programs-empty.pdf.html');
        }
        return NextResponse.json({
          ok: true,
          count: 0,
          programs: [],
          org_scope: { all: false, org_codes: [], source: scope.source },
        });
      }
      params.push(scope.org_ids);
      orgFilter = `AND e.org_id = ANY($${params.length}::uuid[])`;
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const res = await query(
      `SELECT
         cp.id,
         cp.program_code,
         cp.status,
         cp.start_date,
         cp.end_date,
         e.external_employee_id,
         e.full_name AS employee_name,
         d.full_name AS patient_name,
         d.relation,
         (SELECT count(*)::int FROM chronic_med_lines m
          WHERE m.program_id = cp.id AND m.is_active) AS med_count
       FROM chronic_programs cp
       JOIN employees e ON e.id = cp.employee_id
       JOIN dependents d ON d.id = cp.dependent_id
       ${whereSql}
       ${orgFilter}
       ORDER BY cp.program_code`,
      params
    );

    if (format === 'pdf' || format === 'print') {
      const html = buildPrintableHtml({
        title: `Chronic programs · ${status || 'all'}`,
        subtitle: 'البرامج المزمنة · Save as PDF from the print dialog',
        meta: [
          { label: 'Status', value: status || 'all' },
          { label: 'Search', value: q || '—' },
          { label: 'Rows', value: String(res.rows.length) },
        ],
        columns: [
          { key: 'program_code', label: 'Program' },
          { key: 'employee_name', label: 'Employee' },
          { key: 'external_employee_id', label: 'Emp ID' },
          { key: 'patient_name', label: 'Patient' },
          { key: 'relation', label: 'Relation' },
          { key: 'status', label: 'Status' },
          { key: 'med_count', label: 'Meds', align: 'right' },
        ],
        rows: res.rows as Record<string, unknown>[],
        autoPrint,
      });
      return pdfHtmlResponse(html, `programs-${status || 'all'}.pdf.html`);
    }

    return NextResponse.json({
      ok: true,
      count: res.rows.length,
      programs: res.rows,
      org_scope: {
        all: scope.all,
        org_codes: scope.org_codes,
        source: scope.source,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'List failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
