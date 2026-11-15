import React, { useEffect, useState } from 'react';
import { 
  Briefcase, 
  PlusCircle, 
  Search, 
  Trash2, 
  ExternalLink, 
  BookOpen, 
  CheckCircle, 
  Ban, 
  ArrowRight,
  Database,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../services/api';

export default function BrandWorkspace({ onNavigate, onSelectBrandForReview, triggerToast }) {
  const [brands, setBrands] = useState([]);
  const [selectedBrandDetail, setSelectedBrandDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBrandId, setExpandedBrandId] = useState(null);

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    setLoading(true);
    try {
      const data = await api.getBrands();
      setBrands(data);
    } catch (err) {
      triggerToast({ type: 'error', title: 'Error', message: 'Failed to load brands.' });
    } finally {
      setLoading(false);
    }
  }

  async function toggleExpand(brandId) {
    if (expandedBrandId === brandId) {
      setExpandedBrandId(null);
      setSelectedBrandDetail(null);
      return;
    }
    setExpandedBrandId(brandId);
    try {
      const detail = await api.getBrand(brandId);
      setSelectedBrandDetail(detail);
    } catch (err) {
      triggerToast({ type: 'error', title: 'Error', message: 'Failed to load brand details.' });
    }
  }

  async function handleDelete(brandId, brandName, e) {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete brand '${brandName}'? All its guidelines, facts, and reviews will be removed.`)) {
      return;
    }
    try {
      await api.deleteBrand(brandId);
      triggerToast({ type: 'success', title: 'Brand Deleted', message: `Deleted ${brandName}.` });
      if (expandedBrandId === brandId) {
        setExpandedBrandId(null);
        setSelectedBrandDetail(null);
      }
      loadBrands();
    } catch (err) {
      triggerToast({ type: 'error', title: 'Deletion Failed', message: err.message });
    }
  }

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    b.preferred_tone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Brand Workspace</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure enterprise brand profiles, approved tone, facts, guidelines, and prohibited terminology.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search brands or tone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => onNavigate('create-brand')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Brand</span>
          </button>
        </div>
      </div>

      {/* Brands List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading brand profiles...</p>
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Brands Found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery ? 'No brands matched your search criteria.' : 'Create your first brand workspace or preload demo profiles for testing.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => onNavigate('create-brand')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              + Create New Brand
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBrands.map((brand) => {
            const isExpanded = expandedBrandId === brand.id;
            return (
              <div
                key={brand.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition overflow-hidden"
              >
                {/* Header Row */}
                <div 
                  onClick={() => toggleExpand(brand.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-base text-slate-900">{brand.name}</h3>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Tone: {brand.preferred_tone}
                      </span>
                    </div>
                    {brand.description && (
                      <p className="text-xs text-slate-600 line-clamp-1">{brand.description}</p>
                    )}
                    {brand.target_audience && (
                      <p className="text-[11px] text-slate-400">Target Audience: {brand.target_audience}</p>
                    )}
                  </div>

                  {/* Summary badges and actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg">
                      <span title="Guidelines count">📜 {brand.guidelines_count} Guidelines</span>
                      <span>•</span>
                      <span title="Approved facts">✅ {brand.approved_facts_count} Facts</span>
                      <span>•</span>
                      <span title="Prohibited terms">🚫 {brand.prohibited_terms_count} Banned</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBrandForReview(brand.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-xs"
                      title="Review new copy for this brand"
                    >
                      <span>Review Content</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(brand.id, brand.name, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && selectedBrandDetail && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-in fade-in duration-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Guidelines Box */}
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          <span>Brand Guidelines ({selectedBrandDetail.guidelines?.length || 0})</span>
                        </div>
                        {selectedBrandDetail.guidelines?.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No specific guidelines added.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {selectedBrandDetail.guidelines.map(g => (
                              <div key={g.id} className="text-xs p-2 rounded bg-slate-50 border border-slate-100">
                                <span className="font-semibold text-blue-700 text-[10px] uppercase block mb-0.5">[{g.category}]</span>
                                <span className="text-slate-700 leading-tight">{g.guideline_text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Approved Facts Box */}
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Approved Facts ({selectedBrandDetail.approved_facts?.length || 0})</span>
                        </div>
                        {selectedBrandDetail.approved_facts?.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No approved facts recorded.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {selectedBrandDetail.approved_facts.map(f => (
                              <div key={f.id} className="text-xs p-2 rounded bg-slate-50 border border-slate-100">
                                <div className="text-slate-800 font-medium leading-tight">{f.fact_text}</div>
                                {f.source_name && (
                                  <div className="text-[10px] text-emerald-700 mt-1 font-medium">
                                    Source: {f.source_name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Prohibited Terms Box */}
                      <div className="bg-white p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2.5">
                          <Ban className="w-3.5 h-3.5 text-rose-600" />
                          <span>Prohibited Terminology ({selectedBrandDetail.prohibited_terms?.length || 0})</span>
                        </div>
                        {selectedBrandDetail.prohibited_terms?.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No prohibited terms registered.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {selectedBrandDetail.prohibited_terms.map(p => (
                              <div key={p.id} className="text-xs p-2 rounded bg-rose-50/50 border border-rose-100">
                                <div className="font-semibold text-rose-700 line-through">{p.term}</div>
                                {p.replacement && (
                                  <div className="text-[11px] text-emerald-700 mt-0.5">
                                    → Replace with: <span className="font-semibold">{p.replacement}</span>
                                  </div>
                                )}
                                {p.reason && (
                                  <div className="text-[10px] text-slate-500 mt-0.5 italic">{p.reason}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
