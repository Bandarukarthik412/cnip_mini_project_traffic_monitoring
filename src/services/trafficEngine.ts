import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Packet,
  SecurityAlert,
  FirewallRule,
  NetworkNode,
  TrafficThroughputSample,
  ScenarioType,
} from '../types/network';
import {
  KNOWN_NODES,
  DEFAULT_FIREWALL_RULES,
  createSynthesizedPacket,
  generateInitialPacketHistory,
} from './packetData';

export interface TrafficEngineState {
  packets: Packet[];
  alerts: SecurityAlert[];
  firewallRules: FirewallRule[];
  nodes: NetworkNode[];
  throughputHistory: TrafficThroughputSample[];
  isCapturing: boolean;
  captureRate: number; // packets per second (1, 5, 15, 30)
  activeScenario: ScenarioType;
  stats: {
    totalPackets: number;
    totalBytes: number;
    currentIngressMbps: number;
    currentEgressMbps: number;
    droppedPackets: number;
    activeSockets: number;
  };
}

export function useTrafficEngine() {
  const [isCapturing, setIsCapturing] = useState<boolean>(true);
  const [captureRate, setCaptureRate] = useState<number>(10); // 10 packets per sec
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('nominal');
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>(DEFAULT_FIREWALL_RULES);
  
  const [packets, setPackets] = useState<Packet[]>(() => generateInitialPacketHistory(35));
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  
  // Rolling throughput history (60 seconds)
  const [throughputHistory, setThroughputHistory] = useState<TrafficThroughputSample[]>(() => {
    const initial: TrafficThroughputSample[] = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const t = now - i * 1000;
      const d = new Date(t);
      initial.push({
        timestamp: t,
        timeLabel: `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`,
        ingressMbps: Number((12.4 + Math.sin(i / 3) * 4.2 + (Math.random() * 2)).toFixed(2)),
        egressMbps: Number((8.2 + Math.cos(i / 4) * 3.1 + (Math.random() * 1.5)).toFixed(2)),
        packetsPerSecond: Math.floor(180 + Math.random() * 40),
        droppedPerSecond: Math.floor(Math.random() * 3)
      });
    }
    return initial;
  });

  const [nodes, setNodes] = useState<NetworkNode[]>(() => {
    return Object.entries(KNOWN_NODES).map(([ip, def], index) => {
      // Calculate realistic positions for graph
      const isInternal = ip.startsWith('192.168');
      const isGateway = ip === '192.168.1.1';
      return {
        id: `node-${ip.replace(/\./g, '-')}`,
        label: def.label,
        ip,
        type: def.type,
        subnet: def.subnet,
        bytesIn: 1024 * (500 + index * 120),
        bytesOut: 1024 * (300 + index * 90),
        packetsTotal: 240 + index * 45,
        activeSockets: isGateway ? 34 : Math.max(1, 12 - index),
        geo: def.geo,
        x: isGateway ? 450 : isInternal ? 200 + (index % 3) * 160 : 700 + ((index % 4) * 140),
        y: isGateway ? 240 : isInternal ? 100 + (index % 4) * 100 : 80 + (index % 5) * 85
      };
    });
  });

  const captureStartTime = useRef<number>(Date.now() - 35 * 400);
  const activeScenarioRef = useRef<ScenarioType>(activeScenario);
  const firewallRulesRef = useRef<FirewallRule[]>(firewallRules);
  const isCapturingRef = useRef<boolean>(isCapturing);
  const captureRateRef = useRef<number>(captureRate);

  // Sync refs
  useEffect(() => {
    activeScenarioRef.current = activeScenario;
  }, [activeScenario]);

  useEffect(() => {
    firewallRulesRef.current = firewallRules;
  }, [firewallRules]);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  useEffect(() => {
    captureRateRef.current = captureRate;
  }, [captureRate]);

  // Check packet against firewall rules
  const evaluateFirewall = useCallback((pkt: Packet, rules: FirewallRule[]): { isBlocked: boolean; matchedRuleId?: string } => {
    for (const rule of rules) {
      if (!rule.enabled) continue;

      // Protocol match
      if (rule.protocol !== 'ANY' && rule.protocol !== pkt.protocol) {
        continue;
      }

      // Source IP match
      if (rule.sourceIp !== '*' && rule.sourceIp !== pkt.srcIp) {
        continue;
      }

      // Destination IP match
      if (rule.destIp !== '*' && rule.destIp !== pkt.dstIp) {
        continue;
      }

      // Dest Port match
      if (rule.destPort !== '*' && parseInt(rule.destPort, 10) !== pkt.dstPort) {
        continue;
      }

      if (rule.action === 'DROP') {
        return { isBlocked: true, matchedRuleId: rule.id };
      }
    }
    return { isBlocked: false };
  }, []);

  // Dispatch incoming packet
  const handleNewPacket = useCallback((pkt: Packet) => {
    const fwResult = evaluateFirewall(pkt, firewallRulesRef.current);
    
    if (fwResult.isBlocked) {
      pkt.status = 'blocked';
      pkt.info = `[BLOCKED BY ACL: rule-${fwResult.matchedRuleId}] ${pkt.info}`;
      
      // increment rule hitCount
      setFirewallRules(prev =>
        prev.map(r => r.id === fwResult.matchedRuleId ? { ...r, hitCount: r.hitCount + 1 } : r)
      );
    }

    setPackets(prev => {
      // keep max 300 packets in memory for smooth performance
      const next = [pkt, ...prev.slice(0, 299)];
      return next;
    });

    if (pkt.alert && !fwResult.isBlocked) {
      setAlerts(prev => [pkt.alert!, ...prev.slice(0, 49)]);
    }

    // Update node metrics
    setNodes(prev =>
      prev.map(n => {
        let bIn = n.bytesIn;
        let bOut = n.bytesOut;
        let pkts = n.packetsTotal;
        if (n.ip === pkt.dstIp) {
          bIn += pkt.length;
          pkts += 1;
        }
        if (n.ip === pkt.srcIp) {
          bOut += pkt.length;
          pkts += 1;
        }
        return { ...n, bytesIn: bIn, bytesOut: bOut, packetsTotal: pkts };
      })
    );
  }, [evaluateFirewall]);

  // Main capture timer loop
  useEffect(() => {
    if (!isCapturing) return;

    const intervalMs = Math.max(25, Math.floor(1000 / captureRate));
    const timer = setInterval(() => {
      if (!isCapturingRef.current) return;
      const pkt = createSynthesizedPacket(
        { scenario: activeScenarioRef.current },
        captureStartTime.current
      );
      handleNewPacket(pkt);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isCapturing, captureRate, handleNewPacket]);

  // 1-second rolling throughput metric updater
  useEffect(() => {
    const metricInterval = setInterval(() => {
      const now = Date.now();
      const d = new Date(now);
      const label = `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      
      const scenario = activeScenarioRef.current;
      const baseMultiplier = scenario === 'syn_flood' ? 3.5 : scenario === 'data_exfil' ? 2.8 : 1.0;
      
      const inMbps = Number((Math.max(1, (isCapturingRef.current ? captureRateRef.current * 0.85 * baseMultiplier : 0.2) + Math.sin(now / 5000) * 2 + Math.random())).toFixed(2));
      const outMbps = Number((Math.max(1, (isCapturingRef.current ? captureRateRef.current * 0.55 * baseMultiplier : 0.1) + Math.cos(now / 4000) * 1.5 + Math.random())).toFixed(2));
      const pps = isCapturingRef.current ? Math.floor(captureRateRef.current * 18 * baseMultiplier + Math.random() * 15) : 4;
      const dropped = scenario === 'syn_flood' ? Math.floor(pps * 0.45) : Math.floor(Math.random() * 2);

      setThroughputHistory(prev => {
        const next = [...prev.slice(1), {
          timestamp: now,
          timeLabel: label,
          ingressMbps: inMbps,
          egressMbps: outMbps,
          packetsPerSecond: pps,
          droppedPerSecond: dropped
        }];
        return next;
      });
    }, 1000);

    return () => clearInterval(metricInterval);
  }, []);

  // Rule management helpers
  const toggleRule = useCallback((ruleId: string) => {
    setFirewallRules(prev =>
      prev.map(r => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const addRule = useCallback((rule: Omit<FirewallRule, 'id' | 'hitCount' | 'createdAt'>) => {
    const newRule: FirewallRule = {
      ...rule,
      id: `fw-${Date.now().toString().slice(-4)}`,
      hitCount: 0,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setFirewallRules(prev => [newRule, ...prev]);
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setFirewallRules(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  const blockIpImmediately = useCallback((targetIp: string, reason: string) => {
    const rule: FirewallRule = {
      id: `fw-block-${Date.now().toString().slice(-4)}`,
      description: `Auto-mitigation: ${reason}`,
      action: 'DROP',
      protocol: 'ANY',
      sourceIp: targetIp,
      sourcePort: '*',
      destIp: '*',
      destPort: '*',
      enabled: true,
      hitCount: 0,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    setFirewallRules(prev => [rule, ...prev]);
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const clearBuffer = useCallback(() => {
    setPackets([]);
    captureStartTime.current = Date.now();
  }, []);

  const resetAll = useCallback(() => {
    setPackets(generateInitialPacketHistory(25));
    setAlerts([]);
    captureStartTime.current = Date.now() - 10000;
  }, []);

  // Compute aggregate statistics
  const totalBytes = packets.reduce((acc, p) => acc + p.length, 0);
  const droppedCount = packets.filter(p => p.status === 'blocked').length;
  const latestThroughput = throughputHistory[throughputHistory.length - 1] || {
    ingressMbps: 0,
    egressMbps: 0,
    packetsPerSecond: 0,
    droppedPerSecond: 0
  };

  return {
    packets,
    alerts,
    firewallRules,
    nodes,
    throughputHistory,
    isCapturing,
    captureRate,
    activeScenario,
    stats: {
      totalPackets: packets.length,
      totalBytes,
      currentIngressMbps: latestThroughput.ingressMbps,
      currentEgressMbps: latestThroughput.egressMbps,
      droppedPackets: droppedCount,
      activeSockets: 48 + (activeScenario === 'syn_flood' ? 240 : 0)
    },
    setIsCapturing,
    setCaptureRate,
    setActiveScenario,
    toggleRule,
    addRule,
    deleteRule,
    blockIpImmediately,
    dismissAlert,
    clearBuffer,
    resetAll
  };
}
