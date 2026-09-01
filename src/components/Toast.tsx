import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, Copy } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'copy';
  title: string;
  description?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={() => onDismiss(t.id)}
            className="pointer-events-auto cursor-pointer flex items-center gap-3 p-3.5 rounded-xl shadow-xl border bg-slate-900/95 backdrop-blur-md text-white border-slate-700/80 hover:border-slate-600 transition-colors"
          >
            {t.type === 'copy' && (
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Copy className="w-4 h-4" />
              </div>
            )}
            {t.type === 'success' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {t.type === 'error' && (
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {t.type === 'info' && (
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
                <Info className="w-4 h-4" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-[11px] font-mono text-blue-300 truncate mt-0.5">{t.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
