/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, CheckCircle, Ban, Wallet, 
  ArrowUpRight, ArrowDownLeft, Plus, Search, 
  Building, MapPin, Mail, Phone, X, RefreshCw
} from 'lucide-react';
import { Agent } from '../types';

interface AgentManagementProps {
  onBalanceUpdated: () => void;
}

export default function AgentManagement({ onBalanceUpdated }: AgentManagementProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Agent Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newRole, setNewRole] = useState<'agent' | 'admin'>('agent');
  
  // Wallet Adjustment Form State
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [selectedAgentForWallet, setSelectedAgentForWallet] = useState<Agent | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentDesc, setAdjustmentDesc] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (res.ok) {
        setAgents(data);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgentStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/agents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newName || !newEmail || !newPhone || !newShopName || !newCity) {
      setFormError('Saare fields fill karna zaroori hai.');
      return;
    }

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          phone: newPhone,
          shopName: newShopName,
          city: newCity,
          role: newRole
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess(`New Agent "${data.shopName}" successfully register ho gaya hai.`);
        setAgents(prev => [...prev, data]);
        // Reset
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewShopName('');
        setNewCity('');
        setTimeout(() => {
          setShowAddForm(false);
          setFormSuccess(null);
        }, 1500);
      } else {
        setFormError(data.error || 'Failed to create agent.');
      }
    } catch (err) {
      setFormError('Network connection failed.');
    }
  };

  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedAgentForWallet) return;
    const amountNum = Number(adjustmentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Kripya positive amount enter karein.');
      return;
    }

    try {
      const res = await fetch('/api/wallet/credit-debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentForWallet.id,
          type: adjustmentType,
          amount: amountNum,
          description: adjustmentDesc || `Admin Manual ${adjustmentType === 'credit' ? 'Top-up' : 'Deduction'}`
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess(`Agent Wallet balance adjustment successful! New balance: ₹${data.agentBalance}`);
        setAgents(prev => prev.map(a => a.id === selectedAgentForWallet.id ? { ...a, walletBalance: data.agentBalance } : a));
        onBalanceUpdated();
        setAdjustmentAmount('');
        setAdjustmentDesc('');
        setTimeout(() => {
          setShowWalletForm(false);
          setFormSuccess(null);
          setSelectedAgentForWallet(null);
        }, 1500);
      } else {
        setFormError(data.error || 'Failed to adjust wallet.');
      }
    } catch (err) {
      setFormError('Network error occurred.');
    }
  };

  const filteredAgents = agents.filter(agent => {
    const q = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      agent.shopName.toLowerCase().includes(q) ||
      agent.city.toLowerCase().includes(q) ||
      agent.phone.includes(q)
    );
  });

  return (
    <div id="agent-management-root" className="space-y-6">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents by name, shop or city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
        
        <button
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setShowAddForm(true);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Onboard New Agent
        </button>
      </div>

      {/* Agents Grid List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 p-6">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-semibold text-slate-800">Koi agents nahi mile</h4>
          <p className="text-sm text-slate-500">Aap naye agent register kar sakte hain.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAgents.map(agent => (
            <div 
              key={agent.id} 
              className={`p-5 bg-white rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
                agent.status === 'inactive' ? 'border-rose-100 opacity-75' : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{agent.name}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building className="h-3.5 w-3.5" />
                      {agent.shopName}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    agent.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-rose-50 text-rose-600'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                {/* Contact and address */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {agent.phone}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {agent.city}
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {agent.email}
                  </div>
                </div>
              </div>

              {/* Wallet and Quick Action bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Wallet Balance</span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    ₹{agent.walletBalance.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFormError(null);
                      setFormSuccess(null);
                      setSelectedAgentForWallet(agent);
                      setShowWalletForm(true);
                    }}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Load/Deduct Wallet Balance"
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Wallet Adjust
                  </button>

                  <button
                    onClick={() => toggleAgentStatus(agent.id, agent.status)}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      agent.status === 'active'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {agent.status === 'active' ? (
                      <>
                        <Ban className="h-3.5 w-3.5" />
                        Suspend
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" />
                        Activate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD NEW AGENT FORM */}
      {showAddForm && (
        <div id="add-agent-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 animate-slide-up">
            
            <button 
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <UserPlus className="text-blue-600" />
              Onboard New SaaS Agent
            </h3>
            <p className="text-xs text-slate-500 mb-4">Indian FinTech Aggregator onboarding compliant verification flow</p>

            {formError && <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs mb-3 font-semibold">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs mb-3 font-semibold">{formSuccess}</div>}

            <form onSubmit={handleAddAgent} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Agent Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Agency/Shop Name</label>
                  <input
                    type="text"
                    value={newShopName}
                    onChange={e => setNewShopName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Seva Kendra"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10 digit mobile"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">City / State</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Patna"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="name@agency.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase">Role Capability</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="agent">Standard Commission Agent (Agent)</option>
                  <option value="admin">Platform Manager / Supervisor (Admin)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm mt-2 transition-colors cursor-pointer"
              >
                Register Agent & Issue KYC
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: WALLET ADJUSTMENT FORM */}
      {showWalletForm && selectedAgentForWallet && (
        <div id="wallet-adjust-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 animate-slide-up">
            
            <button 
              onClick={() => {
                setShowWalletForm(false);
                setSelectedAgentForWallet(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <Wallet className="text-blue-600" />
              Direct Wallet Adjustment
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Modifying Wallet of agent: <strong className="text-slate-800">{selectedAgentForWallet.name}</strong>
            </p>

            {formError && <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs mb-3 font-semibold">{formError}</div>}
            {formSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs mb-3 font-semibold">{formSuccess}</div>}

            <form onSubmit={handleWalletAdjustment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-2">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('credit')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      adjustmentType === 'credit'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Credit (Top-up balance)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('debit')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                      adjustmentType === 'debit'
                        ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-100'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <X className="h-4 w-4" />
                    Debit (Charge wallet)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={e => setAdjustmentAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Audit Log Reason / Remarks</label>
                <input
                  type="text"
                  value={adjustmentDesc}
                  onChange={e => setAdjustmentDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Cash collected at branch / UPI top-up"
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2.5 font-semibold rounded-xl text-sm mt-2 transition-colors cursor-pointer ${
                  adjustmentType === 'credit'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-50'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-50'
                }`}
              >
                Execute {adjustmentType === 'credit' ? 'Credit' : 'Debit'} of ₹{Number(adjustmentAmount || 0).toLocaleString('en-IN')}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
