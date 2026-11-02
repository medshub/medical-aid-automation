import { NextRequest, NextResponse } from 'next/server';
import {
  buildPharmacyPickList,
  pharmacyPickListCsv,
} from '@/lib/pharmacy';
import { authorizeRequest, unauthorizedResponse } from '@/lib/auth';
import { resolveOrgScope } from '@/lib/orgScope';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

/** GET /api/pharmacy/pick-list?period=&status=&formulary=EVA|NOT_EVA&format=csv|pdf */
export async function GET(req: NextRequest) {
  try {
    if (!authorizeRequest(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not set', ok: false },
        { status: 503 }
      );
    }

    const scope = await resolveOrgScope(req);
    const { searchParams } = req.nextUrl;
    const period = searchParams.get('period') || undefined;
    const status = searchParams.get('status') || undefined;
    const includePending = searchParams.get('includePending') === 'true';
    const formularyRaw = (searchParams.get('formulary') || 'all').toUpperCase();
    const formulary =
      formularyRaw === 'EVA' || formularyRaw === 'NOT_EVA'
        ? (formularyRaw as 'EVA' | 'NOT_EVA')
        : 'all';
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const autoPrint = searchParams.get('autoprint') !== '0';

    const lines = await buildPharmacyPickList({
      period,
      status,
      includePending,
      formulary,
      org_ids: scope.all ? undefined : scope.org_ids,
    });

    const label = [period || 'all', formulary !== 'all' ? formulary : '']
      .filter(Boolean)
      .join('-');

    if (format === 'csv') {
      const csv = pharmacyPickListCsv(lines);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="pharmacy-picklist-${label}.csv"`,
        },
      });
    }

    if (format === 'pdf' || format === 'print') {
      const rows = lines.map((l) => ({
        patient: l.patient_name || '',
        employee: l.employee_name || '',
        emp_id: l.employee_id || '',
        med: l.drug_name || '',
        qty: l.qty ?? '',
        status: l.cycle_status || l.item_status || '',
        route: l.company_preferred ? 'EVA' : 'Not EVA',
        program: l.program_code || '',
      }));

      const html = buildPrintableHtml({
        title: `Pharmacy pick list · ${label}`,
        subtitle:
          'قائمة صرف الصيدلية · Export / Save as PDF from the print dialog',
        meta: [
          { label: 'Period', value: period || 'all' },
          { label: 'Route', value: formulary },
          { label: 'Lines', value: String(lines.length) },
        ],
        columns: [
          { key: 'patient', label: 'Patient' },
          { key: 'employee', label: 'Employee' },
          { key: 'emp_id', label: 'Emp ID' },
          { key: 'med', label: 'Medicine' },
          { key: 'qty', label: 'Qty', align: 'right' },
          { key: 'route', label: 'Route' },
          { key: 'status', label: 'Status' },
          { key: 'program', label: 'Program' },
        ],
        rows,
        autoPrint,
      });

      return pdfHtmlResponse(html, `pharmacy-picklist-${label}.pdf.html`);
    }

    return NextResponse.json({
      ok: true,
      count: lines.length,
      formulary,
      lines,
      org_scope: {
        all: scope.all,
        org_codes: scope.org_codes,
        source: scope.source,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Pick list failed';
    return NextResponse.json({ error: message, ok: false }, { status: 500 });
  }
}
