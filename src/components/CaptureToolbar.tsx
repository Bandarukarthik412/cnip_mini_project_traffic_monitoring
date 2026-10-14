import { useState, useRef } from 'react';
import {
  Activity,
  Sliders,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { ScenarioType, Packet } from '../types/network';

interface CaptureToolbarProps {
  isCapturing: boolean;
  captureRate: number;
  onSetCaptureRate: (rate: number) => void;
  activeScenario: ScenarioType;
  onSetScenario: (sc: ScenarioType) => void;
  packetCount: number;
  onClearBuffer: () => void;
  onResetAll: () => void;
  packets: Packet[];
  onImportPackets: (imported: Packet[]) => void;
}

export function CaptureToolbar({
  isCapturing,
  captureRate,
  onSetCaptureRate,
  activeScenario,
  onSetScenario,
  packetCount,
  onClearBuffer,
  onResetAll,
  packets,
  onImportPackets,
}: CaptureToolbarProps) {
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scenarioNames: Record<ScenarioType, string> = {
    nominal: 'Nominal Enterprise Baseline',
    syn_flood: 'SYN Flood DDoS Attack',
    port_scan: 'Port Reconnaissance Scan',
    dns_tunneling: 'DNS Tunneling Exfil',
    data_exfil: 'Tor Data Exfiltration Spike',
    api_spike: 'Microservices Mesh Traffic',
  };

  const handleExportJson = () => {
    const exportData = {
      exportTime: new Date().toISOString(),
      captureInterface: 'eth0',
      totalPackets: packets.length,
      packets: packets.slice(0, 150),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netscope_capture_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.packets) && parsed.packets.length > 0) {
          onImportPackets(parsed.packets);
        } else if (Array.isArray(parsed)) {
          onImportPackets(parsed);
        }
      } catch (err) {
        console.error('Failed to parse uploaded network trace', err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-[#0b101c] border-b border-slate-800/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
      {/* Left side: Telemetry state & Interface metadata */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isCapturing ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="font-semibold text-slate-200">
            {isCapturing ? 'Live Streaming' : 'Capture Paused'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-slate-400">
          <span>Interface eth0 (10GbE)</span>
          <span aria-hidden="true">·</span>
          <span>Buffer: <span className="text-slate-200 font-mono tabular-nums">{packetCount}</span> / 300</span>
          <span aria-hidden="true">·</span>
          <span>Promiscuous Mode</span>
        </div>
      </div>

      {/* Right side: Interactive rate, scenario injector & PCAP tools */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Packet Rate control */}
        <div className="flex items-center gap-1 bg-[#131b2e] border border-slate-800 rounded p-0.5">
          <span className="px-2 text-slate-400 text-[11px] flex items-center gap-1">
            <Sliders className="w-3 h-3 text-slate-500" /> Rate:
          </span>
          {[1, 5, 10, 25].map((rate) => (
            <button
              key={rate}
              onClick={() => onSetCaptureRate(rate)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums transition-colors ${
                captureRate === rate
                  ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {rate}/s
            </button>
          ))}
        </div>

        {/* Scenario Injection Selector */}
        <div className="relative">
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] transition-colors ${
              activeScenario !== 'nominal'
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                : 'bg-[#131b2e] text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            {activeScenario !== 'nominal' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="max-w-[140px] truncate">
              {scenarioNames[activeScenario]}
            </span>
          </button>

          {showScenarioMenu && (
            <div
              className="absolute right-0 mt-1.5 w-64 bg-[#111827] border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-slate-200"
              onMouseLeave={() => setShowScenarioMenu(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-800">
                Inject Scenario / Attack Pattern
              </div>
              {(Object.keys(scenarioNames) as ScenarioType[]).map((scKey) => (
                <button
                  key={scKey}
                  onClick={() => {
                    onSetScenario(scKey);
                    setShowScenarioMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                    activeScenario === scKey
                      ? 'bg-cyan-950/40 text-cyan-300 font-medium'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span>{scenarioNames[scKey]}</span>
                  {scKey !== 'nominal' && (
                    <span className="text-[10px] text-amber-400/90 font-mono">
                      Anomaly
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onClearBuffer}
            title="Clear packet buffer"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportJson}
            title="Export captured trace as JSON/PCAP"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON network trace file"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={onResetAll}
            title="Reset telemetry & alerts"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
