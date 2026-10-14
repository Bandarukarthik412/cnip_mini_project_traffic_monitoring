import { useState, useMemo } from 'react';
import {
  Server,
  Shield,
  ShieldAlert,
  Globe,
  Database,
  Laptop,
  ArrowRight,
  Search,
} from 'lucide-react';
import { NetworkNode, Packet } from '../types/network';

interface TopologyViewProps {
  nodes: NetworkNode[];
  recentPackets: Packet[];
  onSelectHost: (ip: string) => void;
  onBlockIp: (ip: string, reason: string) => void;
}

export function TopologyView({
  nodes,
  recentPackets,
  onSelectHost,
  onBlockIp,
}: TopologyViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    nodes[0]?.id || null
  );

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0] || null;
  }, [nodes, selectedNodeId]);

  // Derive active connections between hosts from recent packets
  const activeFlows = useMemo(() => {
    const flowMap = new Map<string, { src: string; dst: string; protocol: string; bytes: number; count: number; isBlocked: boolean; isSuspicious: boolean }>();
    
    recentPackets.slice(0, 40).forEach((pkt) => {
      const key = `${pkt.srcIp}->${pkt.dstIp}`;
      const existing = flowMap.get(key);
      const isBlocked = pkt.status === 'blocked';
      const isSuspicious = pkt.status === 'flagged' || Boolean(pkt.alert);
      
      if (existing) {
        existing.bytes += pkt.length;
        existing.count += 1;
        if (isBlocked) existing.isBlocked = true;
        if (isSuspicious) existing.isSuspicious = true;
      } else {
        flowMap.set(key, {
          src: pkt.srcIp,
          dst: pkt.dstIp,
          protocol: pkt.protocol,
          bytes: pkt.length,
          count: 1,
          isBlocked,
          isSuspicious,
        });
      }
    });

    return Array.from(flowMap.values());
  }, [recentPackets]);

  const getNodeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'gateway':
        return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'database':
        return <Database className="w-4 h-4 text-emerald-400" />;
      case 'workstation':
        return <Laptop className="w-4 h-4 text-blue-400" />;
      case 'server':
        return <Server className="w-4 h-4 text-purple-400" />;
      case 'suspicious':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'external':
      default:
        return <Globe className="w-4 h-4 text-teal-400" />;
    }
  };

  const getNodeBorder = (node: NetworkNode) => {
    if (node.id === selectedNode?.id) {
      return 'border-cyan-400 ring-2 ring-cyan-500/30 bg-[#162138]';
    }
    if (node.type === 'suspicious') {
      return 'border-rose-700/80 bg-rose-950/20 hover:border-rose-500';
    }
    if (node.type === 'gateway') {
      return 'border-cyan-600/80 bg-cyan-950/20 hover:border-cyan-400';
    }
    return 'border-slate-800 bg-[#0f172a] hover:border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* 1. Topology Map Header */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Interactive Network Infrastructure & Flow Topology
            </h3>
            <div className="text-xs text-slate-400 mt-0.5">
              <span>Dynamic node clusters</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Click any node to inspect telemetry or filter stream</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Internal Subnet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>Cloud / External</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Flagged / Hostile</span>
            </div>
          </div>
        </div>

        {/* 2. Visual Node Topology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${getNodeBorder(
                  node
                )}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#0a0e17] rounded">
                      {getNodeIcon(node.type)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 truncate max-w-[150px]">
                        {node.label}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {node.ip}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                  <div>
                    In: <span className="text-slate-300">{(node.bytesIn / 1024).toFixed(0)} KB</span>
                  </div>
                  <div>
                    Out: <span className="text-slate-300">{(node.bytesOut / 1024).toFixed(0)} KB</span>
                  </div>
                  <div className="text-slate-500">
                    {node.packetsTotal} pkts
                  </div>
                </div>

                {node.geo && (
                  <div className="mt-1 text-[10px] text-slate-500 font-mono truncate">
                    {node.geo.city}, {node.geo.country} · {node.geo.asn}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Node Detail & Flow Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Telemetry Inspector */}
        {selectedNode && (
          <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Host Node Specification
              </h4>
              <span className="text-xs text-slate-400 font-mono capitalize">
                {selectedNode.type}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0a0e17] rounded border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">IPv4 Address:</span>
                  <span className="text-slate-200 font-bold">{selectedNode.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Subnet Mask:</span>
                  <span className="text-slate-300">{selectedNode.subnet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hostname / Role:</span>
                  <span className="text-slate-300 font-sans">{selectedNode.label}</span>
                </div>
                {selectedNode.geo && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-slate-300">
                        {selectedNode.geo.city}, {selectedNode.geo.country}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ASN & Provider:</span>
                      <span className="text-slate-300 truncate max-w-[160px]">
                        {selectedNode.geo.asn} ({selectedNode.geo.org})
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Active TCP Sockets:</span>
                  <span className="text-slate-200 tabular-nums">
                    {selectedNode.activeSockets} concurrent
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Data Transferred:</span>
                  <span className="text-cyan-400 tabular-nums font-semibold">
                    {((selectedNode.bytesIn + selectedNode.bytesOut) / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onSelectHost(selectedNode.ip)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 rounded text-xs font-semibold transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Filter Packet Stream for this Host</span>
                </button>

                {selectedNode.type === 'suspicious' && (
                  <button
                    onClick={() =>
                      onBlockIp(
                        selectedNode.ip,
                        `Blocked hostile node ${selectedNode.label} (${selectedNode.ip})`
                      )
                    }
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/70 rounded text-xs font-semibold transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Drop Host Traffic in Firewall ACL</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Conversation Flows Matrix */}
        <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                Active Host-to-Host Flow Conversations
              </h4>
              <div className="text-xs text-slate-400 mt-0.5">
                Real-time active connection sessions
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {activeFlows.length} Active Streams
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0a0e17] text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-2 px-3">Conversation (Source → Destination)</th>
                  <th className="py-2 px-3">Protocol</th>
                  <th className="py-2 px-3 text-right">Packets</th>
                  <th className="py-2 px-3 text-right">Volume</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {activeFlows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No active stream flows observed in current sample
                    </td>
                  </tr>
                ) : (
                  activeFlows.map((flow, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <span className="text-slate-300">{flow.src}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-300">{flow.dst}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-300 font-semibold">{flow.protocol}</span>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-400">
                        {flow.count}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-200">
                        {(flow.bytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-2 px-3">
                        {flow.isBlocked ? (
                          <span className="text-rose-400 font-semibold">Blocked</span>
                        ) : flow.isSuspicious ? (
                          <span className="text-amber-400 font-semibold">Flagged</span>
                        ) : (
                          <span className="text-emerald-400">Nominal</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
