import { ParsedMorawareData, GlobalJobData, PhaseData, RoomFormDetails } from '../types';

export function parseMorawareHTML(htmlString: string, fileName?: string): ParsedMorawareData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const globalData: GlobalJobData = {
    jobName: '',
    jobNum: '',
    clientPhone: '',
    jobAddress: '',
    contractor: '',
    expectedPhase: 1,
    salesperson: '',
    jobType: '',
    contractorContactName: '',
    contractorContactPhone: '',
  };

  const phases: Record<string, PhaseData> = {};

  // 1. Extract Global Header Info
  const infoTable = doc.querySelector('.pageInfoCenteredJustifiedTable');
  if (infoTable) {
    const rows = infoTable.querySelectorAll('tr');
    rows.forEach((row) => {
      const labelCell = row.querySelector('.pageInfoLabel');
      const valCell = row.querySelector('.pageInfoValue');
      if (labelCell && valCell) {
        const label = labelCell.textContent?.trim().replace(/●/g, '') || '';
        const val = valCell.textContent?.trim().toUpperCase() || '';

        if (label.includes('Job Name')) globalData.jobName = val;
        if (label.includes('Job #')) globalData.jobNum = val;
        if (label.includes('Account')) globalData.contractor = val;
        if (label.includes('Salesperson')) globalData.salesperson = val;
        if (label.includes('Job Type')) globalData.jobType = val;
      }
    });
  }

  // Fallback for Job Name and Job # from document title or headings if table missing
  if (!globalData.jobName) {
    const mainHeading = doc.querySelector('h1, .pageTitle, .jobHeader');
    if (mainHeading?.textContent) {
      const hText = mainHeading.textContent.trim().toUpperCase();
      const numMatch = hText.match(/J\d+-\d+/);
      if (numMatch) globalData.jobNum = numMatch[0];
      globalData.jobName = hText.replace(/J\d+-\d+/, '').replace(/[-:]/g, '').trim();
    }
  }

  // Extract Job Address & Client Phone
  const detailCells = doc.querySelectorAll('.jobDetailInfoCell, td');
  detailCells.forEach((cell) => {
    if (cell.innerHTML.includes('Job Address')) {
      const valueCell = cell.querySelector('.pageInfoValue') || cell;
      if (valueCell) {
        // Grab Phone Number
        const phoneMatch = valueCell.innerHTML.match(/(\d{3}[-\s.]?\d{3}[-\s.]?\d{4})/);
        if (phoneMatch && !globalData.clientPhone) {
          globalData.clientPhone = phoneMatch[1].replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3').toUpperCase();
        }

        // Grab Address by parsing HTML breaks
        const lines = valueCell.innerHTML
          .split(/<br\s*\/?>/i)
          .map((l) => {
            const tmp = document.createElement('div');
            tmp.innerHTML = l;
            return tmp.textContent?.trim().toUpperCase() || '';
          })
          .filter((l) => l && !l.includes('JOB ADDRESS') && !l.includes('PHONE'));

        if (lines.length >= 2 && !globalData.jobAddress) {
          // If line 0 is name, line 1 is street, line 2 is city/state
          if (lines.length >= 3) {
            globalData.jobAddress = `${lines[1]}, ${lines[2]}`;
          } else {
            globalData.jobAddress = `${lines[0]}, ${lines[1]}`;
          }
        }
      }
    }
  });

  // Extract Contractor Contacts
  const contactsBody = doc.getElementById('ContactsBody') || doc.querySelector('.contactsTable tbody');
  if (contactsBody) {
    const rows = contactsBody.querySelectorAll('tr');
    const validRows = Array.from(rows).filter((r) => r.querySelectorAll('td').length >= 2);
    if (validRows.length > 1) {
      globalData.contractorContactName = 'MULTIPLE NAMES AVAILABLE';
      globalData.contractorContactPhone = 'MULTIPLE NAMES AVAILABLE';
    } else if (validRows.length === 1) {
      const cells = validRows[0].querySelectorAll('td');
      globalData.contractorContactName = cells[0]?.textContent?.trim().toUpperCase() || 'N/A';
      const phoneMatch = cells[1]?.innerHTML.match(/(\d{3}[-\s.]?\d{3}[-\s.]?\d{4})/);
      globalData.contractorContactPhone = phoneMatch ? phoneMatch[1].toUpperCase() : 'N/A';
    }
  }

  // 2. Scan Activities for Phase and Templater
  const actHead = doc.getElementById('ActivitiesHead');
  let colActivity = 0;
  let colPhase = -1;
  let colAssigned = 0;
  let colDate = -1;

  if (actHead) {
    const headers = actHead.querySelectorAll('td');
    headers.forEach((td, idx) => {
      const text = td.textContent?.toUpperCase() || '';
      if (text.includes('ACTIVITY')) colActivity = idx;
      if (text.includes('PHASE')) colPhase = idx;
      if (text.includes('ASSIGNED TO')) colAssigned = idx;
      if (text.includes('START DATE')) colDate = idx;
    });
  }

  const actBody = doc.getElementById('ActivitiesBody');
  if (actBody) {
    const rows = actBody.querySelectorAll('tr');
    for (const r of Array.from(rows)) {
      const cells = r.querySelectorAll('td');
      if (cells.length > Math.max(colActivity, colAssigned)) {
        const actName = cells[colActivity]?.textContent?.trim().toUpperCase() || '';
        const assignedTo = cells[colAssigned]?.textContent?.trim().toUpperCase() || '';

        let actDate = '';
        if (colDate !== -1 && cells.length > colDate) {
          const rawDate = cells[colDate]?.textContent?.replace(/[^\d/]/g, '').trim() || '';
          const parts = rawDate.split('/');
          if (parts.length === 3) {
            actDate = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
          }
        }

        let phaseName = 'DEFAULT PHASE';
        if (colPhase !== -1 && cells.length > colPhase) {
          const rawPhase = cells[colPhase]?.textContent?.trim() || '';
          let extractedPhase = rawPhase;
          if (rawPhase.includes('Phase:')) {
            extractedPhase = rawPhase.split('Phase:')[1].trim();
          }
          if (extractedPhase) {
            phaseName = extractedPhase.toUpperCase();
          }
        }

        if (actName.includes('TEMPLATE')) {
          if (!phases[phaseName]) {
            phases[phaseName] = { phaseId: phaseName, forms: [], templater: assignedTo, templateDate: actDate };
          } else {
            phases[phaseName].templater = assignedTo;
            phases[phaseName].templateDate = actDate;
          }
        }

        if (actName === 'CAD' && !r.textContent?.toUpperCase().includes('COMPLETE')) {
          const pMatch = phaseName.match(/\d+/);
          if (pMatch) globalData.expectedPhase = parseInt(pMatch[0], 10);
        }
      }
    }
  }

  // 3. Scan ALL Phase Forms
  const formHeaders = doc.querySelectorAll('.page-subsection-header');

  formHeaders.forEach((header, index) => {
    const titleSpan = header.querySelector('.formTitle');
    const formTitleRaw = titleSpan ? titleSpan.textContent?.trim() || '' : header.textContent?.trim() || '';

    if (!formTitleRaw.startsWith('Job Detail -') && !formTitleRaw.includes('Detail -')) {
      // Check if it's a room header format
      if (!formTitleRaw.toUpperCase().includes('DETAIL')) return;
    }

    const cleanFormTitle = formTitleRaw.replace(/Job Detail\s*-\s*/i, '').replace(/Detail\s*-\s*/i, '').trim().toUpperCase();

    let phaseName = 'DEFAULT PHASE';
    const allSpans = header.querySelectorAll('span');
    allSpans.forEach((sp) => {
      const text = sp.textContent?.trim() || '';
      if (text === 'Phase:' && sp.nextSibling) {
        const siblingText = sp.nextSibling.textContent?.trim() || '';
        if (siblingText) phaseName = siblingText.toUpperCase();
      } else if (text.includes('Phase:') && text !== 'Phase:') {
        const extracted = text.split('Phase:')[1].trim();
        if (extracted) phaseName = extracted.toUpperCase();
      }
    });

    let associatedTable = header.querySelector('table.detail-form') as HTMLTableElement | null;
    if (!associatedTable && header.nextElementSibling?.tagName === 'TABLE') {
      associatedTable = header.nextElementSibling as HTMLTableElement;
    }

    if (!associatedTable) {
      // Search within the parent container for table.detail-form
      associatedTable = header.parentElement?.querySelector('table.detail-form') || null;
    }

    if (!associatedTable) return;

    if (!phases[phaseName]) {
      phases[phaseName] = { phaseId: phaseName, forms: [], templater: '', templateDate: '' };
    }

    const formDetails: RoomFormDetails = {
      id: `form-${index}-${Math.random().toString(36).substring(2, 7)}`,
      title: cleanFormTitle || 'AREA',
      product: '',
      color: '',
      thickness: '',
      edgeProfile: '',
      sinkModel: '',
      sinkType: '',
      sinkSuppliedBy: '',
      faucetHoles: '',
      faucetModel: '',
      faucetNotes: '',
      backsplashHeight: '',
      splashInfo: '',
      sideSplash: '',
      rangeType: '',
      cabinets: '',
      tearout: '',
    };

    const formCells = associatedTable.querySelectorAll('td');
    formCells.forEach((cell) => {
      const divs = cell.querySelectorAll('div');
      if (divs.length === 2) {
        const label = divs[0].textContent?.replace(/[●:]/g, '').trim().toLowerCase() || '';
        const val = divs[1].textContent?.replace(/●/g, '').trim().toUpperCase() || '';

        if (!val || val === '' || val === 'N/A' || val === '**TBD**') return;

        if (label === 'product') formDetails.product = val;
        if (label === 'color' || label.includes('other color')) formDetails.color = val;
        if (label === 'thickness') formDetails.thickness = val;

        if (label === 'edge profile') formDetails.edgeProfile = val;
        if (label === 'profile-notes') {
          const cleanNote = val.replace(/\*/g, '').trim();
          if (formDetails.edgeProfile) formDetails.edgeProfile += ` (${cleanNote})`;
          else formDetails.edgeProfile = cleanNote;
        }

        if (label === 'sink type') formDetails.sinkType = val;
        if (label === 'sink supplied by') formDetails.sinkSuppliedBy = val;
        if (label.includes('sink model')) formDetails.sinkModel = val;
        if (label.includes('holes/spread')) formDetails.faucetHoles = val;
        if (label.includes('faucet model')) formDetails.faucetModel = val;
        if (label.includes('faucet notes')) formDetails.faucetNotes = val;
        if (label.includes('backsplash height')) formDetails.backsplashHeight = val;
        if (label === 'splash info') formDetails.splashInfo = val;
        if (label === 'side splash') formDetails.sideSplash = val;
        if (label.includes('range/cooktop type')) formDetails.rangeType = val;
        if (label === 'cabinets') formDetails.cabinets = val;
        if (label === 'tearout') formDetails.tearout = val;
      }
    });

    phases[phaseName].forms.push(formDetails);
  });

  // If no phases were found through structured headers, fallback to any forms or basic mock structure
  if (Object.keys(phases).length === 0) {
    phases['DEFAULT PHASE'] = {
      phaseId: 'DEFAULT PHASE',
      forms: [],
      templater: '',
      templateDate: '',
    };
  }

  return {
    global: globalData,
    phases,
    fileName,
    parseDate: new Date().toISOString(),
  };
}

export function formatTemplaterDrawn(
  phaseData: PhaseData | undefined,
  drafterInitials = 'MP',
  dateFormat = 'MM/DD/YYYY'
): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const year = today.getFullYear();
  
  let todayStr = `${month}/${day}/${year}`;
  if (dateFormat === 'YYYY-MM-DD') todayStr = `${year}-${month}-${day}`;
  if (dateFormat === 'DD/MM/YYYY') todayStr = `${day}/${month}/${year}`;

  if (phaseData && phaseData.templateDate) {
    let initials = '';
    if (phaseData.templater && !phaseData.templater.includes('SCHEDULE')) {
      const nameParts = phaseData.templater.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        initials = (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0] !== '') {
        initials = nameParts[0].charAt(0).toUpperCase();
      }
    }
    return `${phaseData.templateDate} ${initials}, ${todayStr} ${drafterInitials}`.replace(/\s+/g, ' ').replace(' ,', ',').trim();
  }

  return `${todayStr} ${drafterInitials}`;
}
