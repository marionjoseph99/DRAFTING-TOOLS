import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSpreadsheet, X, Copy, Check, FileText, Code } from 'lucide-react';
import { ParsedMorawareData, DrafterSettings } from '../types';
import { formatTemplaterDrawn } from '../utils/morawareParser';
import { sound } from '../utils/sound';

interface AutoCADExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: ParsedMorawareData | null;
  activePhaseId: string;
  settings: DrafterSettings;
  onShowToast: (title: string, description?: string) => void;
}

export const AutoCADExportModal: React.FC<AutoCADExportModalProps> = ({
  isOpen,
  onClose,
  parsedData,
  activePhaseId,
  settings,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'titleblock' | 'schedule' | 'notes' | 'json'>('titleblock');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !parsedData) return null;

  const global = parsedData.global;
  const phase = parsedData.phases[activePhaseId] || { phaseId: activePhaseId, forms: [], templater: '', templateDate: '' };
  
  // Format Phase Name
  let phaseDisplay = global.jobName;
  if (activePhaseId && activePhaseId.toUpperCase() !== 'PH1' && !activePhaseId.toUpperCase().includes('DEFAULT')) {
    phaseDisplay += ` - ${activePhaseId}`;
  } else if (global.expectedPhase > 1 && (!activePhaseId || activePhaseId.toUpperCase() === 'PH1')) {
    phaseDisplay += ` PHASE ${global.expectedPhase}`;
  }

  const templaterDrawn = formatTemplaterDrawn(phase, settings.drafterInitials, settings.dateFormat);

  // 1. Titleblock Text Format
  const titleBlockText = `JOB NAME: ${phaseDisplay}
JOB #: ${global.jobNum || 'N/A'}
ADDRESS: ${global.jobAddress || 'N/A'}
PHONE: ${global.clientPhone || 'N/A'}
CONTRACTOR: ${global.contractor || 'N/A'}
CONTACT: ${global.contractorContactName || 'N/A'} (${global.contractorContactPhone || 'N/A'})
DRAWN: ${templaterDrawn}
JOB TYPE: ${global.jobType || 'N/A'}`;

  // 2. Room & Area Schedule
  const roomScheduleText = phase.forms.map((f, i) => {
    const matParts = [f.thickness, f.product, f.color].filter(Boolean).join(' - ');
    return `[AREA ${i + 1}: ${f.title}]
MATERIAL: ${matParts || 'N/A'}
EDGE: ${f.edgeProfile || 'EASED'}
SINK: ${f.sinkModel || 'N/A'} (${f.sinkType || 'UNDERMOUNT'}) | SUPPLIED BY: ${f.sinkSuppliedBy || 'N/A'}
FAUCET: ${f.faucetHoles || 'N/A'} | ${f.faucetModel || ''} ${f.faucetNotes ? `(${f.faucetNotes})` : ''}
SPLASH: BACK: ${f.backsplashHeight ? f.backsplashHeight + '"' : 'NONE'} | SIDE: ${f.sideSplash || 'NONE'} ${f.splashInfo ? `(${f.splashInfo})` : ''}
RANGE/APPLIANCE: ${f.rangeType || 'N/A'}
CABINETS: ${f.cabinets || 'N/A'}
TEAROUT: ${f.tearout || 'NO'}`;
  }).join('\n\n');

  // 3. General Drafting Notes
  const generalNotesText = `GENERAL FABRICATION & DRAFTING NOTES:
1. ALL DIMENSIONS ARE FIELD VERIFIED BY TEMPLATER (${phase.templater || 'FIELD'}).
2. CONTRACTOR/CUSTOMER TO VERIFY APPLIANCE CUTOUT SPECIFICATIONS PRIOR TO CNC MACHINING.
3. UNDERMOUNT SINK CUTOUT INCLUDES 1/8" POSITIVE/OVERHANG REVEAL UNLESS SPECIFIED OTHERWISE.
4. BACKSPLASH HEIGHT SPECIFIED AT ${phase.forms.map(f => f.backsplashHeight).filter(Boolean).join(', ') || '4"'} NOMINAL.
5. POLISHED EDGES PER SHOP STANDARD (${phase.forms.map(f => f.edgeProfile).filter(Boolean).join(' / ') || 'EASED'}).`;

  // 4. JSON representation
  const jsonData = JSON.stringify(
    {
      job: global,
      activePhase: activePhaseId,
      templaterDrawn,
      rooms: phase.forms,
    },
    null,
    2
  );

  let currentContent = titleBlockText;
  if (activeTab === 'schedule') currentContent = roomScheduleText;
  if (activeTab === 'notes') currentContent = generalNotesText;
  if (activeTab === 'json') currentContent = jsonData;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      sound.playCopy(settings.soundEnabled);
      setCopied(true);
      onShowToast('Copied to Clipboard', `${activeTab.toUpperCase()} block copied for AutoCAD`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">AutoCAD Text Block Generator</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formatted CAD blocks ready to paste directly into AutoCAD MTEXT or Notes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 px-5 pt-3 bg-slate-950/40 border-b border-slate-800/80">
            <button
              onClick={() => setActiveTab('titleblock')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'titleblock'
                  ? 'border-blue-500 text-blue-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Title Block (8 Lines)
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Room Schedule
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'border-blue-500 text-blue-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              General Notes
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'border-blue-500 text-blue-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Raw JSON
            </button>
          </div>

          {/* Content Area */}
          <div className="p-5">
            <div className="relative">
              <pre className="w-full max-h-80 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs text-blue-200 leading-relaxed whitespace-pre-wrap select-all">
                {currentContent}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 p-4">
            <span className="text-[11px] font-mono text-slate-500">
              Phase: <strong className="text-slate-300">{activePhaseId}</strong> • {phase.forms.length} Areas
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-900/30 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
