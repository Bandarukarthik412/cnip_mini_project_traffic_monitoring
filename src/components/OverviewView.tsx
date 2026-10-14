import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Server,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  Packet,
  SecurityAlert,
  TrafficThroughputSample,
  NetworkNode,
  ProtocolType,
} from '../types/network';

interface OverviewViewProps {
  packets: Packet[];
  throughputHistory: TrafficThroughputSample[];
  nodes: NetworkNode[];
  alerts: SecurityAlert[];
  stats: {
    totalPackets: number;
    totalBytes: number;
    currentIngressMbps: number;
    currentEgressMbps: number;
    droppedPackets: number;
    activeSockets: number;
  };
  onFilterByHost: (ip: string) => void;
  onFilterByProtocol: (proto: ProtocolType) => void;
  onSelectAlert: (alert: SecurityAlert) => void;
}

export function OverviewView({
  packets,
  throughputHistory,
  nodes,
  alerts,
  stats,
  onFilterByHost,
  onFilterByProtocol,
  onSelectAlert,
}: OverviewViewProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TrafficThroughputSample | null>(null);

  // Compute protocol breakdown from recent packets
  const protocolCounts: Record<string, { count: number; bytes: number }> = {};
  let totalSampledBytes = 0;

  packets.forEach((p) => {
    if (!protocolCounts[p.protocol]) {
      protocolCounts[p.protocol] = { count: 0, bytes: 0 };
    }
    protocolCounts[p.protocol].count += 1;
    protocolCounts[p.protocol].bytes += p.length;
    totalSampledBytes += p.length;
  });

  const protocolList = Object.entries(protocolCounts)
    .map(([proto, data]) => ({
      protocol: proto as ProtocolType,
      count: data.count,
      bytes: data.bytes,
      pct: totalSampledBytes > 0 ? (data.bytes / totalSampledBytes) * 100 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);

  const protocolColors: Record<string, string> = {
    'TLS 1.3': 'bg-emerald-500',
    'TCP': 'bg-cyan-500',
    'HTTP/2': 'bg-blue-500',
    'DNS': 'bg-amber-500',
    'QUIC': 'bg-purple-500',
    'gRPC': 'bg-indigo-500',
    'SSH': 'bg-teal-500',
    'ICMP': 'bg-pink-500',
  };

  // SVG Chart Dimensions
  const chartWidth = 800;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  const highestThroughput = throughputHistory.length > 0
    ? Math.max(...throughputHistory.map((s) => Math.max(s.ingressMbps, s.egressMbps)))
    : 10;
  const maxMbps = Math.max(10, highestThroughput * 1.2);

  const getX = (index: number) => {
    const step = (chartWidth - paddingX * 2) / Math.max(1, throughputHistory.length - 1);
    return paddingX + index * step;
  };

  const getY = (val: number) => {
    const usableHeight = chartHeight - paddingY * 2;
    return chartHeight - paddingY - (val / maxMbps) * usableHeight;
  };

  const ingressPath = throughputHistory
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(s.ingressMbps).toFixed(1)}`)
    .join(' ');

  const egressPath = throughputHistory
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(s.egressMbps).toFixed(1)}`)
    .join(' ');

  const ingressArea = `${ingressPath} L ${getX(throughputHistory.length - 1)} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`;

  // Sort nodes by total activity (Top Talkers)
  const topTalkers = [...nodes]
    .sort((a, b) => b.bytesIn + b.bytesOut - (a.bytesIn + a.bytesOut))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 1. Quantitative KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Ingress Rate</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {stats.currentIngressMbps} <span className="text-xs font-normal text-slate-400">Mbps</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            Bandwidth in
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Egress Rate</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {stats.currentEgressMbps} <span className="text-xs font-normal text-slate-400">Mbps</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            Bandwidth out
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Captured Packets</span>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {stats.totalPackets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            {(stats.totalBytes / (1024 * 1024)).toFixed(2)} MB buffer
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Dropped / Blocked</span>
            <span className="text-[10px] text-rose-400 font-mono">ACL</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-300">
            {stats.droppedPackets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            {stats.totalPackets > 0
              ? `${((stats.droppedPackets / stats.totalPackets) * 100).toFixed(1)}% drop rate`
              : '0.0%'}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Sockets</span>
            <Server className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {stats.activeSockets}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            TCP / UDP sessions
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>IDS Anomaly Alerts</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-300">
            {alerts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            {alerts.filter((a) => a.severity === 'critical').length} Critical
          </div>
        </div>
      </div>

      {/* 2. Bandwidth Throughput Timeline Chart */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Real-time Ingress / Egress Throughput
            </h3>
            <div className="text-xs text-slate-400 mt-0.5">
              <span>Rolling 30-second window</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>1000ms sampling granularity</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              <span className="text-slate-300">Ingress</span>
              <span className="text-slate-400 tabular-nums">
                ({stats.currentIngressMbps} Mbps)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
              <span className="text-slate-300">Egress</span>
              <span className="text-slate-400 tabular-nums">
                ({stats.currentEgressMbps} Mbps)
              </span>
            </div>
          </div>
        </div>

        {/* SVG Waveform Canvas */}
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
              const val = (pct * maxMbps).toFixed(0);
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-500 font-mono"
                  >
                    {val}M
                  </text>
                </g>
              );
            })}

            {/* Ingress gradient fill */}
            <defs>
              <linearGradient id="ingressGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Ingress Area & Line */}
            <path d={ingressArea} fill="url(#ingressGrad)" />
            <path
              d={ingressPath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Egress Line */}
            <path
              d={egressPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.75"
              strokeLinecap="round"
            />

            {/* Interactive Data Points */}
            {throughputHistory.map((s, idx) => (
              <circle
                key={idx}
                cx={getX(idx)}
                cy={getY(s.ingressMbps)}
                r="3"
                className="fill-cyan-400 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                onMouseEnter={() => setHoveredPoint(s)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded shadow-lg pointer-events-none font-mono">
              <div>Time: {hoveredPoint.timeLabel}</div>
              <div className="text-cyan-400">In: {hoveredPoint.ingressMbps} Mbps</div>
              <div className="text-emerald-400">Out: {hoveredPoint.egressMbps} Mbps</div>
              <div className="text-slate-400">{hoveredPoint.packetsPerSecond} pkts/s</div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Two-Column Split: Protocol Breakdown & Top Talkers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Distribution */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Protocol Distribution Breakdown
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {protocolList.length} Protocols
            </span>
          </div>

          {/* Visual Stacked Bar */}
          <div className="w-full h-3 rounded bg-slate-800 flex overflow-hidden mb-4">
            {protocolList.map((p) => (
              <div
                key={p.protocol}
                style={{ width: `${Math.max(2, p.pct)}%` }}
                className={`${protocolColors[p.protocol] || 'bg-slate-500'} h-full transition-all`}
                title={`${p.protocol}: ${p.pct.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Protocol Items list */}
          <div className="space-y-2">
            {protocolList.map((p) => (
              <button
                key={p.protocol}
                onClick={() => onFilterByProtocol(p.protocol)}
                className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-800/60 transition-colors text-xs text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-sm ${protocolColors[p.protocol] || 'bg-slate-500'}`}
                  />
                  <span className="font-medium text-slate-300">{p.protocol}</span>
                </div>

                <div className="flex items-center gap-3 font-mono tabular-nums text-slate-400">
                  <span>{p.count} pkts</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-200">{(p.bytes / 1024).toFixed(1)} KB</span>
                  <span aria-hidden="true">·</span>
                  <span className="w-12 text-right font-semibold text-slate-300">
                    {p.pct.toFixed(1)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Top Talkers & Host Conversations */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Top Talkers & Endpoints
            </h3>
            <span className="text-xs text-slate-400">By bandwidth volume</span>
          </div>

          <div className="divide-y divide-slate-800/70">
            {topTalkers.map((node) => {
              const totalMb = ((node.bytesIn + node.bytesOut) / (1024 * 1024)).toFixed(2);
              return (
                <div
                  key={node.id}
                  className="py-2.5 flex items-center justify-between text-xs gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-200">
                        {node.ip}
                      </span>
                      {node.geo && (
                        <span className="text-slate-400 text-[11px]">
                          {node.geo.countryCode} · {node.geo.org}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {node.label}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-slate-200 font-semibold">{totalMb} MB</div>
                      <div className="text-[10px] text-slate-400">{node.packetsTotal} pkts</div>
                    </div>

                    <button
                      onClick={() => onFilterByHost(node.ip)}
                      title={`Filter packet stream by ${node.ip}`}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Active Threat Alerts Banner */}
      {alerts.length > 0 && (
        <div className="bg-[#161224] border border-rose-900/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-semibold text-rose-200">
                Active Security & IDS Detections ({alerts.length})
              </h4>
            </div>
            <span className="text-xs text-rose-400/80 font-mono">
              Live Signature Evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className="bg-[#1f152b] border border-rose-800/40 hover:border-rose-700/80 p-3 rounded cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] text-rose-400 font-mono mb-1">
                  <span className="uppercase font-semibold tracking-wider">
                    {alert.severity}
                  </span>
                  <span>{alert.mitreTag}</span>
                </div>
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {alert.title}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Source: {alert.sourceIp} → {alert.targetIp}
                </div>
                <div className="text-[11px] text-rose-300/80 mt-2 flex items-center gap-1">
                  <span>Inspect incident</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
