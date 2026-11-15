import React from 'react';
import { Sparkles, Database, PlusCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function Header({ 
  title, 
  subtitle, 
  onNewReview, 
  onSeedDemo, 
  systemHealth, 
  isSeeding 
}) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Engine status indicator badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
          <span className={`w-2 h-2 rounded-full ${systemHealth?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="font-medium">
            {systemHealth?.ai_engine_mode || 'Compliance Engine Ready'}
          </span>
        </div>

        {/* Quick Seed Demo Brands Button */}
        {onSeedDemo && (
          <button
            onClick={onSeedDemo}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs disabled:opacity-60"
            title="Preload realistic demo brands & rules for testing"
          >
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>{isSeeding ? 'Seeding...' : 'Load Demo Data'}</span>
          </button>
        )}

        {/* Quick Submit Review Button */}
        {onNewReview && (
          <button
            onClick={onNewReview}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 transition active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Review Content</span>
          </button>
        )}
      </div>
    </header>
  );
}
