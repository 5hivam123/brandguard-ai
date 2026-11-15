import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Briefcase, 
  PlusCircle, 
  FileCheck2, 
  History, 
  Settings as SettingsIcon, 
  Sparkles,
  Users
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, systemHealth }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'review', label: 'Content Review', icon: FileCheck2 },
    { id: 'brands', label: 'Brand Workspace', icon: Briefcase },
    { id: 'create-brand', label: 'Create Brand', icon: PlusCircle },
    { id: 'history', label: 'Review History', icon: History },
    { id: 'settings', label: 'System & Team', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0 min-h-screen">
      {/* Brand Logo & Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
              BrandGuard <span className="text-blue-400 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Governance & Compliance</p>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-slate-400 italic">
          "Create Freely. Publish Confidently."
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Team Reverse Engg Card */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Reverse Engg</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-900/50 text-blue-300 rounded font-medium">Team</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Shivam Gupta • Uzma Nayab • Aaysha Shams
          </p>
        </div>

        {/* Backend Connectivity Status */}
        <div className="mt-3 flex items-center justify-between px-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                systemHealth?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{systemHealth?.status === 'healthy' ? 'Engine Online' : 'Connecting...'}</span>
          </span>
          <span className="text-[10px] text-slate-400">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
