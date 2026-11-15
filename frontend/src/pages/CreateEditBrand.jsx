import React, { useState, useEffect } from 'react';
import { 
  Building, 
  BookOpen, 
  CheckCircle, 
  Ban, 
  Plus, 
  Trash2, 
  Save, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';

export default function CreateEditBrand({ editBrandId, onNavigate, triggerToast }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [preferredTone, setPreferredTone] = useState('Professional, Authoritative, Trustworthy');
  const [targetAudience, setTargetAudience] = useState('');

  const [guidelines, setGuidelines] = useState([
    { guideline_text: 'Maintain an authoritative, transparent tone suitable for enterprise buyers.', category: 'Tone' },
    { guideline_text: 'Do not promise speculative returns without audit proof.', category: 'Legal' }
  ]);

  const [approvedFacts, setApprovedFacts] = useState([
    { fact_text: 'Platform delivers 99.99% audited uptime SLA.', source_name: 'SOC-2 Audit 2025', category: 'Performance' },
    { fact_text: 'Active in over 20 global markets.', source_name: 'Annual Report 2025', category: 'General' }
  ]);

  const [prohibitedTerms, setProhibitedTerms] = useState([
    { term: 'cheapest in India', replacement: 'competitively priced for Indian enterprises', reason: 'Unverified superlative price claim' },
    { term: '100% risk-free', replacement: 'structured enterprise risk protection', reason: 'Misleading regulatory statement' }
  ]);

  const [saving, setSaving] = useState(false);
  const [loadingBrand, setLoadingBrand] = useState(false);

  useEffect(() => {
    if (editBrandId) {
      loadBrandToEdit(editBrandId);
    }
  }, [editBrandId]);

  async function loadBrandToEdit(id) {
    setLoadingBrand(true);
    try {
      const data = await api.getBrand(id);
      setName(data.name || '');
      setDescription(data.description || '');
      setPreferredTone(data.preferred_tone || '');
      setTargetAudience(data.target_audience || '');
      if (data.guidelines) setGuidelines(data.guidelines);
      if (data.approved_facts) setApprovedFacts(data.approved_facts);
      if (data.prohibited_terms) setProhibitedTerms(data.prohibited_terms);
    } catch (err) {
      triggerToast({ type: 'error', title: 'Error', message: 'Failed to load brand profile.' });
    } finally {
      setLoadingBrand(false);
    }
  }

  // Template Quick Fill
  const loadTemplate = (type) => {
    if (type === 'fintech') {
      setName('ApexPay Technologies');
      setDescription('Enterprise payment infrastructure powering digital commerce across Asia-Pacific.');
      setPreferredTone('Professional, Authoritative, Trustworthy, Transparent');
      setTargetAudience('Fintech CTOs, CFOs, Risk Officers, and Product Managers');
      setGuidelines([
        { guideline_text: 'Maintain a professional, transparent, and authoritative tone suitable for regulated institutions.', category: 'Tone' },
        { guideline_text: 'Never guarantee investment returns or commercial growth multipliers without validated audit disclosures.', category: 'Legal' },
        { guideline_text: 'Avoid competitor disparagement or unverified superlative comparisons.', category: 'Messaging' }
      ]);
      setApprovedFacts([
        { fact_text: 'ApexPay processes transactions with an audited 99.99% system availability.', source_name: 'SOC-2 Type II Report 2025', category: 'Performance' },
        { fact_text: 'Supports instant settlements across 45 national clearing networks.', source_name: 'Product Specs v4.2', category: 'Feature' },
        { fact_text: 'Over 12,000 businesses currently use ApexPay APIs.', source_name: 'Q4 2025 Shareholder Filing', category: 'Performance' }
      ]);
      setProhibitedTerms([
        { term: 'cheapest in India', replacement: 'competitively priced for Indian enterprises', reason: 'Unverified price superlative' },
        { term: '100% risk-free', replacement: 'comprehensive risk mitigation framework', reason: 'Zero-risk claim violates financial advertising standards' }
      ]);
    } else if (type === 'ecommerce') {
      setName('EcoNova Organics');
      setDescription('Certified sustainable personal care brand dedicated to zero-waste packaging.');
      setPreferredTone('Warm, Inspiring, Conscious, Scientifically Credible');
      setTargetAudience('Eco-conscious consumers and wellness advocates');
      setGuidelines([
        { guideline_text: 'Emphasize ethical sourcing, transparency, and scientific efficacy without greenwashing.', category: 'Tone' },
        { guideline_text: 'Every sustainability assertion must cite third-party ecological certification.', category: 'Legal' }
      ]);
      setApprovedFacts([
        { fact_text: '100% of product packaging is compostable within 90 days in home compost systems.', source_name: 'TUV Austria OK Compost Certification', category: 'Certification' },
        { fact_text: 'Formulas contain zero microplastics, parabens, or synthetic phthalates.', source_name: 'EWG Verified 2025', category: 'Performance' }
      ]);
      setProhibitedTerms([
        { term: 'miracle cure', replacement: 'evidence-backed natural formula', reason: 'Unsubstantiated therapeutic claim' },
        { term: 'zero chemical', replacement: 'naturally derived botanical ingredients', reason: 'Scientifically inaccurate terminology' }
      ]);
    }
    triggerToast({ type: 'info', title: 'Template Loaded', message: `Filled form with ${type} guidelines.` });
  };

  // Guidelines helper
  const addGuideline = () => {
    setGuidelines([...guidelines, { guideline_text: '', category: 'Tone' }]);
  };
  const updateGuideline = (index, field, value) => {
    const updated = [...guidelines];
    updated[index][field] = value;
    setGuidelines(updated);
  };
  const removeGuideline = (index) => {
    setGuidelines(guidelines.filter((_, i) => i !== index));
  };

  // Facts helper
  const addFact = () => {
    setApprovedFacts([...approvedFacts, { fact_text: '', source_name: '', category: 'Performance' }]);
  };
  const updateFact = (index, field, value) => {
    const updated = [...approvedFacts];
    updated[index][field] = value;
    setApprovedFacts(updated);
  };
  const removeFact = (index) => {
    setApprovedFacts(approvedFacts.filter((_, i) => i !== index));
  };

  // Prohibited terms helper
  const addProhibitedTerm = () => {
    setProhibitedTerms([...prohibitedTerms, { term: '', replacement: '', reason: '' }]);
  };
  const updateProhibitedTerm = (index, field, value) => {
    const updated = [...prohibitedTerms];
    updated[index][field] = value;
    setProhibitedTerms(updated);
  };
  const removeProhibitedTerm = (index) => {
    setProhibitedTerms(prohibitedTerms.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      triggerToast({ type: 'error', title: 'Validation Error', message: 'Brand name is required.' });
      return;
    }
    if (!preferredTone.trim()) {
      triggerToast({ type: 'error', title: 'Validation Error', message: 'Preferred brand tone is required.' });
      return;
    }

    setSaving(true);
    try {
      if (editBrandId) {
        // Update brand
        await api.updateBrand(editBrandId, {
          name: name.trim(),
          description: description.trim() || null,
          preferred_tone: preferredTone.trim(),
          target_audience: targetAudience.trim() || null
        });
        triggerToast({
          type: 'success',
          title: 'Brand Updated',
          message: `Successfully updated '${name}'.`
        });
      } else {
        // Create brand
        const payload = {
          name: name.trim(),
          description: description.trim() || null,
          preferred_tone: preferredTone.trim(),
          target_audience: targetAudience.trim() || null,
          guidelines: guidelines.filter(g => g.guideline_text.trim().length > 0),
          approved_facts: approvedFacts.filter(f => f.fact_text.trim().length > 0),
          prohibited_terms: prohibitedTerms.filter(p => p.term.trim().length > 0)
        };

        await api.createBrand(payload);
        triggerToast({
          type: 'success',
          title: 'Brand Created',
          message: `Successfully configured brand '${name}'.`
        });
      }
      onNavigate('brands');
    } catch (err) {
      triggerToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loadingBrand) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading brand profile...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('brands')}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {editBrandId ? `Edit Brand: ${name}` : 'Configure Brand Profile'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define the brand voice, core compliance guidelines, validated facts, and disallowed terms.
            </p>
          </div>
        </div>

        {/* Quick Template Fill Buttons (only in create mode) */}
        {!editBrandId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Templates:</span>
            <button
              type="button"
              onClick={() => loadTemplate('fintech')}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            >
              FinTech
            </button>
            <button
              type="button"
              onClick={() => loadTemplate('ecommerce')}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
            >
              Eco Retail
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Module A1: Brand Information */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-900">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Brand Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ApexPay Technologies"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Brand Tone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Professional, Authoritative, Trustworthy"
                value={preferredTone}
                onChange={(e) => setPreferredTone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                placeholder="e.g. Enterprise Chief Financial Officers, Product Managers, and IT Directors"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Description
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of your company, mission, and products..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Module A2: Brand Guidelines */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Brand Guidelines ({guidelines.length})</span>
            </div>
            <button
              type="button"
              onClick={addGuideline}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Guideline
            </button>
          </div>

          <div className="space-y-3">
            {guidelines.map((g, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <select
                  value={g.category}
                  onChange={(e) => updateGuideline(idx, 'category', e.target.value)}
                  className="w-32 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none font-medium text-slate-700"
                >
                  <option value="Tone">Tone</option>
                  <option value="Legal">Legal</option>
                  <option value="Messaging">Messaging</option>
                  <option value="Formatting">Formatting</option>
                </select>
                <input
                  type="text"
                  placeholder="e.g. Always use active voice and avoid colloquial slang..."
                  value={g.guideline_text}
                  onChange={(e) => updateGuideline(idx, 'guideline_text', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeGuideline(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Module A3: Approved Facts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Approved Facts Repository ({approvedFacts.length})</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Claims in marketing content are verified against these validated internal records.
              </p>
            </div>
            <button
              type="button"
              onClick={addFact}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Fact
            </button>
          </div>

          <div className="space-y-3">
            {approvedFacts.map((f, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <input
                  type="text"
                  placeholder="Approved statement (e.g. Provides audited 99.99% system availability)"
                  value={f.fact_text}
                  onChange={(e) => updateFact(idx, 'fact_text', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Audit / Source citation (e.g. SOC2 Report 2025)"
                  value={f.source_name || ''}
                  onChange={(e) => updateFact(idx, 'source_name', e.target.value)}
                  className="w-full sm:w-60 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-emerald-700 font-medium"
                />
                <button
                  type="button"
                  onClick={() => removeFact(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 self-end sm:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Module A4: Prohibited Terminology */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Ban className="w-4 h-4 text-rose-600" />
                <span>Prohibited Words & Phrases ({prohibitedTerms.length})</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically flagged by BrandGuard AI with recommended enterprise replacements.
              </p>
            </div>
            <button
              type="button"
              onClick={addProhibitedTerm}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Prohibited Term
            </button>
          </div>

          <div className="space-y-3">
            {prohibitedTerms.map((p, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-2.5 rounded-lg bg-rose-50/30 border border-rose-200/50">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Disallowed term (e.g. cheapest in India)"
                    value={p.term}
                    onChange={(e) => updateProhibitedTerm(idx, 'term', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none font-semibold text-rose-700"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Approved replacement (e.g. competitively priced)"
                    value={p.replacement || ''}
                    onChange={(e) => updateProhibitedTerm(idx, 'replacement', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-emerald-700 font-medium"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Reason (e.g. Unproven price claim)"
                    value={p.reason || ''}
                    onChange={(e) => updateProhibitedTerm(idx, 'reason', e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none text-slate-500"
                  />
                </div>
                <div className="sm:col-span-1 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeProhibitedTerm(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => onNavigate('brands')}
            className="px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : editBrandId ? 'Update Brand Profile' : 'Save Brand Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
