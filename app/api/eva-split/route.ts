import { NextRequest, NextResponse } from 'next/server';
import {
  evaSplitToCsv,
  splitFromDatabase,
  splitFromSheet,
} from '@/lib/evaSplit';
import { jsonError } from '@/lib/errors';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Bucket = 'EVA' | 'NOT_EVA' | 'all';

function parseBucket(raw: string | null): Bucket {
  const u = (raw || 'all').toUpperCase();
  if (u === 'EVA') return 'EVA';
  if (u === 'NOT_EVA' || u === 'NOT-EVA' || u === 'NOTEVA') return 'NOT_EVA';
  return 'all';
}

/**
 * GET /api/eva-split
 *   ?source=db|sheet  (default db)
 *   ?bucket=EVA|NOT_EVA|all
 *   ?format=csv|pdf
 *   ?q=search
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const source = (sp.get('source') || 'db').toLowerCase();
    const bucket = parseBucket(sp.get('bucket'));
    const format = (sp.get('format') || 'json').toLowerCase();
    const q = sp.get('q') || undefined;
    const autoPrint = sp.get('autoprint') !== '0';

    let eva: Awaited<ReturnType<typeof splitFromDatabase>>['eva'] = [];
    let not_eva: Awaited<ReturnType<typeof splitFromDatabase>>['not_eva'] =
      [];
    let total = 0;
    let usedSource = source;

    if (source === 'sheet') {
      try {
        const sheet = await splitFromSheet();
        eva = sheet.eva;
        not_eva = sheet.not_eva;
        total = sheet.total;
        usedSource = 'sheet';
      } catch (e) {
        if (!process.env.DATABASE_URL) throw e;
        const db = await splitFromDatabase({ q });
        eva = db.eva;
        not_eva = db.not_eva;
        total = db.total;
        usedSource = 'db_fallback';
      }
    } else {
      if (!process.env.DATABASE_URL) {
        return NextResponse.json(
          { ok: false, error: 'DATABASE_URL not set', code: 'missing_env' },
          { status: 503 }
        );
      }
      const db = await splitFromDatabase({
        bucket,
        q,
      });
      eva = db.eva;
      not_eva = db.not_eva;
      total = db.total;
      usedSource = 'db';
    }

    if (bucket === 'EVA') not_eva = [];
    if (bucket === 'NOT_EVA') eva = [];

    const rows =
      bucket === 'EVA'
        ? eva
        : bucket === 'NOT_EVA'
          ? not_eva
          : [...eva, ...not_eva];

    const label =
      bucket === 'EVA'
        ? 'Available-in-EVA'
        : bucket === 'NOT_EVA'
          ? 'NOT-IN-EVA'
          : 'EVA-split-all';

    if (format === 'csv') {
      return new NextResponse(evaSplitToCsv(rows), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${label}.csv"`,
        },
      });
    }

    if (format === 'pdf' || format === 'print') {
      const html = buildPrintableHtml({
        title: `EVA split · ${label}`,
        subtitle: 'توزيع إيفا / غير إيفا · Save as PDF from the print dialog',
        meta: [
          { label: 'Source', value: usedSource },
          { label: 'Bucket', value: bucket },
          { label: 'Rows', value: String(rows.length) },
          { label: 'Total active lines', value: String(total) },
        ],
        columns: [
          { key: 'bucket', label: 'Route' },
          { key: 'employee_name', label: 'Employee' },
          { key: 'employee_id', label: 'Emp ID' },
          { key: 'patient_name', label: 'Patient' },
          { key: 'matched_name', label: 'Medicine' },
          { key: 'qty', label: 'Qty', align: 'right' },
          { key: 'program_code', label: 'Program' },
          { key: 'company', label: 'Company' },
        ],
        rows: rows as unknown as Record<string, unknown>[],
        autoPrint,
      });
      return pdfHtmlResponse(html, `${label}.pdf.html`);
    }

    return NextResponse.json({
      ok: true,
      source: usedSource,
      counts: {
        eva: eva.length,
        not_eva: not_eva.length,
        total: eva.length + not_eva.length,
      },
      eva,
      not_eva,
      total,
    });
  } catch (e: unknown) {
    const { body, status } = jsonError(e);
    return NextResponse.json(body, { status });
  }
}
