/**
 * Lightweight printable HTML for "Export to PDF" (browser Save as PDF).
 * No external PDF libraries — works with Arabic and offline printing.
 */

export type PdfTableColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
};

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}

export function buildPrintableHtml(opts: {
  title: string;
  subtitle?: string;
  meta?: Array<{ label: string; value: string }>;
  columns: PdfTableColumn[];
  rows: Record<string, unknown>[];
  footerNote?: string;
  autoPrint?: boolean;
}): string {
  const autoPrint = opts.autoPrint !== false;
  const metaHtml = (opts.meta || [])
    .map(
      (m) =>
        `<div class="meta-item"><span class="meta-label">${escapeHtml(
          m.label
        )}</span><span>${escapeHtml(m.value)}</span></div>`
    )
    .join('');

  const head = opts.columns
    .map(
      (c) =>
        `<th style="text-align:${c.align || 'left'}">${escapeHtml(c.label)}</th>`
    )
    .join('');

  const body = opts.rows
    .map((row) => {
      const cells = opts.columns
        .map((c) => {
          const v = row[c.key];
          return `<td style="text-align:${c.align || 'left'}">${escapeHtml(
            v
          )}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n');

  const printScript = autoPrint
    ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},250)});</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Arabic", sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #f8fafc;
    }
    .sheet {
      max-width: 1100px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 28px;
    }
    h1 { font-size: 1.35rem; margin: 0 0 4px; }
    .sub { color: #64748b; font-size: 0.875rem; margin: 0 0 16px; }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 24px;
      margin-bottom: 20px;
      font-size: 0.85rem;
    }
    .meta-label { color: #64748b; margin-right: 6px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 6px;
      vertical-align: top;
    }
    th {
      text-align: left;
      background: #f1f5f9;
      font-weight: 600;
      color: #334155;
    }
    tr:nth-child(even) td { background: #fafafa; }
    .footer {
      margin-top: 20px;
      font-size: 0.75rem;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
    }
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }
    .toolbar button {
      appearance: none;
      border: 0;
      border-radius: 10px;
      padding: 10px 16px;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      background: #0f172a;
      color: #fff;
    }
    .toolbar .hint { font-size: 0.8rem; color: #64748b; align-self: center; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { border: 0; border-radius: 0; padding: 0; max-width: none; }
      .toolbar { display: none !important; }
      th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="toolbar">
      <button type="button" onclick="window.print()">Export / Print PDF · تصدير PDF</button>
      <span class="hint">Choose “Save as PDF” in the print dialog · اختر حفظ كـ PDF</span>
    </div>
    <h1>${escapeHtml(opts.title)}</h1>
    ${opts.subtitle ? `<p class="sub">${escapeHtml(opts.subtitle)}</p>` : ''}
    ${metaHtml ? `<div class="meta">${metaHtml}</div>` : ''}
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>
        ${body || '<tr><td colspan="99">No rows</td></tr>'}
      </tbody>
    </table>
    <div class="footer">
      ${escapeHtml(
        opts.footerNote ||
          `Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · Medical Aid Automation`
      )}
      · ${opts.rows.length} row(s)
    </div>
  </div>
  ${printScript}
</body>
</html>`;
}

export function pdfHtmlResponse(html: string, filename: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
