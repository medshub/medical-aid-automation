import { NextRequest, NextResponse } from 'next/server';
import { buildMonthlyCsv, buildMonthlyReport } from '@/lib/reports';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

function defaultPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** GET /api/reports/monthly?period=2026-09&format=json|csv|pdf */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || defaultPeriod();
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const autoPrint = searchParams.get('autoprint') !== '0';

    if (format === 'csv') {
      const csv = await buildMonthlyCsv(period);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="refills-${period}.csv"`,
        },
      });
    }

    const report = await buildMonthlyReport(period);

    if (format === 'pdf' || format === 'print') {
      const s = report.summary;
      const html = buildPrintableHtml({
        title: `Monthly medicine report · ${period}`,
        subtitle:
          'تقرير الأدوية الشهري · Save as PDF from the print dialog',
        meta: [
          { label: 'Period', value: period },
          { label: 'Cycles', value: String(s.cycles) },
          { label: 'Estimated EGP', value: String(s.estimated_total_egp) },
          { label: 'Approved EGP', value: String(s.approved_total_egp) },
          {
            label: 'Items D/A/P',
            value: `${s.items_dispensed}/${s.items_approved}/${s.items_pending}`,
          },
        ],
        columns: [
          { key: 'program_code', label: 'Program' },
          { key: 'patient_name', label: 'Patient' },
          { key: 'employee_name', label: 'Employee' },
          { key: 'status', label: 'Status' },
          { key: 'estimated_total_egp', label: 'Est.', align: 'right' },
          { key: 'approved_total_egp', label: 'Approved', align: 'right' },
        ],
        rows: (report.cycles as Record<string, unknown>[]).map((c) => ({
          program_code: c.program_code || '',
          patient_name: c.patient_name || '',
          employee_name: c.employee_name || '',
          status: c.status || '',
          estimated_total_egp:
            c.estimated_total_egp != null ? String(c.estimated_total_egp) : '—',
          approved_total_egp:
            c.approved_total_egp != null ? String(c.approved_total_egp) : '—',
        })),
        footerNote: 'Medical Aid Automation · monthly refill snapshot',
        autoPrint,
      });
      return pdfHtmlResponse(html, `monthly-report-${period}.pdf.html`);
    }

    return NextResponse.json({ ok: true, ...report });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Report failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
