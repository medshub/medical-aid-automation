import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest, unauthorizedResponse } from '@/lib/auth';
import { resolveOrgScope } from '@/lib/orgScope';
import { runMonthlyOps } from '@/lib/opsMonthlyRun';
import { jsonError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Safe monthly automation:
 * process intake → sheet sync (soft) → generate refills → report snapshot.
 * Does NOT submit claims or dispense.
 *
 * Auth: staff session / PROCESS_SECRET, or CRON_SECRET Bearer for schedules.
 * GET/POST ?period=YYYY-MM&dryRun=1&secret=
 */
export async function GET(req: NextRequest) {
  return run(req);
}

export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  try {
    if (!authorizeCronOrStaff(req)) {
      const u = unauthorizedResponse();
      return NextResponse.json(u.body, { status: u.status });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: 'DATABASE_URL required' },
        { status: 503 }
      );
    }

    const sp = req.nextUrl.searchParams;
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    }

    const period =
      (typeof body.period === 'string' && body.period) ||
      sp.get('period') ||
      undefined;
    const dryRun =
      body.dryRun === true ||
      sp.get('dryRun') === '1' ||
      sp.get('dry_run') === '1';
    const skipSheetSync =
      body.skipSheetSync === true || sp.get('skipSheetSync') === '1';
    const skipRefills =
      body.skipRefills === true || sp.get('skipRefills') === '1';
    const skipReports =
      body.skipReports === true || sp.get('skipReports') === '1';

    let org_codes: string[] | undefined;
    let actor = 'ops-monthly-run';
    try {
      if (authorizeRequest(req)) {
        const scope = await resolveOrgScope(req);
        if (!scope.all) org_codes = scope.org_codes;
        if (scope.email) actor = scope.email;
      }
    } catch {
      /* cron may not have org cookie */
    }

    const result = await runMonthlyOps({
      period,
      dryRun,
      skipSheetSync,
      skipRefills,
      skipReports,
      org_codes,
      actor,
    });

    return NextResponse.json(result, {
      status: result.ok ? 200 : 500,
    });
  } catch (e: unknown) {
    const { body, status } = jsonError(e);
    return NextResponse.json(body, { status });
  }
}

function authorizeCronOrStaff(req: NextRequest): boolean {
  if (authorizeRequest(req)) return true;
  const cronSecret = process.env.CRON_SECRET || process.env.PROCESS_SECRET;
  if (!cronSecret) return true;
  const auth = req.headers.get('authorization');
  if (auth === `Bearer ${cronSecret}`) return true;
  if (req.headers.get('x-process-secret') === cronSecret) return true;
  if (req.nextUrl.searchParams.get('secret') === cronSecret) return true;
  return false;
}
