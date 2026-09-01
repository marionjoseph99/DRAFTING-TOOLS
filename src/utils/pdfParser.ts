import * as pdfjsLib from 'pdfjs-dist';
import { ParsedPdfData, ParsedMorawareData, PdfSheetDetail } from '../types';

// Configure pdfjs worker using standard Vite URL resolution
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    console.warn('Could not set pdfjs workerSrc:', e);
  }
}

export async function extractDataFromPDF(
  arrayBuffer: ArrayBuffer,
  fileName?: string,
  parsedHtmlData?: ParsedMorawareData
): Promise<ParsedPdfData> {
  const typedarray = new Uint8Array(arrayBuffer);
  
  // Configure loading task
  const loadingTask = pdfjsLib.getDocument({
    data: typedarray,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  
  let fullText = '';
  const sheetDetails: PdfSheetDetail[] = [];
  let maxStatedTotalSheets = 0;
  const discoveredRooms: string[] = [];

  // Loop through all pages in the PDF
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Filter non-empty items
    const rawItems = (textContent.items || []) as any[];
    const items = rawItems.filter(
      (item) => typeof item?.str === 'string' && item.str.trim().length > 0
    );

    let pageText = '';

    // Check if items have transform matrices for 2D spatial sorting
    const hasTransforms = items.every(
      (it) => Array.isArray(it.transform) && it.transform.length >= 6
    );

    if (hasTransforms && items.length > 0) {
      // Spatial Sorting: Y coordinate (top to bottom), then X coordinate (left to right)
      // This reconstructs CAD drawings text into natural human reading order
      const sortedItems = [...items].sort((a, b) => {
        const yA = a.transform[5];
        const yB = b.transform[5];
        const xA = a.transform[4];
        const xB = b.transform[4];

        if (Math.abs(yA - yB) > 4) {
          return yB - yA; // Top to Bottom
        }
        return xA - xB; // Left to Right
      });

      let lastY = -1;
      let lastX = -1;

      sortedItems.forEach((item) => {
        const currentY = item.transform[5];
        const currentX = item.transform[4];

        if (lastY !== -1) {
          if (Math.abs(currentY - lastY) > 5) {
            pageText += '\n';
          } else if (lastX !== -1 && currentX - lastX > 15) {
            pageText += '   ';
          } else if (lastX !== -1 && currentX - lastX > 2) {
            pageText += ' ';
          }
        }

        pageText += item.str;
        lastY = currentY;
        lastX = currentX + (item.width || item.str.length * 5);
      });
    } else {
      // Fallback linear join if transform matrix is absent
      pageText = items.map((it) => it.str).join(' ');
    }

    const cText = pageText.replace(/[ \t]+/g, ' ');

    // 1. Detect per-sheet number patterns: SHEET 1 OF 2, PAGE 2 OF 2, SHT 1/2, etc.
    const pageSheetMatch = cText.match(/(?:PAGE|SHEET|SHT|DWG)\s*\.?\s*(\d+)\s*(?:OF|\/)\s*(\d+)/i);
    let statedSheetNumber: number | undefined = undefined;
    let statedTotalSheets: number | undefined = undefined;

    if (pageSheetMatch) {
      statedSheetNumber = parseInt(pageSheetMatch[1], 10);
      statedTotalSheets = parseInt(pageSheetMatch[2], 10);
      if (statedTotalSheets > maxStatedTotalSheets) {
        maxStatedTotalSheets = statedTotalSheets;
      }
    }

    // 2. Detect room / countertop name for this sheet (e.g. COUNTERTOP: KITCHEN, COUNTERTOP: BAR)
    let sheetRoom = '';
    const countertopMatch = cText.match(/COUNTERTOP\s*[:\-]\s*([A-Za-z0-9\s/&]+?)(?=\s*(?:PROFILE|SINK|EDGE|TEMPLATED|DRAWN|PAGE|JOB|$))/i);
    if (countertopMatch) {
      sheetRoom = countertopMatch[1].trim().toUpperCase();
    } else {
      const roomMatch = cText.match(/(?:ROOM|AREA|VIEW|TITLE)\s*[:\-]\s*([A-Za-z0-9\s/&]+?)(?=\s*(?:SCALE|DATE|DRAWN|JOB|SHEET|$))/i);
      if (roomMatch) sheetRoom = roomMatch[1].trim().toUpperCase();
    }
    if (sheetRoom && !discoveredRooms.includes(sheetRoom)) {
      discoveredRooms.push(sheetRoom);
    }

    // 3. Per-sheet sink extraction
    let sheetSinkModel = '';
    const sinkModelMatch =
      cText.match(/(?:SINK:\s*MAKE\/MODEL\/COLOR|SINK\s*MAKE\/MODEL|SINK\s*MODEL)\s*:?\s*(?:[\n\r]+\s*)?([A-Za-z0-9\-_/\s]+?)(?=\s*(?:TOP\s*MOUNT|UNDER\s*MOUNT|FLUSH|FAUCET|HOLE|SINK\s*LOCATION|LOCK|RANGE|BACKSPLASH|$))/i) ||
      cText.match(/SINK\s*[:\-]\s*([^\n\r]+?)(?=\s*(?:TOP\s*MOUNT|UNDER\s*MOUNT|FAUCET|HOLE|EDGE|SPLASH|$))/i);
    if (sinkModelMatch && sinkModelMatch[1].trim() && !sinkModelMatch[1].trim().startsWith('TOP MOUNT')) {
      sheetSinkModel = sinkModelMatch[1].trim().toUpperCase();
    }
    // Also check for standard sink model number like K-8206-CM6
    const specificSinkNumMatch = cText.match(/\b([Kk]-?\d{4,5}(?:-[A-Za-z0-9]+)*)\b/);
    if (specificSinkNumMatch && (!sheetSinkModel || sheetSinkModel.length < specificSinkNumMatch[1].length)) {
      if (sheetSinkModel) {
        if (!sheetSinkModel.includes(specificSinkNumMatch[1].toUpperCase())) {
          sheetSinkModel = `${specificSinkNumMatch[1].toUpperCase()} (${sheetSinkModel})`;
        }
      } else {
        sheetSinkModel = specificSinkNumMatch[1].toUpperCase();
      }
    }

    // Sink mount type
    let sheetSinkType = '';
    if (/UNDER\s*MOUNT\s*\(\s*[Xx✓1]\s*\)/i.test(cText)) sheetSinkType = 'UNDERMOUNT';
    else if (/TOP\s*MOUNT\s*\(\s*[Xx✓1]\s*\)/i.test(cText)) sheetSinkType = 'TOP MOUNT';

    // Sink supplier / location
    let sheetSinkSupply = '';
    const sinkLocMatch = cText.match(/SINK\s*LOCATION\s*:\s*([^\n\r]+?)(?=\s*(?:FAUCET|DRILLING|LOCK|PHONE|$))/i);
    if (sinkLocMatch) sheetSinkSupply = sinkLocMatch[1].trim().toUpperCase();

    // 4. Per-sheet faucet holes
    let sheetFaucetHoles = '';
    const faucetMatch = cText.match(/FAUCET\s*(?:DRILLINGS?|HOLES?|SPREAD)?\s*:\s*([^\n\r]+?)(?=\s*(?:BACKSPLASH|SIDESPLASH|SPLASH|EDGE|SINK|NOTES|LOCK|RANGE|$))/i);
    if (faucetMatch && faucetMatch[1].trim()) {
      sheetFaucetHoles = faucetMatch[1].trim().toUpperCase();
    }

    // 5. Per-sheet backsplash
    let sheetBacksplash = '';
    if (/BACKSPLASH\s*\(\s*N\s*\)/i.test(cText) || /BACKSPLASH\s*\(NONE\)/i.test(cText)) {
      sheetBacksplash = 'NONE';
    } else {
      const splashHeightMatch =
        cText.match(/BACKSPLASH.*?HEIGHT\s*[:=]?\s*([\d\-\/"\w\s]+?)(?=\s*(?:SIDE|EDGE|CUT|NOTES|SINK|RANGE|CABINET|$))/i) ||
        cText.match(/SPLASH\s*HEIGHT\s*[:=]?\s*([\d\-\/"\w\s]+?)(?=\s*(?:SIDE|EDGE|CUT|NOTES|$))/i);
      if (splashHeightMatch && splashHeightMatch[1].trim()) {
        sheetBacksplash = splashHeightMatch[1].trim().toUpperCase();
      } else if (/BACKSPLASH\s*\(\s*S\s*\)/i.test(cText)) {
        sheetBacksplash = 'SQUARE (4")';
      }
    }

    // 6. Per-sheet edge profile
    let sheetEdge = '';
    const edgeMatch =
      cText.match(/(?:PROFILE|EDGE\s*PROFILE|EDGE\s*DETAIL|EDGE)\s*[:\-]\s*([^\n\r]+?)(?=\s*(?:TEMPLATED|DRAWN|SINK|FAUCET|SPLASH|THICKNESS|MATERIAL|NOTES|OVERHANGS|$))/i) ||
      cText.match(/\b(FLAT\s*EASED(?:\s*\([A-Z0-9]+\))?(?:\s*[\d/"]+\s*[xX*]\s*[\d/"]+)?|EASED|1\/4\s*BEVEL|1\/2\s*BEVEL|BEVEL|OGEE|HALF\s*BULLNOSE|FULL\s*BULLNOSE|DEMI\s*BULLNOSE|MITER(?:ED)?|CRESCENT|DUPONT|CHISELED|COVE)\b/i);
    if (edgeMatch) {
      sheetEdge = edgeMatch[1].trim().toUpperCase();
    }

    // 7. Per-sheet material
    let sheetMaterial = '';
    const topMatMatch =
      cText.match(/(?:3CM|2CM)\s*-\s*([A-Z0-9\s\-]+?)(?=\s*(?:TEAR-OUT|PAGE|SHEET|NOTE|\n|$))/i) ||
      cText.match(/(?:MATERIAL|PRODUCT|STONE|COLOR)\s*[:\-]\s*([^\n\r]+?)(?=\s*(?:EDGE|SINK|FAUCET|SPLASH|NOTES|THICKNESS|$))/i);
    if (topMatMatch) {
      sheetMaterial = topMatMatch[1].trim().toUpperCase();
      if (!sheetMaterial.includes('3CM') && !sheetMaterial.includes('2CM') && topMatMatch[0].includes('3CM')) {
        sheetMaterial = `3CM ${sheetMaterial}`;
      } else if (!sheetMaterial.includes('3CM') && !sheetMaterial.includes('2CM') && topMatMatch[0].includes('2CM')) {
        sheetMaterial = `2CM ${sheetMaterial}`;
      }
    }

    // 8. Tearout, Cabinets, Range
    let sheetTearout = '';
    if (/TEAR-OUT\s*\(\s*Y\s*\)/i.test(cText) || /TEAR-OUT\s*\(YES\)/i.test(cText)) {
      sheetTearout = 'YES (Y)';
    } else if (/TEAR-OUT\s*\(\s*N\s*\)/i.test(cText)) {
      sheetTearout = 'NO';
    }

    let sheetCabinets = '';
    if (/CABINETS:\s*EXISTING\s*\(\s*[Xx✓1]\s*\)/i.test(cText)) {
      sheetCabinets = 'EXISTING';
    } else if (/CABINETS:\s*NEW\s*\(\s*[Xx✓1]\s*\)/i.test(cText)) {
      sheetCabinets = 'NEW';
    }

    let sheetRange = '';
    const hasCooktop = /RANGE:\s*C-TOP\s*\(\s*[Xx✓1]\s*\)/i.test(cText);
    const hasDowndraft = /DOWNDRAFT:\s*[Xx✓1]/i.test(cText) || /DOWNDRAFT\s*\(\s*[Xx✓1]\s*\)/i.test(cText);
    if (hasCooktop && hasDowndraft) sheetRange = 'COOKTOP & DOWNDRAFT';
    else if (hasCooktop) sheetRange = 'COOKTOP';
    else if (hasDowndraft) sheetRange = 'DOWNDRAFT';

    sheetDetails.push({
      pageNumber: i,
      statedSheetNumber,
      statedTotalSheets,
      sheetTitle: sheetRoom || `Sheet ${i}`,
      roomName: sheetRoom,
      sinkModel: sheetSinkModel,
      sinkType: sheetSinkType,
      sinkSuppliedBy: sheetSinkSupply,
      faucetHoles: sheetFaucetHoles,
      backsplash: sheetBacksplash,
      edgeProfile: sheetEdge,
      material: sheetMaterial,
      tearout: sheetTearout,
      cabinets: sheetCabinets,
      range: sheetRange,
      pageText,
    });

    fullText += `--- [PAGE / SHEET ${i}${statedSheetNumber && statedTotalSheets ? ` (SHT ${statedSheetNumber}/${statedTotalSheets})` : ''} - ${sheetRoom || 'PLAN'}] ---\n` + pageText + '\n\n';
  }

  // Check if text was extracted
  const trimmedFullText = fullText.trim();
  if (!trimmedFullText) {
    throw new Error(
      'No selectable CAD text found in this PDF. The PDF may be a flattened raster/scanned image without vector text.'
    );
  }

  const cText = fullText.replace(/[ \t]+/g, ' ');
  const statedPages = maxStatedTotalSheets > 0 ? maxStatedTotalSheets : pdf.numPages;

  const data: ParsedPdfData = {
    actualPages: pdf.numPages,
    statedPages,
    jobNum: '',
    jobName: '',
    phone: '',
    contractor: '',
    contactName: '',
    contactPhone: '',
    sinkModel: '',
    sinkType: '',
    sinkSuppliedBy: '',
    faucetHoles: '',
    backsplash: '',
    edgeProfile: '',
    material: '',
    tearout: '',
    cabinets: '',
    rangeType: '',
    templaterDrawn: '',
    rooms: discoveredRooms,
    sheets: sheetDetails,
    rawText: fullText,
    fileName,
  };

  // 1. Job Number (e.g. JOB#: J26-91175)
  const jNumMatch =
    cText.match(/\b([Jj]\d{2,4}[-_]\d{1,6})\b/) ||
    cText.match(/(?:JOB|PROJECT|ORDER|WO|W\.O\.)\s*(?:#|NUM|NO\.?)\s*:?\s*([A-Za-z0-9\-_/]+)/i);
  if (jNumMatch) {
    data.jobNum = jNumMatch[1].replace(/\s/g, '').trim().toUpperCase();
  }

  // 2. Job Name (e.g. JOB NAME: TILTMANN, HEATHER & LAREN)
  const jNameMatch =
    cText.match(/(?:JOB\s*NAME|PROJECT(?:\s*NAME)?|CUSTOMER)\s*:\s*([^0-9\n\r]+?)(?=\s*(?:1\d{4}|\d{3,5}\s+[A-Z]|ADDRESS|PHONE|CONTRACTOR|TEL|JOB\s*#|DATE|PAGE|SHEET|$))/i) ||
    cText.match(/(?:JOB\s*NAME|PROJECT)\s*[:\-]\s*([^\n\r]+?)(?=\s*(?:ADDRESS|PHONE|CONTRACTOR|TEL|$))/i);
  if (jNameMatch) {
    data.jobName = jNameMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  }

  // 3. Client Phone (e.g. PHONE: 262-444-3009)
  const allPhones = Array.from(cText.matchAll(/(?:PHONE|TEL|CELL|MOBILE)?\s*[:#]?\s*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi));
  if (allPhones.length > 0) {
    // Look specifically for the phone near JOB NAME / Address first
    const clientPhoneCandidate = allPhones[0][1].replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    data.phone = clientPhoneCandidate;
  }

  // 4. Contractor / Account (e.g. CONTRACTOR: COSTCO PEWAUKEE 1101)
  const contrMatch =
    cText.match(/(?:CONTRACTOR|BUILDER|DEALER|ACCOUNT)\s*[:\-]?\s*([^\n\r]+?)(?=\s*(?:CONTACT|EXPEDITER|PHONE|JOB|PAGE|DATE|ADDRESS|DRAWN|$))/i) ||
    cText.match(/(?:CONTRACTOR|BUILDER|DEALER)\s*[:\-]\s*([^\n\r]+?)(?=\s*(?:CONTACT|PHONE|JOB|PAGE|$))/i);
  if (contrMatch) {
    data.contractor = contrMatch[1].trim().toUpperCase();
  }

  // 5. Contact / Expediter (e.g. CONTACT/EXPEDITER: CHARLIE DRAZEWSKI)
  const contactMatch = cText.match(/(?:CONTACT\/EXPEDITER|CONTACT|EXPEDITER|SALES(?:PERSON)?)\s*[:\-]?\s*([^\n\r]+?)(?=\s*(?:PHONE|TEL|LOCK|SINK|CABINET|$))/i);
  if (contactMatch) {
    data.contactName = contactMatch[1].trim().toUpperCase();
  }
  // Contact phone (2nd phone often follows contact)
  if (allPhones.length >= 2) {
    data.contactPhone = allPhones[1][1].replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }

  // 6. Aggregate Sinks across all sheets
  const validSinks = sheetDetails.map((s) => s.sinkModel).filter(Boolean);
  const distinctSinks = Array.from(new Set(validSinks));
  data.sinkModel = distinctSinks.join(' | ');

  const validSinkTypes = sheetDetails.map((s) => s.sinkType).filter(Boolean);
  data.sinkType = Array.from(new Set(validSinkTypes)).join(' | ');

  const validSinkSupplies = sheetDetails.map((s) => s.sinkSuppliedBy).filter(Boolean);
  data.sinkSuppliedBy = Array.from(new Set(validSinkSupplies)).join(' | ');

  // 7. Aggregate Faucet Holes
  const validFaucets = sheetDetails.map((s) => s.faucetHoles).filter(Boolean);
  data.faucetHoles = Array.from(new Set(validFaucets)).join(' | ');

  // 8. Aggregate Backsplash
  const validSplashes = sheetDetails.map((s) => (s.roomName ? `${s.backsplash} (${s.roomName})` : s.backsplash)).filter(Boolean);
  data.backsplash = Array.from(new Set(validSplashes)).join(' | ');

  // 9. Edge Profile
  const validEdges = sheetDetails.map((s) => s.edgeProfile).filter(Boolean);
  data.edgeProfile = Array.from(new Set(validEdges)).join(' | ');

  // 10. Material / Color
  const validMaterials = sheetDetails.map((s) => s.material).filter(Boolean);
  data.material = Array.from(new Set(validMaterials)).join(' | ');

  // 11. Tearout, Cabinets, Range
  const validTearouts = sheetDetails.map((s) => s.tearout).filter(Boolean);
  data.tearout = Array.from(new Set(validTearouts))[0] || '';

  const validCabinets = sheetDetails.map((s) => s.cabinets).filter(Boolean);
  data.cabinets = Array.from(new Set(validCabinets))[0] || '';

  const validRanges = sheetDetails.map((s) => s.range).filter(Boolean);
  data.rangeType = Array.from(new Set(validRanges)).join(' | ');

  // 12. Templater & Drafter initials / date
  const drawnMatch = cText.match(/(?:TEMPLATED\s*&\s*DRAWN\s*BY\s*-\s*DATE|TEMPLATED\s*BY|DRAWN\s*BY)\s*[:\-]?\s*([^\n\r]+?)(?=\s*(?:JOB|PROFILE|COUNTERTOP|PAGE|SIGNATURE|$))/i);
  if (drawnMatch) {
    data.templaterDrawn = drawnMatch[1].trim().toUpperCase();
  }

  // Cross-reference Heuristics with parsed Moraware HTML if provided
  if (parsedHtmlData) {
    if (!data.jobNum && parsedHtmlData.global.jobNum && cText.toUpperCase().includes(parsedHtmlData.global.jobNum.toUpperCase())) {
      data.jobNum = parsedHtmlData.global.jobNum;
    }
    if (!data.jobName && parsedHtmlData.global.jobName) {
      const cleanH = parsedHtmlData.global.jobName.toUpperCase().replace(/AND/g, '&').replace(/[^A-Z0-9\s]/g, '');
      const words = cleanH.split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 0 && words.every((w) => cText.toUpperCase().includes(w))) {
        data.jobName = parsedHtmlData.global.jobName;
      }
    }
    if (!data.phone && parsedHtmlData.global.clientPhone) {
      const cleanHtmlPhone = parsedHtmlData.global.clientPhone.replace(/\D/g, '');
      if (cleanHtmlPhone.length === 10 && cText.replace(/\D/g, '').includes(cleanHtmlPhone)) {
        data.phone = parsedHtmlData.global.clientPhone;
      }
    }
    if (!data.contractor && parsedHtmlData.global.contractor) {
      const firstWord = parsedHtmlData.global.contractor.split(' ')[0].toUpperCase();
      if (cText.toUpperCase().includes(firstWord)) {
        data.contractor = parsedHtmlData.global.contractor;
      }
    }
  }

  return data;
}
