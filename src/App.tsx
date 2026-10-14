import { useState, useCallback } from 'react';
import { useTrafficEngine } from './services/trafficEngine';
import { Header, ActiveTab } from './components/Header';
import { CaptureToolbar } from './components/CaptureToolbar';
import { OverviewView } from './components/OverviewView';
import { PacketStreamView } from './components/PacketStreamView';
import { TopologyView } from './components/TopologyView';
import { SecurityView } from './components/SecurityView';
import { FirewallView } from './components/FirewallView';
import { ProtocolType, SecurityAlert, Packet } from './types/network';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [streamFilter, setStreamFilter] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const {
    packets,
    alerts,
    firewallRules,
    nodes,
    throughputHistory,
    isCapturing,
    captureRate,
    activeScenario,
    stats,
    setIsCapturing,
    setCaptureRate,
    setActiveScenario,
    toggleRule,
    addRule,
    deleteRule,
    blockIpImmediately,
    dismissAlert,
    clearBuffer,
    resetAll,
  } = useTrafficEngine();

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((current) => (current === msg ? null : current));
    }, 3500);
  }, []);

  const handleBlockIp = useCallback((ip: string, reason: string) => {
    blockIpImmediately(ip, reason);
    showNotification(`Firewall ACL rule applied: Dropping traffic from ${ip}`);
  }, [blockIpImmediately, showNotification]);

  const handleFilterByHost = useCallback((ip: string) => {
    setStreamFilter(`ip.addr == ${ip}`);
    setActiveTab('stream');
  }, []);

  const handleFilterByProtocol = useCallback((proto: ProtocolType) => {
    setStreamFilter(`proto == ${proto}`);
    setActiveTab('stream');
  }, []);

  const handleSelectAlert = useCallback((alert: SecurityAlert) => {
    setStreamFilter(`ip.addr == ${alert.sourceIp}`);
    setActiveTab('stream');
  }, []);

  const handleInspectPacket = useCallback((packetId: number) => {
    setStreamFilter(`${packetId}`);
    setActiveTab('stream');
  }, []);

  const handleImportPackets = useCallback((imported: Packet[]) => {
    showNotification(`Imported ${imported.length} packets from network trace`);
    setActiveTab('stream');
  }, [showNotification]);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-200 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* 1. Header (Strict Top Bar Contract: Brand, Nav links, Capture CTA) */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCapturing={isCapturing}
        onToggleCapture={() => setIsCapturing((prev) => !prev)}
        alertCount={alerts.length}
      />

      {/* 2. Interactive Telemetry Toolbar & Attack Injector */}
      <CaptureToolbar
        isCapturing={isCapturing}
        captureRate={captureRate}
        onSetCaptureRate={setCaptureRate}
        activeScenario={activeScenario}
        onSetScenario={(sc) => {
          setActiveScenario(sc);
          if (sc !== 'nominal') {
            showNotification(`Scenario injected: ${sc.replace('_', ' ').toUpperCase()}`);
          }
        }}
        packetCount={packets.length}
        onClearBuffer={clearBuffer}
        onResetAll={resetAll}
        packets={packets}
        onImportPackets={handleImportPackets}
      />

      {/* 3. Toast Feedback */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#162138] border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-lg shadow-2xl text-xs font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* 4. Main Content Area */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6">
        {activeTab === 'overview' && (
          <OverviewView
            packets={packets}
            throughputHistory={throughputHistory}
            nodes={nodes}
            alerts={alerts}
            stats={stats}
            onFilterByHost={handleFilterByHost}
            onFilterByProtocol={handleFilterByProtocol}
            onSelectAlert={handleSelectAlert}
          />
        )}

        {activeTab === 'stream' && (
          <PacketStreamView
            packets={packets}
            initialFilter={streamFilter}
            onBlockIp={handleBlockIp}
          />
        )}

        {activeTab === 'topology' && (
          <TopologyView
            nodes={nodes}
            recentPackets={packets}
            onSelectHost={handleFilterByHost}
            onBlockIp={handleBlockIp}
          />
        )}

        {activeTab === 'security' && (
          <SecurityView
            alerts={alerts}
            onDismissAlert={dismissAlert}
            onBlockIp={handleBlockIp}
            onInspectPacket={handleInspectPacket}
            onTriggerScenario={(sc) => {
              setActiveScenario(sc);
              showNotification(`Injected attack scenario: ${sc.replace('_', ' ').toUpperCase()}`);
            }}
          />
        )}

        {activeTab === 'firewall' && (
          <FirewallView
            rules={firewallRules}
            onToggleRule={toggleRule}
            onAddRule={(rule) => {
              addRule(rule);
              showNotification(`Added firewall rule: ${rule.description}`);
            }}
            onDeleteRule={(id) => {
              deleteRule(id);
              showNotification('Firewall rule deleted');
            }}
            droppedPacketsCount={stats.droppedPackets}
          />
        )}
      </main>

      {/* 5. Minimal Human Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 bg-[#0a0e17] text-slate-500 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span>NetScope Sentinel Engine</span>
          <span aria-hidden="true">·</span>
          <span>RFC-793 / IEEE 802.3 Telemetry Protocol</span>
          <span aria-hidden="true">·</span>
          <span>Interface eth0</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setStreamFilter('');
              setActiveTab('stream');
            }}
            className="hover:text-slate-300 transition-colors"
          >
            Packet Dissector
          </button>
          <button
            onClick={() => setActiveTab('firewall')}
            className="hover:text-slate-300 transition-colors"
          >
            Access Rules
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className="hover:text-slate-300 transition-colors"
          >
            MITRE Taxonomy
          </button>
        </div>
      </footer>
    </div>
  );
}
