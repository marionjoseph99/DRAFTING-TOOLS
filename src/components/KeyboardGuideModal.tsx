import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardGuideModal: React.FC<KeyboardGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + V', description: 'Paste raw Moraware HTML directly anywhere on page' },
    { key: '1 - 9', description: 'Instantly copy corresponding Global Field (1=Job Name, 2=Address, 3=Phone...)' },
    { key: 'Q / E', description: 'Switch between QA Checker (Q) and Data Extractor (E)' },
    { key: 'Escape', description: 'Close any open modal or clear search filter' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Keyboard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">CAD Keyboard Shortcuts</h3>
                <p className="text-xs text-slate-400 mt-0.5">Rapid drafting commands for power users</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List of shortcuts */}
          <div className="p-5 space-y-3">
            {shortcuts.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50"
              >
                <span className="text-xs text-slate-300 font-medium">{s.description}</span>
                <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-blue-300 shrink-0 ml-3">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-slate-800 bg-slate-900/90 p-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
