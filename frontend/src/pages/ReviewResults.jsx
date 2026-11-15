import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ArrowLeft, 
  RotateCcw, 
  Save, 
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  SplitSquareVertical,
  Check,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function ReviewResults({ reviewId, onNavigate, triggerToast }) {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedTab, setSelectedTab] = useState('split'); // 'split', 'original', 'revised', 'diff'
  const [filterSeverity, setFilterSeverity] = useState('all'); // 'all', 'High', 'Medium', 'Low', 'unverified'
  
  // Manual text editing
  const [isEditingRevised, setIsEditingRevised] = useState(false);
  const [editedRevisedText, setEditedRevisedText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (reviewId) {
      loadReviewDetails();
    }
  }, [reviewId]);

  async function loadReviewDetails() {
    setLoading(true);
    try {
      const data = await api.getReview(reviewId);
      setReview(data);
      setEditedRevisedText(data.revised_content);
    } catch (err) {
      triggerToast({ type: 'error', title: 'Error', message: 'Failed to load review details.' });
    } finally {
      setLoading(false);
    }
  }

  // Handle Review Status Update (Module F)
  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await api.updateReviewStatus(reviewId, newStatus);
      setReview(updated);
      triggerToast({
        type: 'success',
        title: 'Status Updated',
        message: `Review marked as '${newStatus}'.`
      });
    } catch (err) {
      triggerToast({ type: 'error', title: 'Status Update Failed', message: err.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Accept or Reject Suggestion (Module E)
  const handleApplySuggestion = async (issueId, action) => {
    try {
      const updated = await api.applySuggestion(reviewId, issueId, action);
      setReview(updated);
      setEditedRevisedText(updated.revised_content);
      triggerToast({
        type: action === 'accept' ? 'success' : 'info',
        title: action === 'accept' ? 'Suggestion Accepted' : 'Suggestion Dismissed',
        message: action === 'accept' 
          ? 'Draft revised with approved replacement text.' 
          : 'Human reviewer dismissed the suggestion.'
      });
    } catch (err) {
      triggerToast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  };

  // Accept all high severity suggestions
  const handleAcceptAllHigh = async () => {
    const highPending = review.issues.filter(i => i.severity === 'High' && i.is_accepted === null);
    if (highPending.length === 0) {
      triggerToast({ type: 'info', title: 'No Pending High Issues', message: 'All high-severity issues have already been addressed.' });
      return;
    }
    for (const issue of highPending) {
      await api.applySuggestion(reviewId, issue.id, 'accept');
    }
    loadReviewDetails();
    triggerToast({
      type: 'success',
      title: 'Batch Action Complete',
      message: `Accepted ${highPending.length} high-severity correction(s).`
    });
  };

  // Save manual edit
  const handleSaveManualEdit = async () => {
    setSavingEdit(true);
    try {
      const updated = await api.updateRevisedContent(reviewId, editedRevisedText);
      setReview(updated);
      setIsEditingRevised(false);
      triggerToast({
        type: 'success',
        title: 'Revised Draft Saved',
        message: 'Your custom revisions have been successfully saved.'
      });
    } catch (err) {
      triggerToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  // Reset revised content back to original
  const handleResetToOriginal = async () => {
    if (!window.confirm('Reset the revised draft back to the original submitted text? All accepted suggestions will be reverted.')) {
      return;
    }
    try {
      const updated = await api.updateRevisedContent(reviewId, review.original_content);
      setReview(updated);
      setEditedRevisedText(review.original_content);
      triggerToast({
        type: 'info',
        title: 'Draft Reset',
        message: 'Revised draft has been reset to original text.'
      });
    } catch (err) {
      triggerToast({ type: 'error', title: 'Reset Failed', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading review results & compliance analysis...</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <p className="text-sm text-slate-600">Review not found or has been deleted.</p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Filter issues
  const filteredIssues = review.issues.filter(issue => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'unverified') {
      return ['Unverified Statement', 'Unsupported Claim', 'Needs Human Review'].includes(issue.verification_status);
    }
    return issue.severity === filterSeverity;
  });

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'High':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">HIGH SEVERITY</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">MEDIUM SEVERITY</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">LOW SEVERITY</span>;
    }
  };

  const getVerificationBadge = (vStatus) => {
    switch (vStatus) {
      case 'Confirmed Conflict':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">Confirmed Conflict</span>;
      case 'Unsupported Claim':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">Unsupported Claim</span>;
      case 'Unverified Statement':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">Unverified Statement</span>;
      case 'Style Recommendation':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">Style Recommendation</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">Needs Review</span>;
    }
  };

  // Render original text with highlight spans
  const renderHighlightedOriginal = () => {
    let text = review.original_content;
    const issueSpans = review.issues.map(i => ({
      text: i.problematic_text,
      severity: i.severity,
      id: i.id
    })).filter(s => s.text && text.includes(s.text));

    if (issueSpans.length === 0) {
      return <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{text}</div>;
    }

    // Sort by length descending to match longest spans first
    issueSpans.sort((a, b) => b.text.length - a.text.length);

    let parts = [text];
    issueSpans.forEach(span => {
      const newParts = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        const split = part.split(span.text);
        for (let i = 0; i < split.length; i++) {
          if (split[i]) newParts.push(split[i]);
          if (i < split.length - 1) {
            const highlightClass = span.severity === 'High' 
              ? 'highlight-issue' 
              : span.severity === 'Medium' 
                ? 'highlight-issue-medium' 
                : 'highlight-issue-low';
            newParts.push(
              <mark key={`${span.id}-${i}`} className={highlightClass} title={`Issue #${span.id}: ${span.severity} severity`}>
                {span.text}
              </mark>
            );
          }
        }
      });
      parts = newParts;
    });

    return <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{parts}</div>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {review.content_title}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                {review.content_type}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Brand: <span className="font-semibold text-slate-800">{review.brand_name}</span> • 
              Submitted on {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Module F: Human Review Workflow Status Selector */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <span className="text-xs font-semibold text-slate-500">Review Status:</span>
          <select
            value={review.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updatingStatus}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border focus:outline-none transition ${
              review.status === 'Approved'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : review.status === 'Changes Requested'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-blue-50 border-blue-300 text-blue-800'
            }`}
          >
            <option value="Draft">Draft</option>
            <option value="In Review">In Review</option>
            <option value="Changes Requested">Changes Requested</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Module D: Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-2xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Issues</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{review.total_issues}</div>
        </div>
        <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200/80 text-center shadow-2xs">
          <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">High Severity</div>
          <div className="text-xl font-bold text-rose-800 mt-1">{review.high_issues}</div>
        </div>
        <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 text-center shadow-2xs">
          <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Medium Severity</div>
          <div className="text-xl font-bold text-amber-800 mt-1">{review.medium_issues}</div>
        </div>
        <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200/80 text-center shadow-2xs">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Low Severity</div>
          <div className="text-xl font-bold text-indigo-800 mt-1">{review.low_issues}</div>
        </div>
        <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200/80 text-center shadow-2xs">
          <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">Unverified Claims</div>
          <div className="text-xl font-bold text-purple-800 mt-1">{review.unverified_claims}</div>
        </div>
      </div>

      {/* Main Two-Column Workflow Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Content Viewer & Correction Workflow */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col sticky top-20">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedTab('split')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  selectedTab === 'split' ? 'bg-white shadow-2xs text-blue-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Split Drafts
              </button>
              <button
                onClick={() => setSelectedTab('revised')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  selectedTab === 'revised' ? 'bg-white shadow-2xs text-blue-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Revised Output
              </button>
              <button
                onClick={() => setSelectedTab('original')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                  selectedTab === 'original' ? 'bg-white shadow-2xs text-blue-700 border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Original Draft
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetToOriginal}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
                title="Reset to original submitted text"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-5 max-h-[calc(100vh-280px)] overflow-y-auto space-y-4">
            {/* Split View */}
            {selectedTab === 'split' && (
              <div className="space-y-4">
                {/* Original Copy Box */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                    <span>Original Submitted Draft (Non-destructive)</span>
                    <span className="text-[10px] text-rose-600 font-semibold">Flagged Spans Highlighted</span>
                  </div>
                  {renderHighlightedOriginal()}
                </div>

                {/* Revised Copy Box */}
                <div className="border border-emerald-200/80 rounded-xl p-3.5 bg-emerald-50/20">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center justify-between">
                    <span>Revised Compliant Draft (Live Preview)</span>
                    {!isEditingRevised ? (
                      <button
                        onClick={() => setIsEditingRevised(true)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Draft
                      </button>
                    ) : (
                      <button
                        onClick={handleSaveManualEdit}
                        disabled={savingEdit}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> {savingEdit ? 'Saving...' : 'Save Draft'}
                      </button>
                    )}
                  </div>

                  {isEditingRevised ? (
                    <textarea
                      rows={6}
                      value={editedRevisedText}
                      onChange={(e) => setEditedRevisedText(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed font-sans"
                    />
                  ) : (
                    <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {review.revised_content}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Revised Only View */}
            {selectedTab === 'revised' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-700">Revised Content Ready for Publishing</span>
                  {!isEditingRevised ? (
                    <button
                      onClick={() => setIsEditingRevised(true)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Text
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveManualEdit}
                      disabled={savingEdit}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  )}
                </div>
                {isEditingRevised ? (
                  <textarea
                    rows={10}
                    value={editedRevisedText}
                    onChange={(e) => setEditedRevisedText(e.target.value)}
                    className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed font-sans"
                  />
                ) : (
                  <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap p-2">
                    {review.revised_content}
                  </div>
                )}
              </div>
            )}

            {/* Original Only View */}
            {selectedTab === 'original' && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
                  Original Submitted Draft
                </div>
                {renderHighlightedOriginal()}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Detected Issues Cards (Module D) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Issue Filters & Batch Action */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1">Filter:</span>
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  filterSeverity === 'all' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({review.issues.length})
              </button>
              <button
                onClick={() => setFilterSeverity('High')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  filterSeverity === 'High' ? 'bg-rose-600 text-white font-semibold' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                High ({review.high_issues})
              </button>
              <button
                onClick={() => setFilterSeverity('Medium')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  filterSeverity === 'Medium' ? 'bg-amber-600 text-white font-semibold' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Medium ({review.medium_issues})
              </button>
              <button
                onClick={() => setFilterSeverity('unverified')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                  filterSeverity === 'unverified' ? 'bg-purple-600 text-white font-semibold' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                Unverified ({review.unverified_claims})
              </button>
            </div>

            {review.high_issues > 0 && (
              <button
                onClick={handleAcceptAllHigh}
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold transition"
              >
                Accept All High Issues
              </button>
            )}
          </div>

          {/* Issue Cards */}
          {filteredIssues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">No Compliance Violations</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {filterSeverity === 'all'
                  ? 'Submitted copy fully adheres to all configured brand guidelines and verified facts.'
                  : `No issues match the '${filterSeverity}' filter.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => {
                const isAccepted = issue.is_accepted === true;
                const isRejected = issue.is_accepted === false;
                const isPending = issue.is_accepted === null;

                return (
                  <div
                    key={issue.id}
                    className={`bg-white rounded-xl border p-5 transition shadow-2xs ${
                      isAccepted
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : isRejected
                          ? 'border-slate-300 bg-slate-50/40 opacity-75'
                          : issue.severity === 'High'
                            ? 'border-rose-200 hover:border-rose-300'
                            : issue.severity === 'Medium'
                              ? 'border-amber-200 hover:border-amber-300'
                              : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{issue.category}</span>
                        {getSeverityBadge(issue.severity)}
                        {getVerificationBadge(issue.verification_status)}
                      </div>

                      {/* Suggestion status badge */}
                      {isAccepted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Accepted
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full">
                          <X className="w-3 h-3" /> Dismissed
                        </span>
                      )}
                    </div>

                    {/* Problematic Text Snippet */}
                    <div className="mb-3 p-2.5 rounded-lg bg-slate-100/80 border border-slate-200/80 font-mono text-xs text-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block font-sans mb-0.5">Problematic Text:</span>
                      "{issue.problematic_text}"
                    </div>

                    {/* Explanation */}
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      {issue.explanation}
                    </p>

                    {/* Supporting Evidence */}
                    {issue.supporting_evidence && (
                      <div className="mb-3 text-[11px] p-2.5 rounded-md bg-blue-50/60 border border-blue-100 text-blue-900 leading-normal">
                        <span className="font-bold block mb-0.5">CITED EVIDENCE / RULE:</span>
                        {issue.supporting_evidence}
                      </div>
                    )}

                    {/* Suggested Correction & Action Buttons (Module E) */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs flex-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-0.5">Suggested Correction:</span>
                        <span className="font-medium text-slate-900">{issue.suggested_correction}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleApplySuggestion(issue.id, 'reject')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            isRejected
                              ? 'bg-slate-200 border-slate-300 text-slate-700'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplySuggestion(issue.id, 'accept')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs ${
                            isAccepted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isAccepted ? 'Accepted' : 'Accept Suggestion'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
