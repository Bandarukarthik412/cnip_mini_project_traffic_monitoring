import { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Shield,
  Trash2,
  Zap,
} from 'lucide-react';
import { SecurityAlert } from '../types/network';

interface SecurityViewProps {
  alerts: SecurityAlert[];
  onDismissAlert: (id: string) => void;
  onBlockIp: (ip: string, reason: string) => void;
  onInspectPacket: (packetId: number) => void;
  onTriggerScenario: (scenario: 'syn_flood' | 'port_scan' | 'dns_tunneling' | 'data_exfil') => void;
}

export function SecurityView({
  alerts,
  onDismissAlert,
  onBlockIp,
  onInspectPacket,
  onTriggerScenario,
}: SecurityViewProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [mitigatedAlertIds, setMitigatedAlertIds] = useState<Set<string>>(new Set());

  const handleMitigate = (alert: SecurityAlert) => {
    onBlockIp(alert.sourceIp, `Automated IDS rule mitigation for ${alert.title}`);
    setMitigatedAlertIds((prev) => new Set([...prev, alert.id]));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const highCount = alerts.filter((a) => a.severity === 'high').length;
  const mediumCount = alerts.filter((a) => a.severity === 'medium').length;

  const getSeverityBadge = (sev: SecurityAlert['severity']) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded">
            <ShieldAlert className="w-3 h-3" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" /> High
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-yellow-950/40 border border-yellow-800/60 px-2 py-0.5 rounded">
            <Info className="w-3 h-3" /> Medium
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-950/40 border border-blue-800/60 px-2 py-0.5 rounded">
            <Info className="w-3 h-3" /> Low
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Threat Detection Header & Metrics */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Intrusion Detection System (NIDS) & Security Incidents
            </h3>
            <div className="text-xs text-slate-400 mt-0.5">
              <span>Heuristic and signature anomaly evaluation</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>MITRE ATT&CK framework mapping</span>
            </div>
          </div>

          {/* Severity filter tabs */}
          <div className="flex items-center gap-1 bg-[#0a0e17] border border-slate-800 rounded p-1 text-xs">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1 rounded transition-colors ${
                filterSeverity === 'all'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-3 py-1 rounded transition-colors ${
                filterSeverity === 'critical'
                  ? 'bg-rose-950/60 text-rose-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Critical ({criticalCount})
            </button>
            <button
              onClick={() => setFilterSeverity('high')}
              className={`px-3 py-1 rounded transition-colors ${
                filterSeverity === 'high'
                  ? 'bg-amber-950/60 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High ({highCount})
            </button>
            <button
              onClick={() => setFilterSeverity('medium')}
              className={`px-3 py-1 rounded transition-colors ${
                filterSeverity === 'medium'
                  ? 'bg-yellow-950/60 text-yellow-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Medium ({mediumCount})
            </button>
          </div>
        </div>

        {/* Quick simulation injector buttons */}
        <div className="p-3 bg-[#0a0e17] rounded border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Security Attack Vector:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onTriggerScenario('syn_flood')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              SYN Flood DDoS
            </button>
            <button
              onClick={() => onTriggerScenario('port_scan')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              Port Reconnaissance
            </button>
            <button
              onClick={() => onTriggerScenario('dns_tunneling')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              DNS Tunneling Exfil
            </button>
            <button
              onClick={() => onTriggerScenario('data_exfil')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
            >
              Database Outbound Tor
            </button>
          </div>
        </div>
      </div>

      {/* 2. Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-200">
              No Active Security Alerts
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Network telemetry signatures are nominal. You can trigger simulated
              threat vectors above to verify detection rules.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isMitigated = mitigatedAlertIds.has(alert.id);
            return (
              <div
                key={alert.id}
                className={`bg-[#0f172a] border rounded-lg p-5 transition-all ${
                  isMitigated
                    ? 'border-emerald-800/60 bg-emerald-950/10'
                    : alert.severity === 'critical'
                    ? 'border-rose-900/60'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {getSeverityBadge(alert.severity)}
                    <h4 className="text-sm font-semibold text-slate-100">
                      {alert.title}
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {alert.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      title="Dismiss alert"
                      className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-300 leading-relaxed">
                  {alert.description}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
                  <div className="flex items-center gap-4 text-slate-400">
                    <div>
                      Source: <span className="text-slate-200">{alert.sourceIp}</span>
                    </div>
                    <div>
                      Target: <span className="text-slate-200">{alert.targetIp}</span>
                    </div>
                    <div>
                      MITRE: <span className="text-cyan-400">{alert.mitreTag}</span>
                    </div>
                    <div>
                      Rule: <span className="text-slate-400 text-[11px]">{alert.rule}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onInspectPacket(alert.packetId)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-xs transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                      <span>Inspect Frame #{alert.packetId}</span>
                    </button>

                    {!isMitigated ? (
                      <button
                        onClick={() => handleMitigate(alert)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded border border-rose-800/80 text-xs font-semibold transition-colors"
                      >
                        <Shield className="w-3 h-3 text-rose-400" />
                        <span>Mitigate (Drop IP)</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-emerald-950/50 text-emerald-300 rounded border border-emerald-800/60 text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Mitigated via ACL</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
