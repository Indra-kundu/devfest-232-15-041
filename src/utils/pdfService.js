import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Reads a PDF file, validates it, and returns its page count and arrayBuffer.
 * @param {File} file 
 * @returns {Promise<{ pageCount: number, arrayBuffer: ArrayBuffer }>}
 */
export async function readPdfInfo(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Validate by attempting to parse with pdf-lib
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    return {
      pageCount,
      arrayBuffer
    };
  } catch (err) {
    console.error('Failed to parse PDF:', file.name, err);
    throw new Error(err.message || 'Corrupted or unreadable PDF file');
  }
}

/**
 * Truncates text with ellipsis if it exceeds maxWidth using font metrics.
 */
function fitText(text, font, size, maxWidth) {
  if (!text) return '';
  let width = font.widthOfTextAtSize(text, size);
  if (width <= maxWidth) return text;
  
  let low = 0;
  let high = text.length;
  let best = text;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.slice(0, mid) + '...';
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return best;
}

/**
 * Generates the combined Tender Submission Package PDF with English Cover Page and footers.
 * 
 * @param {Object} options
 * @param {Object} options.tender
 * @param {Array} options.requirements - Sorted requirements with matches
 * @param {Object} options.matches - Map of reqId -> fileId
 * @param {Array} options.files - List of uploaded file objects with arrayBuffer & pageCount
 * @param {Object} options.expiryDates - Map of reqId -> expiryDate string
 * @returns {Promise<Uint8Array>}
 */
export async function generateTenderPackage({ tender, requirements, matches, files, expiryDates }) {
  const mergedPdf = await PDFDocument.create();
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Filter matched requirements in order
  const includedList = [];
  for (const req of requirements) {
    const fileId = matches[req.id];
    if (fileId) {
      const fileObj = files.find(f => f.id === fileId);
      if (fileObj && fileObj.arrayBuffer) {
        includedList.push({
          req,
          file: fileObj,
          expiryDate: req.has_expiry ? (expiryDates[req.id] || 'N/A') : 'N/A'
        });
      }
    }
  }

  // -------------------------------------------------------------
  // 1. CREATE PAGE 1: ENGLISH COVER PAGE (A4 size: 595.28 x 841.89)
  // -------------------------------------------------------------
  const coverPage = mergedPdf.addPage([595.28, 841.89]);
  const { width: pageWidth, height: pageHeight } = coverPage.getSize();
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let curY = pageHeight - 55;

  // Header Title Accent Bar
  coverPage.drawRectangle({
    x: margin,
    y: curY - 2,
    width: contentWidth,
    height: 4,
    color: rgb(0.12, 0.23, 0.54) // Navy accent
  });
  curY -= 25;

  // Header Title
  const mainTitle = 'TENDER SUBMISSION PACKAGE';
  coverPage.drawText(mainTitle, {
    x: margin,
    y: curY,
    size: 20,
    font: fontBold,
    color: rgb(0.09, 0.15, 0.33)
  });
  curY -= 16;

  coverPage.drawText('Official Tender Document Dossier & Submission Package', {
    x: margin,
    y: curY,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55)
  });
  curY -= 24;

  // -------------------------------------------------------------
  // Tender Meta Information Box
  // -------------------------------------------------------------
  const infoBoxHeight = 118;
  coverPage.drawRectangle({
    x: margin,
    y: curY - infoBoxHeight,
    width: contentWidth,
    height: infoBoxHeight,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.93),
    borderWidth: 1
  });

  const nowFormatted = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' (Local)';
  const leftColX = margin + 15;
  const rightColX = margin + contentWidth / 2 + 10;
  let infoY = curY - 20;

  // Tender ID & Deadline
  coverPage.drawText('Tender ID:', { x: leftColX, y: infoY, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.45) });
  coverPage.drawText(tender.tender_id || 'N/A', { x: leftColX + 85, y: infoY, size: 9, font: fontBold, color: rgb(0.08, 0.12, 0.25) });

  coverPage.drawText('Submission Deadline:', { x: rightColX, y: infoY, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.45) });
  coverPage.drawText(tender.submission_deadline || 'N/A', { x: rightColX + 110, y: infoY, size: 9, font: fontBold, color: rgb(0.75, 0.1, 0.1) });

  infoY -= 18;
  // Title
  coverPage.drawText('Tender Title:', { x: leftColX, y: infoY, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.45) });
  const titleStr = fitText(tender.title || 'N/A', fontRegular, 9, contentWidth - 110);
  coverPage.drawText(titleStr, { x: leftColX + 85, y: infoY, size: 9, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });

  infoY -= 18;
  // Procuring Entity
  coverPage.drawText('Procuring Entity:', { x: leftColX, y: infoY, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.45) });
  const peStr = fitText(tender.procuring_entity || 'N/A', fontRegular, 9, contentWidth - 110);
  coverPage.drawText(peStr, { x: leftColX + 85, y: infoY, size: 9, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });

  infoY -= 18;
  // Bidder
  coverPage.drawText('Bidder Name:', { x: leftColX, y: infoY, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.45) });
  const bidderStr = fitText(tender.bidder || 'N/A', fontRegular, 9, contentWidth - 110);
  coverPage.drawText(bidderStr, { x: leftColX + 85, y: infoY, size: 9, font: fontRegular, color: rgb(0.1, 0.15, 0.2) });

  infoY -= 18;
  // Package Date & Included Count
  coverPage.drawText('Package Created:', { x: leftColX, y: infoY, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.45) });
  coverPage.drawText(nowFormatted, { x: leftColX + 85, y: infoY, size: 9, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });

  coverPage.drawText('Included Documents:', { x: rightColX, y: infoY, size: 9, font: fontBold, color: rgb(0.3, 0.35, 0.45) });
  coverPage.drawText(`${includedList.length} of ${requirements.length} required`, { x: rightColX + 110, y: infoY, size: 9, font: fontRegular, color: rgb(0.2, 0.25, 0.3) });

  curY -= (infoBoxHeight + 25);

  // -------------------------------------------------------------
  // Table of Included Documents in Final Order
  // -------------------------------------------------------------
  coverPage.drawText('INCLUDED DOCUMENTS SCHEDULE (IN SUBMISSION ORDER)', {
    x: margin,
    y: curY,
    size: 11,
    font: fontBold,
    color: rgb(0.12, 0.2, 0.4)
  });
  curY -= 14;

  // Table Column Definitions
  const colOrderX = margin + 6;
  const colTitleX = margin + 30;
  const colFileX = margin + 215;
  const colPagesX = margin + 375;
  const colExpiryX = margin + 425;

  const tableHeaderHeight = 20;
  coverPage.drawRectangle({
    x: margin,
    y: curY - tableHeaderHeight,
    width: contentWidth,
    height: tableHeaderHeight,
    color: rgb(0.88, 0.91, 0.96),
    borderColor: rgb(0.78, 0.82, 0.89),
    borderWidth: 1
  });

  const headerY = curY - 14;
  coverPage.drawText('#', { x: colOrderX, y: headerY, size: 8.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
  coverPage.drawText('Document Title', { x: colTitleX, y: headerY, size: 8.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
  coverPage.drawText('Attached Filename', { x: colFileX, y: headerY, size: 8.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
  coverPage.drawText('Pages', { x: colPagesX, y: headerY, size: 8.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });
  coverPage.drawText('Expiry Date', { x: colExpiryX, y: headerY, size: 8.5, font: fontBold, color: rgb(0.15, 0.2, 0.3) });

  curY -= tableHeaderHeight;

  // Rows
  const rowHeight = 22;
  for (let idx = 0; idx < includedList.length; idx++) {
    const item = includedList[idx];
    const isEven = idx % 2 === 0;

    // Row background
    coverPage.drawRectangle({
      x: margin,
      y: curY - rowHeight,
      width: contentWidth,
      height: rowHeight,
      color: isEven ? rgb(1, 1, 1) : rgb(0.97, 0.98, 0.99),
      borderColor: rgb(0.88, 0.9, 0.94),
      borderWidth: 0.5
    });

    const rowTextY = curY - 15;
    // Order
    coverPage.drawText(String(item.req.order || (idx + 1)), {
      x: colOrderX,
      y: rowTextY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.35)
    });

    // English title
    const docTitle = fitText(item.req.title_en || item.req.id, fontRegular, 8.5, 175);
    coverPage.drawText(docTitle, {
      x: colTitleX,
      y: rowTextY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.1, 0.15, 0.2)
    });

    // Filename
    const fileNameStr = fitText(item.file.name, fontRegular, 8, 150);
    coverPage.drawText(fileNameStr, {
      x: colFileX,
      y: rowTextY,
      size: 8,
      font: fontRegular,
      color: rgb(0.25, 0.3, 0.4)
    });

    // Pages
    coverPage.drawText(String(item.file.pageCount || 1), {
      x: colPagesX + 4,
      y: rowTextY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.2, 0.25, 0.35)
    });

    // Expiry
    const expText = item.expiryDate === 'N/A' ? '-' : item.expiryDate;
    coverPage.drawText(expText, {
      x: colExpiryX,
      y: rowTextY,
      size: 8.5,
      font: fontRegular,
      color: item.expiryDate === 'N/A' ? rgb(0.5, 0.55, 0.6) : rgb(0.1, 0.45, 0.2)
    });

    curY -= rowHeight;
  }

  // -------------------------------------------------------------
  // 2. APPEND ALL MATCHED PDF DOCUMENTS IN REQUIREMENTS ORDER
  // -------------------------------------------------------------
  for (const item of includedList) {
    try {
      const srcPdf = await PDFDocument.load(item.file.arrayBuffer, { ignoreEncryption: true });
      const pageIndices = srcPdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(srcPdf, pageIndices);
      for (const cp of copiedPages) {
        mergedPdf.addPage(cp);
      }
    } catch (err) {
      console.error(`Failed to copy pages for ${item.file.name}:`, err);
      throw new Error(`Error embedding file "${item.file.name}": ${err.message}`);
    }
  }

  // -------------------------------------------------------------
  // 3. ADD FOOTER TO EVERY PAGE OF THE FINAL PACKAGE
  // Format: <tender_id> | Page X of Y
  // Safe bottom margin so it doesn't cover content
  // -------------------------------------------------------------
  const totalPages = mergedPdf.getPageCount();
  const footerFontSize = 9;
  const footerFont = fontRegular;

  for (let i = 0; i < totalPages; i++) {
    const page = mergedPdf.getPage(i);
    const { width: pWidth } = page.getSize();
    const pageNumber = i + 1;
    const footerText = `${tender.tender_id || 'Tender'} | Page ${pageNumber} of ${totalPages}`;
    const textWidth = footerFont.widthOfTextAtSize(footerText, footerFontSize);
    const textX = (pWidth - textWidth) / 2;
    const textY = 20; // Safe bottom margin

    // Subtle white background banner behind footer to prevent overlapping with content lines
    page.drawRectangle({
      x: textX - 8,
      y: textY - 4,
      width: textWidth + 16,
      height: footerFontSize + 8,
      color: rgb(1, 1, 1),
      opacity: 0.92
    });

    page.drawText(footerText, {
      x: textX,
      y: textY,
      size: footerFontSize,
      font: footerFont,
      color: rgb(0.2, 0.25, 0.35)
    });
  }

  // Save and return
  const pdfBytes = await mergedPdf.save();
  return {
    pdfBytes,
    pageCount: totalPages
  };
}
