import { NextRequest, NextResponse } from 'next/server';
import { listRefills } from '@/lib/refills';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

/** GET /api/refills?status=in_review&period=2026-09&format=pdf */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const period = searchParams.get('period') || undefined;
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const autoPrint = searchParams.get('autoprint') !== '0';
    const limit = searchParams.get('limit')
      ? Number(searchParams.get('limit'))
      : format === 'pdf'
        ? 200
        : 50;

    const rows = await listRefills({ status, period, limit });

    if (format === 'pdf' || format === 'print') {
      const html = buildPrintableHtml({
        title: `Refill cycles${period ? ` · ${period}` : ''}`,
        subtitle: 'دورات التجديد · Save as PDF from the print dialog',
        meta: [
          { label: 'Period', value: period || 'all' },
          { label: 'Status', value: status || 'all' },
          { label: 'Rows', value: String(rows.length) },
        ],
        columns: [
          { key: 'program_code', label: 'Program' },
          { key: 'patient_name', label: 'Patient' },
          { key: 'employee_name', label: 'Employee' },
          { key: 'period', label: 'Period' },
          { key: 'status', label: 'Status' },
          { key: 'item_count', label: 'Items', align: 'right' },
          { key: 'estimated_total_egp', label: 'Est. EGP', align: 'right' },
        ],
        rows: rows.map((r: Record<string, unknown>) => ({
          program_code: r.program_code || '',
          patient_name: r.patient_name || '',
          employee_name: r.employee_name || '',
          period: r.period || '',
          status: r.status || '',
          item_count: r.item_count ?? '',
          estimated_total_egp:
            r.estimated_total_egp != null ? String(r.estimated_total_egp) : '—',
        })),
        autoPrint,
      });
      const label = [period || 'all', status || 'all'].join('-');
      return pdfHtmlResponse(html, `refills-${label}.pdf.html`);
    }

    return NextResponse.json({ ok: true, count: rows.length, refills: rows });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'List failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
