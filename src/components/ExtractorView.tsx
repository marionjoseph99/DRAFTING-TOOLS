import React, { useState } from 'react';
import {
  Upload,
  Layers,
  RotateCcw,
  Search,
  FileSpreadsheet,
  Copy,
  Building,
  Home,
  CheckCircle2,
  Sparkles,
  ClipboardPaste,
} from 'lucide-react';
import { ParsedMorawareData, DrafterSettings } from '../types';
import { DataCard } from './DataCard';
import { formatTemplaterDrawn } from '../utils/morawareParser';
import { sound } from '../utils/sound';

interface ExtractorViewProps {
  parsedData: ParsedMorawareData | null;
  activePhaseId: string;
  onSelectPhase: (phaseId: string) => void;
  onFileUpload: (file: File) => void;
  onReset: () => void;
  onOpenPasteModal: () => void;
  onOpenExportModal: () => void;
  onLoadSample: (type: 'residential' | 'multiphase' | 'mismatch') => void;
  settings: DrafterSettings;
  onShowToast: (title: string, desc?: string) => void;
}

export const ExtractorView: React.FC<ExtractorViewProps> = ({
  parsedData,
  activePhaseId,
  onSelectPhase,
  onFileUpload,
  onReset,
  onOpenPasteModal,
  onOpenExportModal,
  onLoadSample,
  settings,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  const copyAllGlobalFields = async () => {
    if (!parsedData) return;
    const g = parsedData.global;
    const p = parsedData.phases[activePhaseId] || { phaseId: activePhaseId, forms: [], templater: '', templateDate: '' };
    const templaterDrawn = formatTemplaterDrawn(p, settings.drafterInitials, settings.dateFormat);

    let phaseDisplay = g.jobName;
    if (activePhaseId && activePhaseId.toUpperCase() !== 'PH1' && !activePhaseId.toUpperCase().includes('DEFAULT')) {
      phaseDisplay += ` - ${activePhaseId}`;
    }

    const allText = `JOB NAME: ${phaseDisplay}
ADDRESS: ${g.jobAddress || 'N/A'}
PHONE: ${g.clientPhone || 'N/A'}
JOB #: ${g.jobNum || 'N/A'}
CONTRACTOR: ${g.contractor || 'N/A'}
CONTACT: ${g.contractorContactName || 'N/A'} - ${g.contractorContactPhone || 'N/A'}
JOB TYPE: ${g.jobType || 'N/A'}
DRAWN: ${templaterDrawn}`;

    try {
      await navigator.clipboard.writeText(allText);
      sound.playCopy(settings.soundEnabled);
      onShowToast('Copied All Global Info', 'All 8 title block fields copied to clipboard');
    } catch {
      // Handled
    }
  };

  const copyRoomBlock = async (roomTitle: string, details: string) => {
    try {
      await navigator.clipboard.writeText(details);
      sound.playCopy(settings.soundEnabled);
      onShowToast(`Copied ${roomTitle}`, 'Area specifications copied for AutoCAD');
    } catch {
      // Handled
    }
  };

  // If no data loaded yet, show the Drop Zone Empty State
  if (!parsedData) {
    return (
      <div className="max-w-4xl mx-auto w-full py-8 px-4 flex flex-col gap-6">
        {/* Main Upload Hero */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all bg-slate-900/60 backdrop-blur-md shadow-xl flex flex-col items-center justify-center ${
            dragOver
              ? 'border-blue-500 bg-blue-950/20 ring-4 ring-blue-500/20'
              : 'border-slate-700/80 hover:border-blue-500/60 hover:bg-slate-900/80'
          }`}
        >
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 shadow-lg shadow-blue-950">
            <Upload className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            Upload Moraware Job Details (HTML)
          </h2>
          <p className="text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
            Drag & drop your exported Moraware HTML file here, or click to browse. Instantly extracts all titleblock data, edge profiles, sinks, and area specs.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 z-20">
            <label className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-900/40 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              Browse HTML File
              <input
                type="file"
                accept=".html,.htm"
                onChange={handleFileInput}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={onOpenPasteModal}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all"
            >
              <ClipboardPaste className="w-4 h-4 text-blue-400" />
              Paste Raw HTML
            </button>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Or Try A Preset Demonstration
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onLoadSample('residential')}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-blue-500/50 hover:bg-slate-800/80 text-left transition-all group"
            >
              <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 font-mono">
                Residential Remodel
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Silestone Calacatta Gold Kitchen + Waterfall Island (PH1)
              </p>
            </button>

            <button
              onClick={() => onLoadSample('multiphase')}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-blue-500/50 hover:bg-slate-800/80 text-left transition-all group"
            >
              <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 font-mono">
                Multi-Phase Commercial
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Pinnacle Towers (PH1 Kitchen & PH2 Master Bath)
              </p>
            </button>

            <button
              onClick={() => onLoadSample('mismatch')}
              className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 hover:border-amber-500/50 hover:bg-slate-800/80 text-left transition-all group"
            >
              <p className="text-xs font-bold text-amber-300 group-hover:text-amber-400 font-mono">
                QA Discrepancy Sample
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Loads Moraware HTML + Discrepant CAD PDF inspection
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DATA LOADED VIEW ---
  const global = parsedData.global;
  const phaseKeys = Object.keys(parsedData.phases);
  const activePhase = parsedData.phases[activePhaseId] || {
    phaseId: activePhaseId,
    forms: [],
    templater: '',
    templateDate: '',
  };

  // Phase Title Display
  let phaseDisplay = global.jobName;
  if (activePhaseId && activePhaseId.toUpperCase() !== 'PH1' && !activePhaseId.toUpperCase().includes('DEFAULT')) {
    phaseDisplay += ` - ${activePhaseId}`;
  } else if (global.expectedPhase > 1 && (!activePhaseId || activePhaseId.toUpperCase() === 'PH1')) {
    phaseDisplay += ` PHASE ${global.expectedPhase}`;
  }

  const templaterDrawn = formatTemplaterDrawn(activePhase, settings.drafterInitials, settings.dateFormat);

  // Filter forms by search query
  const filteredForms = activePhase.forms.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      f.product.toLowerCase().includes(q) ||
      f.color.toLowerCase().includes(q) ||
      f.sinkModel.toLowerCase().includes(q) ||
      f.edgeProfile.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto w-full py-6 px-4 sm:px-6 flex flex-col gap-6">
      {/* Top Action Control Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Job Summary & Phase Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold text-xs">
              <Building className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white font-mono">{phaseDisplay || 'JOB DETAILS'}</h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-blue-400 border border-slate-700">
                  {global.jobNum || 'NO-NUM'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{global.contractor || 'DIRECT CUSTOMER'}</p>
            </div>
          </div>

          {/* Phase Tabs (if multiple phases exist) */}
          {phaseKeys.length > 1 && (
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 ml-2">
              <span className="text-[10px] font-bold text-slate-500 px-2 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3" /> Phase:
              </span>
              {phaseKeys.map((pId) => (
                <button
                  key={pId}
                  onClick={() => onSelectPhase(pId)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    activePhaseId === pId
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pId}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Quick search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, sink, color..."
              className="w-44 sm:w-56 pl-8 pr-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Copy All Global */}
          <button
            onClick={copyAllGlobalFields}
            title="Copy all 8 Global Header fields in Title Block format"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-950 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy Title Block</span>
          </button>

          {/* AutoCAD Blocks Modal */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">CAD Blocks</span>
          </button>

          {/* Reset / Start Over */}
          <button
            onClick={onReset}
            title="Load another Moraware HTML file"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Global Information Card Cluster */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Global Title Block Information
              </h3>
              <p className="text-[11px] text-slate-400">
                Click any card to copy for AutoCAD (or press keys [1] - [9])
              </p>
            </div>
          </div>

          <button
            onClick={copyAllGlobalFields}
            className="text-[11px] font-mono text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            Copy All
          </button>
        </div>

        {/* Global Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <DataCard
            shortcutIndex={1}
            label="1. Job Name"
            value={phaseDisplay}
            isImportant
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          <DataCard
            shortcutIndex={2}
            label="2. Job Address"
            value={global.jobAddress}
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          <DataCard
            shortcutIndex={3}
            label="3. Client Phone #"
            value={global.clientPhone}
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          <DataCard
            shortcutIndex={4}
            label="4. Job #"
            value={global.jobNum}
            isImportant
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          <DataCard
            shortcutIndex={5}
            label="5. Contractor"
            value={global.contractor}
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          <DataCard
            shortcutIndex={6}
            label="6. Contractor Contact"
            value={global.contractorContactName}
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          <DataCard
            shortcutIndex={7}
            label="7. Contact Phone"
            value={global.contractorContactPhone}
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          <DataCard
            shortcutIndex={8}
            label="8. Job Type"
            value={global.jobType}
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          <DataCard
            shortcutIndex={9}
            label="9. Templater Drawn"
            value={templaterDrawn}
            isImportant
            subValue={`Template: ${activePhase.templateDate || 'N/A'} ${activePhase.templater || ''} • Drawn: ${settings.drafterInitials}`}
            soundEnabled={settings.soundEnabled}
            onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
          />
          {global.salesperson && (
            <DataCard
              label="Salesperson"
              value={global.salesperson}
              soundEnabled={settings.soundEnabled}
              onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
            />
          )}
        </div>
      </div>

      {/* SECTION 2: Room Specific Area Specifications */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Area Specifications & Rooms ({filteredForms.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                {activePhaseId} — Edge details, sinks, drillings, backsplash specifications
              </p>
            </div>
          </div>
        </div>

        {filteredForms.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800">
            <p className="text-sm font-semibold text-slate-300">No rooms match your filter.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs text-blue-400 hover:underline font-mono"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredForms.map((form, idx) => {
              // Combine Material String (Thickness - Product - Color)
              const materialArr = [form.thickness, form.product, form.color].filter(Boolean);
              const materialStr = materialArr.join(' - ') || 'N/A';

              // Combine Sink Info String
              const sinkSubInfo = [form.sinkType, form.sinkSuppliedBy ? `BY: ${form.sinkSuppliedBy}` : '']
                .filter(Boolean)
                .join(' • ');

              // Combine Faucet Info String
              const faucetSubInfo = [form.faucetModel, form.faucetNotes ? `(${form.faucetNotes})` : '']
                .filter(Boolean)
                .join(' ');

              // Combine Backsplash String
              let backSplashStr = form.backsplashHeight ? `${form.backsplashHeight}"` : 'N/A';
              if (form.splashInfo && form.backsplashHeight) {
                backSplashStr += ` (${form.splashInfo})`;
              }

              // Combine Side Splash String
              let sideSplashStr = form.sideSplash || 'N/A';
              if (form.splashInfo && sideSplashStr !== 'N/A' && sideSplashStr !== 'NO') {
                sideSplashStr += ` (${form.splashInfo})`;
              }

              const roomSummaryText = `[${form.title}]
MATERIAL: ${materialStr}
EDGE: ${form.edgeProfile || 'EASED'}
SINK: ${form.sinkModel || 'N/A'} (${sinkSubInfo || 'UNDERMOUNT'})
FAUCET: ${form.faucetHoles || 'N/A'} ${faucetSubInfo ? `- ${faucetSubInfo}` : ''}
SPLASH: BACK: ${backSplashStr} | SIDE: ${sideSplashStr}
RANGE: ${form.rangeType || 'N/A'}
CABINETS: ${form.cabinets || 'N/A'}
TEAROUT: ${form.tearout || 'NO'}`;

              return (
                <div
                  key={form.id || idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />

                  {/* Room Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 font-mono font-bold text-xs flex items-center justify-center border border-blue-500/30">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono tracking-wide">
                          AREA: {form.title || 'UNKNOWN AREA'}
                        </h4>
                        <p className="text-[11px] font-mono text-blue-300">{materialStr}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => copyRoomBlock(form.title, roomSummaryText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-400" />
                      <span>Copy Area Spec</span>
                    </button>
                  </div>

                  {/* Room Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <DataCard
                      label="Countertop / Room"
                      value={form.title}
                      isImportant
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Material Spec"
                      value={materialStr}
                      isImportant
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Edge Profile"
                      value={form.edgeProfile}
                      isImportant
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Sink Model & Spec"
                      value={form.sinkModel}
                      subValue={sinkSubInfo}
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Faucet Holes / Spread"
                      value={form.faucetHoles}
                      subValue={faucetSubInfo}
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Back Splash"
                      value={backSplashStr}
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Side Splash"
                      value={sideSplashStr}
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Range / Cooktop Type"
                      value={form.rangeType}
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Cabinets"
                      value={form.cabinets}
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                    <DataCard
                      label="Tearout"
                      value={form.tearout}
                      soundEnabled={settings.soundEnabled}
                      onCopy={(lbl, val) => onShowToast(`Copied ${lbl}`, val)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
