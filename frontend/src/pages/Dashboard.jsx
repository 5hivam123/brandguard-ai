import React, { useEffect, useState } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Sparkles, 
  Briefcase, 
  ChevronRight,
  Database
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ onNavigate, onSelectReview, triggerToast }) {
  const [stats, setStats] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [statsData, reviewsData, brandsData] = await Promise.all([
        api.getDashboardStats(),
        api.getReviews({ limit: 6 }),
        api.getBrands()
      ]);
      setStats(statsData);
      setRecentReviews(reviewsData);
      setBrands(brandsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSeed = async () => {
    try {
      await api.seedBrands();
      triggerToast({
        type: 'success',
        title: 'Demo Data Loaded',
        message: 'Successfully seeded enterprise brands, rules, and approved facts.'
      });
      loadDashboardData();
    } catch (err) {
      triggerToast({
        type: 'error',
        title: 'Seeding Error',
        message: err.message
      });
    }
  };

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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading real database analytics...</p>
        </div>
      </div>
    );
  }

  const hasData = (stats?.total_reviews || 0) > 0 || brands.length > 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Intelligent Brand Governance
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Create Freely. Publish Confidently.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            BrandGuard AI automatically verifies marketing content against corporate brand guidelines, 
            prohibited terminology, approved factual records, and preferred brand voice before publication.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('review')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/30 transition flex items-center gap-2"
            >
              <span>Submit Content for Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('brands')}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
            >
              Manage Brand Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reviews</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.total_reviews ?? 0}</span>
            <span className="text-xs text-slate-400">submissions</span>
          </div>
        </div>

        {/* Total Detected Issues */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Detected Issues</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.total_detected_issues ?? 0}</span>
            <span className="text-xs text-rose-600 font-medium">
              {stats?.severity_breakdown?.high ?? 0} high severity
            </span>
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Reviews</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.pending_reviews ?? 0}</span>
            <span className="text-xs text-slate-400">awaiting approval</span>
          </div>
        </div>

        {/* Approved Content */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Content</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats?.approved_content ?? 0}</span>
            <span className="text-xs text-emerald-600 font-medium">ready to publish</span>
          </div>
        </div>
      </div>

      {/* Breakdown Row */}
      {stats && stats.total_detected_issues > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Issue Severity Breakdown:</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              High: {stats.severity_breakdown.high}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Medium: {stats.severity_breakdown.medium}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Low: {stats.severity_breakdown.low}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Unverified Claims: {stats.unverified_claims_count}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reviews (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Recent Content Reviews</h3>
              <p className="text-xs text-slate-500">Live submissions recorded in database</p>
            </div>
            {recentReviews.length > 0 && (
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentReviews.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm">No Content Reviews Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No marketing copies have been reviewed yet. Click below to submit your first content copy or preload demo brands.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => onNavigate('review')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Submit Content Review
                </button>
                <button
                  onClick={handleSeed}
                  className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Database className="w-3 h-3 text-blue-600" />
                  <span>Load Demo Brands</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => onSelectReview(review.id)}
                  className="p-4.5 hover:bg-slate-50/80 transition cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 truncate">
                        {review.content_title}
                      </span>
                      {getStatusBadge(review.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{review.brand_name}</span>
                      <span>•</span>
                      <span>{review.content_type}</span>
                      <span>•</span>
                      <span>
                        {review.total_issues === 0 ? (
                          <span className="text-emerald-600 font-semibold">100% Compliant</span>
                        ) : (
                          <span className="text-slate-600 font-medium">
                            {review.total_issues} issue{review.total_issues > 1 ? 's' : ''} (
                            <span className="text-rose-600 font-semibold">{review.high_issues} High</span>)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configured Brands Preview (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Brand Workspaces</h3>
              <p className="text-xs text-slate-500">{brands.length} configured brand{brands.length === 1 ? '' : 's'}</p>
            </div>
            <button
              onClick={() => onNavigate('create-brand')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              + New
            </button>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {brands.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">No brands configured yet.</p>
                <button
                  onClick={handleSeed}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                >
                  Load Demo Brands
                </button>
              </div>
            ) : (
              brands.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onNavigate('brands')}
                  className="p-3.5 rounded-lg border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/30 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-xs text-slate-900">{b.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-medium">
                      {b.reviews_count || 0} reviews
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                    Tone: {b.preferred_tone}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <span>{b.guidelines_count} guidelines</span>
                    <span>•</span>
                    <span>{b.approved_facts_count} approved facts</span>
                    <span>•</span>
                    <span>{b.prohibited_terms_count} banned terms</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {brands.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('brands')}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
              >
                Manage all {brands.length} brand profiles →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
