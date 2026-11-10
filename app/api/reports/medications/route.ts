import { NextRequest, NextResponse } from 'next/server';
import { buildMedicationsCsv, buildMedicationsReport } from '@/lib/reports';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

/** GET /api/reports/medications?format=json|csv|pdf */
export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not set', ok: false },
        { status: 503 }
      );
    }

    const format = (req.nextUrl.searchParams.get('format') || 'json').toLowerCase();
    const autoPrint = req.nextUrl.searchParams.get('autoprint') !== '0';

    if (format === 'csv') {
      const csv = await buildMedicationsCsv();
      const day = new Date().toISOString().slice(0, 10);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="medications-${day}.csv"`,
        },
      });
    }

    const report = await buildMedicationsReport();

    if (format === 'pdf' || format === 'print') {
      const s = report.summary;
      const html = buildPrintableHtml({
        title: 'Chronic medications catalog',
        subtitle:
          'كتالوج المستحضرات المزمنة · Save as PDF from the print dialog',
        meta: [
          { label: 'Active programs', value: String(s.active_programs) },
          { label: 'Med lines', value: String(s.active_med_lines) },
          { label: 'Unique drugs', value: String(s.unique_drugs) },
          { label: 'EVA preferred', value: String(s.eva_preferred) },
          { label: 'Not EVA', value: String(s.not_in_eva) },
          {
            label: 'Generated',
            value: report.generated_at.slice(0, 16).replace('T', ' ') + ' UTC',
          },
        ],
        columns: [
          { key: 'drug_name', label: 'Drug' },
          { key: 'programs', label: 'Programs', align: 'right' },
          { key: 'total_qty_per_cycle', label: 'Qty/cycle', align: 'right' },
          { key: 'formulary_flag', label: 'Formulary' },
          { key: 'eva', label: 'EVA' },
        ],
        rows: report.catalog.map((m) => ({
          drug_name: m.drug_name,
          programs: m.programs,
          total_qty_per_cycle: m.total_qty_per_cycle,
          formulary_flag: m.formulary_flag,
          eva: m.company_preferred ? 'Yes' : '—',
        })),
        footerNote: 'Active chronic lines · Medical Aid Automation',
        autoPrint,
      });
      const day = new Date().toISOString().slice(0, 10);
      return pdfHtmlResponse(html, `medications-catalog-${day}.pdf.html`);
    }

    return NextResponse.json({ ok: true, ...report });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Medications report failed';
    return NextResponse.json({ error: message, ok: false }, { status: 500 });
  }
}
