import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  FileCheck, 
  FileDown, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { formatBytes } from './FileUploader';

export default function GeneratePackage({
  onGenerate,
  isGenerating,
  hasBlockingIssues,
  blockingSummaryText,
  downloadInfo,
  onDownload,
  t,
  tenderId
}) {
  const dynamicFilename = `${(tenderId || 'Tender').replace(/[/\\?%*:|"<>]/g, '_')}_Package.pdf`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileDown className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800 m-0">
            {t.generateSectionTitle}
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Target: {dynamicFilename}
        </span>
      </div>

      <div className="p-6">
        <p className="text-xs text-slate-500 mb-5">
          {t.coverPageNotice}
        </p>

        {/* Blocking Alert if disabled */}
        {hasBlockingIssues && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <span className="font-bold block mb-0.5">Generate Disabled:</span>
              <span>{blockingSummaryText}</span>
            </div>
          </div>
        )}

        {/* Successful generation download card */}
        {downloadInfo && !hasBlockingIssues && (
          <div className="mb-6 p-5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900 m-0">
                  {t.downloadReady}
                </h4>
                <div className="text-xs text-emerald-700 mt-1 flex flex-wrap items-center gap-3 font-mono">
                  <span>File: <strong>{downloadInfo.filename}</strong></span>
                  <span>•</span>
                  <span>Size: {formatBytes(downloadInfo.size)}</span>
                  <span>•</span>
                  <span>Total Pages: {downloadInfo.pageCount}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={onDownload}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {t.downloadButton}: {downloadInfo.filename}
              </button>
            </div>
          </div>
        )}

        {/* Action Button Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={onGenerate}
            disabled={hasBlockingIssues || isGenerating}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition shadow-sm ${
              hasBlockingIssues || isGenerating
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow cursor-pointer'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.generating}</span>
              </>
            ) : downloadInfo ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.regenerateButton}</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>{t.generateButton}</span>
              </>
            )}
          </button>

          {downloadInfo && (
            <button
              type="button"
              onClick={onDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition"
            >
              <Download className="w-4 h-4 text-slate-500" />
              {t.downloadAgain}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
