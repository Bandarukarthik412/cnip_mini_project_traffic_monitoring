import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import { FirewallRule } from '../types/network';

interface FirewallViewProps {
  rules: FirewallRule[];
  onToggleRule: (ruleId: string) => void;
  onAddRule: (rule: Omit<FirewallRule, 'id' | 'hitCount' | 'createdAt'>) => void;
  onDeleteRule: (ruleId: string) => void;
  droppedPacketsCount: number;
}

export function FirewallView({
  rules,
  onToggleRule,
  onAddRule,
  onDeleteRule,
  droppedPacketsCount,
}: FirewallViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [action, setAction] = useState<'DROP' | 'ALLOW'>('DROP');
  const [protocol, setProtocol] = useState<'ANY' | 'TCP' | 'UDP' | 'ICMP'>('ANY');
  const [sourceIp, setSourceIp] = useState('*');
  const [sourcePort, setSourcePort] = useState('*');
  const [destIp, setDestIp] = useState('*');
  const [destPort, setDestPort] = useState('*');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onAddRule({
      description: description.trim(),
      action,
      protocol,
      sourceIp: sourceIp.trim() || '*',
      sourcePort: sourcePort.trim() || '*',
      destIp: destIp.trim() || '*',
      destPort: destPort.trim() || '*',
      enabled: true,
    });

    // Reset form
    setDescription('');
    setSourceIp('*');
    setSourcePort('*');
    setDestIp('*');
    setDestPort('*');
    setShowAddModal(false);
  };

  const totalHits = rules.reduce((acc, r) => acc + r.hitCount, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header & Firewall Metrics */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Access Control Lists (ACL) & Stateful Firewall
            </h3>
            <div className="text-xs text-slate-400 mt-0.5">
              <span>Kernel packet filtering engine</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Evaluated in order for all ingress / egress frames</span>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Firewall Rule</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-[#0a0e17] rounded border border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">Configured Rules</div>
            <div className="text-sm font-bold font-mono tabular-nums text-slate-200">
              {rules.length} total ({rules.filter((r) => r.enabled).length} active)
            </div>
          </div>

          <div className="p-3 bg-[#0a0e17] rounded border border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">Total Filter Matches</div>
            <div className="text-sm font-bold font-mono tabular-nums text-cyan-400">
              {totalHits} hits
            </div>
          </div>

          <div className="p-3 bg-[#0a0e17] rounded border border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">Live Dropped Packets</div>
            <div className="text-sm font-bold font-mono tabular-nums text-rose-400">
              {droppedPacketsCount} blocked
            </div>
          </div>
        </div>
      </div>

      {/* 2. Rules Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0a0e17] text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-2.5 px-3 w-16">Status</th>
                <th className="py-2.5 px-3 w-20">Action</th>
                <th className="py-2.5 px-3">Rule Description</th>
                <th className="py-2.5 px-3 w-24">Proto</th>
                <th className="py-2.5 px-3 w-40">Source IP : Port</th>
                <th className="py-2.5 px-3 w-40">Dest IP : Port</th>
                <th className="py-2.5 px-3 w-24 text-right">Hit Count</th>
                <th className="py-2.5 px-3 w-16 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    !rule.enabled ? 'opacity-50' : ''
                  }`}
                >
                  {/* Enabled toggle */}
                  <td className="py-2 px-3">
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {rule.enabled ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  </td>

                  {/* Action badge */}
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.action === 'DROP'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/70'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/70'
                      }`}
                    >
                      {rule.action}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="py-2 px-3 font-sans text-slate-200">
                    <div className="font-medium">{rule.description}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Rule ID: {rule.id} · Created {rule.createdAt}
                    </div>
                  </td>

                  {/* Protocol */}
                  <td className="py-2 px-3 text-slate-300 font-semibold">
                    {rule.protocol}
                  </td>

                  {/* Source */}
                  <td className="py-2 px-3 text-slate-300">
                    {rule.sourceIp}:{rule.sourcePort}
                  </td>

                  {/* Destination */}
                  <td className="py-2 px-3 text-slate-300">
                    {rule.destIp}:{rule.destPort}
                  </td>

                  {/* Hit count */}
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-cyan-400">
                    {rule.hitCount}
                  </td>

                  {/* Delete */}
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      title="Delete firewall rule"
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-slate-100">
                  Add New Firewall ACL Rule
                </h4>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Rule Description / Intent
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block unauthenticated database access from external IP"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0a0e17] border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Filter Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as 'DROP' | 'ALLOW')}
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="DROP">DROP (Block matching traffic)</option>
                    <option value="ALLOW">ALLOW (Explicit permit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Protocol</label>
                  <select
                    value={protocol}
                    onChange={(e) =>
                      setProtocol(e.target.value as 'ANY' | 'TCP' | 'UDP' | 'ICMP')
                    }
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ANY">ANY</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Source IP Address</label>
                  <input
                    type="text"
                    value={sourceIp}
                    onChange={(e) => setSourceIp(e.target.value)}
                    placeholder="* or 194.26.29.112"
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Source Port</label>
                  <input
                    type="text"
                    value={sourcePort}
                    onChange={(e) => setSourcePort(e.target.value)}
                    placeholder="* or 52410"
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Destination IP</label>
                  <input
                    type="text"
                    value={destIp}
                    onChange={(e) => setDestIp(e.target.value)}
                    placeholder="* or 192.168.1.102"
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Destination Port</label>
                  <input
                    type="text"
                    value={destPort}
                    onChange={(e) => setDestPort(e.target.value)}
                    placeholder="* or 443"
                    className="w-full bg-[#0a0e17] border border-slate-700 rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded text-xs transition-colors shadow-sm"
                >
                  Install Rule in Firewall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
