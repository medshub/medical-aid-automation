import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/auth';
import { ensureAuditTable } from '@/lib/audit';
import { query } from '@/lib/db';
import { jsonError } from '@/lib/errors';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

/** GET /api/admin/audit?limit=50&action=&org=&format=pdf&report=1 */
export async function GET(req: NextRequest) {
  try {
    if (!authorizeRequest(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }
    await ensureAuditTable();
    const sp = req.nextUrl.searchParams;
    const format = (sp.get('format') || 'json').toLowerCase();
    const asReport = sp.get('report') === '1' || sp.get('report') === 'true';
    const autoPrint = sp.get('autoprint') !== '0';
    const limit = Math.min(
      Number(sp.get('limit') || (format === 'pdf' ? 200 : 50)),
      500
    );
    const action = sp.get('action')?.trim();
    const org = sp.get('org')?.trim();
    const params: unknown[] = [];
    const where = ['1=1'];
    if (action) {
      params.push(`%${action}%`);
      where.push(`action ILIKE $${params.length}`);
    }
    if (org) {
      params.push(org.toUpperCase());
      where.push(`upper(coalesce(org_code,'')) = $${params.length}`);
    }
    params.push(limit);
    const res = await query(
      `SELECT id::text, at::text, actor, action, entity_type, entity_id, org_code, meta
       FROM audit_events
       WHERE ${where.join(' AND ')}
       ORDER BY at DESC
       LIMIT $${params.length}`,
      params
    );

    if (format === 'pdf' || format === 'print') {
      const html = buildPrintableHtml({
        title: asReport ? 'Staff activity report' : 'Staff activity log',
        subtitle: asReport
          ? 'تقرير نشاط الموظفين · printable ops report · Save as PDF from the print dialog'
          : 'سجل نشاط الموظفين · audit_events · Save as PDF from the print dialog',
        meta: [
          { label: 'Document', value: asReport ? 'Activity report' : 'Activity log' },
          { label: 'Action filter', value: action || 'all' },
          { label: 'Org filter', value: org || 'all' },
          { label: 'Rows', value: String(res.rows.length) },
          {
            label: 'Generated',
            value:
              new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
          },
        ],
        columns: [
          { key: 'at', label: 'When' },
          { key: 'actor', label: 'Actor' },
          { key: 'action', label: 'Action' },
          { key: 'org_code', label: 'Org' },
          { key: 'entity', label: 'Entity' },
        ],
        rows: res.rows.map((r: Record<string, unknown>) => ({
          at: String(r.at || '')
            .replace('T', ' ')
            .slice(0, 19),
          actor: r.actor || '—',
          action: r.action || '',
          org_code: r.org_code || '—',
          entity: [
            r.entity_type || '',
            r.entity_id ? String(r.entity_id).slice(0, 8) : '',
          ]
            .filter(Boolean)
            .join(' · '),
        })),
        footerNote:
          'Internal staff activity only · not for public distribution',
        autoPrint,
      });
      const label = [action || 'all', org || 'all'].join('-');
      return pdfHtmlResponse(
        html,
        asReport
          ? `staff-activity-report-${label}.pdf.html`
          : `staff-activity-${label}.pdf.html`
      );
    }

    return NextResponse.json({
      ok: true,
      count: res.rows.length,
      events: res.rows,
    });
  } catch (e: unknown) {
    const { body, status } = jsonError(e);
    return NextResponse.json(body, { status });
  }
}
