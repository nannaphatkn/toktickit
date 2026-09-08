// artifacts/lab-02/generate-pdf.mjs
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

async function generatePDF() {
  console.log('📄 Generating Lab2_Submission.pdf with marked + Base64 images...');
  const mdPath = path.resolve('docs-pdf/lab2/Lab2_Submission.md');
  const pdfPath = path.resolve('docs-pdf/lab2/Lab2_Submission.pdf');
  let mdContent = fs.readFileSync(mdPath, 'utf8');

  // Convert all image links in markdown to Base64 data URLs
  const screenshotsDir = path.resolve('artifacts/lab-02/screenshots');
  mdContent = mdContent.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, imgPath) => {
    const filename = path.basename(imgPath);
    const fullPath = path.join(screenshotsDir, filename);

    if (fs.existsSync(fullPath)) {
      const base64Img = fs.readFileSync(fullPath).toString('base64');
      const dataUrl = `data:image/png;base64,${base64Img}`;
      return `![${alt}](${dataUrl})`;
    } else {
      console.warn(`⚠️ Warning: Image not found at ${fullPath}`);
      return match;
    }
  });

  // Render markdown to HTML using marked
  const parsedHTML = marked.parse(mdContent);

  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TokTickIT — Lab 2 Submission Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        @page {
          size: A4;
          margin: 18mm 15mm 18mm 15mm;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1e293b;
          background: #ffffff;
          line-height: 1.6;
          font-size: 13px;
        }

        h1 {
          font-size: 24px;
          color: #006B3C;
          border-bottom: 3px solid #006B3C;
          padding-bottom: 8px;
          margin-top: 0;
          margin-bottom: 16px;
        }

        h2 {
          font-size: 18px;
          color: #064e3b;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 6px;
          margin-top: 28px;
          margin-bottom: 14px;
          page-break-after: avoid;
        }

        h3 {
          font-size: 15px;
          color: #047857;
          margin-top: 20px;
          margin-bottom: 10px;
          page-break-after: avoid;
        }

        h4 {
          font-size: 13px;
          color: #0f766e;
          margin-top: 14px;
          margin-bottom: 8px;
          page-break-after: avoid;
        }

        p {
          margin-top: 0;
          margin-bottom: 10px;
        }

        code {
          background: #f1f5f9;
          color: #0f172a;
          padding: 2px 5px;
          border-radius: 4px;
          font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
          font-size: 12px;
        }

        pre {
          background: #0f172a;
          color: #f8fafc;
          padding: 14px;
          border-radius: 8px;
          overflow-x: auto;
          font-size: 11px;
          line-height: 1.5;
          page-break-inside: avoid;
          margin-bottom: 14px;
        }

        pre code {
          background: transparent;
          color: inherit;
          padding: 0;
        }

        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 12px auto;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
          page-break-inside: avoid;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          page-break-inside: avoid;
          font-size: 12px;
        }

        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background-color: #f0fdf4;
          color: #065f46;
          font-weight: 600;
        }

        tr:nth-child(even) {
          background-color: #f8fafc;
        }

        /* Responsive image grid styling in tables */
        td img {
          max-height: 280px;
          object-fit: contain;
          margin: 4px auto;
        }

        ul, ol {
          padding-left: 22px;
          margin-top: 0;
          margin-bottom: 12px;
        }

        li {
          margin-bottom: 4px;
        }

        blockquote {
          border-left: 4px solid #10b981;
          background-color: #ecfdf5;
          margin: 14px 0;
          padding: 8px 16px;
          color: #047857;
          border-radius: 0 6px 6px 0;
        }

        hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 24px 0;
        }

        a {
          color: #0284c7;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      ${parsedHTML}
    </body>
    </html>
  `;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(fullHTML, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '18mm', bottom: '18mm', left: '15mm', right: '15mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 8px; color: #94a3b8; margin-left: 15mm; font-family: sans-serif;">TokTickIT — Lab 2 Submission Report</div>',
    footerTemplate: '<div style="font-size: 8px; color: #94a3b8; margin-right: 15mm; text-align: right; width: 100%; font-family: sans-serif;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  });

  await browser.close();
  console.log(`🎉 PDF successfully generated at: ${pdfPath}`);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
