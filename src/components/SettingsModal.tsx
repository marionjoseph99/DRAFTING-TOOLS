import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Volume2, VolumeX, User, Calendar, Check } from 'lucide-react';
import { DrafterSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DrafterSettings;
  onUpdateSettings: (newSettings: DrafterSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

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
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Drafter Preferences</h3>
                <p className="text-xs text-slate-400 mt-0.5">Customize your CAD drafting settings and shortcuts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5 space-y-4">
            {/* Drafter Initials */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Default Drafter Initials (e.g. MP, JD)
              </label>
              <input
                type="text"
                maxLength={4}
                value={settings.drafterInitials}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    drafterInitials: e.target.value.toUpperCase().trim(),
                  })
                }
                placeholder="MP"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2.5 font-mono text-sm font-bold uppercase text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              <p className="text-[11px] text-slate-500">
                Used to format the "Templater Drawn" block string (e.g. 10/14/2026 EL, 10/16/2026 {settings.drafterInitials || 'MP'}).
              </p>
            </div>

            {/* Date format */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Date Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, dateFormat: fmt })}
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-mono transition-all ${
                      settings.dateFormat === fmt
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-slate-950/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-200">Click & Copy Audio Feedback</p>
                  <p className="text-[11px] text-slate-500">Play tactile clicks on field copy and QA inspection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.soundEnabled ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto-uppercase toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 font-mono font-bold text-xs text-blue-400 flex items-center justify-center">AA</div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Strict Uppercase for CAD</p>
                  <p className="text-[11px] text-slate-500">Ensure all copied text is capitalized for standard drawings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateSettings({ ...settings, autoUppercase: !settings.autoUppercase })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.autoUppercase ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.autoUppercase ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-slate-800 bg-slate-900/90 p-4">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Save Preferences
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
