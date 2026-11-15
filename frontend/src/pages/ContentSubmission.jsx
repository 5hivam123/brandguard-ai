import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Sparkles, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  Building,
  Info,
  Clock,
  Briefcase
} from 'lucide-react';
import { api } from '../services/api';

export default function ContentSubmission({ 
  preselectedBrandId, 
  onReviewSubmitted, 
  onNavigate, 
  triggerToast 
}) {
  const [brands, setBrands] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState(preselectedBrandId || '');
  const [contentTitle, setContentTitle] = useState('');
  const [contentType, setContentType] = useState('Social media post');
  const [contentText, setContentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(true);

  const contentTypes = [
    'Social media post',
    'Advertisement copy',
    'Website content',
    'Marketing email'
  ];

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    setLoadingBrands(true);
    try {
      const data = await api.getBrands();
      setBrands(data);
      if (data.length > 0 && !selectedBrandId) {
        setSelectedBrandId(preselectedBrandId || data[0].id);
      }
    } catch (err) {
      triggerToast({ type: 'error', title: 'Error', message: 'Failed to load brand workspaces.' });
    } finally {
      setLoadingBrands(false);
    }
  }

  const selectedBrand = brands.find(b => b.id === Number(selectedBrandId));

  // Hackathon Quick-Fill Test Cases (from Section 10)
  const applyTestCase = (caseNumber) => {
    // Pick ApexPay or first brand
    const apexBrand = brands.find(b => b.name.includes('ApexPay')) || brands[0];
    if (apexBrand) {
      setSelectedBrandId(apexBrand.id);
    }

    if (caseNumber === 1) {
      // Test Case 1 — Compliant Content
      setContentTitle('Enterprise Infrastructure Announcement');
      setContentType('Website content');
      setContentText(
        'ApexPay provides audited 99.99% system availability, serving over 10,000 corporate clients globally with enterprise-grade PCI-DSS compliance and dedicated technical support.'
      );
      triggerToast({
        type: 'info',
        title: 'Loaded Test Case 1',
        message: 'Compliant Content (Expected: 0 major violations)'
      });
    } else if (caseNumber === 2) {
      // Test Case 2 — Unsupported Claim
      setContentTitle('Performance Ad Campaign');
      setContentType('Advertisement copy');
      setContentText(
        'Switch to our financial platform today. We guarantee 10x growth for every customer with our automated settlement infrastructure.'
      );
      triggerToast({
        type: 'warning',
        title: 'Loaded Test Case 2',
        message: 'Unsupported Claim: "We guarantee 10x growth" (Expected: Flagged as Unsupported Claim)'
      });
    } else if (caseNumber === 3) {
      // Test Case 3 — Prohibited Terminology
      setContentTitle('Digital Payments Social Blast');
      setContentType('Social media post');
      setContentText(
        'Looking for modern payment gateways? Our checkout solution is the cheapest in India, giving your business maximum profitability.'
      );
      triggerToast({
        type: 'warning',
        title: 'Loaded Test Case 3',
        message: 'Prohibited Terminology: "cheapest in India" (Expected: High Severity Terminology Violation)'
      });
    } else if (caseNumber === 4) {
      // Test Case 4 — Tone Inconsistency
      setContentTitle('Exclusive Weekend Newsletter');
      setContentType('Marketing email');
      setContentText(
        'Hey guys!! rn you can grab this insane deal tbh, check it out right now before it sells out lol!!!'
      );
      triggerToast({
        type: 'warning',
        title: 'Loaded Test Case 4',
        message: 'Tone Inconsistency: Casual slang vs professional brand voice'
      });
    } else if (caseNumber === 5) {
      // Test Case 5 — Unverified Claim
      setContentTitle('Regional Market Expansion PR');
      setContentType('Website content');
      setContentText(
        'ApexPay powers over 75,000 merchants across Southeast Asia with instant localized banking integrations.'
      );
      triggerToast({
        type: 'info',
        title: 'Loaded Test Case 5',
        message: 'Unverified Claim: Metric not found in approved facts (Expected: Marked Unverified, not false)'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBrandId) {
      triggerToast({ type: 'error', title: 'Validation Error', message: 'Please select a brand.' });
      return;
    }
    if (!contentTitle.trim()) {
      triggerToast({ type: 'error', title: 'Validation Error', message: 'Please provide a content title.' });
      return;
    }
    if (!contentText.trim() || contentText.trim().length < 5) {
      triggerToast({ type: 'error', title: 'Validation Error', message: 'Content text must be at least 5 characters.' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        brand_id: Number(selectedBrandId),
        content_title: contentTitle.trim(),
        content_type: contentType,
        content_text: contentText.trim()
      };

      const result = await api.submitReview(payload);
      triggerToast({
        type: 'success',
        title: 'Analysis Complete',
        message: `Analysis completed: ${result.total_issues} compliance issue(s) detected.`
      });
      onReviewSubmitted(result.id);
    } catch (err) {
      triggerToast({ type: 'error', title: 'Review Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = contentText.trim() ? contentText.trim().split(/\s+/).length : 0;
  const charCount = contentText.length;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Content Compliance Review</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit marketing copy, social posts, or ad creative for automated verification against brand guidelines and approved facts.
        </p>
      </div>

      {/* Hackathon Demo Test Cases Bar */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 rounded-xl border border-blue-200/60 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Hackathon Evaluation: 1-Click Test Cases</span>
        </div>
        <p className="text-[11px] text-blue-800 mb-3 leading-relaxed">
          Click any scenario below to automatically load the exact test case from the specification:
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyTestCase(1)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-2xs transition"
          >
            ✅ Case 1: Compliant Content
          </button>
          <button
            type="button"
            onClick={() => applyTestCase(2)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold shadow-2xs transition"
          >
            ⚠️ Case 2: Unsupported 10x Claim
          </button>
          <button
            type="button"
            onClick={() => applyTestCase(3)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold shadow-2xs transition"
          >
            🚫 Case 3: Prohibited Terminology
          </button>
          <button
            type="button"
            onClick={() => applyTestCase(4)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold shadow-2xs transition"
          >
            🗣️ Case 4: Tone Inconsistency
          </button>
          <button
            type="button"
            onClick={() => applyTestCase(5)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-purple-50 border border-purple-300 text-purple-800 text-xs font-semibold shadow-2xs transition"
          >
            🔍 Case 5: Unverified Claim
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        {/* Brand Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Brand Profile <span className="text-rose-500">*</span>
          </label>
          {loadingBrands ? (
            <div className="text-xs text-slate-400 py-2">Loading brand profiles...</div>
          ) : brands.length === 0 ? (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span>No brand workspaces exist yet. Create a brand or load demo data first.</span>
              <button
                type="button"
                onClick={() => onNavigate('create-brand')}
                className="font-bold underline text-amber-900"
              >
                Create Brand
              </button>
            </div>
          ) : (
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
            >
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} (Tone: {b.preferred_tone})
                </option>
              ))}
            </select>
          )}

          {selectedBrand && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">
                Preferred Tone: <span className="font-semibold text-slate-900">{selectedBrand.preferred_tone}</span>
              </span>
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span>{selectedBrand.guidelines_count} guidelines</span>
                <span>•</span>
                <span>{selectedBrand.approved_facts_count} approved facts</span>
                <span>•</span>
                <span>{selectedBrand.prohibited_terms_count} banned terms</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Content Title / Campaign <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Q1 Product Launch Announcement"
            value={contentTitle}
            onChange={(e) => setContentTitle(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Content Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Content Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {contentTypes.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setContentType(type)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition border text-center ${
                  contentType === type
                    ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Content Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Content Copy <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {wordCount} words • {charCount} characters
            </span>
          </div>
          <textarea
            required
            rows={7}
            placeholder="Paste your marketing draft, social post, advertisement copy, or website text here for comprehensive compliance verification..."
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            className="w-full px-3.5 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed font-sans"
          />
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Original draft is strictly preserved and never overwritten without approval.</span>
          </div>

          <button
            type="submit"
            disabled={submitting || brands.length === 0}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-2 active:scale-98 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Compliance Review...</span>
              </>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Review Content with BrandGuard AI</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
