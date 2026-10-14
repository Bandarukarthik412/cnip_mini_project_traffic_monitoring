import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Shield,
  FileCode,
} from 'lucide-react';
import { Packet, ProtocolType } from '../types/network';

interface PacketStreamViewProps {
  packets: Packet[];
  initialFilter?: string;
  onBlockIp: (ip: string, reason: string) => void;
}

export function PacketStreamView({
  packets,
  initialFilter = '',
  onBlockIp,
}: PacketStreamViewProps) {
  const [filterQuery, setFilterQuery] = useState<string>(initialFilter);
  const [selectedPacketId, setSelectedPacketId] = useState<number | null>(
    packets.length > 0 ? packets[0].id : null
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'dissect' | 'hex' | 'json'>('dissect');

  // Expanded nodes in dissect tree
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    frame: true,
    eth: true,
    ip: true,
    transport: true,
    payload: true,
  });

  const toggleSection = (sec: string) => {
    setExpandedSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Filter evaluation logic
  const filteredPackets = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return packets;

    return packets.filter((p) => {
      // Protocol filter (e.g. proto == dns or proto:dns or dns)
      if (q.includes('proto ==') || q.includes('proto:')) {
        const targetProto = q.replace(/(proto\s*==|proto:)\s*/, '').trim();
        return p.protocol.toLowerCase().includes(targetProto);
      }

      // IP filter (e.g. ip.addr == 192.168.1.45 or ip:192.168.1.45)
      if (q.includes('ip.addr ==') || q.includes('ip:')) {
        const targetIp = q.replace(/(ip\.addr\s*==|ip:)\s*/, '').trim();
        return p.srcIp.includes(targetIp) || p.dstIp.includes(targetIp);
      }

      // Port filter (e.g. port == 443 or port:443)
      if (q.includes('port ==') || q.includes('port:')) {
        const targetPort = q.replace(/(port\s*==|port:)\s*/, '').trim();
        return p.srcPort.toString() === targetPort || p.dstPort.toString() === targetPort;
      }

      // Status blocked
      if (q === 'blocked' || q === 'status:blocked') {
        return p.status === 'blocked';
      }

      // Alert / Flagged
      if (q === 'alert' || q === 'flagged') {
        return Boolean(p.alert) || p.status === 'flagged';
      }

      // General substring search across all fields
      return (
        p.srcIp.toLowerCase().includes(q) ||
        p.dstIp.toLowerCase().includes(q) ||
        p.protocol.toLowerCase().includes(q) ||
        p.info.toLowerCase().includes(q) ||
        p.srcPort.toString().includes(q) ||
        p.dstPort.toString().includes(q)
      );
    });
  }, [packets, filterQuery]);

  // Active selected packet
  const selectedPacket = useMemo(() => {
    if (selectedPacketId === null) return packets[0] || null;
    return packets.find((p) => p.id === selectedPacketId) || packets[0] || null;
  }, [packets, selectedPacketId]);

  const handleCopyPacket = () => {
    if (!selectedPacket) return;
    navigator.clipboard.writeText(JSON.stringify(selectedPacket, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getProtocolBadgeColor = (proto: ProtocolType) => {
    switch (proto) {
      case 'TLS 1.3':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      case 'TCP':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60';
      case 'DNS':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'HTTP/2':
        return 'text-blue-400 bg-blue-950/40 border-blue-800/60';
      case 'QUIC':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/60';
      case 'gRPC':
        return 'text-indigo-400 bg-indigo-950/40 border-indigo-800/60';
      case 'SSH':
        return 'text-teal-400 bg-teal-950/40 border-teal-800/60';
      case 'ICMP':
        return 'text-pink-400 bg-pink-950/40 border-pink-800/60';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  const presets = [
    { label: 'All', query: '' },
    { label: 'TLS & HTTPS', query: 'proto:tls' },
    { label: 'DNS Queries', query: 'proto:dns' },
    { label: 'Blocked / Drops', query: 'blocked' },
    { label: 'Security Alerts', query: 'alert' },
    { label: 'Database (5432)', query: 'port:5432' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Filter Query & Presets Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Display filter (e.g. ip.addr == 192.168.1.45, proto == DNS, port == 443, alert)..."
              className="w-full bg-[#0a0e17] border border-slate-700/80 rounded pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-cyan-500/80"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick:
            </span>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setFilterQuery(preset.query)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  filterQuery === preset.query
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter stats indicator */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div>
            Showing <span className="text-slate-200 font-bold">{filteredPackets.length}</span> of{' '}
            <span className="text-slate-200">{packets.length}</span> packets in buffer
          </div>
          <div className="flex items-center gap-2">
            <span>Scrollable frame buffer</span>
            <span aria-hidden="true">·</span>
            <span>Real-time capture</span>
          </div>
        </div>
      </div>

      {/* 2. Packet List Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0a0e17] text-slate-400 border-b border-slate-800 sticky top-0 z-10 font-mono">
              <tr>
                <th className="py-2 px-3 w-14">No.</th>
                <th className="py-2 px-3 w-20">Time</th>
                <th className="py-2 px-3 w-40">Source</th>
                <th className="py-2 px-3 w-40">Destination</th>
                <th className="py-2 px-3 w-20">Protocol</th>
                <th className="py-2 px-3 w-16 text-right">Length</th>
                <th className="py-2 px-3">Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No packets match filter &ldquo;{filterQuery}&rdquo;
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt) => {
                  const isSelected = selectedPacket?.id === pkt.id;
                  const isBlocked = pkt.status === 'blocked';
                  const isFlagged = pkt.status === 'flagged' || Boolean(pkt.alert);

                  let rowBg = 'hover:bg-slate-800/40 cursor-pointer';
                  if (isSelected) {
                    rowBg = 'bg-cyan-950/50 border-l-2 border-cyan-400 text-white';
                  } else if (isBlocked) {
                    rowBg = 'bg-rose-950/20 text-rose-300/90 hover:bg-rose-950/30';
                  } else if (isFlagged) {
                    rowBg = 'bg-amber-950/20 text-amber-200/90 hover:bg-amber-950/30';
                  }

                  return (
                    <tr
                      key={pkt.id}
                      onClick={() => setSelectedPacketId(pkt.id)}
                      className={`transition-colors ${rowBg}`}
                    >
                      <td className="py-1.5 px-3 tabular-nums text-slate-500 font-semibold">
                        {pkt.id}
                      </td>
                      <td className="py-1.5 px-3 tabular-nums text-slate-400">
                        +{pkt.timeOffset.toFixed(3)}s
                      </td>
                      <td className="py-1.5 px-3 truncate text-slate-300">
                        {pkt.srcIp}:{pkt.srcPort}
                      </td>
                      <td className="py-1.5 px-3 truncate text-slate-300">
                        {pkt.dstIp}:{pkt.dstPort}
                      </td>
                      <td className="py-1.5 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.2 text-[10px] rounded border font-semibold ${getProtocolBadgeColor(
                            pkt.protocol
                          )}`}
                        >
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 tabular-nums text-right text-slate-400">
                        {pkt.length}
                      </td>
                      <td className="py-1.5 px-3 truncate max-w-md text-slate-300 font-sans">
                        {pkt.info}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Deep Packet Inspector Pane (Dissection & Raw Hex Dump) */}
      {selectedPacket && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
          {/* Header of Inspector */}
          <div className="bg-[#0a0e17] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-xs text-slate-200">
                Frame #{selectedPacket.id} Inspection
              </span>
              <span className="text-slate-500 text-xs">·</span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedPacket.protocol} · {selectedPacket.length} bytes · {selectedPacket.direction}
              </span>
            </div>

            {/* Inspector Mode Tabs & Action */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5 text-xs">
                <button
                  onClick={() => setActiveInspectorTab('dissect')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeInspectorTab === 'dissect'
                      ? 'bg-slate-800 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Protocol Hierarchy
                </button>
                <button
                  onClick={() => setActiveInspectorTab('hex')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeInspectorTab === 'hex'
                      ? 'bg-slate-800 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Hex & ASCII
                </button>
                <button
                  onClick={() => setActiveInspectorTab('json')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeInspectorTab === 'json'
                      ? 'bg-slate-800 text-cyan-300 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON Spec
                </button>
              </div>

              <button
                onClick={handleCopyPacket}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={() =>
                  onBlockIp(
                    selectedPacket.srcIp,
                    `Manual drop from packet inspection frame #${selectedPacket.id}`
                  )
                }
                title={`Block Source IP ${selectedPacket.srcIp}`}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded border border-rose-800/60 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Drop Host</span>
              </button>
            </div>
          </div>

          {/* Inspector Content */}
          <div className="p-4 text-xs font-mono">
            {activeInspectorTab === 'dissect' && (
              <div className="space-y-2 text-slate-300">
                {/* 1. Frame Layer */}
                <div className="border border-slate-800/80 rounded bg-[#0b101c]">
                  <button
                    onClick={() => toggleSection('frame')}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800/50 font-semibold text-slate-200"
                  >
                    {expandedSections.frame ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>Frame {selectedPacket.id}: {selectedPacket.length} bytes captured on interface eth0</span>
                  </button>
                  {expandedSections.frame && (
                    <div className="px-6 py-2 border-t border-slate-800/60 space-y-1 text-slate-400 text-[11px]">
                      <div>Interface id: 0 (eth0, 10Gbps VirtIO Network Adapter)</div>
                      <div>Encapsulation type: Ethernet (1)</div>
                      <div>Arrival Time: {new Date(selectedPacket.timestamp).toISOString()}</div>
                      <div>Time delta from previous captured frame: +0.024 seconds</div>
                      <div>Frame length: {selectedPacket.length} bytes ({selectedPacket.length * 8} bits)</div>
                    </div>
                  )}
                </div>

                {/* 2. Ethernet II Layer */}
                <div className="border border-slate-800/80 rounded bg-[#0b101c]">
                  <button
                    onClick={() => toggleSection('eth')}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800/50 font-semibold text-slate-200"
                  >
                    {expandedSections.eth ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>Ethernet II, Src: {selectedPacket.headers.ethernet.srcMac}, Dst: {selectedPacket.headers.ethernet.dstMac}</span>
                  </button>
                  {expandedSections.eth && (
                    <div className="px-6 py-2 border-t border-slate-800/60 space-y-1 text-slate-400 text-[11px]">
                      <div>Destination: {selectedPacket.headers.ethernet.dstMac} (Broadcast / Gateway Interface)</div>
                      <div>Source: {selectedPacket.headers.ethernet.srcMac} (Hardware NIC Node)</div>
                      <div>Type: {selectedPacket.headers.ethernet.type}</div>
                    </div>
                  )}
                </div>

                {/* 3. Internet Protocol Version 4 */}
                <div className="border border-slate-800/80 rounded bg-[#0b101c]">
                  <button
                    onClick={() => toggleSection('ip')}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800/50 font-semibold text-slate-200"
                  >
                    {expandedSections.ip ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>Internet Protocol Version 4, Src: {selectedPacket.srcIp}, Dst: {selectedPacket.dstIp}</span>
                  </button>
                  {expandedSections.ip && (
                    <div className="px-6 py-2 border-t border-slate-800/60 space-y-1 text-slate-400 text-[11px]">
                      <div>Version: 4</div>
                      <div>Header Length: 20 bytes (5)</div>
                      <div>Differentiated Services Field: {selectedPacket.headers.ip.tos}</div>
                      <div>Identification: {selectedPacket.headers.ip.identification}</div>
                      <div>Time to Live: {selectedPacket.headers.ip.ttl} hops</div>
                      <div>Protocol: {selectedPacket.headers.ip.protocol}</div>
                      <div>Header Checksum: {selectedPacket.headers.ip.checksum}</div>
                      <div>Source Address: {selectedPacket.srcIp}</div>
                      <div>Destination Address: {selectedPacket.dstIp}</div>
                    </div>
                  )}
                </div>

                {/* 4. Transport Layer (TCP/UDP/ICMP) */}
                <div className="border border-slate-800/80 rounded bg-[#0b101c]">
                  <button
                    onClick={() => toggleSection('transport')}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800/50 font-semibold text-slate-200"
                  >
                    {expandedSections.transport ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>
                      {selectedPacket.protocol.includes('UDP') || selectedPacket.protocol === 'DNS' || selectedPacket.protocol === 'QUIC'
                        ? 'User Datagram Protocol'
                        : selectedPacket.protocol === 'ICMP'
                        ? 'Internet Control Message Protocol'
                        : 'Transmission Control Protocol'}
                      , Src Port: {selectedPacket.srcPort}, Dst Port: {selectedPacket.dstPort}
                    </span>
                  </button>
                  {expandedSections.transport && (
                    <div className="px-6 py-2 border-t border-slate-800/60 space-y-1 text-slate-400 text-[11px]">
                      <div>Source Port: {selectedPacket.srcPort}</div>
                      <div>Destination Port: {selectedPacket.dstPort}</div>
                      {selectedPacket.headers.transport.seq !== undefined && (
                        <div>Sequence Number: {selectedPacket.headers.transport.seq} (relative sequence number)</div>
                      )}
                      {selectedPacket.headers.transport.ack !== undefined && (
                        <div>Acknowledgment Number: {selectedPacket.headers.transport.ack}</div>
                      )}
                      <div>Window Size: {selectedPacket.headers.transport.windowSize}</div>
                      <div>Checksum: {selectedPacket.headers.transport.checksum} [verified]</div>
                      {selectedPacket.tcpFlags && (
                        <div>
                          Flags: [
                          {Object.entries(selectedPacket.tcpFlags)
                            .filter(([, v]) => v)
                            .map(([k]) => k.toUpperCase())
                            .join(', ')}
                          ]
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Application Payload Layer */}
                <div className="border border-slate-800/80 rounded bg-[#0b101c]">
                  <button
                    onClick={() => toggleSection('payload')}
                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800/50 font-semibold text-cyan-300"
                  >
                    {expandedSections.payload ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>Application Protocol: {selectedPacket.protocol} ({selectedPacket.headers.payload.byteCount} bytes)</span>
                  </button>
                  {expandedSections.payload && (
                    <div className="px-6 py-2 border-t border-slate-800/60 space-y-1 text-slate-300 text-[11px]">
                      <div>Payload Preview: {selectedPacket.headers.payload.preview}</div>
                      <div>Content-Type: {selectedPacket.headers.payload.contentType}</div>
                      <div className="text-slate-400 pt-1">Information string: {selectedPacket.info}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Raw Hex & ASCII Viewer */}
            {activeInspectorTab === 'hex' && (
              <div className="bg-[#080c14] border border-slate-800 rounded p-4 overflow-x-auto text-xs leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2">
                      Offset & Hex Bytes
                    </div>
                    <pre className="text-cyan-400/90 whitespace-pre font-mono">
                      {selectedPacket.rawHex}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2">
                      Decoded ASCII Representation
                    </div>
                    <pre className="text-emerald-400/90 whitespace-pre font-mono">
                      {selectedPacket.rawAscii}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* JSON Specification */}
            {activeInspectorTab === 'json' && (
              <div className="bg-[#080c14] border border-slate-800 rounded p-4 overflow-x-auto text-xs">
                <div className="flex items-center gap-2 text-slate-400 mb-2">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>RFC-Standard PCAP Encapsulation Object</span>
                </div>
                <pre className="text-slate-300 whitespace-pre font-mono text-[11px]">
                  {JSON.stringify(selectedPacket, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
