import React, { useState } from 'react';
import {
  Compass,
  CheckCheck,
  FileCode2,
  Settings,
  Keyboard,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
  ClipboardPaste,
} from 'lucide-react';
import { DrafterSettings, ParsedMorawareData } from '../types';

interface NavbarProps {
  activeTab: 'extract' | 'qa';
  onTabChange: (tab: 'extract' | 'qa') => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenPasteHtml: () => void;
  onOpenExportModal: () => void;
  onLoadSample: (sampleType: 'residential' | 'multiphase' | 'mismatch') => void;
  settings: DrafterSettings;
  parsedData: ParsedMorawareData | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenShortcuts,
  onOpenPasteHtml,
  onOpenExportModal,
  onLoadSample,
  settings,
  parsedData,
}) => {
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                KGS Assistant
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PRO CAD v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Drafting QA & Moraware Extractor
            </p>
          </div>
        </div>

        {/* Primary Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
          <button
            onClick={() => onTabChange('extract')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'extract'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Data Extractor</span>
            {parsedData && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onTabChange('qa')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'qa'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>QA Inspector</span>
          </button>
        </div>

        {/* Right Tools & Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Load Sample Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Samples</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {sampleMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSampleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-1.5 z-20 space-y-1">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Instant Demo Scenarios
                  </div>
                  <button
                    onClick={() => {
                      onLoadSample('residential');
                      setSampleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex flex-col transition-colors"
                  >
                    <span className="font-semibold text-blue-300">1. Residential Kitchen & Island</span>
                    <span className="text-[10px] text-slate-400">Silestone Calacatta Gold (PH1)</span>
                  </button>
                  <button
                    onClick={() => {
                      onLoadSample('multiphase');
                      setSampleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex flex-col transition-colors"
                  >
                    <span className="font-semibold text-blue-300">2. Commercial Multi-Phase</span>
                    <span className="text-[10px] text-slate-400">Condo PH1 Kitchen + PH2 Bathrooms</span>
                  </button>
                  <button
                    onClick={() => {
                      onLoadSample('mismatch');
                      setSampleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex flex-col transition-colors"
                  >
                    <span className="font-semibold text-amber-300">3. QA Mismatch Inspector</span>
                    <span className="text-[10px] text-slate-400">Demonstrates CAD drawing error detection</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Paste Raw HTML Button */}
          <button
            onClick={onOpenPasteHtml}
            title="Paste Moraware HTML code"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Paste HTML</span>
          </button>

          {/* AutoCAD Text Blocks */}
          {parsedData && (
            <button
              onClick={onOpenExportModal}
              title="Generate AutoCAD MTEXT blocks"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20 text-xs font-semibold text-blue-300 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden lg:inline">CAD Blocks</span>
            </button>
          )}

          {/* Keyboard Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            className="p-2 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Settings / Initials */}
          <button
            onClick={onOpenSettings}
            title="Drafter Preferences"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-400">{settings.drafterInitials || 'MP'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
