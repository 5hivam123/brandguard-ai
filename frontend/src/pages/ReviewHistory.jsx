import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText,
  ChevronRight,
  PlusCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ReviewHistory({ onSelectReview, onNavigate, triggerToast }) {
  const [reviews, setReviews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [reviewsData, brandsData] = await Promise.all([
        api.getReviews({ limit: 100 }),
        api.getBrands()
      ]);
      setReviews(reviewsData);
      setBrands(brandsData);
    } catch (err) {
      triggerToast({ type: 'error', title: 'Error', message: 'Failed to load review history.' });
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (reviewId, title, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete review '${title}'?`)) return;
    try {
      await api.deleteReview(reviewId);
      triggerToast({ type: 'success', title: 'Deleted', message: `Review #${reviewId} deleted.` });
      loadData();
    } catch (err) {
      triggerToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.content_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.original_content && r.original_content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.brand_name && r.brand_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesBrand = selectedBrand === 'all' || r.brand_id === Number(selectedBrand);
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;

    return matchesSearch && matchesBrand && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved</span>;
      case 'Changes Requested':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><AlertTriangle className="w-3 h-3 text-amber-600" /> Changes Req.</span>;
      case 'In Review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200"><Clock className="w-3 h-3 text-blue-600" /> In Review</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Review History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of all submitted marketing copy, compliance scores, and approval decisions.
          </p>
        </div>

        <button
          onClick={() => onNavigate('review')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Review</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search review title or copy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-700"
          >
            <option value="all">All Brands</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="In Review">In Review</option>
            <option value="Changes Requested">Changes Requested</option>
            <option value="Approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading audit history...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <History className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Reviews Found</h3>
          <p className="text-xs text-slate-500">
            {searchQuery || selectedBrand !== 'all' || selectedStatus !== 'all'
              ? 'No review records matched the selected filters.'
              : 'Submit marketing content to start tracking compliance reviews.'}
          </p>
          <button
            onClick={() => onNavigate('review')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
          >
            Submit Content Review
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Content Title</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Compliance Issues</th>
                  <th className="py-3 px-4">Review Status</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onSelectReview(r.id)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {r.content_title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {r.brand_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {r.content_type}
                    </td>
                    <td className="py-3.5 px-4">
                      {r.total_issues === 0 ? (
                        <span className="text-emerald-700 font-semibold">100% Compliant</span>
                      ) : (
                        <span className="text-slate-700">
                          <span className="font-bold">{r.total_issues}</span> issue{r.total_issues > 1 ? 's' : ''} (
                          <span className="text-rose-600 font-semibold">{r.high_issues} High</span>)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDelete(r.id, r.content_title, e)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
