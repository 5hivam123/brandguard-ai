import React from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Code2,
  Lock,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function Settings({ systemHealth, onRefreshHealth, triggerToast }) {
  const handleSeed = async () => {
    try {
      const res = await api.seedBrands();
      triggerToast({ type: 'success', title: 'Data Seeded', message: res.message });
      onRefreshHealth();
    } catch (err) {
      triggerToast({ type: 'error', title: 'Seeding Error', message: err.message });
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Architecture & Team</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Overview of platform health, engine architecture, responsible AI safeguards, and hackathon team credits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & AI Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-900">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Compliance Engine Status</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Backend API Status:</span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {systemHealth?.status === 'healthy' ? 'Healthy & Connected' : 'Degraded'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Database Layer:</span>
              <span className="font-semibold text-slate-800">
                {systemHealth?.database || 'SQLite / PostgreSQL'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Active Engine Mode:</span>
              <span className="font-semibold text-blue-700">
                {systemHealth?.ai_engine_mode || 'Rule-based Compliance Engine'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Gemini LLM Configured:</span>
              <span className="font-semibold text-slate-700">
                {systemHealth?.gemini_configured ? 'Yes (API Key Detected)' : 'No (Deterministic Fallback Active)'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSeed}
              className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition flex items-center justify-center gap-2"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Preload Demonstration Data & Guidelines</span>
            </button>
          </div>
        </div>

        {/* Responsible AI Safeguards */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold text-slate-900">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Responsible AI Guardrails</span>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">🛡️ Untrusted Data Boundary</div>
              User-submitted content is isolated as untrusted data with prompt-injection defense.
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">🚫 No Hallucinated Facts</div>
              BrandGuard AI strictly refuses to fabricate company facts or evidence. Only verified records count.
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="font-bold text-slate-800 mb-1">⚖️ Human in the Loop (HITL)</div>
              No automatic publication. Human reviewers always accept, reject, or edit suggestions.
            </div>
          </div>
        </div>

        {/* Hackathon Team Credits */}
        <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base">Team: Reverse Engg</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-semibold">
              Hackathon Entry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="font-bold text-sm text-white">Shivam Gupta</div>
              <div className="text-xs text-blue-300 mt-0.5">Software Architect & Backend Lead</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="font-bold text-sm text-white">Uzma Nayab</div>
              <div className="text-xs text-blue-300 mt-0.5">Full-Stack Engineer & AI Review Engine</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <div className="font-bold text-sm text-white">Aaysha Shams</div>
              <div className="text-xs text-blue-300 mt-0.5">UI/UX Designer & Frontend Lead</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>BrandGuard AI • "Create Freely. Publish Confidently."</span>
            <span className="font-mono text-[11px] text-slate-400">FastAPI • React • Vite • Tailwind • SQLAlchemy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
