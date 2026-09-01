import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, ChevronRight, X, Building2 } from 'lucide-react';
import { ParsedMorawareData } from '../types';

interface PhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: ParsedMorawareData | null;
  onSelectPhase: (phaseId: string) => void;
  title?: string;
  subtitle?: string;
}

export const PhaseModal: React.FC<PhaseModalProps> = ({
  isOpen,
  onClose,
  parsedData,
  onSelectPhase,
  title = 'Select Job Phase',
  subtitle = 'Multiple phases were detected in this Moraware file. Which phase would you like to inspect?',
}) => {
  if (!isOpen || !parsedData) return null;

  const phaseKeys = Object.keys(parsedData.phases);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">{title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Job summary badge */}
          <div className="bg-slate-950/40 px-5 py-3 border-b border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              {parsedData.global.jobName || 'JOB'} ({parsedData.global.jobNum || 'NO-NUM'})
            </span>
            <span className="text-blue-400">{phaseKeys.length} Phases Available</span>
          </div>

          {/* List of phases */}
          <div className="p-4 max-h-80 overflow-y-auto space-y-2.5">
            {phaseKeys.map((phaseId) => {
              const phase = parsedData.phases[phaseId];
              const roomCount = phase.forms.length;
              const roomNames = phase.forms.map((f) => f.title).filter(Boolean).join(', ');

              return (
                <button
                  key={phaseId}
                  onClick={() => onSelectPhase(phaseId)}
                  className="w-full group flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500/50 transition-all text-left"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition-colors font-mono">
                        {phaseId}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">
                        {roomCount} {roomCount === 1 ? 'Area' : 'Areas'}
                      </span>
                    </div>

                    {roomNames ? (
                      <p className="text-xs text-slate-400 truncate mt-1">
                        {roomNames}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic mt-1">
                        No specific area forms attached
                      </p>
                    )}

                    {phase.templater && (
                      <p className="text-[11px] font-mono text-slate-500 mt-1">
                        Templater: <span className="text-slate-300">{phase.templater}</span> {phase.templateDate && `(${phase.templateDate})`}
                      </p>
                    )}
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/50 text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-slate-800 bg-slate-900/90 p-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
