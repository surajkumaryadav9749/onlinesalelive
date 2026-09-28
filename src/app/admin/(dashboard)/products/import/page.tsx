'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ValidationSummary, ImportExecutionResult } from '@/lib/csv-import';

export default function BulkImportProductsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidationSummary | null>(null);
  const [importResult, setImportResult] = useState<ImportExecutionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'errors'>('all');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid .csv file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5 MB limit');
      return;
    }

    setError('');
    setFile(selectedFile);
    setValidationResult(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (!droppedFile.name.endsWith('.csv')) {
      setError('Please drop a valid .csv file');
      return;
    }

    if (droppedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5 MB limit');
      return;
    }

    setError('');
    setFile(droppedFile);
    setValidationResult(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string);
    };
    reader.readAsText(droppedFile, 'UTF-8');
  };

  const handleValidate = async () => {
    if (!file || !csvContent) {
      setError('Please choose or drop a CSV file first');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const res = await fetch('/api/products/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent, updateExisting }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to validate CSV');
      }

      setValidationResult(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error validating CSV');
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult || !csvContent) return;

    setIsImporting(true);
    setError('');

    try {
      const res = await fetch('/api/products/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent, updateExisting }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to execute import');
      }

      setImportResult(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error importing products');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadErrorCsv = () => {
    if (!validationResult && !importResult) return;
    const errorsToExport = importResult?.errors || validationResult?.errors || [];
    if (errorsToExport.length === 0) return;

    let csvContent = 'row,message\n';
    for (const err of errorsToExport) {
      const escaped = `"${err.message.replace(/"/g, '""')}"`;
      csvContent += `${err.row},${escaped}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import_errors_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setCsvContent('');
    setValidationResult(null);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredPreview = (validationResult?.preview || []).filter((item) => {
    if (previewFilter === 'valid') return item.status === 'valid' || item.status === 'will_update';
    if (previewFilter === 'errors') return item.status === 'invalid' || item.status === 'duplicate';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mx-6 -mt-6 rounded-b-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            title="Back to products list"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Bulk Import Products
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create and update products in bulk via CSV with automatic duplicate protection and affiliate safety.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/products/import/template"
            download="products_template.csv"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors shadow-2xs"
          >
            <Download size={14} />
            <span>Download CSV Template</span>
          </a>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                Step 1
              </span>
              <FileText size={18} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Download Template</h3>
            <p className="text-xs text-slate-500 mt-1">
              Start with our pre-configured CSV template containing all 28 supported fields and an example Amazon row.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <a
              href="/api/products/import/template"
              download="products_template.csv"
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              <Download size={14} />
              <span>Get CSV Template</span>
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                Step 2
              </span>
              <HelpCircle size={18} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Prepare Your Data</h3>
            <p className="text-xs text-slate-500 mt-1">
              Fill product rows. Category must match an existing category name or slug. Affiliate URLs are optional.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <span>{showInstructions ? 'Hide Instructions' : 'View Field Guide'}</span>
              {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                Step 3
              </span>
              <UploadCloud size={18} className="text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Upload & Validate</h3>
            <p className="text-xs text-slate-500 mt-1">
              Choose your prepared CSV file. We validate all rows before writing anything to the production database.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium text-center">
              Max 5 MB • Max 500 rows
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Field Guide */}
      {showInstructions && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-4">
          <h4 className="font-bold text-sm text-slate-900">CSV Column Specifications & Instructions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="font-semibold text-slate-900">Mandatory Fields:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong className="text-slate-900">name</strong>: Full product title.</li>
                <li><strong className="text-slate-900">category</strong>: Must match an existing category name or slug (e.g. <em>Electronics</em>, <em>Accessories</em>). Missing categories will fail validation to prevent duplicates.</li>
                <li><strong className="text-slate-900">price</strong>: Deal or current price (₹). Must be a non-negative number.</li>
                <li><strong className="text-slate-900">originalPrice</strong>: MRP or list price (₹). Used to auto-calculate discount if discountPercent is left empty.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-900">Marketplace & Affiliate Rules:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong className="text-slate-900">affiliateUrl is optional</strong>: Leave blank during initial bulk import. Real Amazon SiteStripe affiliate URLs can be added later via Admin Edit.</li>
                <li><strong className="text-slate-900">affiliateEnabled</strong>: Defaults to false when affiliateUrl is blank.</li>
                <li><strong className="text-slate-900">standardUrl</strong>: Validated against authorized partner domains (e.g. <em>amazon.in</em>). Auto-generated from ASIN if omitted for Amazon.</li>
                <li><strong className="text-slate-900">asin</strong>: Used for duplicate protection. Duplicate ASINs are prevented from creating multiple products.</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold text-slate-900">Arrays (Pipe-separated):</span>
              <p className="text-slate-600 mt-0.5">
                Use <code className="bg-white px-1 py-0.5 rounded border border-slate-200">|</code> for multi-value fields: <code className="bg-white px-1 py-0.5 rounded border border-slate-200">pros</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200">cons</code>, and <code className="bg-white px-1 py-0.5 rounded border border-slate-200">images</code>. Example: <em>80H Playtime|40ms Gaming Mode|Type-C Fast Charge</em>.
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Booleans:</span>
              <p className="text-slate-600 mt-0.5">
                Accepts <code className="bg-white px-1 py-0.5 rounded border border-slate-200">true</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200">false</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200">yes</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200">no</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200">1</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200">0</code> case-insensitively.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Box */}
      {!importResult && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
              file
                ? 'border-emerald-300 bg-emerald-50/30'
                : 'border-slate-300 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/20'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
              <div
                className={`p-3 rounded-full ${
                  file ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                }`}
              >
                {file ? <CheckCircle2 size={28} /> : <UploadCloud size={28} />}
              </div>
              <div className="font-bold text-slate-900 text-sm">
                {file ? file.name : 'Click to select or drag and drop your CSV file'}
              </div>
              <div className="text-xs text-slate-500">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB • Click to change file`
                  : 'Standard CSV format, UTF-8 encoded, up to 5 MB'}
              </div>
            </div>
          </div>

          {/* Import Mode Options */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="updateExisting"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <div>
                <label htmlFor="updateExisting" className="text-xs font-bold text-slate-900 cursor-pointer">
                  Update existing products
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  If enabled, products with existing ASIN or slug will be updated. Existing affiliate links will NEVER be overwritten with blank CSV values.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {file && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={handleValidate}
                disabled={!file || isValidating}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isValidating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Validating CSV...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Validate CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Summary & Preview */}
      {validationResult && !importResult && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Total Rows</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {validationResult.totalRows}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
              <div className="text-xs text-emerald-700 font-medium">Valid Rows</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {validationResult.validRows}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
              <div className="text-xs text-amber-700 font-medium">
                {updateExisting ? 'Will Update' : 'Duplicate (Skip)'}
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {validationResult.duplicateRows}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-2xs">
              <div className="text-xs text-red-700 font-medium">Invalid Rows</div>
              <div className="text-2xl font-black text-red-700 mt-1">
                {validationResult.invalidRows}
              </div>
            </div>
          </div>

          {/* Errors List */}
          {validationResult.errors.length > 0 && (
            <div className="bg-red-50/70 border border-red-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                  <AlertTriangle size={16} />
                  <span>Validation Errors ({validationResult.errors.length})</span>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadErrorCsv}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:text-red-900 bg-white border border-red-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Download size={12} />
                  <span>Export Errors CSV</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                {validationResult.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-red-700 bg-white/80 px-3 py-1.5 rounded-lg border border-red-100 flex items-start gap-2"
                  >
                    <span className="font-bold text-red-800 shrink-0">Row {err.row}:</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Product Data Preview</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review validated items before writing to database.
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    previewFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({validationResult.preview.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('valid')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    previewFilter === 'valid'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Valid ({validationResult.validRows})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('errors')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    previewFilter === 'errors'
                      ? 'bg-white text-red-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Issues ({validationResult.invalidRows + validationResult.duplicateRows})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">MRP</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Marketplace</th>
                    <th className="py-2.5 px-3">ASIN</th>
                    <th className="py-2.5 px-3">Affiliate</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPreview.map((item) => {
                    let statusBadgeClass = 'bg-slate-100 text-slate-600';
                    if (item.status === 'valid') {
                      statusBadgeClass = 'bg-emerald-100 text-emerald-800';
                    } else if (item.status === 'will_update') {
                      statusBadgeClass = 'bg-blue-100 text-blue-800';
                    } else if (item.status === 'duplicate') {
                      statusBadgeClass = 'bg-amber-100 text-amber-800';
                    } else if (item.status === 'invalid') {
                      statusBadgeClass = 'bg-red-100 text-red-800';
                    }

                    return (
                      <tr key={item.rowNumber} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {item.rowNumber}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 max-w-[200px] truncate" title={item.name}>
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          ₹{Number(item.price).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          ₹{Number(item.originalPrice).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.rating}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {item.marketplace}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                          {item.asin}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.affiliateStatus === 'Added'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.affiliateStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeClass}`}
                            title={item.errors.join('; ')}
                          >
                            {item.statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Ready to import{' '}
                <strong className="text-slate-900">
                  {validationResult.validRows} valid row
                  {validationResult.validRows === 1 ? '' : 's'}
                </strong>
                {validationResult.invalidRows > 0 &&
                  ` (${validationResult.invalidRows} invalid row${validationResult.invalidRows === 1 ? '' : 's'} will be skipped)`}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={validationResult.validRows === 0 || isImporting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Writing to Database...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Import Products ({validationResult.validRows})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Execution Result */}
      {importResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs space-y-6 text-center max-w-2xl mx-auto">
          <div className="p-3 bg-emerald-100 text-emerald-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">Import Completed</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your catalog has been updated and public paths have been revalidated.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">Total Rows</div>
              <div className="text-xl font-black text-slate-900">{importResult.totalRows}</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <div className="text-[11px] text-emerald-700 font-medium">Created</div>
              <div className="text-xl font-black text-emerald-700">{importResult.created}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
              <div className="text-[11px] text-blue-700 font-medium">Updated</div>
              <div className="text-xl font-black text-blue-700">{importResult.updated}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="text-[11px] text-slate-500 font-medium">Skipped/Failed</div>
              <div className="text-xl font-black text-slate-700">
                {importResult.skipped + importResult.failed}
              </div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="text-left bg-red-50 p-4 rounded-xl border border-red-200 space-y-2">
              <div className="text-xs font-bold text-red-800 flex items-center justify-between">
                <span>Row Failures ({importResult.errors.length})</span>
                <button
                  type="button"
                  onClick={handleDownloadErrorCsv}
                  className="inline-flex items-center gap-1 text-[11px] text-red-700 hover:text-red-900 underline font-semibold cursor-pointer"
                >
                  <Download size={12} />
                  <span>Download Error Log</span>
                </button>
              </div>
              <div className="text-xs text-red-700 max-h-32 overflow-y-auto space-y-1">
                {importResult.errors.map((err, idx) => (
                  <div key={idx}>
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Import Another File
            </button>
            <Link
              href="/admin/products"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-xs transition-colors"
            >
              <span>View Products in Catalog</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
