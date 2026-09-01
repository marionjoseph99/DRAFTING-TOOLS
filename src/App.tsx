import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ExtractorView } from './components/ExtractorView';
import { QAChecker } from './components/QAChecker';
import { PhaseModal } from './components/PhaseModal';
import { PasteHtmlModal } from './components/PasteHtmlModal';
import { SettingsModal } from './components/SettingsModal';
import { AutoCADExportModal } from './components/AutoCADExportModal';
import { KeyboardGuideModal } from './components/KeyboardGuideModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ParsedMorawareData, DrafterSettings } from './types';
import { parseMorawareHTML, formatTemplaterDrawn } from './utils/morawareParser';
import {
  SAMPLE_HTML_RESIDENTIAL,
  SAMPLE_HTML_MULTIPHASE,
  MOCK_MISMATCH_PDF,
} from './utils/sampleData';
import { sound } from './utils/sound';

const DEFAULT_SETTINGS: DrafterSettings = {
  drafterInitials: 'MP',
  soundEnabled: true,
  autoUppercase: true,
  compactCards: false,
  dateFormat: 'MM/DD/YYYY',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'extract' | 'qa'>('extract');
  const [parsedHtmlData, setParsedHtmlData] = useState<ParsedMorawareData | null>(null);
  const [targetPhaseId, setTargetPhaseId] = useState<string>('DEFAULT PHASE');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Load settings from localStorage
  const [settings, setSettings] = useState<DrafterSettings>(() => {
    try {
      const saved = localStorage.getItem('kgs_drafter_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = (newSettings: DrafterSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('kgs_drafter_settings', JSON.stringify(newSettings));
    } catch {
      // Ignore
    }
  };

  const showToast = useCallback(
    (title: string, description?: string, type: 'success' | 'error' | 'info' | 'copy' = 'copy') => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev.slice(-4), { id, title, description, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handle uploaded or pasted Moraware HTML
  const handleMorawareHtml = useCallback(
    (htmlString: string, fileName?: string) => {
      try {
        const parsed = parseMorawareHTML(htmlString, fileName);
        setParsedHtmlData(parsed);

        const phaseKeys = Object.keys(parsed.phases);
        if (phaseKeys.length > 1) {
          setShowPhaseModal(true);
        } else if (phaseKeys.length === 1) {
          setTargetPhaseId(phaseKeys[0]);
        } else {
          setTargetPhaseId('DEFAULT PHASE');
        }

        showToast(
          'Moraware Data Extracted',
          `${parsed.global.jobName || 'Job'} (${parsed.global.jobNum || 'No #'})`,
          'success'
        );
      } catch (err) {
        showToast('Parse Error', 'Could not parse this Moraware file.', 'error');
      }
    },
    [showToast]
  );

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      showToast('Invalid File Type', 'Please upload a Moraware .html file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handleMorawareHtml(text, file.name);
    };
    reader.readAsText(file);
  };

  // Load Demonstration Samples
  const handleLoadSample = (sampleType: 'residential' | 'multiphase' | 'mismatch') => {
    if (sampleType === 'residential') {
      handleMorawareHtml(SAMPLE_HTML_RESIDENTIAL, 'Henderson_Residence_Moraware.html');
      setTargetPhaseId('PH1');
      setActiveTab('extract');
      showToast('Loaded Residential Preset', 'Silestone Calacatta Gold Kitchen (PH1)', 'info');
    } else if (sampleType === 'multiphase') {
      handleMorawareHtml(SAMPLE_HTML_MULTIPHASE, 'Pinnacle_Towers_Commercial.html');
      setTargetPhaseId('PH1');
      setActiveTab('extract');
      showToast('Loaded Multi-Phase Preset', 'Pinnacle Towers PH1 & PH2', 'info');
    } else if (sampleType === 'mismatch') {
      handleMorawareHtml(SAMPLE_HTML_RESIDENTIAL, 'Henderson_Residence_Moraware.html');
      setTargetPhaseId('PH1');
      setActiveTab('qa');
      showToast('Loaded QA Mismatch Scenario', 'Switching to QA Inspector to view discrepancies', 'info');
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      // Shortcut 1: Ctrl+V or Cmd+V to paste HTML anywhere
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        try {
          const clipboardText = await navigator.clipboard.readText();
          if (clipboardText && (clipboardText.includes('<table') || clipboardText.includes('html') || clipboardText.includes('Job Detail'))) {
            e.preventDefault();
            handleMorawareHtml(clipboardText, 'Pasted_Source.html');
          }
        } catch {
          // Clipboard read permission might not be active, paste modal is available
        }
        return;
      }

      // Shortcut 2: 1-9 number keys to copy global fields
      if (parsedHtmlData && !e.ctrlKey && !e.altKey && !e.metaKey && /^[1-9]$/.test(e.key)) {
        const keyNum = parseInt(e.key, 10);
        const g = parsedHtmlData.global;
        const p = parsedHtmlData.phases[targetPhaseId] || { phaseId: targetPhaseId, forms: [], templater: '', templateDate: '' };
        
        let phaseDisplay = g.jobName;
        if (targetPhaseId && targetPhaseId.toUpperCase() !== 'PH1' && !targetPhaseId.toUpperCase().includes('DEFAULT')) {
          phaseDisplay += ` - ${targetPhaseId}`;
        }

        const templaterDrawn = formatTemplaterDrawn(p, settings.drafterInitials, settings.dateFormat);

        const fieldMap: Record<number, { label: string; val: string }> = {
          1: { label: '1. Job Name', val: phaseDisplay },
          2: { label: '2. Job Address', val: g.jobAddress },
          3: { label: '3. Client Phone', val: g.clientPhone },
          4: { label: '4. Job Number', val: g.jobNum },
          5: { label: '5. Contractor', val: g.contractor },
          6: { label: '6. Contractor Contact', val: g.contractorContactName },
          7: { label: '7. Contact Phone', val: g.contractorContactPhone },
          8: { label: '8. Job Type', val: g.jobType },
          9: { label: '9. Templater Drawn', val: templaterDrawn },
        };

        const target = fieldMap[keyNum];
        if (target && target.val) {
          e.preventDefault();
          try {
            await navigator.clipboard.writeText(target.val);
            sound.playCopy(settings.soundEnabled);
            showToast(`Copied [${keyNum}] ${target.label}`, target.val);
          } catch {
            // Handled
          }
        }
      }

      // Shortcut 3: Q / E to switch tabs
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key.toLowerCase() === 'q') {
          setActiveTab('qa');
        } else if (e.key.toLowerCase() === 'e') {
          setActiveTab('extract');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [parsedHtmlData, targetPhaseId, settings, handleMorawareHtml, showToast]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Navigation Topbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onOpenPasteHtml={() => setShowPasteModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
        onLoadSample={handleLoadSample}
        settings={settings}
        parsedData={parsedHtmlData}
      />

      {/* Main Screen Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'extract' ? (
          <ExtractorView
            parsedData={parsedHtmlData}
            activePhaseId={targetPhaseId}
            onSelectPhase={setTargetPhaseId}
            onFileUpload={handleFileUpload}
            onReset={() => {
              setParsedHtmlData(null);
              setTargetPhaseId('DEFAULT PHASE');
            }}
            onOpenPasteModal={() => setShowPasteModal(true)}
            onOpenExportModal={() => setShowExportModal(true)}
            onLoadSample={handleLoadSample}
            settings={settings}
            onShowToast={showToast}
          />
        ) : (
          <QAChecker
            parsedHtmlData={parsedHtmlData}
            targetPhaseId={targetPhaseId}
            onSetParsedHtml={setParsedHtmlData}
            onSetTargetPhase={setTargetPhaseId}
            onOpenPhaseModal={() => setShowPhaseModal(true)}
            onLoadSample={handleLoadSample}
            settings={settings}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <PhaseModal
        isOpen={showPhaseModal}
        onClose={() => setShowPhaseModal(false)}
        parsedData={parsedHtmlData}
        onSelectPhase={(pId) => {
          setTargetPhaseId(pId);
          setShowPhaseModal(false);
        }}
      />

      <PasteHtmlModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onParse={(html) => handleMorawareHtml(html, 'Pasted_Source.html')}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <AutoCADExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        parsedData={parsedHtmlData}
        activePhaseId={targetPhaseId}
        settings={settings}
        onShowToast={showToast}
      />

      <KeyboardGuideModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
