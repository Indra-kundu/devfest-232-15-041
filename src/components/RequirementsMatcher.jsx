import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MinusCircle, 
  Sparkles, 
  Trash2, 
  FileCheck 
} from 'lucide-react';

export default function RequirementsMatcher({
  requirements,
  tender,
  files,
  matches,
  expiryDates,
  onMatchChange,
  onExpiryChange,
  onAutoMatch,
  onClearMatches,
  statuses,
  t,
  lang
}) {
  // Find which file IDs are already matched to any requirement
  // and which requirement they are matched to
  const fileToReqMap = {};
  Object.entries(matches).forEach(([reqId, fileId]) => {
    if (fileId) {
      fileToReqMap[fileId] = reqId;
    }
  });

  // Find set of content hashes that are already used by a matched file
  const matchedContentHashes = new Set();
  Object.values(matches).forEach((fId) => {
    const matchedF = files.find(f => f.id === fId);
    if (matchedF?.hash) {
      matchedContentHashes.add(matchedF.hash);
    }
  });

  const getStatusBadge = (statusObj) => {
    switch (statusObj.code) {
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t.status_OK}
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            {t.status_MISSING}
          </span>
        );
      case 'EXPIRY_DATE_NEEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {t.status_EXPIRY_DATE_NEEDED}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            {t.status_EXPIRED}
          </span>
        );
      case 'NOT_PROVIDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-300">
            <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
            {t.status_NOT_PROVIDED}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800 m-0">
              {t.matchingSectionTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.matchingSectionSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <button
              type="button"
              onClick={onAutoMatch}
              title={t.autoMatchTooltip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              {t.autoMatchButton}
            </button>
          )}
          {Object.keys(matches).length > 0 && (
            <button
              type="button"
              onClick={onClearMatches}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.clearMatchesButton}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-10 text-center">{t.colOrder}</th>
              <th className="py-3 px-4 min-w-[200px]">{t.colRequirement}</th>
              <th className="py-3 px-3 w-28">{t.colType}</th>
              <th className="py-3 px-3 min-w-[240px]">{t.colMatchedFile}</th>
              <th className="py-3 px-3 min-w-[190px]">{t.colExpiryDate}</th>
              <th className="py-3 px-4 min-w-[160px] text-right">{t.colDocStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {requirements.map((req) => {
              const currentFileId = matches[req.id] || '';
              const matchedFile = files.find(f => f.id === currentFileId);
              const expiryDate = expiryDates[req.id] || '';
              const statusObj = statuses[req.id] || { code: 'MISSING', isBlocking: req.mandatory };
              const docTitle = lang === 'bn' ? (req.title_bn || req.title_en) : req.title_en;

              return (
                <tr 
                  key={req.id} 
                  className={`hover:bg-slate-50/70 transition-colors ${
                    statusObj.code === 'OK' ? 'bg-emerald-50/15' : 
                    statusObj.isBlocking ? 'bg-red-50/10' : ''
                  }`}
                >
                  {/* Order */}
                  <td className="py-3.5 px-3 text-center font-bold text-slate-500 font-mono">
                    {req.order}
                  </td>

                  {/* Requirement Name */}
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 text-sm">
                        {docTitle}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {req.id} {lang === 'bn' && req.title_en ? `(${req.title_en})` : ''}
                      </span>
                    </div>
                  </td>

                  {/* Mandatory / Optional */}
                  <td className="py-3.5 px-3">
                    {req.mandatory ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {t.mandatoryDocs}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {t.optionalDocs}
                      </span>
                    )}
                  </td>

                  {/* Matched File Dropdown */}
                  <td className="py-3.5 px-3">
                    <select
                      value={currentFileId}
                      onChange={(e) => onMatchChange(req.id, e.target.value)}
                      className={`w-full max-w-sm rounded-lg text-xs font-medium border py-1.5 px-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        currentFileId
                          ? 'border-blue-400 bg-blue-50/30 text-slate-900'
                          : 'border-slate-300 bg-white text-slate-500'
                      }`}
                    >
                      <option value="">{t.selectFilePlaceholder}</option>
                      {currentFileId && (
                        <option value="__unmatch__" className="text-red-600 font-medium">
                          {t.unmatchOption}
                        </option>
                      )}
                      {files.map((file) => {
                        const isAssignedToOther = fileToReqMap[file.id] && fileToReqMap[file.id] !== req.id;
                        
                        // Check if file is duplicate of another already matched file
                        const isDuplicateOfMatched = file.isDuplicate && 
                          file.hash && 
                          matchedContentHashes.has(file.hash) && 
                          (!matchedFile || matchedFile.hash !== file.hash);

                        const isDisabled = isAssignedToOther || isDuplicateOfMatched;

                        let label = file.name;
                        if (file.pageCount) {
                          label += ` (${file.pageCount} ${file.pageCount === 1 ? t.pageCountSingle : t.pagesCount})`;
                        }
                        if (isAssignedToOther) {
                          label += ` — ${t.alreadyMatchedTo}`;
                        } else if (isDuplicateOfMatched) {
                          label += ` — ${t.duplicateFileWarning}`;
                        }

                        return (
                          <option
                            key={file.id}
                            value={file.id}
                            disabled={isDisabled}
                            className={isDisabled ? 'text-slate-400 bg-slate-50' : 'text-slate-900'}
                          >
                            {label}
                          </option>
                        );
                      })}
                    </select>

                    {matchedFile && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-500">
                          {matchedFile.pageCount} {matchedFile.pageCount === 1 ? t.pageCountSingle : t.pagesCount}
                        </span>
                        {matchedFile.isDuplicate && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            {t.duplicateOf} {matchedFile.duplicateOf}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onMatchChange(req.id, '')}
                          className="text-[11px] text-red-500 hover:text-red-700 underline ml-1"
                        >
                          {t.removeFile}
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Expiry Date Input */}
                  <td className="py-3.5 px-3">
                    {req.has_expiry ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => onExpiryChange(req.id, e.target.value)}
                            disabled={!currentFileId}
                            className={`rounded-md text-xs border py-1 px-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                              !currentFileId 
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : expiryDate
                                  ? (statusObj.code === 'EXPIRED' ? 'border-red-400 bg-red-50 text-red-900' : 'border-emerald-400 bg-emerald-50 text-emerald-900')
                                  : 'border-amber-400 bg-amber-50 text-amber-900'
                            }`}
                          />
                        </div>
                        {req.has_expiry && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            {t.requiredExpiryBadge} (Deadline: {tender.submission_deadline})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        {t.noExpiryNeeded}
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(statusObj)}
                      {statusObj.code === 'EXPIRED' && (
                        <span className="text-[10px] text-red-600 font-medium">
                          &lt; {tender.submission_deadline}
                        </span>
                      )}
                      {statusObj.code === 'OK' && req.has_expiry && expiryDate && (
                        <span className="text-[10px] text-emerald-600 font-medium">
                          &ge; {tender.submission_deadline}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
