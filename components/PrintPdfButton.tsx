'use client';

export function PrintPdfButton({
  label = 'Export PDF · تصدير PDF',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={
        className ||
        'rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 shadow-sm'
      }
    >
      {label}
    </button>
  );
}
