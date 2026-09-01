import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Printer, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { QACheckItem, ParsedMorawareData, ParsedPdfData } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  checks: QACheckItem[];
  parsedHtml: ParsedMorawareData | null;
  parsedPdf: ParsedPdfData | null;
  targetPhaseId: string;
  onShowToast: (title: string, desc?: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  checks,
  parsedHtml,
  parsedPdf,
  targetPhaseId,
  onShowToast,
}) => {
  if (!isOpen || !parsedHtml || !parsedPdf) return null;

  const passedCount = checks.filter((c) => c.isMatch).length;
  const totalCount = checks.length;
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const isPerfect = passRate === 100;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = async () => {
    const summary = `KGS DRAFTING QUALITY ASSURANCE INSPECTION REPORT
Date: ${new Date().toLocaleString()}
Job: ${parsedHtml.global.jobName || 'N/A'} (#${parsedHtml.global.jobNum || 'N/A'})
Phase: ${targetPhaseId}
CAD PDF: ${parsedPdf.fileName || 'Drawing.pdf'}
Moraware HTML: ${parsedHtml.fileName || 'Moraware.html'}
Inspection Status: ${isPerfect ? 'PASSED (100%)' : `FLAGGED (${passRate}% - ${totalCount - passedCount} Mismatch)`}

Audit Points:
${checks.map((c) => `[${c.isMatch ? 'PASS' : 'FAIL'}] ${c.label}\n  Moraware: ${c.htmlVal || 'N/A'}\n  CAD PDF:  ${c.pdfVal || 'N/A'}`).join('\n\n')}
`;
    try {
      await navigator.clipboard.writeText(summary);
      onShowToast('QA Report Copied', 'Summary report copied to clipboard');
    } catch {
      // Fallback
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl flex flex-col print:border-none print:shadow-none print:max-h-none print:bg-white print:text-black"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 p-5 print:border-b-2 print:border-black">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isPerfect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 print:text-black">QA Inspection Audit Certificate</h3>
                <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                  Generated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors print:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* Top Score Banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              isPerfect ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {isPerfect ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    {isPerfect ? 'All Inspection Checks Verified & Passed' : `${totalCount - passedCount} Discrepancies Require Attention`}
                  </h4>
                  <p className="text-xs opacity-80 mt-0.5">
                    {passedCount} of {totalCount} fields matched between Moraware specifications and CAD drawing.
                  </p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-2xl font-black">{passRate}%</span>
                <p className="text-[10px] uppercase tracking-wider font-semibold">Match Score</p>
              </div>
            </div>

            {/* Metadata Table */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">Job Name</span>
                <span className="font-bold text-slate-200">{parsedHtml.global.jobName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">Job #</span>
                <span className="font-bold text-slate-200">{parsedHtml.global.jobNum || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">Phase</span>
                <span className="font-bold text-blue-400">{targetPhaseId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-sans">Contractor</span>
                <span className="font-bold text-slate-200 truncate block">{parsedHtml.global.contractor || 'N/A'}</span>
              </div>
            </div>

            {/* Detailed Checklist Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-300 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Field</th>
                    <th className="p-3">Moraware (HTML)</th>
                    <th className="p-3">CAD Drawing (PDF)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40 font-mono">
                  {checks.map((item) => (
                    <tr key={item.id} className={item.isMatch ? 'hover:bg-slate-800/30' : 'bg-rose-950/20 hover:bg-rose-950/30'}>
                      <td className="p-3 font-semibold font-sans text-slate-200">{item.label}</td>
                      <td className="p-3 text-slate-300 max-w-[200px] break-words">{item.htmlVal || '—'}</td>
                      <td className="p-3 text-slate-300 max-w-[200px] break-words">{item.pdfVal || '—'}</td>
                      <td className="p-3 text-center">
                        {item.isMatch ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            MATCH
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            MISMATCH
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/90 p-4 print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Report Summary
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
