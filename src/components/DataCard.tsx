import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { sound } from '../utils/sound';

interface DataCardProps {
  label: string;
  value: string;
  shortcutIndex?: number;
  subValue?: string;
  isImportant?: boolean;
  soundEnabled?: boolean;
  onCopy?: (label: string, text: string) => void;
}

export const DataCard: React.FC<DataCardProps> = ({
  label,
  value,
  shortcutIndex,
  subValue,
  isImportant = false,
  soundEnabled = true,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  const displayValue = value || 'N/A';
  const isEmpty = !value || value === 'N/A' || value === 'NO';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clean value for clipboard (remove HTML or excessive breaks)
    const cleanText = (value || 'N/A').replace(/\s+/g, ' ').trim();
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cleanText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = cleanText;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      sound.playCopy(soundEnabled);
      setCopied(true);
      if (onCopy) onCopy(label, cleanText);

      setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      // Fallback handled
    }
  };

  return (
    <div
      onClick={handleCopy}
      title="Click to copy for AutoCAD"
      className={`group relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
        copied
          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-900/20'
          : isImportant
          ? 'bg-slate-800/90 hover:bg-slate-800 border-blue-500/30 hover:border-blue-400/70 shadow-sm'
          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-blue-400/60 shadow-sm'
      }`}
    >
      {/* Top row: Label & Shortcut / Copy icon */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {shortcutIndex !== undefined && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-mono font-bold bg-slate-700/80 text-blue-400 border border-slate-600/60">
              {shortcutIndex}
            </span>
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {label}
          </span>
        </div>

        <button
          type="button"
          aria-label={`Copy ${label}`}
          className={`p-1 rounded-md transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Value */}
      <div className="min-w-0">
        <p
          className={`font-mono text-xs font-semibold leading-relaxed tracking-wide uppercase break-words ${
            isEmpty
              ? 'text-slate-400 italic'
              : copied
              ? 'text-emerald-300'
              : isImportant
              ? 'text-blue-200'
              : 'text-slate-200'
          }`}
        >
          {displayValue}
        </p>

        {subValue && (
          <p className="text-[10px] text-slate-300 font-mono mt-1 pt-1 border-t border-slate-700/50 leading-tight">
            {subValue}
          </p>
        )}
      </div>

      {/* Copied Feedback indicator pill */}
      {copied && (
        <span className="absolute bottom-1 right-2 text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
          COPIED!
        </span>
      )}
    </div>
  );
};
