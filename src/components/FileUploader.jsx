import { useRef } from 'react';
import { 
  AlertTriangle, 
  Copy, 
  FileCheck, 
  FileText, 
  Loader2, 
  Trash2, 
  UploadCloud, 
  X 
} from 'lucide-react';
import { formatBytes } from '../utils/format';


export default function FileUploader({
  files,
  onUploadFiles,
  onRemoveFile,
  onClearAllFiles,
  isProcessing,
  uploadErrors,
  onDismissError,
  t
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800 m-0">
              {t.uploadSectionTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.uploadSectionSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
            {t.uploadedFilesCount}: <strong className="text-slate-900">{files.length} / 30</strong>
          </div>
          <div className="text-xs text-slate-600 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
            {t.totalSize}: <strong className="text-slate-900">{formatBytes(totalBytes)} / 50 MB</strong>
          </div>
          {files.length > 0 && (
            <button
              type="button"
              onClick={onClearAllFiles}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t.removeAllFiles}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Error Messages banner */}
        {uploadErrors && uploadErrors.length > 0 && (
          <div className="mb-5 space-y-2">
            {uploadErrors.map((err, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span>{err}</span>
                </div>
                {onDismissError && (
                  <button
                    type="button"
                    onClick={() => onDismissError(idx)}
                    className="text-red-400 hover:text-red-700 p-0.5 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center text-center group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>
          <button
            type="button"
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow hover:bg-blue-700 transition"
          >
            {isProcessing ? t.readingPdf : t.selectPdfFiles}
          </button>
          <span className="text-xs text-slate-400 mt-2">
            {t.dragPdfHere}
          </span>
        </div>

        {/* Uploaded Files Table */}
        {files.length > 0 && (
          <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">{t.colFilename}</th>
                    <th className="py-2.5 px-3 w-24">{t.colSize}</th>
                    <th className="py-2.5 px-3 w-24">{t.colPages}</th>
                    <th className="py-2.5 px-3">{t.colStatus}</th>
                    <th className="py-2.5 px-3 w-20 text-right">{t.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {files.map((file) => (
                    <tr 
                      key={file.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${file.isDuplicate ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="py-2.5 px-4 font-medium text-slate-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate max-w-xs md:max-w-md" title={file.name}>
                          {file.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">
                        {formatBytes(file.size)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-semibold font-mono">
                        {file.pageCount !== undefined ? (
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono">
                            {file.pageCount} {file.pageCount === 1 ? t.pageCountSingle : t.pagesCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">...</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {file.isDuplicate ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200"
                            title={`SHA-256 duplicate of ${file.duplicateOf}`}
                          >
                            <Copy className="w-3 h-3 text-amber-600" />
                            {t.duplicateBadge}: {t.duplicateOf} {file.duplicateOf}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            {t.originalFile}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveFile(file.id)}
                          title={t.removeFile}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
