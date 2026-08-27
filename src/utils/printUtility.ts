/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Builds a complete standalone printable HTML document with embedded styling
 */
export function generatePrintableHtml(elementId: string, title: string = 'Household Chore Chart'): string {
  const element = document.getElementById(elementId);
  const contentHtml = element ? element.outerHTML : '<p>No printable schedule found.</p>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@500;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      background-color: #ffffff !important;
      color: #0f172a !important;
      margin: 0;
      padding: 24px;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    @media print {
      body {
        padding: 0 !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      .print-page {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
      .print-card {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="max-w-5xl mx-auto">
    ${contentHtml}
  </div>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;
}

/**
 * Triggers printing using popup window with fallback to direct print & iframe print
 */
export function executePrint(elementId: string, title: string = 'Household Chore Chart'): boolean {
  try {
    const htmlContent = generatePrintableHtml(elementId, title);

    // 1. Try Opening Clean Dedicated Print Window
    const printWindow = window.open('', '_blank', 'width=950,height=800,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      return true;
    }
  } catch (e) {
    console.warn('Could not open print popup window, trying iframe print fallback:', e);
  }

  // 2. Hidden iframe fallback
  try {
    const existingIframe = document.getElementById('hidden-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'hidden-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(generatePrintableHtml(elementId, title));
      doc.close();
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {}
      }, 800);
      return true;
    }
  } catch (e) {
    console.warn('Iframe print fallback error:', e);
  }

  // 3. Fallback directly to window.print()
  try {
    window.print();
    return true;
  } catch (e) {
    console.error('All print methods failed:', e);
    return false;
  }
}

/**
 * Downloads standalone formatted HTML printable file for local offline printing / PDF saving
 */
export function downloadPrintableFile(elementId: string, filename: string = 'Family-Chore-Schedule.html', title: string = 'Household Chore Chart'): void {
  const html = generatePrintableHtml(elementId, title);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
