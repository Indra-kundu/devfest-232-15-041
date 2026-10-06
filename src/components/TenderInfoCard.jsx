import React, { useRef } from 'react';
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  FileCode, 
  FileQuestion, 
  FolderCheck, 
  RotateCcw, 
  Tag, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export default function TenderInfoCard({ 
  tenderData, 
  onLoadRequirements, 
  error, 
  t, 
  lang 
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadRequirements(file);
      // Reset input value so same file can be reloaded if needed
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onLoadRequirements(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // If no requirements loaded yet, show upload dropzone
  if (!tenderData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="text-center max-w-lg mx-auto">
          <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileCode className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            {t.loadRequirementsPrompt}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Upload the official <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700">requirements.json</code> to load tender rules and required documents.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2 text-left">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition"
            >
              {t.selectJsonFile}
            </button>
            <span className="text-xs text-slate-400 mt-2">
              {t.dragJsonHere}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const { tender, requirements } = tenderData;
  const mandatoryCount = requirements.filter(r => r.mandatory).length;
  const optionalCount = requirements.filter(r => !r.mandatory).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800 m-0">
            {t.tenderDetailsTitle}
          </h2>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.requirementsLoaded}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            {t.replaceRequirements}
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tender ID Card */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.tenderId}</span>
            </div>
            <div className="text-base font-bold text-slate-900 font-mono tracking-tight">
              {tender.tender_id || '—'}
            </div>
          </div>

          {/* Submission Deadline Card */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{t.submissionDeadline}</span>
            </div>
            <div className="text-base font-bold text-amber-700 font-mono">
              {tender.submission_deadline || '—'}
            </div>
          </div>

          {/* Procuring Entity */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.procuringEntity}</span>
            </div>
            <div className="text-sm font-semibold text-slate-800 line-clamp-1" title={tender.procuring_entity}>
              {tender.procuring_entity || '—'}
            </div>
          </div>

          {/* Bidder */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.bidder}</span>
            </div>
            <div className="text-sm font-semibold text-slate-800 line-clamp-1" title={tender.bidder}>
              {tender.bidder || '—'}
            </div>
          </div>
        </div>

        {/* Title & Requirements Count */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500 font-medium">
              {t.tenderTitle}:
            </div>
            <div className="text-sm font-semibold text-slate-900 mt-0.5">
              {tender.title}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
              {t.totalRequirements}: <strong className="text-slate-900">{requirements.length}</strong>
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium border border-blue-100">
              {t.mandatoryDocs}: <strong className="text-blue-900">{mandatoryCount}</strong>
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
              {t.optionalDocs}: <strong className="text-slate-800">{optionalCount}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
