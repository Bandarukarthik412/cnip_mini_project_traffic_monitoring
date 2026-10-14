export type ProtocolType =
  | 'TCP'
  | 'UDP'
  | 'TLS 1.3'
  | 'HTTP/2'
  | 'DNS'
  | 'SSH'
  | 'ICMP'
  | 'QUIC'
  | 'gRPC';

export type TrafficDirection = 'inbound' | 'outbound' | 'internal';

export type PacketStatus =
  | 'nominal'
  | 'retransmission'
  | 'blocked'
  | 'flagged'
  | 'handshake'
  | 'rst';

export interface TcpFlags {
  syn?: boolean;
  ack?: boolean;
  fin?: boolean;
  rst?: boolean;
  psh?: boolean;
  urg?: boolean;
}

export interface GeoLocation {
  country: string;
  countryCode: string;
  city: string;
  asn: string;
  org: string;
  lat: number;
  lng: number;
}

export interface PacketHeaderEthernet {
  srcMac: string;
  dstMac: string;
  type: string;
}

export interface PacketHeaderIp {
  version: 4 | 6;
  headerLength: number;
  ttl: number;
  protocol: string;
  checksum: string;
  tos: string;
  identification: string;
}

export interface PacketHeaderTransport {
  srcPort: number;
  dstPort: number;
  seq?: number;
  ack?: number;
  windowSize?: number;
  checksum: string;
  flags?: TcpFlags;
}

export interface PacketHeaderPayload {
  preview: string;
  byteCount: number;
  contentType?: string;
  protocolSpecific?: Record<string, string | number>;
}

export interface Packet {
  id: number;
  timestamp: number; // Unix ms
  timeOffset: number; // seconds from capture start
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  protocol: ProtocolType;
  length: number; // bytes
  info: string;
  tcpFlags?: TcpFlags;
  direction: TrafficDirection;
  status: PacketStatus;
  rawHex: string;
  rawAscii: string;
  headers: {
    ethernet: PacketHeaderEthernet;
    ip: PacketHeaderIp;
    transport: PacketHeaderTransport;
    payload: PacketHeaderPayload;
  };
  alert?: SecurityAlert;
  geo?: GeoLocation;
}

export interface SecurityAlert {
  id: string;
  timestamp: number;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'Reconnaissance' | 'DoS / DDoS' | 'Exfiltration' | 'Cleartext Credential' | 'Brute Force' | 'Suspicious C2';
  mitreTag: string;
  rule: string;
  sourceIp: string;
  targetIp: string;
  description: string;
  packetId: number;
  status: 'active' | 'mitigated' | 'dismissed';
}

export interface FirewallRule {
  id: string;
  description: string;
  action: 'DROP' | 'ALLOW';
  protocol: 'ANY' | 'TCP' | 'UDP' | 'ICMP';
  sourceIp: string; // CIDR or single IP or *
  sourcePort: string; // port or *
  destIp: string;
  destPort: string;
  enabled: boolean;
  hitCount: number;
  createdAt: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  type: 'gateway' | 'server' | 'database' | 'workstation' | 'external' | 'suspicious';
  subnet: string;
  bytesIn: number;
  bytesOut: number;
  packetsTotal: number;
  activeSockets: number;
  geo?: GeoLocation;
  x?: number;
  y?: number;
}

export interface TrafficThroughputSample {
  timestamp: number;
  timeLabel: string;
  ingressMbps: number;
  egressMbps: number;
  packetsPerSecond: number;
  droppedPerSecond: number;
}

export type ScenarioType =
  | 'nominal'
  | 'syn_flood'
  | 'port_scan'
  | 'dns_tunneling'
  | 'data_exfil'
  | 'api_spike';
