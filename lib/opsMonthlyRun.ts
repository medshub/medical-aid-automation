import { processPlatformIntake } from '@/lib/processIntake';
import { syncApprovedToPrograms } from '@/lib/syncApprovedToPrograms';
import { generateRefills } from '@/lib/refills';
import { buildMedicationsReport, buildMonthlyReport } from '@/lib/reports';
import { softStep, pipelineResult } from '@/lib/errors';
import { writeAudit } from '@/lib/audit';

export type MonthlyRunOptions = {
  period?: string;
  /** When true, process-intake does not write (still reports counts) */
  dryRun?: boolean;
  /** Skip Google/sheet-era sync (default false — soft-fails if unused) */
  skipSheetSync?: boolean;
  /** Skip refill generation */
  skipRefills?: boolean;
  /** Skip report snapshot */
  skipReports?: boolean;
  org_codes?: string[];
  actor?: string;
};

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Safe monthly ops automation (no auto-submit claims, no auto-dispense).
 * 1) Process waiting intake → enroll + claim drafts
 * 2) Optional sheet sync to programs
 * 3) Generate refill cycles for the period
 * 4) Snapshot monthly + medications reports
 */
export async function runMonthlyOps(opts: MonthlyRunOptions = {}) {
  const period = opts.period || currentPeriod();
  const dryRun = !!opts.dryRun;
  const actor = opts.actor || 'ops-monthly-run';

  const intakeStep = await softStep(
    'process_intake',
    () =>
      processPlatformIntake(dryRun, {
        org_codes: opts.org_codes,
      }),
    { optional: false }
  );

  const syncStep =
    opts.skipSheetSync || !process.env.DATABASE_URL
      ? {
          ok: true as const,
          data: { skipped: true, reason: opts.skipSheetSync ? 'skip' : 'no_db' },
        }
      : await softStep('sheet_sync', () => syncApprovedToPrograms(), {
          optional: true,
        });

  const refillsStep =
    opts.skipRefills || dryRun
      ? {
          ok: true as const,
          data: {
            skipped: true,
            reason: dryRun ? 'dry_run' : 'skip',
            period,
          },
        }
      : await softStep('refills', () => generateRefills(period), {
          optional: false,
        });

  const reportsStep =
    opts.skipReports
      ? {
          ok: true as const,
          data: { skipped: true },
        }
      : await softStep(
          'reports',
          async () => {
            const [monthly, medications] = await Promise.all([
              buildMonthlyReport(period),
              buildMedicationsReport(),
            ]);
            return {
              period,
              monthly_summary: monthly.summary,
              monthly_cycles: monthly.cycles.length,
              top_meds: monthly.top_meds?.slice?.(0, 10) ?? monthly.top_meds,
              medications_summary: medications.summary,
            };
          },
          { optional: true }
        );

  const pipe = pipelineResult({
    process_intake: intakeStep,
    sheet_sync: syncStep,
    refills: refillsStep,
    reports: reportsStep,
  });

  if (!dryRun) {
    try {
      await writeAudit({
        actor,
        action: 'ops.monthly_run',
        entity_type: 'batch',
        meta: {
          period,
          ok: pipe.ok,
          partial: pipe.partial,
          errors: pipe.errors,
          intake: intakeStep.ok ? summarizeIntake(intakeStep.data) : null,
          refills: refillsStep.ok ? summarizeRefills(refillsStep.data) : null,
        },
      });
    } catch {
      /* audit must not fail the run */
    }
  }

  return {
    ok: pipe.ok,
    partial: pipe.partial,
    dryRun,
    period,
    generated_at: new Date().toISOString(),
    steps: pipe.data,
    errors: pipe.errors,
    /** Human-facing next actions that stay manual */
    manual_next: [
      'Review and Submit claim drafts on /claims',
      'Export Pharmacy EVA + Not EVA CSVs on /pharmacy',
      'Optional full cut on /eva-split',
      'Review refill cycles on /refills then dispense',
      'PDFs from Admin → Reports hub',
    ],
  };
}

function summarizeIntake(data: unknown) {
  if (!data || typeof data !== 'object') return data;
  const d = data as Record<string, unknown>;
  return {
    processed: d.processed,
    enrolled: d.enrolled,
    claims_created: d.claims_created,
    message: d.message,
  };
}

function summarizeRefills(data: unknown) {
  if (!data || typeof data !== 'object') return data;
  const d = data as Record<string, unknown>;
  if (d.skipped) return d;
  return {
    period: d.period,
    created: d.created,
    skipped: d.skipped,
    emptySkipped: d.emptySkipped,
    cycles: Array.isArray(d.cycles) ? d.cycles.length : undefined,
  };
}
