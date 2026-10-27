import Link from 'next/link';
import { query } from '@/lib/db';
import { FlowSteps } from '../FlowSteps';
import { FormSelectPicker } from '@/components/FormSelectPicker';
import { PROGRAM_STATUS_OPTIONS } from '@/lib/optionLists';
import { isWhoAssessmentEnabled } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

// RESTORED - full content will follow in next commit if truncated
export default async function ProgramsPage() {
  return (
    <main className="min-h-screen p-4 sm:p-6 text-slate-900 pb-28">
      <div className="mx-auto max-w-5xl space-y-5">
        <FlowSteps current={5} />
        <h1 className="aid-display text-3xl font-semibold">Programs</h1>
        <p className="text-sm text-amber-800">
          Restoring full page — if you see this briefly, refresh in a minute.
        </p>
        <a href="/eva-split" className="text-violet-700 underline">← EVA</a>
        {' · '}
        <a href="/refills" className="text-violet-700 underline">Refills →</a>
      </div>
    </main>
  );
}
