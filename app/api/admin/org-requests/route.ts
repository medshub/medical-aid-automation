import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/auth';
import {
  approveRegistrationRequest,
  ensureOrgTables,
} from '@/lib/organizations';
import { query } from '@/lib/db';
import { jsonError } from '@/lib/errors';
import { writeAudit } from '@/lib/audit';
import { staffAccessStatus } from '@/lib/staffAccess';
import { buildPrintableHtml, pdfHtmlResponse } from '@/lib/exportPdf';

export const dynamic = 'force-dynamic';

/** GET pending org registration requests · ?format=pdf */
export async function GET(req: NextRequest) {
  try {
    if (!authorizeRequest(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }
    await ensureOrgTables();
    const sp = req.nextUrl.searchParams;
    const format = (sp.get('format') || 'json').toLowerCase();
    const autoPrint = sp.get('autoprint') !== '0';
    const statusFilter = (sp.get('status') || 'pending').trim();

    const params: unknown[] = [];
    let statusSql = `status = 'pending'`;
    if (statusFilter === 'all') {
      statusSql = '1=1';
    } else if (statusFilter) {
      params.push(statusFilter);
      statusSql = `status = $${params.length}`;
    }

    const res = await query(
      `SELECT id::text, org_name, org_code, contact_name, contact_email,
              contact_phone, country, employee_count_est, message, status,
              created_at::text
       FROM org_registration_requests
       WHERE ${statusSql}
       ORDER BY created_at DESC
       LIMIT 200`,
      params
    );

    const mode = process.env.ORG_REGISTRATION_MODE || 'auto';

    if (format === 'pdf' || format === 'print') {
      const html = buildPrintableHtml({
        title: 'Organization registration requests',
        subtitle:
          'طلبات تسجيل المؤسسات · Save as PDF from the print dialog',
        meta: [
          { label: 'Mode', value: mode },
          { label: 'Status filter', value: statusFilter },
          { label: 'Rows', value: String(res.rows.length) },
          {
            label: 'Generated',
            value:
              new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
          },
        ],
        columns: [
          { key: 'created_at', label: 'Submitted' },
          { key: 'org_name', label: 'Organization' },
          { key: 'org_code', label: 'Code' },
          { key: 'contact', label: 'Contact' },
          { key: 'status', label: 'Status' },
          { key: 'message', label: 'Message' },
        ],
        rows: res.rows.map((r: Record<string, unknown>) => ({
          created_at: String(r.created_at || '')
            .replace('T', ' ')
            .slice(0, 16),
          org_name: r.org_name || '',
          org_code: r.org_code || '',
          contact: [r.contact_name, r.contact_email, r.contact_phone]
            .filter(Boolean)
            .join(' · '),
          status: r.status || '',
          message: r.message
            ? String(r.message).slice(0, 80)
            : '—',
        })),
        footerNote: 'Staff only · multi-tenant onboarding queue',
        autoPrint,
      });
      return pdfHtmlResponse(
        html,
        `org-requests-${statusFilter}.pdf.html`
      );
    }

    return NextResponse.json({
      ok: true,
      mode,
      count: res.rows.length,
      requests: res.rows,
    });
  } catch (e: unknown) {
    const { body, status } = jsonError(e);
    return NextResponse.json(body, { status });
  }
}

/** POST { action: 'approve'|'reject', id } */
export async function POST(req: NextRequest) {
  try {
    if (!authorizeRequest(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || '');
    const action = String(body.action || '');
    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: 'id and action=approve|reject required' },
        { status: 400 }
      );
    }

    const actor =
      staffAccessStatus(req).staff_email || body.actor || 'admin';

    if (action === 'approve') {
      const result = await approveRegistrationRequest(id, String(actor));
      if (!result.ok) {
        return NextResponse.json(result, { status: 400 });
      }
      await writeAudit({
        actor: String(actor),
        action: 'org.registration_approved',
        entity_type: 'org_registration',
        entity_id: id,
        org_code: result.org?.code,
        meta: { org_name: result.org?.name },
      });
      return NextResponse.json(result);
    }

    await ensureOrgTables();
    await query(
      `UPDATE org_registration_requests
       SET status = 'rejected', reviewed_by = $2, reviewed_at = now()
       WHERE id = $1::uuid AND status = 'pending'`,
      [id, String(actor)]
    );
    await writeAudit({
      actor: String(actor),
      action: 'org.registration_rejected',
      entity_type: 'org_registration',
      entity_id: id,
    });
    return NextResponse.json({ ok: true, status: 'rejected' });
  } catch (e: unknown) {
    const { body, status } = jsonError(e);
    return NextResponse.json(body, { status });
  }
}
