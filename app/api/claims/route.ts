import { NextRequest, NextResponse } from 'next/server';
import {
  createClaimDraft,
  listClaims,
  getClaim,
  updateClaimStatus,
  submitClaimExternal,
  type ClaimStatus,
} from '@/lib/claims';
import { authorizeRequest, unauthorizedResponse } from '@/lib/auth';
import { jsonError, AppError } from '@/lib/errors';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!authorizeRequest(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: 'DATABASE_URL not set', code: 'missing_env' },
        { status: 503 }
      );
    }

    const sp = req.nextUrl.searchParams;
    const id = sp.get('id');
    if (id) {
      const full = await getClaim(id);
      return NextResponse.json({ ok: true, ...full });
    }

    const { resolveOrgScope } = await import('@/lib/orgScope');
    const scope = await resolveOrgScope(req);
    const status = sp.get('status') || 'all';
    const q = sp.get('q') || undefined;
    const format = (sp.get('format') || 'json').toLowerCase();
    const autoPrint = sp.get('autoprint') !== '0';
    const limit = Number(sp.get('limit') || (format === 'pdf' ? 200 : 50));

    const rows = await listClaims({
      status,
      q,
      limit,
      org_codes: scope.all ? undefined : scope.org_codes,
      org_ids: scope.all ? undefined : scope.org_ids,
    });

    if (format === 'pdf' || format === 'print') {
      const html = buildPrintableHtml({
        title: `Claims · ${status}`,
        subtitle: 'المطالبات · Save as PDF from the print dialog',
        meta: [
          { label: 'Status filter', value: status },
          { label: 'Rows', value: String(rows.length) },
        ],
        columns: [
          { key: 'claim_code', label: 'Code' },
          { key: 'patient_name', label: 'Patient' },
          { key: 'emp_name', label: 'Employee' },
          { key: 'period', label: 'Period' },
          { key: 'status', label: 'Status' },
          { key: 'total_claimed_egp', label: 'Claimed EGP', align: 'right' },
        ],
        rows: rows.map((r: Record<string, unknown>) => ({
          claim_code: r.claim_code || r.id || '',
          patient_name: r.patient_name || '',
          emp_name: r.emp_name || '',
          period: r.period || '',
          status: r.status || '',
          total_claimed_egp:
            r.total_claimed_egp != null ? String(r.total_claimed_egp) : '—',
        })),
        autoPrint,
      });
      return pdfHtmlResponse(html, `claims-${status}.pdf.html`);
    }

    return NextResponse.json({
      ok: true,
      count: rows.length,
      claims: rows,
      org_scope: {
        all: scope.all,
        org_codes: scope.org_codes,
        source: scope.source,
      },
    });
  } catch (e: unknown) {
    const { body, status } = jsonError(e);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!authorizeRequest(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: 'DATABASE_URL not set', code: 'missing_env' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'create');

    if (action === 'create') {
      if (!Array.isArray(body.lines) || !body.lines.length) {
        throw new AppError('lines array required', {
          code: 'validation',
          status: 400,
          details: { field: 'lines' },
        });
      }
      const created = await createClaimDraft({
        aid_request_id: body.aid_request_id,
        program_id: body.program_id,
        emp_name: body.emp_name,
        emp_id: body.emp_id,
        patient_name: body.patient_name,
        period: body.period,
        notes: body.notes,
        lines: body.lines,
      });
      return NextResponse.json({ ok: true, ...created });
    }

    if (action === 'set_status') {
      if (!body.id || !body.status) {
        throw new AppError('id and status required', {
          code: 'validation',
          status: 400,
        });
      }
      await updateClaimStatus(String(body.id), body.status as ClaimStatus, {
        notes: body.notes,
        total_approved_egp: body.total_approved_egp,
        external_ref: body.external_ref,
      });
      return NextResponse.json({ ok: true, id: body.id, status: body.status });
    }

    if (action === 'submit') {
      if (!body.id) {
        throw new AppError('id required', { code: 'validation', status: 400 });
      }
      const result = await submitClaimExternal(String(body.id));
      return NextResponse.json({ ok: result.ok, ...result });
    }

    throw new AppError(`Unknown action: ${action}`, {
      code: 'validation',
      status: 400,
    });
  } catch (e: unknown) {
    const { body, status } = jsonError(e);
    return NextResponse.json(body, { status });
  }
}
