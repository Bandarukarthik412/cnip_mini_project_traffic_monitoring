import { Play, Pause } from 'lucide-react';

export type ActiveTab = 'overview' | 'stream' | 'topology' | 'security' | 'firewall';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isCapturing: boolean;
  onToggleCapture: () => void;
  alertCount: number;
}

export function Header({
  activeTab,
  onSelectTab,
  isCapturing,
  onToggleCapture,
  alertCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0e1422] border-b border-slate-800/80">
      {/* Zone 1: Brand wordmark (single text element, no adjacent badges) */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap shrink-0">
          NetScope Sentinel
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line nav links */}
      <nav className="hidden md:flex items-center gap-7 text-xs font-medium tracking-wide">
        <button
          onClick={() => onSelectTab('overview')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'overview'
              ? 'text-white border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          NOC Telemetry
        </button>

        <button
          onClick={() => onSelectTab('stream')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'stream'
              ? 'text-white border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Packet Inspector
        </button>

        <button
          onClick={() => onSelectTab('topology')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'topology'
              ? 'text-white border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Network Topology
        </button>

        <button
          onClick={() => onSelectTab('security')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 relative ${
            activeTab === 'security'
              ? 'text-white border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Security & Alerts {alertCount > 0 ? `(${alertCount})` : ''}
        </button>

        <button
          onClick={() => onSelectTab('firewall')}
          className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'firewall'
              ? 'text-white border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Firewall ACL
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleCapture}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
            isCapturing
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
          }`}
        >
          {isCapturing ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Capture</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Resume Capture</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
