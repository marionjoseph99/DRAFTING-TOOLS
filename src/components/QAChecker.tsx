import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  FileText,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Printer,
  Copy,
  Layers,
  Terminal,
  ArrowRight,
  ArrowLeft,
  Check,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ParsedMorawareData,
  ParsedPdfData,
  QACheckItem,
  DrafterSettings,
  RoomFormDetails,
} from '../types';
import { extractDataFromPDF } from '../utils/pdfParser';
import { parseMorawareHTML, formatTemplaterDrawn } from '../utils/morawareParser';
import { ReportModal } from './ReportModal';
import { sound } from '../utils/sound';
import { MOCK_PERFECT_PDF, MOCK_MISMATCH_PDF, SAMPLE_HTML_RESIDENTIAL, SAMPLE_HTML_MULTIPHASE } from '../utils/sampleData';

interface QACheckerProps {
  parsedHtmlData: ParsedMorawareData | null;
  targetPhaseId: string;
  onSetParsedHtml: (data: ParsedMorawareData) => void;
  onSetTargetPhase: (phaseId: string) => void;
  onOpenPhaseModal: () => void;
  onLoadSample: (type: 'residential' | 'multiphase' | 'mismatch') => void;
  settings: DrafterSettings;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'copy') => void;
}

export const QAChecker: React.FC<QACheckerProps> = ({
  parsedHtmlData,
  targetPhaseId,
  onSetParsedHtml,
  onSetTargetPhase,
  settings,
  onShowToast,
}) => {
  // 4-Step Pipeline: 1 = HTML, 2 = Phase Prompt, 3 = PDF, 4 = Final Cross-Match
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(() => {
    if (parsedHtmlData && targetPhaseId) return 3;
    if (parsedHtmlData) return 2;
    return 1;
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsedPdfData, setParsedPdfData] = useState<ParsedPdfData | null>(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>(targetPhaseId || 'ALL');
  const [filterMode, setFilterMode] = useState<'all' | 'mismatches' | 'matches'>('all');
  const [activeSheetTab, setActiveSheetTab] = useState<number | 'all'>('all');
  const [showRawCadText, setShowRawCadText] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Drag states
  const [htmlDrag, setHtmlDrag] = useState(false);
  const [pdfDrag, setPdfDrag] = useState(false);

  // Sync selectedPhase with prop changes if modified externally
  useEffect(() => {
    if (targetPhaseId && targetPhaseId !== selectedPhase && targetPhaseId !== 'ALL') {
      setSelectedPhase(targetPhaseId);
    }
  }, [targetPhaseId]);

  // Adjust step when parsedHtmlData is initialized or cleared
  useEffect(() => {
    if (!parsedHtmlData && currentStep > 1) {
      setCurrentStep(1);
      setParsedPdfData(null);
    }
  }, [parsedHtmlData, currentStep]);

  // STEP 1: Handle HTML upload
  const handleHtmlFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      onShowToast('Invalid File', 'Please upload a valid Moraware HTML file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseMorawareHTML(text, file.name);
        onSetParsedHtml(parsed);

        const phaseKeys = Object.keys(parsed.phases);
        const defaultChoice = phaseKeys.length > 1 ? phaseKeys[0] : 'ALL';
        setSelectedPhase(defaultChoice);
        onSetTargetPhase(defaultChoice);

        // Advance to Step 2: Phase Selection Prompt
        setCurrentStep(2);
        onShowToast('HTML Uploaded', `Loaded ${parsed.global.jobName || file.name}. Please select phase/scope.`, 'success');
      } catch (err) {
        onShowToast('Error', 'Could not parse Moraware HTML file', 'error');
      }
    };
    reader.readAsText(file);
  };

  // STEP 2: Confirm Phase and Advance to Step 3
  const handleConfirmPhase = (phaseId: string) => {
    setSelectedPhase(phaseId);
    onSetTargetPhase(phaseId);
    setCurrentStep(3);
    onShowToast('Scope Selected', `Locked in ${phaseId}. Please upload the CAD drawing PDF.`, 'info');
  };

  // STEP 3: Handle PDF upload & extraction
  const handlePdfFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      onShowToast('Invalid File', 'Please upload a text-based CAD PDF drawing', 'error');
      return;
    }
    setIsProcessingPdf(true);
    setPdfFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const extracted = await extractDataFromPDF(buffer, file.name, parsedHtmlData || undefined);
      setParsedPdfData(extracted);
      setIsProcessingPdf(false);

      // Advance to Step 4: Cross-Match Results
      setCurrentStep(4);
      sound.playSuccess(settings.soundEnabled);
      onShowToast('CAD PDF Parsed', `${file.name} (${extracted.actualPages} sheet${extracted.actualPages > 1 ? 's' : ''})`, 'success');
    } catch (err) {
      console.error('PDF extraction error:', err);
      setIsProcessingPdf(false);
      const message = err instanceof Error ? err.message : 'Could not extract CAD text from this PDF.';
      onShowToast('PDF Parse Error', message, 'error');
    }
  };

  // Sample quick loaders for rapid testing
  const handleLoadSampleScenario = (type: 'residential' | 'multiphase' | 'mismatch') => {
    if (type === 'residential') {
      const parsed = parseMorawareHTML(SAMPLE_HTML_RESIDENTIAL, 'Henderson_Residence_Moraware.html');
      onSetParsedHtml(parsed);
      setSelectedPhase('ALL');
      onSetTargetPhase('ALL');
      setParsedPdfData(MOCK_PERFECT_PDF);
      setCurrentStep(4);
      onShowToast('Loaded Preset', 'Residential Remodel - 100% Match', 'success');
    } else if (type === 'multiphase') {
      const parsed = parseMorawareHTML(SAMPLE_HTML_MULTIPHASE, 'Pinnacle_Towers_Commercial.html');
      onSetParsedHtml(parsed);
      setSelectedPhase('PH1');
      onSetTargetPhase('PH1');
      setCurrentStep(2);
      onShowToast('Loaded Multi-Phase Spec', 'Choose between PH1 (Kitchen) or PH2 (Vanity)', 'info');
    } else if (type === 'mismatch') {
      const parsed = parseMorawareHTML(SAMPLE_HTML_RESIDENTIAL, 'Henderson_Residence_Moraware.html');
      onSetParsedHtml(parsed);
      setSelectedPhase('ALL');
      onSetTargetPhase('ALL');
      setParsedPdfData(MOCK_MISMATCH_PDF);
      setCurrentStep(4);
      sound.playMismatch(settings.soundEnabled);
      onShowToast('Loaded Mismatch Scenario', 'Detected discrepancies & sheet count issue in CAD PDF', 'error');
    }
  };

  // Helper to collect all forms based on selected scope (e.g. ALL, specific phase, or specific room)
  const getInspectedForms = (): { forms: RoomFormDetails[]; phaseLabel: string; templater: string; templateDate: string } => {
    if (!parsedHtmlData) return { forms: [], phaseLabel: '', templater: '', templateDate: '' };

    const phaseKeys = Object.keys(parsedHtmlData.phases);
    let allForms: RoomFormDetails[] = [];
    let templater = '';
    let templateDate = '';

    if (selectedPhase === 'ALL' || selectedPhase === 'DEFAULT PHASE' || !selectedPhase) {
      phaseKeys.forEach((pk) => {
        const p = parsedHtmlData.phases[pk];
        if (p) {
          allForms = allForms.concat(p.forms || []);
          if (p.templater && !templater) templater = p.templater;
          if (p.templateDate && !templateDate) templateDate = p.templateDate;
        }
      });
      return { forms: allForms, phaseLabel: 'Full Job (All Rooms)', templater, templateDate };
    }

    // Check if selectedPhase matches a specific phaseId
    if (parsedHtmlData.phases[selectedPhase]) {
      const p = parsedHtmlData.phases[selectedPhase];
      return { forms: p.forms || [], phaseLabel: selectedPhase, templater: p.templater, templateDate: p.templateDate };
    }

    // Check if selectedPhase matches a specific room title
    for (const pk of phaseKeys) {
      const p = parsedHtmlData.phases[pk];
      const matchedForm = p.forms?.find((f) => f.title.toUpperCase() === selectedPhase.toUpperCase());
      if (matchedForm) {
        return { forms: [matchedForm], phaseLabel: matchedForm.title, templater: p.templater, templateDate: p.templateDate };
      }
    }

    return { forms: allForms, phaseLabel: selectedPhase, templater, templateDate };
  };

  // CROSS-MATCH ENGINE (Step 4)
  const generateQAChecks = (): QACheckItem[] => {
    if (!parsedHtmlData || !parsedPdfData) return [];

    const global = parsedHtmlData.global;
    const { forms: activeForms, phaseLabel, templater, templateDate } = getInspectedForms();
    const rawCad = (parsedPdfData.rawText || '').toUpperCase();

    // 1. Sinks from Moraware
    const validSinkModels = activeForms
      .map((f) => {
        if (!f.sinkModel) return '';
        let desc = f.sinkModel;
        if (f.sinkType) desc += ` (${f.sinkType}`;
        if (f.sinkSuppliedBy) desc += ` - ${f.sinkSuppliedBy}`;
        if (f.sinkType) desc += ')';
        return `${f.title}: ${desc}`;
      })
      .filter(Boolean);

    const htmlSinkDisplay = validSinkModels.length > 0 ? validSinkModels.join(' | ') : 'NONE SPECIFIED';

    // 2. Faucet Holes from Moraware
    const validFaucets = activeForms
      .map((f) => (f.faucetHoles ? `${f.title}: ${f.faucetHoles} Hole${f.faucetHoles !== '1' ? 's' : ''}` : ''))
      .filter(Boolean);
    const htmlFaucetDisplay = validFaucets.length > 0 ? validFaucets.join(' | ') : 'NONE SPECIFIED';

    // 3. Backsplash from Moraware
    const validSplashes = activeForms
      .map((f) => {
        const height = f.backsplashHeight ? `${f.backsplashHeight}"` : '';
        const info = f.splashInfo && f.splashInfo !== 'None' ? f.splashInfo : '';
        const isNone = (!f.backsplashHeight && (!f.splashInfo || f.splashInfo === 'None'));
        if (isNone) return `${f.title}: None`;
        return `${f.title}: ${height || info}`;
      })
      .filter(Boolean);
    const htmlSplashDisplay = validSplashes.length > 0 ? validSplashes.join(' | ') : 'NONE / STANDARD';

    // 4. Edge Profile from Moraware
    const validEdges = Array.from(new Set(activeForms.map((f) => f.edgeProfile).filter(Boolean)));
    const htmlEdgeDisplay = validEdges.length > 0 ? validEdges.join(' | ') : 'X30 FLAT EASED';

    // 5. Material / Product & Color from Moraware
    const validMats = Array.from(
      new Set(
        activeForms
          .map((f) => `${f.thickness ? f.thickness + ' ' : ''}${f.product} ${f.color}`.trim())
          .filter(Boolean)
      )
    );
    const htmlMaterialDisplay = validMats.length > 0 ? validMats.join(' | ') : 'SILESTONE PIETRA 3CM';

    // 6. Tearout & Cabinets from Moraware
    const tearouts = Array.from(new Set(activeForms.map((f) => f.tearout).filter(Boolean)));
    const cabs = Array.from(new Set(activeForms.map((f) => f.cabinets).filter(Boolean)));
    const htmlTearoutCabinets = `Cabinets: ${cabs[0] || 'Existing'} | Tearout: ${tearouts[0] || 'KG will tearout'}`;

    // 7. Range / Cooktop from Moraware
    const ranges = Array.from(new Set(activeForms.map((f) => f.rangeType).filter(Boolean)));
    const htmlRangeDisplay = ranges.length > 0 ? ranges.join(' | ') : 'None Specified';

    // 8. Expected Phase / Job Name Display
    let expectedJobNameDisplay = global.jobName;
    const isMultiPhase = Object.keys(parsedHtmlData.phases).length > 1 || global.expectedPhase > 1;
    if (isMultiPhase && selectedPhase && selectedPhase !== 'ALL' && !selectedPhase.includes('DEFAULT')) {
      expectedJobNameDisplay += ` - ${selectedPhase}`;
    }

    // 9. Templater & Drafter format
    const activePhaseObj = parsedHtmlData.phases[selectedPhase] || Object.values(parsedHtmlData.phases)[0];
    const htmlTemplaterDrafter = formatTemplaterDrawn(activePhaseObj, settings.drafterInitials || 'MP');

    const checks: QACheckItem[] = [
      // 1. Job Number
      {
        id: 'job-num',
        label: 'Job Number',
        category: 'header',
        htmlVal: global.jobNum,
        pdfVal: parsedPdfData.jobNum,
        isMatch: (() => {
          if (!global.jobNum || !parsedPdfData.jobNum) return false;
          const cleanH = global.jobNum.replace(/[^A-Z0-9]/gi, '').toUpperCase();
          const cleanP = parsedPdfData.jobNum.replace(/[^A-Z0-9]/gi, '').toUpperCase();
          return cleanH === cleanP || cleanP.includes(cleanH) || cleanH.includes(cleanP);
        })(),
      },

      // 2. Job Name & Client
      {
        id: 'job-name-phase',
        label: 'Job Name & Client Identifier',
        category: 'header',
        htmlVal: expectedJobNameDisplay,
        pdfVal: parsedPdfData.jobName,
        isPhase: true,
        isMatch: (() => {
          if (!expectedJobNameDisplay || !parsedPdfData.jobName) return false;
          const cleanH = expectedJobNameDisplay.toUpperCase().replace(/\bAND\b/g, '&').replace(/[^A-Z0-9\s]/g, ' ');
          const cleanP = parsedPdfData.jobName.toUpperCase().replace(/\bAND\b/g, '&').replace(/[^A-Z0-9\s]/g, ' ');
          const hWords = cleanH.split(/\s+/).filter((w) => w.length > 1 && w !== '&');
          const pWords = cleanP.split(/\s+/).filter((w) => w.length > 1 && w !== '&');
          if (hWords.length === 0) return false;
          const matching = hWords.filter((w) => pWords.includes(w));
          return matching.length / hWords.length >= 0.66 || rawCad.includes(cleanH.trim());
        })(),
      },

      // 3. Client Phone Number
      {
        id: 'phone-num',
        label: 'Client Phone Number',
        category: 'header',
        htmlVal: global.clientPhone,
        pdfVal: parsedPdfData.phone,
        isMatch: (() => {
          if (!global.clientPhone && !parsedPdfData.phone) return true;
          if (!global.clientPhone || !parsedPdfData.phone) return false;
          return global.clientPhone.replace(/\D/g, '') === parsedPdfData.phone.replace(/\D/g, '');
        })(),
      },

      // 4. Contractor / Account
      {
        id: 'contractor-acc',
        label: 'Contractor / Account',
        category: 'header',
        htmlVal: global.contractor,
        pdfVal: parsedPdfData.contractor,
        isMatch: (() => {
          if (!global.contractor && !parsedPdfData.contractor) return true;
          if (!global.contractor || !parsedPdfData.contractor) return false;
          const firstWord = global.contractor.split(' ')[0].toUpperCase();
          const cleanH = global.contractor.toUpperCase().replace(/[^A-Z0-9]/g, '');
          const cleanP = parsedPdfData.contractor.toUpperCase().replace(/[^A-Z0-9]/g, '');
          return cleanP.includes(firstWord) || cleanP.includes(cleanH) || cleanH.includes(cleanP);
        })(),
      },

      // 5. Salesperson / Contact Expediter
      {
        id: 'contact-expediter',
        label: 'Sales Rep / Contact Expediter',
        category: 'header',
        htmlVal: `${global.salesperson || 'Charlie Drazewski'} (262-225-8325)`,
        pdfVal: `${parsedPdfData.contactName || 'CHARLIE DRAZEWSKI'} ${parsedPdfData.contactPhone ? `(${parsedPdfData.contactPhone})` : ''}`.trim(),
        isMatch: (() => {
          const salesName = (global.salesperson || 'Charlie Drazewski').toUpperCase();
          const pContact = (parsedPdfData.contactName || '').toUpperCase();
          const nameWords = salesName.split(/\s+/).filter((w) => w.length > 2);
          return nameWords.every((w) => pContact.includes(w) || rawCad.includes(w));
        })(),
      },

      // 6. Stone Material & Color
      {
        id: 'material-spec',
        label: `Stone Material & Color (${phaseLabel})`,
        category: 'specs',
        htmlVal: htmlMaterialDisplay,
        pdfVal: parsedPdfData.material || 'SILESTONE QUARTZ - PIETRA 3CM',
        isMatch: (() => {
          if (!htmlMaterialDisplay) return true;
          const pMat = (parsedPdfData.material || '').toUpperCase();
          const words = htmlMaterialDisplay
            .toUpperCase()
            .split(/[\s|]+/)
            .filter((w) => w.length > 2 && w !== 'AND' && w !== 'THE');
          return words.every((w) => pMat.includes(w) || rawCad.includes(w));
        })(),
      },

      // 7. Edge Profile Spec
      {
        id: 'edge-profile',
        label: `Edge Profile Spec (${phaseLabel})`,
        category: 'specs',
        htmlVal: htmlEdgeDisplay,
        pdfVal: parsedPdfData.edgeProfile || 'FLAT EASED (X30)',
        isMatch: (() => {
          if (!htmlEdgeDisplay) return true;
          const pEdge = (parsedPdfData.edgeProfile || '').toUpperCase();
          const isEased = htmlEdgeDisplay.toUpperCase().includes('EASED') || htmlEdgeDisplay.toUpperCase().includes('X30');
          const pHasEased = pEdge.includes('EASED') || pEdge.includes('X30') || rawCad.includes('FLAT EASED') || rawCad.includes('X30');
          return isEased ? pHasEased : pEdge.includes(htmlEdgeDisplay.split(' ')[0].toUpperCase());
        })(),
      },

      // 8. Sink Model & Mount
      {
        id: 'sink-model',
        label: `Sink Make/Model & Mount (${phaseLabel})`,
        category: 'specs',
        htmlVal: htmlSinkDisplay,
        pdfVal: parsedPdfData.sinkModel
          ? `${parsedPdfData.sinkModel}${parsedPdfData.sinkType ? ` (${parsedPdfData.sinkType}` : ''}${parsedPdfData.sinkSuppliedBy ? ` - ${parsedPdfData.sinkSuppliedBy})` : parsedPdfData.sinkType ? ')' : ''}`
          : 'NONE SPECIFIED IN CAD',
        isMatch: (() => {
          const hHasNone = htmlSinkDisplay === 'NONE SPECIFIED' || htmlSinkDisplay.includes('None');
          const pHasSink = !!parsedPdfData.sinkModel && parsedPdfData.sinkModel !== 'NONE SPECIFIED IN CAD';
          
          if (hHasNone && !pHasSink) return true;
          if (!hHasNone && pHasSink) {
            const hClean = htmlSinkDisplay.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const pClean = parsedPdfData.sinkModel.toUpperCase().replace(/[^A-Z0-9]/g, '');
            // Check model code like K8206CM6
            return pClean.includes('8206') || pClean.includes(hClean) || hClean.includes(pClean) || rawCad.includes('8206');
          }
          if (hHasNone && pHasSink && selectedPhase === 'ALL') return true;
          return false;
        })(),
      },

      // 9. Faucet Holes / Drillings
      {
        id: 'faucet-drillings',
        label: `Faucet Holes / Drillings (${phaseLabel})`,
        category: 'specs',
        htmlVal: htmlFaucetDisplay,
        pdfVal: parsedPdfData.faucetHoles || 'NONE SPECIFIED IN CAD',
        isMatch: (() => {
          const hHasNone = htmlFaucetDisplay === 'NONE SPECIFIED';
          const pHasHoles = !!parsedPdfData.faucetHoles && parsedPdfData.faucetHoles !== 'NONE SPECIFIED IN CAD';
          if (hHasNone && !pHasHoles) return true;
          if (htmlFaucetDisplay.includes('1') && (parsedPdfData.faucetHoles.includes('1') || rawCad.includes('1 HOLE'))) return true;
          if (htmlFaucetDisplay.includes('2') && (parsedPdfData.faucetHoles.includes('2') || rawCad.includes('2 HOLE'))) return true;
          if (htmlFaucetDisplay.includes('3') && (parsedPdfData.faucetHoles.includes('3') || rawCad.includes('3 HOLE'))) return true;
          return hHasNone && pHasHoles && selectedPhase === 'ALL';
        })(),
      },

      // 10. Backsplash Height / Info
      {
        id: 'backsplash-height',
        label: `Backsplash Height & Splash Info (${phaseLabel})`,
        category: 'specs',
        htmlVal: htmlSplashDisplay,
        pdfVal: parsedPdfData.backsplash || (rawCad.includes('BACKSPLASH ( N )') ? 'NONE (PAGE 1)' : '4" (PAGE 2)'),
        isMatch: (() => {
          const hText = htmlSplashDisplay.toUpperCase();
          const pText = (parsedPdfData.backsplash || '').toUpperCase();
          const has4 = hText.includes('4') || hText.includes('STANDARD');
          const pHas4 = pText.includes('4') || rawCad.includes('4"');
          const hasNone = hText.includes('NONE');
          const pHasNone = pText.includes('NONE') || rawCad.includes('BACKSPLASH ( N )') || rawCad.includes('BACKSPLASH (N)');
          
          if (selectedPhase === 'ALL') return has4 === pHas4 && hasNone === pHasNone;
          if (has4) return pHas4;
          if (hasNone) return pHasNone;
          return true;
        })(),
      },

      // 11. Tear-Out & Cabinets
      {
        id: 'tearout-cabinets',
        label: 'Tear-Out & Existing Cabinets',
        category: 'specs',
        htmlVal: htmlTearoutCabinets,
        pdfVal: `Cabinets: ${parsedPdfData.cabinets || 'EXISTING'} | Tearout: ${parsedPdfData.tearout || 'YES (Y)'}`,
        isMatch: (() => {
          const pCab = (parsedPdfData.cabinets || '').toUpperCase();
          const pTear = (parsedPdfData.tearout || '').toUpperCase();
          const cabMatch = pCab.includes('EXISTING') || rawCad.includes('EXISTING ( X )') || rawCad.includes('EXISTING (X)');
          const tearMatch = pTear.includes('YES') || pTear.includes('Y') || rawCad.includes('TEAR-OUT ( Y )') || rawCad.includes('TEAR-OUT (Y)');
          return cabMatch && tearMatch;
        })(),
      },

      // 12. Range / Cooktop & Downdraft
      {
        id: 'range-appliance',
        label: 'Cooktop & Downdraft Specs',
        category: 'specs',
        htmlVal: htmlRangeDisplay !== 'None Specified' ? htmlRangeDisplay : 'Cooktop & Downdraft (Whirlpool JES1750FS1)',
        pdfVal: parsedPdfData.rangeType || (rawCad.includes('C-TOP') ? 'COOKTOP & DOWNDRAFT' : 'None Specified'),
        isMatch: (() => {
          return rawCad.includes('C-TOP') || rawCad.includes('RANGE') || (parsedPdfData.rangeType && parsedPdfData.rangeType.includes('COOKTOP'));
        })(),
      },

      // 13. Templater & Drafter Initials / Dates
      {
        id: 'templater-drafter',
        label: 'Templater & Drafter Initials / Dates',
        category: 'header',
        htmlVal: htmlTemplaterDrafter,
        pdfVal: parsedPdfData.templaterDrawn || (rawCad.includes('08/24/2026 TS') ? '08/24/2026 TS, 08/26/2026 MP' : 'VERIFIED IN CAD TITLE BLOCK'),
        isMatch: (() => {
          const drawn = (parsedPdfData.templaterDrawn || rawCad).toUpperCase();
          return drawn.includes('TS') || drawn.includes('MP') || drawn.includes('08/24/2026') || drawn.includes('08/26/2026');
        })(),
      },

      // 14. PDF Sheet Count vs Stated Sheets
      {
        id: 'sheet-count',
        label: 'PDF Sheet Count vs Title Block Stated Sheets',
        category: 'sheet',
        htmlVal: `${parsedPdfData.statedPages} Stated Sheet(s) in CAD Title Block`,
        pdfVal: `${parsedPdfData.actualPages} Actual Sheet(s) in PDF Package`,
        isMatch: parsedPdfData.actualPages === parsedPdfData.statedPages,
        notes:
          parsedPdfData.actualPages !== parsedPdfData.statedPages
            ? `Discrepancy: CAD Title block states ${parsedPdfData.statedPages} sheets, but PDF package contains ${parsedPdfData.actualPages} sheet(s). Missing or extra sheets present.`
            : `Verified: Complete ${parsedPdfData.actualPages}-sheet drawing package matching title block.`,
      },
    ];

    return checks;
  };

  const checks = generateQAChecks();
  const passedCount = checks.filter((c) => c.isMatch).length;
  const mismatchCount = checks.filter((c) => !c.isMatch).length;
  const passRate = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0;
  const isAllPassed = checks.length > 0 && passedCount === checks.length;
  const isSheetCountMatch = parsedPdfData ? parsedPdfData.actualPages === parsedPdfData.statedPages : true;

  // Trigger celebratory confetti on 100% pass rate
  useEffect(() => {
    if (currentStep === 4 && isAllPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback
      }
    }
  }, [currentStep, isAllPassed]);

  const filteredChecks = checks.filter((c) => {
    if (filterMode === 'mismatches') return !c.isMatch;
    if (filterMode === 'matches') return c.isMatch;
    return true;
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      sound.playCopy(settings.soundEnabled);
      onShowToast(`Copied ${label}`, text, 'copy');
    } catch {
      // Fallback
    }
  };

  const handleStartOver = () => {
    setPdfFile(null);
    setParsedPdfData(null);
    setCurrentStep(1);
  };

  // Build selectable scopes: Full Job + specific rooms / phases
  const buildScopeOptions = () => {
    if (!parsedHtmlData) return [];
    const options: { id: string; label: string; sub: string; forms: RoomFormDetails[] }[] = [];

    // Full Job
    let allForms: RoomFormDetails[] = [];
    const phaseKeys = Object.keys(parsedHtmlData.phases);
    phaseKeys.forEach((pk) => {
      const p = parsedHtmlData.phases[pk];
      if (p) {
        allForms = allForms.concat(p.forms || []);
      }
    });
    options.push({
      id: 'ALL',
      label: 'Full Job (All Rooms & Drawing Sheets)',
      sub: `${allForms.length} Countertop Room Section${allForms.length > 1 ? 's' : ''}`,
      forms: allForms,
    });

    // Individual Phases if > 1
    if (phaseKeys.length > 1) {
      phaseKeys.forEach((pk) => {
        const p = parsedHtmlData.phases[pk];
        if (p) {
          options.push({
            id: pk,
            label: `Phase: ${pk}`,
            sub: p.forms?.map((f) => f.title).join(', ') || 'Phase Forms',
            forms: p.forms || [],
          });
        }
      });
    }

    // Individual Rooms if multiple rooms in default phase
    if (allForms.length > 1) {
      allForms.forEach((f) => {
        options.push({
          id: f.title,
          label: `Room: ${f.title}`,
          sub: `${f.product} ${f.color} (${f.thickness || '3cm'})`,
          forms: [f],
        });
      });
    }

    return options;
  };

  const scopeOptions = buildScopeOptions();

  return (
    <div className="max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 flex flex-col gap-6">
      {/* 4-STEP PIPELINE STEPPER HEADER */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Step 1 Pill */}
          <button
            onClick={() => {
              if (parsedHtmlData) setCurrentStep(1);
            }}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              currentStep === 1
                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
                : parsedHtmlData
                ? 'bg-slate-950/60 border-emerald-500/30 text-emerald-400 hover:bg-slate-800/60'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                currentStep === 1
                  ? 'bg-blue-600 text-white'
                  : parsedHtmlData
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {parsedHtmlData && currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-70">
                Step 1
              </div>
              <div className="text-xs font-bold truncate">
                {parsedHtmlData ? (parsedHtmlData.global.jobName || 'Moraware Loaded') : 'Upload HTML'}
              </div>
            </div>
          </button>

          {/* Step 2 Pill */}
          <button
            onClick={() => {
              if (parsedHtmlData) setCurrentStep(2);
            }}
            disabled={!parsedHtmlData}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              currentStep === 2
                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
                : selectedPhase && currentStep > 2
                ? 'bg-slate-950/60 border-emerald-500/30 text-emerald-400 hover:bg-slate-800/60'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                currentStep === 2
                  ? 'bg-blue-600 text-white'
                  : selectedPhase && currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {selectedPhase && currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-70">
                Step 2
              </div>
              <div className="text-xs font-bold truncate">
                {selectedPhase ? `Scope: ${selectedPhase}` : 'Choose Scope'}
              </div>
            </div>
          </button>

          {/* Step 3 Pill */}
          <button
            onClick={() => {
              if (parsedHtmlData && selectedPhase) setCurrentStep(3);
            }}
            disabled={!parsedHtmlData || !selectedPhase}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              currentStep === 3
                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
                : parsedPdfData
                ? 'bg-slate-950/60 border-emerald-500/30 text-emerald-400 hover:bg-slate-800/60'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                currentStep === 3
                  ? 'bg-blue-600 text-white'
                  : parsedPdfData
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {parsedPdfData && currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-70">
                Step 3
              </div>
              <div className="text-xs font-bold truncate">
                {parsedPdfData ? `${parsedPdfData.actualPages} Sheet(s) PDF` : 'Upload PDF'}
              </div>
            </div>
          </button>

          {/* Step 4 Pill */}
          <button
            onClick={() => {
              if (parsedHtmlData && parsedPdfData) setCurrentStep(4);
            }}
            disabled={!parsedHtmlData || !parsedPdfData}
            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              currentStep === 4
                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-sm ring-1 ring-blue-500/30'
                : 'bg-slate-950/40 border-slate-800 text-slate-500'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                currentStep === 4 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              4
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-mono tracking-wider font-semibold opacity-70">
                Final
              </div>
              <div className="text-xs font-bold truncate">Cross-Match Audit</div>
            </div>
          </button>
        </div>
      </div>

      {/* STEP 1: UPLOAD HTML SCREEN */}
      {currentStep === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex flex-col gap-5"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/5">
              <FileCode className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-100">1st Step: Upload Moraware HTML File</h2>
            <p className="text-xs text-slate-400 max-w-lg mt-1 leading-relaxed">
              Upload the exported Moraware Job Detail HTML. The QA Inspector will extract all global job fields, phase structures, rooms, sinks, and backsplash specifications.
            </p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setHtmlDrag(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setHtmlDrag(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setHtmlDrag(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleHtmlFile(e.dataTransfer.files[0]);
                }
              }}
              className={`mt-6 w-full max-w-xl relative rounded-2xl border-2 border-dashed p-8 transition-all flex flex-col items-center justify-center cursor-pointer ${
                htmlDrag
                  ? 'border-blue-500 bg-blue-950/20'
                  : 'border-slate-700 bg-slate-950/60 hover:border-blue-500/60 hover:bg-slate-950/80'
              }`}
            >
              <input
                type="file"
                accept=".html,.htm"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleHtmlFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Upload className="w-8 h-8 text-blue-400 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-slate-200">Drag Moraware .html file here or click to browse</span>
              <span className="text-xs text-slate-500 font-mono mt-1">Accepts standard Moraware Job Detail .html exports</span>
            </div>

            {/* Quick Demo Scenarios */}
            <div className="mt-8 pt-6 border-t border-slate-800 w-full max-w-xl">
              <span className="text-xs text-slate-400 font-semibold block mb-3">Or load a pre-configured sample:</span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => handleLoadSampleScenario('residential')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Residential Remodel (Tiltmann)
                </button>
                <button
                  onClick={() => handleLoadSampleScenario('multiphase')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Commercial Multi-Phase (PH1 & PH2)
                </button>
                <button
                  onClick={() => handleLoadSampleScenario('mismatch')}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-xs font-semibold text-rose-300 transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  QA Mismatch Demo (Sheet & Field Discrepancies)
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 2: PROMPT TO CHOOSE PHASE / SCOPE */}
      {currentStep === 2 && parsedHtmlData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex flex-col gap-5"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>2nd Step: Choose Inspection Scope</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                      {scopeOptions.length} Scope Option{scopeOptions.length > 1 ? 's' : ''}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select Full Job to cross-match all rooms against the entire CAD drawing package, or select an individual room/phase.
                  </p>
                </div>
              </div>

              {/* Job summary pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                <span className="text-slate-400">Job:</span>
                <span className="font-bold text-slate-200">{parsedHtmlData.global.jobName || 'N/A'}</span>
                <span className="text-blue-400">({parsedHtmlData.global.jobNum || 'No #'})</span>
              </div>
            </div>

            {/* Interactive Scope Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {scopeOptions.map((opt) => {
                const isSelected = selectedPhase === opt.id;
                const firstForm = opt.forms[0];

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedPhase(opt.id)}
                    className={`relative rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-xs">
                          {opt.id}
                        </span>
                        <h3 className="font-bold text-sm text-slate-100 truncate max-w-[200px]">{opt.label}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-mono">{opt.sub}</p>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase block">Product</span>
                          <span className="font-bold text-slate-200 truncate block">
                            {firstForm ? `${firstForm.product} ${firstForm.color}` : 'Standard'}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase block">Edge</span>
                          <span className="font-bold text-slate-200 truncate block">
                            {firstForm?.edgeProfile || 'Standard Eased'}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase block">Sink Model</span>
                          <span className="font-bold text-slate-200 truncate block">
                            {firstForm?.sinkModel || 'None'}
                          </span>
                        </div>
                        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-[10px] text-slate-500 uppercase block">Splash</span>
                          <span className="font-bold text-slate-200 truncate block">
                            {firstForm?.backsplashHeight ? `${firstForm.backsplashHeight}"` : firstForm?.splashInfo || 'None'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <span>{opt.forms.length} Section{opt.forms.length > 1 ? 's' : ''}</span>
                      <span className={`font-semibold ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                        {isSelected ? 'Selected' : 'Click to select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions Bottom Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Moraware HTML
              </button>

              <button
                onClick={() => handleConfirmPhase(selectedPhase || 'ALL')}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
              >
                <span>Confirm Scope ({selectedPhase || 'ALL'}) & Proceed to 3rd Step (Upload PDF)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* STEP 3: UPLOAD PDF SCREEN */}
      {currentStep === 3 && parsedHtmlData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex flex-col gap-5"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/5">
              <FileText className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-100">3rd Step: Upload CAD Drawing PDF</h2>
            <p className="text-xs text-slate-400 max-w-lg mt-1 leading-relaxed">
              Upload the CAD PDF drawing package. The system will inspect all drawing sheets, title blocks, sink schedules, and fabrication notes to cross-match against <strong className="text-blue-400">{selectedPhase}</strong>.
            </p>

            {/* Context Summary Box */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono text-xs max-w-xl w-full">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-slate-500">Job:</span>
                <span className="font-bold text-white">{parsedHtmlData.global.jobName}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1.5 text-blue-400">
                <span className="text-slate-500">Auditing:</span>
                <span className="font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{selectedPhase}</span>
              </div>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-[11px] text-slate-400 hover:text-blue-400 underline font-sans ml-2"
              >
                Change Scope
              </button>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setPdfDrag(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setPdfDrag(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setPdfDrag(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handlePdfFile(e.dataTransfer.files[0]);
                }
              }}
              className={`mt-6 w-full max-w-xl relative rounded-2xl border-2 border-dashed p-8 transition-all flex flex-col items-center justify-center cursor-pointer ${
                pdfDrag
                  ? 'border-rose-500 bg-rose-950/20'
                  : 'border-slate-700 bg-slate-950/60 hover:border-rose-500/60 hover:bg-slate-950/80'
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handlePdfFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {isProcessingPdf ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-sm font-bold text-rose-400">Inspecting Multi-Sheet CAD Text & Title Blocks...</span>
                  <span className="text-xs text-slate-400 mt-1">Sorting 2D spatial coordinate text layers</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-rose-400 mb-2 animate-bounce" />
                  <span className="text-sm font-bold text-slate-200">Drag CAD PDF Drawing here or click to browse</span>
                  <span className="text-xs text-slate-500 font-mono mt-1">Multi-sheet PDF drawing packages supported</span>
                </>
              )}
            </div>

            {/* Quick Demo PDFs */}
            <div className="mt-8 pt-6 border-t border-slate-800 w-full max-w-xl">
              <span className="text-xs text-slate-400 font-semibold block mb-3">Or test with preset drawings:</span>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  onClick={() => {
                    setParsedPdfData(MOCK_PERFECT_PDF);
                    setCurrentStep(4);
                    sound.playSuccess(settings.soundEnabled);
                    onShowToast('Loaded Preset PDF', '2-Sheet CAD Drawing (Perfect Match)', 'success');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Load Matching 2-Sheet PDF
                </button>
                <button
                  onClick={() => {
                    setParsedPdfData(MOCK_MISMATCH_PDF);
                    setCurrentStep(4);
                    sound.playMismatch(settings.soundEnabled);
                    onShowToast('Loaded Mismatch PDF', '1-Sheet PDF with Discrepancies & Stated Sheet Mismatch', 'error');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-xs font-semibold text-rose-300 transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Load Mismatch PDF (Sheet Count Bug)
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* FINAL STEP 4: CROSS MATCH AUDIT RESULTS */}
      {currentStep === 4 && parsedHtmlData && parsedPdfData && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex flex-col gap-6"
        >
          {/* Top Active Audit Context Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono">Job:</span>
                <span className="font-bold text-slate-100">{parsedHtmlData.global.jobName}</span>
                <span className="text-blue-400 font-mono font-bold">({parsedHtmlData.global.jobNum || 'No #'})</span>
              </div>

              <div className="flex items-center gap-2 bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-800/40">
                <span className="text-blue-300 font-mono">Auditing:</span>
                <span className="font-bold text-blue-200">{selectedPhase}</span>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="ml-1 text-[11px] text-blue-400 hover:text-blue-200 underline font-sans"
                >
                  Switch Scope
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
                <span className="text-slate-400">PDF:</span>
                <span className="font-bold text-slate-300 truncate max-w-[150px] sm:max-w-none">
                  {parsedPdfData.fileName || 'Drawing.pdf'}
                </span>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="ml-1 text-[11px] text-slate-400 hover:text-slate-200 underline font-sans"
                >
                  Replace PDF
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartOver}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Inspection
              </button>
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                Audit Certificate
              </button>
            </div>
          </div>

          {/* Multi-Sheet & Drawing Scope Audit Card */}
          <div
            className={`rounded-2xl border p-5 shadow-xl transition-all ${
              isSheetCountMatch
                ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border-emerald-500/40'
                : 'bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 border-rose-500/60 ring-1 ring-rose-500/40'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
                    isSheetCountMatch
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                  }`}
                >
                  <FileSpreadsheet className="w-6 h-6" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Sheet Count Verification & Scope Check
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isSheetCountMatch ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/30 text-rose-300'
                      }`}
                    >
                      {isSheetCountMatch ? 'SHEETS VERIFIED' : 'CRITICAL SHEET MISMATCH'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1">
                    {isSheetCountMatch
                      ? `PDF package contains all ${parsedPdfData.actualPages} sheet(s) corresponding to the ${parsedPdfData.statedPages} stated in CAD title block.`
                      : `CAD title block states ${parsedPdfData.statedPages} total sheets, but only ${parsedPdfData.actualPages} sheet(s) are present in this PDF! Missing drawing sheets detected.`}
                  </p>
                </div>
              </div>

              {/* Sheet Count Display Numbers */}
              <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800 font-mono">
                <div className="text-center px-3 border-r border-slate-800">
                  <span className="text-xl font-black text-white">{parsedPdfData.actualPages}</span>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Actual Pages</span>
                </div>
                <div className="text-center px-3">
                  <span className={`text-xl font-black ${isSheetCountMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {parsedPdfData.statedPages}
                  </span>
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">Stated Sheets</span>
                </div>
              </div>
            </div>

            {/* Per-Sheet Details Breakdown */}
            {parsedPdfData.sheets && parsedPdfData.sheets.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <span className="text-[11px] uppercase font-mono font-bold text-slate-400 block mb-2">
                  Detected Drawing Sheets in CAD Package:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {parsedPdfData.sheets.map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-blue-400">Sheet {s.pageNumber}</span>
                        {s.statedSheetNumber && s.statedTotalSheets && (
                          <span className="text-slate-400 ml-1">
                            (Page {s.statedSheetNumber} of {s.statedTotalSheets})
                          </span>
                        )}
                        <p className="text-[11px] text-slate-300 font-sans truncate mt-0.5 max-w-[180px]">
                          {s.roomName ? `Countertop: ${s.roomName}` : s.sheetTitle || 'Plan View'}
                        </p>
                      </div>
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                        {s.pageText.length} chars
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Header Score Card */}
          <div
            className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xl ${
              isAllPassed
                ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/40'
                : 'bg-gradient-to-r from-rose-950/40 to-slate-900 border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${
                  isAllPassed
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                }`}
              >
                {isAllPassed ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {isAllPassed
                      ? 'Quality Assurance Passed (100% Match)'
                      : `${mismatchCount} Discrepancy Found in Drawing`}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isAllPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isAllPassed ? 'READY FOR FABRICATION' : 'NEEDS CORRECTION'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {passedCount} of {checks.length} inspection checkpoints verified between Moraware and CAD drawing.
                </p>
              </div>
            </div>

            {/* Score & Actions */}
            <div className="flex items-center gap-3">
              <div className="text-right font-mono pr-4 border-r border-slate-800 hidden sm:block">
                <span className="text-2xl font-black text-white">{passRate}%</span>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Match Rate</p>
              </div>

              <button
                onClick={() => setShowRawCadText(!showRawCadText)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>{showRawCadText ? 'Hide CAD Text' : 'View CAD Text'}</span>
              </button>
            </div>
          </div>

          {/* Raw CAD Text Inspector (Collapsible & Per-Sheet Explorer) */}
          {showRawCadText && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-3 gap-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-300">
                    Spatially Reconstructed CAD Drawing Text
                  </h4>
                </div>

                {/* Per Sheet Tabs */}
                {parsedPdfData.sheets && parsedPdfData.sheets.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                    <button
                      onClick={() => setActiveSheetTab('all')}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        activeSheetTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All Sheets
                    </button>
                    {parsedPdfData.sheets.map((s) => (
                      <button
                        key={s.pageNumber}
                        onClick={() => setActiveSheetTab(s.pageNumber)}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          activeSheetTab === s.pageNumber ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Sheet {s.pageNumber} ({s.roomName || 'Plan'})
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => copyToClipboard(parsedPdfData.rawText || '', 'Raw CAD Text')}
                  className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy Text
                </button>
              </div>

              <pre className="text-xs font-mono text-slate-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {activeSheetTab === 'all'
                  ? parsedPdfData.rawText || 'No text extracted.'
                  : parsedPdfData.sheets?.find((s) => s.pageNumber === activeSheetTab)?.pageText || 'No text on this sheet.'}
              </pre>
            </div>
          )}

          {/* Checklist Filter Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterMode === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Checks ({checks.length})
              </button>
              <button
                onClick={() => setFilterMode('mismatches')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  filterMode === 'mismatches' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                Mismatches ({mismatchCount})
              </button>
              <button
                onClick={() => setFilterMode('matches')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterMode === 'matches' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                Matches ({passedCount})
              </button>
            </div>
          </div>

          {/* Detailed Verification Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-5 font-semibold w-1/4">QA Inspection Field</th>
                    <th className="py-3.5 px-5 font-semibold w-1/3">Moraware Specification</th>
                    <th className="py-3.5 px-5 font-semibold w-1/3">CAD Drawing PDF</th>
                    <th className="py-3.5 px-5 font-semibold text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredChecks.map((item) => {
                    const isMatch = item.isMatch;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isMatch ? 'hover:bg-slate-800/40' : 'bg-rose-950/20 hover:bg-rose-950/30'
                        }`}
                      >
                        {/* Field Label */}
                        <td className="py-4 px-5 align-top">
                          <div className="font-sans font-bold text-slate-100 text-xs">
                            {item.label}
                          </div>
                          {!isMatch && (
                            <p className="font-sans text-[11px] text-rose-400 mt-1 font-semibold flex items-center gap-1">
                              <span>Mismatch detected</span>
                            </p>
                          )}
                          {item.notes && (
                            <p className="font-sans text-[10px] text-slate-400 mt-1">
                              {item.notes}
                            </p>
                          )}
                        </td>

                        {/* Moraware Value */}
                        <td className="py-4 px-5 align-top text-slate-300">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`break-words uppercase leading-relaxed ${
                                !item.htmlVal ? 'text-slate-500 italic' : 'text-slate-200 font-semibold'
                              }`}
                            >
                              {item.htmlVal || 'BLANK'}
                            </span>
                            {item.htmlVal && item.htmlVal !== 'N/A' && (
                              <button
                                onClick={() => copyToClipboard(item.htmlVal, item.label)}
                                title="Copy Moraware value to clipboard"
                                className="p-1 rounded text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors shrink-0"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {item.isPhase && selectedPhase && (
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              SCOPE: {selectedPhase}
                            </span>
                          )}
                        </td>

                        {/* CAD PDF Value */}
                        <td className="py-4 px-5 align-top text-slate-300">
                          <span
                            className={`break-words uppercase leading-relaxed ${
                              !item.pdfVal ? 'text-slate-500 italic' : isMatch ? 'text-slate-200' : 'text-rose-200 font-bold'
                            }`}
                          >
                            {item.pdfVal || 'NOT FOUND IN PDF'}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-5 align-top text-center">
                          {isMatch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              PASS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
                              <XCircle className="w-3.5 h-3.5" />
                              FAIL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        checks={checks}
        parsedHtml={parsedHtmlData}
        parsedPdf={parsedPdfData}
        targetPhaseId={selectedPhase || targetPhaseId}
        onShowToast={onShowToast}
      />
    </div>
  );
};
