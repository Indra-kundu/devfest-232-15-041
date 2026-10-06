import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import TenderInfoCard from './components/TenderInfoCard';
import FileUploader from './components/FileUploader';
import RequirementsMatcher from './components/RequirementsMatcher';
import ValidationSummary from './components/ValidationSummary';
import GeneratePackage from './components/GeneratePackage';
import { translations } from './utils/translations';
import { computeSHA256 } from './utils/crypto';
import { readPdfInfo, generateTenderPackage } from './utils/pdfService';

export default function App() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('tender_app_lang') || 'en';
  });

  const t = translations[lang] || translations.en;

  useEffect(() => {
    localStorage.setItem('tender_app_lang', lang);
  }, [lang]);

  // Tender requirements state
  const [tenderData, setTenderData] = useState(null);
  const [jsonError, setJsonError] = useState(null);

  // Uploaded files state: list of { id, file, name, size, pageCount, hash, isDuplicate, duplicateOf, arrayBuffer }
  const [files, setFiles] = useState([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);

  // Matching state: reqId -> fileId
  const [matches, setMatches] = useState({});

  // Expiry dates state: reqId -> "YYYY-MM-DD"
  const [expiryDates, setExpiryDates] = useState({});

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);

  // -------------------------------------------------------------
  // STEP 1 & 2: Load and Parse requirements.json
  // -------------------------------------------------------------
  const handleLoadRequirements = async (file) => {
    setJsonError(null);
    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(t.errInvalidJson);
      }

      if (!parsed || !parsed.tender || !Array.isArray(parsed.requirements)) {
        throw new Error(t.errMissingFields);
      }

      const { tender, requirements } = parsed;
      if (!tender.tender_id || !tender.submission_deadline) {
        throw new Error('JSON is missing tender_id or submission_deadline.');
      }

      // Sort requirements by "order" ascending
      const sortedRequirements = [...requirements].sort((a, b) => (a.order || 0) - (b.order || 0));

      setTenderData({
        tender,
        requirements: sortedRequirements
      });

      // Reset previous matches and expiry dates when new requirements loaded
      setMatches({});
      setExpiryDates({});
      setDownloadInfo(null);
    } catch (err) {
      console.error('Error loading requirements.json:', err);
      setJsonError(err.message || 'Failed to read requirements.json');
    }
  };

  // -------------------------------------------------------------
  // STEP 3 & 6: Upload PDF Files & Duplicate Detection (SHA-256)
  // -------------------------------------------------------------
  const handleUploadFiles = async (newFileList) => {
    setIsProcessingFiles(true);
    const errors = [];
    const MAX_FILES = 30;
    const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB

    let currentTotalBytes = files.reduce((sum, f) => sum + f.size, 0);
    let currentTotalCount = files.length;

    const acceptedFiles = [];

    for (const file of newFileList) {
      // 1. Check if PDF
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        errors.push(`"${file.name}" ${t.errNonPdfFile}`);
        continue;
      }

      // 2. Check max file count
      if (currentTotalCount >= MAX_FILES) {
        errors.push(t.errMaxFilesExceeded);
        break;
      }

      // 3. Check total size
      if (currentTotalBytes + file.size > MAX_TOTAL_BYTES) {
        errors.push(`"${file.name}": ${t.errMaxSizeExceeded}`);
        continue;
      }

      try {
        // Read page count and buffer in browser
        const { pageCount, arrayBuffer } = await readPdfInfo(file);
        // Compute SHA-256 hash of content
        const hash = await computeSHA256(arrayBuffer);

        acceptedFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          pageCount,
          hash,
          arrayBuffer,
          isDuplicate: false,
          duplicateOf: null
        });

        currentTotalBytes += file.size;
        currentTotalCount += 1;
      } catch (err) {
        errors.push(`"${file.name}": ${t.errCorruptPdf} (${err.message})`);
      }
    }

    if (errors.length > 0) {
      setUploadErrors(prev => [...prev, ...errors]);
    }

    if (acceptedFiles.length > 0) {
      // Re-evaluate duplicates across all files
      const combined = [...files, ...acceptedFiles];
      const processed = calculateDuplicateStatuses(combined);
      setFiles(processed);
      setDownloadInfo(null);
    }

    setIsProcessingFiles(false);
  };

  /**
   * Evaluates SHA-256 hash uniqueness across all uploaded files.
   */
  const calculateDuplicateStatuses = (fileList) => {
    const hashToFirstFile = new Map();

    return fileList.map((file) => {
      if (hashToFirstFile.has(file.hash)) {
        const originalFile = hashToFirstFile.get(file.hash);
        return {
          ...file,
          isDuplicate: true,
          duplicateOf: originalFile.name
        };
      } else {
        hashToFirstFile.set(file.hash, file);
        return {
          ...file,
          isDuplicate: false,
          duplicateOf: null
        };
      }
    });
  };

  const handleRemoveFile = (fileId) => {
    const remaining = files.filter(f => f.id !== fileId);
    const updated = calculateDuplicateStatuses(remaining);
    setFiles(updated);

    // If removed file was matched, unmatch it
    setMatches(prev => {
      const nextMatches = { ...prev };
      Object.keys(nextMatches).forEach(reqId => {
        if (nextMatches[reqId] === fileId) {
          delete nextMatches[reqId];
        }
      });
      return nextMatches;
    });
    setDownloadInfo(null);
  };

  const handleClearAllFiles = () => {
    setFiles([]);
    setMatches({});
    setExpiryDates({});
    setDownloadInfo(null);
  };

  const handleDismissError = (index) => {
    setUploadErrors(prev => prev.filter((_, i) => i !== index));
  };

  // -------------------------------------------------------------
  // STEP 4: Document Matching & Handlers
  // -------------------------------------------------------------
  const handleMatchChange = (reqId, fileId) => {
    setMatches(prev => {
      const next = { ...prev };
      if (!fileId || fileId === '__unmatch__') {
        delete next[reqId];
      } else {
        // Enforce 1-to-1 match: if fileId was matched to another req, remove that old match
        Object.keys(next).forEach(r => {
          if (next[r] === fileId) {
            delete next[r];
          }
        });
        next[reqId] = fileId;
      }
      return next;
    });
    setDownloadInfo(null);
  };

  const handleExpiryChange = (reqId, dateStr) => {
    setExpiryDates(prev => ({
      ...prev,
      [reqId]: dateStr
    }));
    setDownloadInfo(null);
  };

  const handleClearMatches = () => {
    setMatches({});
    setDownloadInfo(null);
  };

  // -------------------------------------------------------------
  // Smart Auto-Match Helper
  // -------------------------------------------------------------
  const handleAutoMatch = () => {
    if (!tenderData || !tenderData.requirements || files.length === 0) return;

    const newMatches = { ...matches };
    const usedFileIds = new Set(Object.values(newMatches));

    // Prefer non-duplicate files
    const availableFiles = files.filter(f => !usedFileIds.has(f.id) && !f.isDuplicate);

    // Normalize string for keyword matching
    const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);

    for (const req of tenderData.requirements) {
      if (newMatches[req.id]) continue; // Already matched

      const reqWords = [
        ...normalize(req.title_en),
        ...normalize(req.title_bn),
        req.id.toLowerCase()
      ];

      let bestFile = null;
      let maxScore = 0;

      for (const file of availableFiles) {
        if (usedFileIds.has(file.id)) continue;

        const fileWords = normalize(file.name);
        let score = 0;

        for (const rw of reqWords) {
          if (rw.length > 2 && fileWords.some(fw => fw.includes(rw) || rw.includes(fw))) {
            score += rw.length;
          }
        }

        // Special tender keyword boosts
        if (req.id === 'R01' && file.name.includes('trade_license')) score += 10;
        if (req.id === 'R02' && file.name.includes('tin')) score += 10;
        if (req.id === 'R03' && file.name.includes('vat')) score += 10;
        if (req.id === 'R04' && file.name.includes('solvency')) score += 10;
        if (req.id === 'R05' && file.name.includes('experience')) score += 10;
        if (req.id === 'R08' && file.name.includes('technical')) score += 10;
        if (req.id === 'R09' && file.name.includes('financial')) score += 10;

        if (score > maxScore) {
          maxScore = score;
          bestFile = file;
        }
      }

      if (bestFile && maxScore > 2) {
        newMatches[req.id] = bestFile.id;
        usedFileIds.add(bestFile.id);
      }
    }

    setMatches(newMatches);
    setDownloadInfo(null);
  };

  // -------------------------------------------------------------
  // STEP 7 & 8: Calculate Document Statuses & Blocking Logic
  // -------------------------------------------------------------
  const { statuses, summary, blockingIssues, blockingSummaryText } = useMemo(() => {
    if (!tenderData || !tenderData.requirements) {
      return {
        statuses: {},
        summary: { total: 0, mandatoryTotal: 0, ok: 0, missing: 0, expired: 0, expiryNeeded: 0, optionalNotProvided: 0 },
        blockingIssues: [],
        blockingSummaryText: ''
      };
    }

    const { tender, requirements } = tenderData;
    const deadline = tender.submission_deadline;

    const statusesMap = {};
    const issues = [];

    let countOk = 0;
    let countMissing = 0;
    let countExpired = 0;
    let countExpiryNeeded = 0;
    let countOptionalNotProvided = 0;

    // Check duplicate content matched across requirements
    const matchedHashes = new Map(); // hash -> reqId

    for (const req of requirements) {
      const fileId = matches[req.id];
      const matchedFile = files.find(f => f.id === fileId);
      const expiry = expiryDates[req.id];
      const reqTitle = lang === 'bn' ? (req.title_bn || req.title_en) : req.title_en;

      if (!matchedFile) {
        if (req.mandatory) {
          statusesMap[req.id] = { code: 'MISSING', isBlocking: true };
          countMissing++;
          issues.push(
            lang === 'bn' 
              ? `বাধ্যতামূলক নথি অনুপস্থিত: "${reqTitle}" (Order ${req.order})`
              : `Missing required document: "${reqTitle}" (Order ${req.order})`
          );
        } else {
          statusesMap[req.id] = { code: 'NOT_PROVIDED', isBlocking: false };
          countOptionalNotProvided++;
        }
        continue;
      }

      // Check if duplicate content is used in multiple places
      if (matchedFile.hash) {
        if (matchedHashes.has(matchedFile.hash)) {
          const prevReqId = matchedHashes.get(matchedFile.hash);
          issues.push(
            lang === 'bn'
              ? `ডুপ্লিকেট ফাইল কনটেন্ট: "${matchedFile.name}" একাধিক নথিতে যুক্ত করা যাবে না (${req.id} এবং ${prevReqId})`
              : `Duplicate file content: "${matchedFile.name}" cannot be used for multiple requirements (${req.id} and ${prevReqId})`
          );
        } else {
          matchedHashes.set(matchedFile.hash, req.id);
        }
      }

      if (req.has_expiry) {
        if (!expiry || !expiry.trim()) {
          statusesMap[req.id] = { code: 'EXPIRY_DATE_NEEDED', isBlocking: true };
          countExpiryNeeded++;
          issues.push(
            lang === 'bn'
              ? `মেয়াদ উত্তীর্ণের তারিখ প্রয়োজন: "${reqTitle}"`
              : `Expiry date required for: "${reqTitle}"`
          );
        } else if (expiry < deadline) {
          statusesMap[req.id] = { code: 'EXPIRED', isBlocking: true };
          countExpired++;
          issues.push(
            lang === 'bn'
              ? `নথির মেয়াদ উত্তীর্ণ (${expiry}): "${reqTitle}" (জমা দেওয়ার শেষ সময়: ${deadline})`
              : `Document expired on ${expiry}: "${reqTitle}" (Submission deadline: ${deadline})`
          );
        } else {
          statusesMap[req.id] = { code: 'OK', isBlocking: false };
          countOk++;
        }
      } else {
        statusesMap[req.id] = { code: 'OK', isBlocking: false };
        countOk++;
      }
    }

    const mandatoryTotal = requirements.filter(r => r.mandatory).length;

    let summaryText = '';
    if (issues.length > 0) {
      const parts = [];
      if (countMissing > 0) parts.push(`${countMissing} required document(s) missing`);
      if (countExpired > 0) parts.push(`${countExpired} document(s) expired`);
      if (countExpiryNeeded > 0) parts.push(`${countExpiryNeeded} document(s) missing expiry date`);
      if (issues.some(i => i.includes('Duplicate'))) parts.push(`duplicate document assigned`);
      summaryText = `Package cannot be generated because: ${parts.join(', ')}.`;
    }

    return {
      statuses: statusesMap,
      summary: {
        total: requirements.length,
        mandatoryTotal,
        ok: countOk,
        missing: countMissing,
        expired: countExpired,
        expiryNeeded: countExpiryNeeded,
        optionalNotProvided: countOptionalNotProvided
      },
      blockingIssues: issues,
      blockingSummaryText: summaryText
    };
  }, [tenderData, matches, expiryDates, files, lang]);

  const hasBlockingIssues = !tenderData || blockingIssues.length > 0;

  // -------------------------------------------------------------
  // STEP 9 & 10: PDF Package Generation & Dynamic Download
  // -------------------------------------------------------------
  const handleGeneratePackage = async () => {
    if (hasBlockingIssues) return;

    setIsGenerating(true);
    try {
      const { pdfBytes, pageCount } = await generateTenderPackage({
        tender: tenderData.tender,
        requirements: tenderData.requirements,
        matches,
        files,
        expiryDates
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const safeTenderId = (tenderData.tender.tender_id || 'Tender').replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `${safeTenderId}_Package.pdf`;

      setDownloadInfo({
        url,
        blob,
        filename,
        size: blob.size,
        pageCount
      });
    } catch (err) {
      console.error('Failed to generate PDF package:', err);
      alert(`Package Generation Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!downloadInfo) return;
    const link = document.createElement('a');
    link.href = downloadInfo.url;
    link.download = downloadInfo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Header lang={lang} setLang={setLang} t={t} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SECTION 1: Tender Information */}
        <section id="tender-info">
          <TenderInfoCard
            tenderData={tenderData}
            onLoadRequirements={handleLoadRequirements}
            error={jsonError}
            t={t}
            lang={lang}
          />
        </section>

        {tenderData && (
          <>
            {/* SECTION 2: Upload Documents */}
            <section id="upload-docs">
              <FileUploader
                files={files}
                onUploadFiles={handleUploadFiles}
                onRemoveFile={handleRemoveFile}
                onClearAllFiles={handleClearAllFiles}
                isProcessing={isProcessingFiles}
                uploadErrors={uploadErrors}
                onDismissError={handleDismissError}
                t={t}
              />
            </section>

            {/* SECTION 3: Document Matching */}
            <section id="document-matching">
              <RequirementsMatcher
                requirements={tenderData.requirements}
                tender={tenderData.tender}
                files={files}
                matches={matches}
                expiryDates={expiryDates}
                onMatchChange={handleMatchChange}
                onExpiryChange={handleExpiryChange}
                onAutoMatch={handleAutoMatch}
                onClearMatches={handleClearMatches}
                statuses={statuses}
                t={t}
                lang={lang}
              />
            </section>

            {/* SECTION 4: Validation Summary */}
            <section id="validation-summary">
              <ValidationSummary
                summary={summary}
                blockingIssues={blockingIssues}
                t={t}
              />
            </section>

            {/* SECTION 5: Generate Package */}
            <section id="generate-package">
              <GeneratePackage
                onGenerate={handleGeneratePackage}
                isGenerating={isGenerating}
                hasBlockingIssues={hasBlockingIssues}
                blockingSummaryText={blockingSummaryText}
                downloadInfo={downloadInfo}
                onDownload={handleDownload}
                t={t}
                tenderId={tenderData.tender.tender_id}
              />
            </section>
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Tender Document Package Builder • AI DevFest Contest</span>
          <span>100% Client-Side In-Browser Processing (No Uploads)</span>
        </div>
      </footer>
    </div>
  );
}
