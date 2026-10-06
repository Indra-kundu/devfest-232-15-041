import React from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  MinusCircle, 
  ShieldAlert, 
  ShieldCheck 
} from 'lucide-react';

export default function ValidationSummary({
  summary,
  blockingIssues,
  t
}) {
  const hasBlockingIssues = blockingIssues.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800 m-0">
            {t.summaryTitle}
          </h2>
        </div>

        <div>
          {hasBlockingIssues ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              {blockingIssues.length} Blocking Issue{blockingIssues.length === 1 ? '' : 's'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Ready to Generate
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {/* Total / Mandatory */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wide">
              {t.mandatoryDocs}
            </span>
            <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
              {summary.mandatoryTotal}
            </span>
            <span className="text-[10px] text-slate-400">of {summary.total} total</span>
          </div>

          {/* OK */}
          <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 text-center">
            <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wide flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {t.okCount}
            </span>
            <span className="text-xl font-bold text-emerald-800 font-mono mt-0.5 block">
              {summary.ok}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">Valid</span>
          </div>

          {/* Missing */}
          <div className={`p-3 rounded-lg border text-center ${
            summary.missing > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50/50 border-slate-200'
          }`}>
            <span className={`text-[11px] font-semibold block uppercase tracking-wide flex items-center justify-center gap-1 ${
              summary.missing > 0 ? 'text-red-700' : 'text-slate-500'
            }`}>
              <AlertCircle className="w-3 h-3" />
              {t.missingCount}
            </span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${
              summary.missing > 0 ? 'text-red-800' : 'text-slate-700'
            }`}>
              {summary.missing}
            </span>
            <span className={`text-[10px] font-medium ${summary.missing > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              Blocking
            </span>
          </div>

          {/* Expired */}
          <div className={`p-3 rounded-lg border text-center ${
            summary.expired > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50/50 border-slate-200'
          }`}>
            <span className={`text-[11px] font-semibold block uppercase tracking-wide flex items-center justify-center gap-1 ${
              summary.expired > 0 ? 'text-red-700' : 'text-slate-500'
            }`}>
              <AlertTriangle className="w-3 h-3" />
              {t.expiredCount}
            </span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${
              summary.expired > 0 ? 'text-red-800' : 'text-slate-700'
            }`}>
              {summary.expired}
            </span>
            <span className={`text-[10px] font-medium ${summary.expired > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              Blocking
            </span>
          </div>

          {/* Expiry Needed */}
          <div className={`p-3 rounded-lg border text-center ${
            summary.expiryNeeded > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50/50 border-slate-200'
          }`}>
            <span className={`text-[11px] font-semibold block uppercase tracking-wide flex items-center justify-center gap-1 ${
              summary.expiryNeeded > 0 ? 'text-amber-700' : 'text-slate-500'
            }`}>
              <Clock className="w-3 h-3" />
              {t.expiryNeededCount}
            </span>
            <span className={`text-xl font-bold font-mono mt-0.5 block ${
              summary.expiryNeeded > 0 ? 'text-amber-800' : 'text-slate-700'
            }`}>
              {summary.expiryNeeded}
            </span>
            <span className={`text-[10px] font-medium ${summary.expiryNeeded > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              Blocking
            </span>
          </div>

          {/* Optional Not Provided */}
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-600 block uppercase tracking-wide flex items-center justify-center gap-1">
              <MinusCircle className="w-3 h-3 text-slate-400" />
              {t.optionalNotProvidedCount}
            </span>
            <span className="text-xl font-bold text-slate-700 font-mono mt-0.5 block">
              {summary.optionalNotProvided}
            </span>
            <span className="text-[10px] text-slate-500">Non-blocking</span>
          </div>
        </div>

        {/* Blocking issues list or All Passed message */}
        {hasBlockingIssues ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide mb-1.5">
                  {t.blockingIssuesFound}
                </h3>
                <ul className="space-y-1 text-xs text-rose-800 list-disc list-inside">
                  {blockingIssues.map((issue, idx) => (
                    <li key={idx} className="font-medium">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-emerald-900 m-0">
              {t.allChecksPassed}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
