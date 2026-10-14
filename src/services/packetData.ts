import {
  Packet,
  GeoLocation,
  ProtocolType,
  TrafficDirection,
  SecurityAlert,
  FirewallRule,
  NetworkNode,
  ScenarioType,
} from '../types/network';

export const KNOWN_NODES: Record<string, { label: string; type: NetworkNode['type']; subnet: string; geo?: GeoLocation }> = {
  '192.168.1.1': {
    label: 'Core Router & Gateway',
    type: 'gateway',
    subnet: '192.168.1.0/24',
  },
  '192.168.1.45': {
    label: 'SecOps Workstation',
    type: 'workstation',
    subnet: '192.168.1.0/24',
  },
  '192.168.1.88': {
    label: 'PostgreSQL Primary Cluster',
    type: 'database',
    subnet: '192.168.1.0/24',
  },
  '192.168.1.102': {
    label: 'App Server & API Gateway',
    type: 'server',
    subnet: '192.168.1.0/24',
  },
  '192.168.1.150': {
    label: 'Ingress K8s Node',
    type: 'server',
    subnet: '192.168.1.0/24',
  },
  '1.1.1.1': {
    label: 'Cloudflare Anycast DNS',
    type: 'external',
    subnet: '1.1.1.0/24',
    geo: { country: 'Australia', countryCode: 'AU', city: 'Sydney', asn: 'AS13335', org: 'Cloudflare, Inc.', lat: -33.8688, lng: 151.2093 }
  },
  '8.8.8.8': {
    label: 'Google Public DNS',
    type: 'external',
    subnet: '8.8.8.0/24',
    geo: { country: 'United States', countryCode: 'US', city: 'Mountain View', asn: 'AS15169', org: 'Google LLC', lat: 37.3861, lng: -122.0839 }
  },
  '142.250.190.46': {
    label: 'Google Cloud Platform',
    type: 'external',
    subnet: '142.250.0.0/16',
    geo: { country: 'United States', countryCode: 'US', city: 'Council Bluffs', asn: 'AS15169', org: 'Google LLC', lat: 41.2619, lng: -95.8608 }
  },
  '13.107.42.16': {
    label: 'Microsoft Azure Services',
    type: 'external',
    subnet: '13.104.0.0/14',
    geo: { country: 'United States', countryCode: 'US', city: 'Redmond', asn: 'AS8075', org: 'Microsoft Corp', lat: 47.6740, lng: -122.1215 }
  },
  '104.16.132.229': {
    label: 'Cloudflare CDN Edge',
    type: 'external',
    subnet: '104.16.0.0/12',
    geo: { country: 'United States', countryCode: 'US', city: 'San Francisco', asn: 'AS13335', org: 'Cloudflare, Inc.', lat: 37.7749, lng: -122.4194 }
  },
  '151.101.65.140': {
    label: 'Fastly Global CDN',
    type: 'external',
    subnet: '151.101.0.0/16',
    geo: { country: 'United States', countryCode: 'US', city: 'New York', asn: 'AS54113', org: 'Fastly, Inc.', lat: 40.7128, lng: -74.0060 }
  },
  '185.220.101.5': {
    label: 'Tor Exit Node Relay',
    type: 'suspicious',
    subnet: '185.220.101.0/24',
    geo: { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', asn: 'AS208323', org: 'Tor Privacy Network', lat: 50.1109, lng: 8.6821 }
  },
  '45.154.255.89': {
    label: 'Reconnaissance Scanner Bot',
    type: 'suspicious',
    subnet: '45.154.0.0/16',
    geo: { country: 'Bulgaria', countryCode: 'BG', city: 'Sofia', asn: 'AS44050', org: 'Shodan Scanner Host', lat: 42.6977, lng: 23.3219 }
  },
  '194.26.29.112': {
    label: 'Mirai Command & Control',
    type: 'suspicious',
    subnet: '194.26.0.0/16',
    geo: { country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam', asn: 'AS57523', org: 'Bulletproof VPS Host', lat: 52.3676, lng: 4.9041 }
  }
};

export const DEFAULT_FIREWALL_RULES: FirewallRule[] = [
  {
    id: 'fw-1',
    description: 'Block inbound SSH from untrusted public subnets',
    action: 'DROP',
    protocol: 'TCP',
    sourceIp: '*',
    sourcePort: '*',
    destIp: '192.168.1.102',
    destPort: '22',
    enabled: true,
    hitCount: 42,
    createdAt: '2026-10-14 00:00:00'
  },
  {
    id: 'fw-2',
    description: 'Drop traffic from known Mirai C2 infrastructure',
    action: 'DROP',
    protocol: 'ANY',
    sourceIp: '194.26.29.112',
    sourcePort: '*',
    destIp: '*',
    destPort: '*',
    enabled: true,
    hitCount: 128,
    createdAt: '2026-10-14 00:05:00'
  },
  {
    id: 'fw-3',
    description: 'Drop Shodan & unauthorized network scanners',
    action: 'DROP',
    protocol: 'TCP',
    sourceIp: '45.154.255.89',
    sourcePort: '*',
    destIp: '*',
    destPort: '*',
    enabled: true,
    hitCount: 89,
    createdAt: '2026-10-14 00:10:00'
  },
  {
    id: 'fw-4',
    description: 'Allow internal database connections from API Gateway',
    action: 'ALLOW',
    protocol: 'TCP',
    sourceIp: '192.168.1.102',
    sourcePort: '*',
    destIp: '192.168.1.88',
    destPort: '5432',
    enabled: true,
    hitCount: 1420,
    createdAt: '2026-10-14 00:00:00'
  }
];

// Helper to generate realistic hex string and ascii view
export function generateHexAndAscii(length: number, seedStr: string): { hex: string; ascii: string } {
  const bytes: number[] = [];
  const textChars = seedStr.split('').map(c => c.charCodeAt(0));
  
  for (let i = 0; i < Math.min(length, 128); i++) {
    if (i < textChars.length) {
      bytes.push(textChars[i]);
    } else {
      // realistic pseudo-random bytes
      bytes.push((i * 17 + seedStr.length * 31 + (i % 7) * 41) % 256);
    }
  }

  // format into standard Wireshark 16-bytes per line
  const linesHex: string[] = [];
  const linesAscii: string[] = [];

  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const hexRow = chunk.map(b => b.toString(16).padStart(2, '0')).join(' ');
    const asciiRow = chunk.map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
    const offset = i.toString(16).padStart(4, '0');
    
    linesHex.push(`${offset}   ${hexRow.padEnd(48, ' ')}`);
    linesAscii.push(asciiRow);
  }

  return {
    hex: linesHex.join('\n'),
    ascii: linesAscii.join('\n')
  };
}

let packetCounter = 1000;

export function createSynthesizedPacket(
  options: Partial<Packet> & { scenario?: ScenarioType } = {},
  startTime: number = Date.now() - 30000
): Packet {
  packetCounter += 1;
  const now = Date.now();
  const timeOffset = Math.max(0, (now - startTime) / 1000);

  // default profile is nominal web/cloud traffic
  const scenarios: ScenarioType = options.scenario || 'nominal';

  let srcIp = '192.168.1.45';
  let dstIp = '142.250.190.46';
  let srcPort = 52410 + (packetCounter % 5000);
  let dstPort = 443;
  let protocol: ProtocolType = 'TLS 1.3';
  let length = 1240;
  let info = 'Application Data [TLS 1.3] 1186 bytes';
  let direction: TrafficDirection = 'outbound';
  let status: Packet['status'] = 'nominal';
  let alert: SecurityAlert | undefined;
  let tcpFlags = { syn: false, ack: true, psh: true, fin: false, rst: false, urg: false };
  let payloadStr = '{"status":"ok","channel":"telemetry","data":{"metrics":{"load":0.24}}}';

  if (scenarios === 'syn_flood') {
    // SYN flood from distributed or attacker IP
    srcIp = (packetCounter % 3 === 0) ? '194.26.29.112' : `185.${packetCounter % 255}.${(packetCounter * 3) % 255}.14`;
    dstIp = '192.168.1.102';
    srcPort = 1024 + (packetCounter % 60000);
    dstPort = 443;
    protocol = 'TCP';
    length = 64;
    tcpFlags = { syn: true, ack: false, psh: false, fin: false, rst: false, urg: false };
    info = `[SYN] Seq=0 Win=1024 Len=0 MSS=1460 (SYN Flood Pattern)`;
    direction = 'inbound';
    status = 'flagged';
    payloadStr = 'SYN_FLOOD_ANOMALY';
    alert = {
      id: `alt-${packetCounter}`,
      timestamp: now,
      title: 'SYN Flood Exhaustion Anomaly',
      severity: 'critical',
      category: 'DoS / DDoS',
      mitreTag: 'T1498: Denial of Service',
      rule: 'SURICATA_TCP_SYN_FLOOD_THRESHOLD_EXCEEDED',
      sourceIp: srcIp,
      targetIp: dstIp,
      description: `High-frequency TCP SYN packet without completion handshake. Targets Ingress API Gateway ${dstIp}:443`,
      packetId: packetCounter,
      status: 'active'
    };
  } else if (scenarios === 'port_scan') {
    srcIp = '45.154.255.89';
    dstIp = '192.168.1.102';
    srcPort = 41200;
    const scanPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 3306, 5432, 6379, 8080, 9200];
    dstPort = scanPorts[packetCounter % scanPorts.length];
    protocol = 'TCP';
    length = 58;
    tcpFlags = { syn: true, ack: false, psh: false, fin: false, rst: false, urg: false };
    info = `[SYN] Seq=0 Win=1024 Len=0 -> Destination Port ${dstPort}`;
    direction = 'inbound';
    status = 'flagged';
    payloadStr = `SCAN_PROBE_PORT_${dstPort}`;
    if (packetCounter % 3 === 0) {
      alert = {
        id: `alt-${packetCounter}`,
        timestamp: now,
        title: 'Network Port Reconnaissance Scan',
        severity: 'high',
        category: 'Reconnaissance',
        mitreTag: 'T1046: Network Service Discovery',
        rule: 'IDS_PORT_SWEEP_SEQUENTIAL_PORTS',
        sourceIp: srcIp,
        targetIp: dstIp,
        description: `External IP ${srcIp} probing sequential privileged ports [${dstPort}] on internal gateway.`,
        packetId: packetCounter,
        status: 'active'
      };
    }
  } else if (scenarios === 'dns_tunneling') {
    srcIp = '192.168.1.45';
    dstIp = '1.1.1.1';
    srcPort = 53341;
    dstPort = 53;
    protocol = 'DNS';
    length = 512;
    const chunk = `aW50ZWwudXNlcnMuZGF0YXBheWxvYWQuY2hhbms=${packetCounter}`;
    info = `Standard query 0x7b12 TXT ${chunk}.tunnel.c2-exfil.xyz`;
    direction = 'outbound';
    status = 'flagged';
    payloadStr = `DNS TXT Query: ${chunk}.tunnel.c2-exfil.xyz`;
    alert = {
      id: `alt-${packetCounter}`,
      timestamp: now,
      title: 'DNS Tunneling / Data Exfiltration',
      severity: 'critical',
      category: 'Exfiltration',
      mitreTag: 'T1048: Exfiltration Over Alternative Protocol',
      rule: 'ZEEK_ANOMALOUS_DNS_TXT_QUERY_LENGTH',
      sourceIp: srcIp,
      targetIp: dstIp,
      description: `High entropy base64 encoded TXT request to suspicious apex domain tunnel.c2-exfil.xyz`,
      packetId: packetCounter,
      status: 'active'
    };
  } else if (scenarios === 'data_exfil') {
    srcIp = '192.168.1.88';
    dstIp = '185.220.101.5';
    srcPort = 49152;
    dstPort = 8443;
    protocol = 'TLS 1.3';
    length = 1514;
    info = 'Application Data [Encrypted Stream] 1460 bytes to Tor Exit';
    direction = 'outbound';
    status = 'flagged';
    payloadStr = 'BULK_BINARY_PAYLOAD_EXFILTRATION_TOR_ROUTED';
    alert = {
      id: `alt-${packetCounter}`,
      timestamp: now,
      title: 'Database Outbound Spike to Tor Exit',
      severity: 'critical',
      category: 'Exfiltration',
      mitreTag: 'T1071.001: Web Protocols C2',
      rule: 'IDS_DATABASE_OUTBOUND_NON_RFC1918',
      sourceIp: srcIp,
      targetIp: dstIp,
      description: `PostgreSQL host ${srcIp} initiating direct encrypted sessions to known Tor exit node ${dstIp}`,
      packetId: packetCounter,
      status: 'active'
    };
  } else {
    // Nominal mix: rotate between HTTP/2, TLS 1.3, DNS, SSH, gRPC, ICMP, Database
    const mix = packetCounter % 8;
    switch (mix) {
      case 0:
        protocol = 'DNS';
        srcIp = '192.168.1.45';
        dstIp = '1.1.1.1';
        srcPort = 58210;
        dstPort = 53;
        length = 78;
        info = 'Standard query 0x3f21 A api.cloudflare.com';
        payloadStr = 'Standard query 0x3f21 A api.cloudflare.com IN 1';
        break;
      case 1:
        protocol = 'HTTP/2';
        srcIp = '192.168.1.102';
        dstIp = '104.16.132.229';
        srcPort = 44210;
        dstPort = 443;
        length = 890;
        info = 'GET /api/v2/telemetry/heartbeat HTTP/2';
        payloadStr = 'GET /api/v2/telemetry/heartbeat HTTP/2.0\r\nHost: api.cloudflare.com\r\nUser-Agent: NetPulse/3.4\r\nAccept: application/json\r\n';
        break;
      case 2:
        protocol = 'TLS 1.3';
        srcIp = '142.250.190.46';
        dstIp = '192.168.1.45';
        srcPort = 443;
        dstPort = 52410;
        length = 1420;
        info = 'Application Data [TLS 1.3] (Encrypted payload, 1374 bytes)';
        direction = 'inbound';
        payloadStr = 'TLSv1.3 Encrypted Handshake Message & Application Data';
        break;
      case 3:
        protocol = 'gRPC';
        srcIp = '192.168.1.102';
        dstIp = '192.168.1.88';
        srcPort = 59812;
        dstPort = 5432;
        length = 460;
        info = 'Query: SELECT * FROM transactions WHERE tenant_id = $1 LIMIT 50';
        direction = 'internal';
        payloadStr = 'Query: SELECT * FROM transactions WHERE tenant_id = $1 LIMIT 50 [postgres wire 3.0]';
        break;
      case 4:
        protocol = 'QUIC';
        srcIp = '192.168.1.45';
        dstIp = '151.101.65.140';
        srcPort = 51433;
        dstPort = 443;
        length = 1200;
        info = '1-RTT Protected Payload, DCID=7a2c914e Packet Number=142';
        payloadStr = 'QUIC Short Header, Flags=0x40, DCID=7a2c914e, Stream 4 Offset 0';
        break;
      case 5:
        protocol = 'ICMP';
        srcIp = '192.168.1.45';
        dstIp = '8.8.8.8';
        srcPort = 0;
        dstPort = 0;
        length = 64;
        info = 'Echo (ping) request id=0x0042 seq=8 ttl=64';
        payloadStr = 'abcdefghijklmnopqrstuvwabcdefghi';
        break;
      case 6:
        protocol = 'SSH';
        srcIp = '192.168.1.45';
        dstIp = '192.168.1.102';
        srcPort = 49120;
        dstPort = 22;
        length = 148;
        info = 'Encrypted packet (len=96, mac=16) SSH-2.0';
        direction = 'internal';
        payloadStr = 'SSHv2 Encrypted Session Transport Data';
        break;
      case 7:
        protocol = 'TCP';
        srcIp = '13.107.42.16';
        dstIp = '192.168.1.150';
        srcPort = 443;
        dstPort = 49300;
        length = 66;
        info = '[ACK] Seq=1420 Ack=891 Win=131072 Len=0';
        direction = 'inbound';
        tcpFlags = { syn: false, ack: true, psh: false, fin: false, rst: false, urg: false };
        payloadStr = 'TCP ACK confirmation packet';
        break;
    }
  }

  // Override options if supplied
  if (options.srcIp) srcIp = options.srcIp;
  if (options.dstIp) dstIp = options.dstIp;
  if (options.srcPort !== undefined) srcPort = options.srcPort;
  if (options.dstPort !== undefined) dstPort = options.dstPort;
  if (options.protocol) protocol = options.protocol;
  if (options.length) length = options.length;
  if (options.info) info = options.info;
  if (options.status) status = options.status;
  if (options.direction) direction = options.direction;

  const hexAscii = generateHexAndAscii(length, payloadStr);

  const geo = KNOWN_NODES[srcIp]?.geo || KNOWN_NODES[dstIp]?.geo;

  return {
    id: packetCounter,
    timestamp: now,
    timeOffset: Number(timeOffset.toFixed(3)),
    srcIp,
    srcPort,
    dstIp,
    dstPort,
    protocol,
    length,
    info,
    tcpFlags,
    direction,
    status,
    rawHex: hexAscii.hex,
    rawAscii: hexAscii.ascii,
    headers: {
      ethernet: {
        srcMac: '52:54:00:12:34:56',
        dstMac: '00:1A:2B:3C:4D:5E',
        type: 'IPv4 (0x0800)'
      },
      ip: {
        version: 4,
        headerLength: 20,
        ttl: 64,
        protocol: protocol === 'ICMP' ? 'ICMP (1)' : protocol === 'UDP' || protocol === 'DNS' || protocol === 'QUIC' ? 'UDP (17)' : 'TCP (6)',
        checksum: '0x3a7f [correct]',
        tos: '0x00 (Routine)',
        identification: `0x${((packetCounter * 13) % 65535).toString(16).padStart(4, '0')}`
      },
      transport: {
        srcPort,
        dstPort,
        seq: (packetCounter * 1420) % 4294967295,
        ack: (packetCounter * 890) % 4294967295,
        windowSize: 65535,
        checksum: '0x9b42',
        flags: tcpFlags
      },
      payload: {
        preview: payloadStr.substring(0, 80),
        byteCount: length - 40,
        contentType: protocol === 'HTTP/2' ? 'application/json' : protocol === 'DNS' ? 'dns-wire-format' : 'application/octet-stream',
        protocolSpecific: {
          'Protocol': protocol,
          'Frame Number': packetCounter,
          'Capture Interface': 'eth0 (10Gbps VirtIO)'
        }
      }
    },
    alert,
    geo
  };
}

export function generateInitialPacketHistory(count: number = 30): Packet[] {
  const list: Packet[] = [];
  const baseTime = Date.now() - count * 400;
  for (let i = 0; i < count; i++) {
    const pkt = createSynthesizedPacket({
      scenario: i === 12 ? 'port_scan' : i === 24 ? 'syn_flood' : 'nominal'
    }, baseTime);
    pkt.timestamp = baseTime + i * 400;
    pkt.timeOffset = Number((i * 0.4).toFixed(3));
    list.push(pkt);
  }
  return list;
}
