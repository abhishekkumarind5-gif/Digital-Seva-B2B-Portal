/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Fingerprint, Coins, Users, Sliders, History, Wallet, 
  Smartphone, Lightbulb, Train, ShieldCheck, Pin, PinOff, 
  Grid, Plus, RefreshCw, AlertCircle, Check, BookOpen, 
  Plane, Layers, Settings, CreditCard, ArrowRight, ChevronRight,
  TrendingUp, Activity, BarChart3, HelpCircle, X, ShieldAlert,
  Laptop, QrCode, Download, Upload
} from 'lucide-react';
import { ServiceItem, ServiceCategory, DashboardStats, WalletTransaction } from './types';
import ServiceForms from './components/ServiceForms';
import AgentManagement from './components/AgentManagement';
import CommissionSettings from './components/CommissionSettings';
import TransactionsHistory from './components/TransactionsHistory';

export default function App() {
  // Navigation & Role States
  const [activeTab, setActiveTab] = useState<'home' | 'agents' | 'commissions' | 'history'>('home');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [userRole, setUserRole] = useState<'agent' | 'admin'>('agent');
  const [agentsList, setAgentsList] = useState<any[]>([]);
  const [activeAgentId, setActiveAgentId] = useState<string>('agent-1');

  // Business States
  const [stats, setStats] = useState<DashboardStats>({
    totalVolume: 0,
    totalCommission: 0,
    walletBalance: 0,
    successRate: 100,
    transactionCount: 0
  });

  const [topUpModal, setTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  // UPI QR Code States
  const [upiQrModal, setUpiQrModal] = useState(false);
  const [upiAmount, setUpiAmount] = useState('1000');
  const [upiStatus, setUpiStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [recentUpiTransactions, setRecentUpiTransactions] = useState<WalletTransaction[]>([]);

  // UPI Config & Custom QR States
  const [upiId, setUpiId] = useState(() => localStorage.getItem('customUpiId') || 'digitalb2b@paytm');
  const [upiMerchantName, setUpiMerchantName] = useState(() => localStorage.getItem('customMerchantName') || 'Digital Seva Portal');
  const [upiQrMode, setUpiQrMode] = useState<'dynamic' | 'custom'>(() => (localStorage.getItem('upiQrMode') as 'dynamic' | 'custom') || 'dynamic');
  const [customQrImage, setCustomQrImage] = useState(() => localStorage.getItem('customQrImage') || '');
  const [upiModalTab, setUpiModalTab] = useState<'pay' | 'settings' | 'history'>('pay');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [upiSearchQuery, setUpiSearchQuery] = useState('');
  const [activeQrSessionId, setActiveQrSessionId] = useState<string | null>(null);
  const [isPollingPayment, setIsPollingPayment] = useState(false);

  const handleDownloadQr = async () => {
    setDownloadingQr(true);
    try {
      if (upiQrMode === 'custom' && customQrImage) {
        const link = document.createElement('a');
        link.href = customQrImage;
        link.download = `UPI-QR-₹${upiAmount || '1000'}-custom.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiMerchantName)}&am=${upiAmount || '1000'}&cu=INR&tn=AgentWalletTopup`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `UPI-QR-₹${upiAmount || '1000'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiMerchantName)}&am=${upiAmount || '1000'}&cu=INR&tn=AgentWalletTopup`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
      const link = document.createElement('a');
      link.href = qrUrl;
      link.target = '_blank';
      link.download = `UPI-QR-₹${upiAmount || '1000'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingQr(false);
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setCustomQrImage(base64String);
      localStorage.setItem('customQrImage', base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('customUpiId', upiId);
    localStorage.setItem('customMerchantName', upiMerchantName);
    localStorage.setItem('upiQrMode', upiQrMode);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // Trigger history component update
  const [auditTrigger, setAuditTrigger] = useState<number>(Date.now());

  const handleUpiVerify = async () => {
    const amt = Number(upiAmount);
    if (isNaN(amt) || amt <= 0) return;

    setUpiStatus('verifying');
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt })
      });
      if (res.ok) {
        setUpiStatus('success');
        setAuditTrigger(Date.now());
        setTimeout(() => {
          setUpiQrModal(false);
          setUpiStatus('idle');
          setUpiAmount('1000');
        }, 2200);
      } else {
        setUpiStatus('idle');
      }
    } catch (err) {
      console.error('UPI Verification error:', err);
      setUpiStatus('idle');
    }
  };

  const fetchRecentUpiPayments = async () => {
    try {
      const res = await fetch(`/api/wallet-history?agentId=${activeAgentId}`);
      if (res.ok) {
        const data: WalletTransaction[] = await res.json();
        const upiOnly = data.filter(tx => 
          tx.type === 'credit' && 
          (tx.description.includes('UPI') || tx.description.includes('Gateway'))
        );
        setRecentUpiTransactions(upiOnly);
      }
    } catch (err) {
      console.error('Error fetching recent UPI payments:', err);
    }
  };

  // Real-Time Auto-Checking UPI Payment Session Lifecycle
  useEffect(() => {
    if (!upiQrModal || upiModalTab !== 'pay') {
      setActiveQrSessionId(null);
      setIsPollingPayment(false);
      return;
    }

    let isMounted = true;
    const startQrSession = async () => {
      try {
        const res = await fetch('/api/wallet/qr-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(upiAmount) || 1000, agentId: activeAgentId })
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && isMounted) {
          setActiveQrSessionId(data.session.id);
          setIsPollingPayment(true);
        }
      } catch (err) {
        console.error('Error starting QR session:', err);
      }
    };

    startQrSession();

    return () => {
      isMounted = false;
    };
  }, [upiQrModal, upiAmount, upiModalTab, activeAgentId]);

  // Poll server for session state updates
  useEffect(() => {
    if (!activeQrSessionId || !isPollingPayment) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/wallet/qr-session-status?sessionId=${activeQrSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          if (data.status === 'success') {
            clearInterval(pollInterval);
            setIsPollingPayment(false);
            setUpiStatus('success');
            setAuditTrigger(Date.now());
            fetchMe();
            fetchRecentUpiPayments();
            
            setTimeout(() => {
              setUpiQrModal(false);
              setUpiStatus('idle');
              setUpiAmount('1000');
              setActiveQrSessionId(null);
            }, 2400);
          } else if (data.status === 'failed') {
            clearInterval(pollInterval);
            setIsPollingPayment(false);
            setUpiStatus('idle');
          }
        }
      } catch (err) {
        console.error('Error polling QR status:', err);
      }
    }, 2000); // poll every 2 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [activeQrSessionId, isPollingPayment]);

  // Dynamic Dashboard - Pin/Unpin state
  const [services, setServices] = useState<ServiceItem[]>([
    { id: 'aeps', category: 'banking', name: 'AePS Cash Withdrawal', description: 'Withdraw money using customer fingerprint & Aadhaar link', icon: 'Fingerprint', path: 'banking/aeps', isPinned: true },
    { id: 'dmt', category: 'banking', name: 'DMT Money Transfer', description: 'Instant money remittance to any bank account in India', icon: 'Coins', path: 'banking/dmt', isPinned: true },
    { id: 'microatm', category: 'banking', name: 'Micro ATM Withdrawal', description: 'Debit card cash withdrawal using dynamic bluetooth device', icon: 'CreditCard', path: 'banking/microatm', isPinned: false },
    { id: 'recharge', category: 'utility', name: 'Mobile & DTH Recharge', description: 'Instant prepaid recharges for Jio, Airtel, VI, and DTH boards', icon: 'Smartphone', path: 'utility/recharge', isPinned: true },
    { id: 'bbps', category: 'utility', name: 'BBPS Utility Bill Pay', description: 'Unified bill payments for electricity, water, gas, & FASTags', icon: 'Lightbulb', path: 'utility/bbps', isPinned: true },
    { id: 'health', category: 'insurance', name: 'Health Insurance Policy', description: 'Compare & buy custom health quotes from leading insurers', icon: 'ShieldCheck', path: 'insurance/health', isPinned: false },
    { id: 'auto', category: 'insurance', name: 'Auto & Bike Insurance', description: 'Instant auto insurance quotes & digital policy delivery', icon: 'Layers', path: 'insurance/auto', isPinned: false },
    { id: 'irctc', category: 'travel', name: 'IRCTC Train Booking', description: 'Authorized agent IRCTC ticket booking with live updates', icon: 'Train', path: 'travel/irctc', isPinned: false },
    { id: 'flight', category: 'travel', name: 'Flight Ticket Booking', description: 'Book domestic and international flights at wholesale commissions', icon: 'Plane', path: 'travel/flight', isPinned: false },
    { id: 'pan', category: 'egov', name: 'NSDL PAN Card', description: 'Apply for fresh or corrected PAN cards with direct NSDL webhooks', icon: 'BookOpen', path: 'egov/pan', isPinned: false },
  ]);

  useEffect(() => {
    fetchMe();
    fetchStats();
    fetchAgents();
    fetchRecentUpiPayments();
  }, [activeAgentId, auditTrigger]);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (res.ok) {
        setUserRole(data.simulatedRole);
        setActiveAgentId(data.id);
      }
    } catch (err) {
      console.error('Error fetching identity:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/stats?agentId=${activeAgentId}`);
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (res.ok) {
        setAgentsList(data);
      }
    } catch (err) {
      console.error('Error fetching agents list:', err);
    }
  };

  // Toggle user simulated role (Agent view vs Admin view)
  const handleRoleToggle = async (targetRole: 'agent' | 'admin') => {
    try {
      const res = await fetch('/api/me/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });
      if (res.ok) {
        setUserRole(targetRole);
        if (targetRole === 'agent') {
          // Switch to home tab
          setActiveTab('home');
        }
      }
    } catch (err) {
      console.error('Error switching roles:', err);
    }
  };

  // Switch acting agent (simulate another agent's session)
  const handleAgentSwitch = async (agentId: string) => {
    try {
      const res = await fetch('/api/me/switch-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });
      if (res.ok) {
        setActiveAgentId(agentId);
        setAuditTrigger(Date.now());
      }
    } catch (err) {
      console.error('Error switching acting agent:', err);
    }
  };

  const handlePinToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card click
    setServices(prev => prev.map(s => s.id === id ? { ...s, isPinned: !s.isPinned } : s));
  };

  const handleWalletTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(topUpAmount);
    if (isNaN(val) || val <= 0) return;

    setTopUpLoading(true);
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val })
      });
      if (res.ok) {
        setTopUpSuccess(true);
        setTopUpAmount('');
        setAuditTrigger(Date.now());
        setTimeout(() => {
          setTopUpModal(false);
          setTopUpSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Wallet top-up failed:', err);
    } finally {
      setTopUpLoading(false);
    }
  };

  const activeAgentName = agentsList.find(a => a.id === activeAgentId)?.name || 'Abhishek Kumar';
  const activeAgentShop = agentsList.find(a => a.id === activeAgentId)?.shopName || 'Abhishek Digital Agency';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-100">
              <Laptop className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Digital Seva B2B Portal</h1>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">NPCI Approved SaaS Aggregator</span>
            </div>
          </div>

          {/* SIMULATION CONTROLS (Extremely Useful for user tests) */}
          <div className="flex items-center gap-3.5 bg-slate-50 p-2 rounded-2xl border border-slate-200/60 text-xs flex-wrap justify-center">
            
            {/* Active Acting Agent selector */}
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3 mr-1">
              <span className="text-slate-500 font-medium">Acting Agent:</span>
              <select
                value={activeAgentId}
                onChange={e => handleAgentSwitch(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none"
              >
                {agentsList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.shopName})
                  </option>
                ))}
              </select>
            </div>

            {/* Sandbox Role Switcher */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Sandbox Mode:</span>
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
                <button
                  onClick={() => handleRoleToggle('agent')}
                  className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                    userRole === 'agent' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Agent View
                </button>
                <button
                  onClick={() => handleRoleToggle('admin')}
                  className={`px-3 py-1 font-bold rounded-md transition-all cursor-pointer ${
                    userRole === 'admin' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Admin Panel
                </button>
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Sidebar Navigation + Dynamic Wallet Widget */}
        <aside className="lg:col-span-3 space-y-6">
          
          {/* 1. Interactive Wallet Dashboard Element */}
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl text-white p-5 shadow-lg relative overflow-hidden wallet-glow">
            {/* Ambient background blur circles */}
            <div className="absolute -right-10 -bottom-10 h-28 w-28 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -left-10 -top-10 h-28 w-28 bg-white/10 rounded-full blur-xl"></div>

            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block">Active Agent Portal</span>
                <span className="font-semibold text-xs text-white/90 truncate block max-w-[160px]">{activeAgentShop}</span>
              </div>
              <Wallet className="h-5 w-5 text-blue-200" />
            </div>

            <div className="mt-6 mb-4 relative z-10">
              <span className="text-[10px] font-semibold text-blue-150 uppercase tracking-wider block">Wallet Balance</span>
              <div className="text-3xl font-bold font-mono tracking-tight mt-0.5">
                ₹{stats.walletBalance.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 relative z-10 pt-3 border-t border-white/15">
              <button
                onClick={() => setTopUpModal(true)}
                className="py-2 bg-white text-blue-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Balance
              </button>
              <button
                onClick={() => {
                  setUpiAmount('1000');
                  setUpiStatus('idle');
                  setUpiQrModal(true);
                }}
                className="py-2 bg-blue-600/50 hover:bg-blue-600 text-white font-semibold rounded-xl text-xs transition-colors border border-white/10 cursor-pointer"
              >
                UPI QR Link
              </button>
            </div>
          </div>

          {/* 2. Platform Navigation Menu */}
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-2">Main Menu</span>
            
            <button
              onClick={() => {
                setSelectedService(null);
                setActiveTab('home');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'home' && !selectedService
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Grid className="h-4 w-4" />
              SaaS Marketplace
            </button>

            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => {
                    setSelectedService(null);
                    setActiveTab('agents');
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'agents'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Manage Agents
                </button>

                <button
                  onClick={() => {
                    setSelectedService(null);
                    setActiveTab('commissions');
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'commissions'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="h-4 w-4" />
                  Commission Rates
                </button>
              </>
            )}

            <button
              onClick={() => {
                setSelectedService(null);
                setActiveTab('history');
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <History className="h-4 w-4" />
              Audit Logs & Receipts
            </button>
          </nav>

          {/* Quick Support Guidelines widget */}
          <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200/60 text-xs space-y-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              B2B Security Compliant
            </span>
            <p className="text-slate-600 leading-relaxed">
              AePS cashout services require active, registered biometric fingerprint hardware. Transactions are settled in real-time under NPCI regulatory guidelines.
            </p>
          </div>

        </aside>

        {/* RIGHT COLUMN: Interactive Workspaces */}
        <main className="lg:col-span-9 space-y-8">
          
          {/* DYNAMIC VIEWPORTS */}
          {selectedService ? (
            // 1. ACTIVE SERVICE FORM CONTAINER (BackButton + Component)
            <div className="space-y-4">
              <button
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                ← Back to Marketplace
              </button>
              <ServiceForms 
                category={selectedService.category}
                serviceId={selectedService.id}
                serviceName={selectedService.name}
                walletBalance={stats.walletBalance}
                onTransactionSuccess={() => {
                  setAuditTrigger(Date.now());
                }}
              />
            </div>
          ) : activeTab === 'home' ? (
            // 2. DASHBOARD HOME (Metrics Grid + Pinning Widget Workspace)
            <div className="space-y-8">
              
              {/* TOP LIVE METRICS PANELS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* 1. Business Volume */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Business Volume</span>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      ₹{stats.totalVolume.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Total processed amount</span>
                  </div>
                </div>

                {/* 2. Commissions Earned */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between text-emerald-600">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Commissions</span>
                    <Coins className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-bold text-emerald-600 font-mono">
                      +₹{stats.totalCommission.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">Earned by {activeAgentName}</span>
                  </div>
                </div>

                {/* 3. Transaction Count */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                    <Activity className="h-4 w-4 text-violet-500" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {stats.transactionCount} Txns
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Real-time status synced</span>
                  </div>
                </div>

                {/* 4. API Success Rate */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
                    <BarChart3 className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="mt-2.5">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {stats.successRate}%
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">Standard SLA uptime</span>
                  </div>
                </div>

              </div>

              {/* DYNAMIC PINNED SERVICES DASHBOARD WORKSPACE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                      <Pin className="h-4 w-4 text-blue-600 rotate-45" />
                      Pinned Fast Access Services
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Din bhar use hone wali services ko pin/unpin karke dashboard customize karein.</p>
                  </div>
                </div>

                {/* Render Pinned services list */}
                {services.filter(s => s.isPinned).length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                    <PinOff className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Koi pinned services nahi hain. Niche scroll karke marketplace se pin karein.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {services.filter(s => s.isPinned).map(service => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-400/80 hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-44"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                              {service.icon === 'Fingerprint' && <Fingerprint className="h-5 w-5" />}
                              {service.icon === 'Coins' && <Coins className="h-5 w-5" />}
                              {service.icon === 'CreditCard' && <CreditCard className="h-5 w-5" />}
                              {service.icon === 'Smartphone' && <Smartphone className="h-5 w-5" />}
                              {service.icon === 'Lightbulb' && <Lightbulb className="h-5 w-5" />}
                              {service.icon === 'ShieldCheck' && <ShieldCheck className="h-5 w-5" />}
                              {service.icon === 'Layers' && <Layers className="h-5 w-5" />}
                              {service.icon === 'Train' && <Train className="h-5 w-5" />}
                              {service.icon === 'Plane' && <Plane className="h-5 w-5" />}
                              {service.icon === 'BookOpen' && <BookOpen className="h-5 w-5" />}
                            </div>
                            
                            <button
                              onClick={(e) => handlePinToggle(service.id, e)}
                              className="p-1 text-blue-600 hover:bg-slate-50 rounded-lg"
                              title="Unpin from top"
                            >
                              <Pin className="h-3.5 w-3.5 fill-blue-600" />
                            </button>
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm mt-3.5 group-hover:text-blue-600 transition-colors">
                            {service.name}
                          </h3>
                          <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        </div>

                        <div className="flex items-center text-blue-600 text-xs font-bold pt-2 mt-2 border-t border-slate-50">
                          Configure & Access
                          <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SERVICE MARKETPLACE GRID */}
              <div className="space-y-4 pt-4">
                <div>
                  <h2 className="text-base font-bold text-slate-950 flex items-center gap-1.5">
                    <Grid className="h-4.5 w-4.5 text-slate-600" />
                    All SaaS API Service Integrations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Onboard multiple service APIs with real-time settlement & direct commission logging.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer relative group flex flex-col justify-between h-44"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {service.icon === 'Fingerprint' && <Fingerprint className="h-5 w-5" />}
                            {service.icon === 'Coins' && <Coins className="h-5 w-5" />}
                            {service.icon === 'CreditCard' && <CreditCard className="h-5 w-5" />}
                            {service.icon === 'Smartphone' && <Smartphone className="h-5 w-5" />}
                            {service.icon === 'Lightbulb' && <Lightbulb className="h-5 w-5" />}
                            {service.icon === 'ShieldCheck' && <ShieldCheck className="h-5 w-5" />}
                            {service.icon === 'Layers' && <Layers className="h-5 w-5" />}
                            {service.icon === 'Train' && <Train className="h-5 w-5" />}
                            {service.icon === 'Plane' && <Plane className="h-5 w-5" />}
                            {service.icon === 'BookOpen' && <BookOpen className="h-5 w-5" />}
                          </div>
                          
                          <button
                            onClick={(e) => handlePinToggle(service.id, e)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg"
                            title={service.isPinned ? 'Unpin service' : 'Pin to top of dashboard'}
                          >
                            <Pin className={`h-3.5 w-3.5 ${service.isPinned ? 'fill-blue-600 text-blue-600' : 'rotate-45'}`} />
                          </button>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mt-3.5 group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="flex items-center text-blue-600 text-xs font-bold pt-2 mt-2 border-t border-slate-50">
                        Launch Service
                        <ChevronRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : activeTab === 'agents' && userRole === 'admin' ? (
            // 3. ADMIN AGENT MANAGER
            <AgentManagement onBalanceUpdated={() => setAuditTrigger(Date.now())} />
          ) : activeTab === 'commissions' && userRole === 'admin' ? (
            // 4. ADMIN COMMISSION RATE CONSOLE
            <CommissionSettings />
          ) : (
            // 5. AUDIT LOGS HISTORY
            <TransactionsHistory lastUpdated={auditTrigger} />
          )}

        </main>

      </div>

      {/* FOOTER SYSTEM CREDITS */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-400 text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            © 2026 Digital Seva B2B Platform (SaaS). All Rights Reserved.
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            NPCI Secure Sockets Active
          </div>
        </div>
      </footer>

      {/* MODAL: TOP UP GATEWAY SIMULATION */}
      {topUpModal && (
        <div id="topup-gateway-modal" className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative border border-slate-100 animate-slide-up">
            
            <button 
              onClick={() => setTopUpModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-100">
              <div className="mx-auto h-11 w-11 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <CreditCard className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Add Wallet Balance</h3>
              <p className="text-xs text-slate-500 mt-1">Simulated secure payment gateway checkout</p>
            </div>

            {topUpSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-950">Payment Approved</h4>
                  <p className="text-xs text-slate-500 mt-1">₹{topUpAmount} added to your active wallet balance instantly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWalletTopUp} className="space-y-4 py-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Enter Top-up Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={topUpAmount}
                      onChange={e => setTopUpAmount(e.target.value)}
                      className="w-full pl-7.5 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-lg text-slate-800"
                      placeholder="e.g. 5000"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                    This simulates a B2B payment gateway redirect. Funds are added instantly upon submission.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[1000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt.toString())}
                      className="py-1.5 border border-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      +₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={topUpLoading || !topUpAmount}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {topUpLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Paying securely...
                    </>
                  ) : (
                    <>
                      Pay ₹{Number(topUpAmount || 0).toLocaleString('en-IN')}
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL: UPI QR GATEWAY */}
      {upiQrModal && (
        <div id="upi-qr-modal" className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`bg-white rounded-2xl w-full ${upiModalTab === 'pay' ? 'max-w-md' : 'max-w-lg'} shadow-2xl p-6 relative border border-slate-100 animate-slide-up transition-all duration-300`}>
            
            <button 
              onClick={() => {
                setUpiQrModal(false);
                setUpiModalTab('pay'); // Reset tab on close
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-100">
              <div className="mx-auto h-11 w-11 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                <QrCode className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">UPI QR Instant Top-up</h3>
              <p className="text-xs text-slate-500 mt-1">Scan QR code using any UPI App to pay instantly</p>
            </div>

            {/* TABS HEADER (Hidden when verifying or successful) */}
            {upiStatus === 'idle' && (
              <div className="flex border-b border-slate-100 mb-4 mt-3">
                <button
                  onClick={() => setUpiModalTab('pay')}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    upiModalTab === 'pay'
                      ? 'border-blue-600 text-blue-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  भुगतान / QR Pay
                </button>
                <button
                  onClick={() => setUpiModalTab('settings')}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    upiModalTab === 'settings'
                      ? 'border-blue-600 text-blue-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  सेटिंग्स / UPI Settings
                </button>
                <button
                  onClick={() => setUpiModalTab('history')}
                  className={`flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    upiModalTab === 'history'
                      ? 'border-blue-600 text-blue-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  इतिहास / UPI History
                </button>
              </div>
            )}

            {upiStatus === 'success' ? (
              <div className="py-8 text-center space-y-4">
                <div className="h-14 w-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Check className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-emerald-600">भुगतान सफल / Payment Successful!</h4>
                  <p className="text-sm font-semibold text-slate-700">₹{Number(upiAmount).toLocaleString('en-IN')} has been credited</p>
                  <p className="text-xs text-slate-400">Transaction ID: UPI-TX-{Date.now().toString().slice(-6)}</p>
                </div>
              </div>
            ) : upiStatus === 'verifying' ? (
              <div className="py-12 text-center space-y-4">
                <div className="relative mx-auto h-12 w-12 flex items-center justify-center">
                  <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-950">सत्यापन किया जा रहा है...</h4>
                  <p className="text-xs text-slate-500">Verifying your payment with NPCI network</p>
                  <div className="w-48 bg-slate-100 h-1 rounded-full mx-auto overflow-hidden mt-2">
                    <div className="bg-blue-600 h-full animate-pulse-width w-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* TAB 1: QR PAY */}
                {upiModalTab === 'pay' && (
                  <div className="space-y-4 py-2">
                    {/* Amount input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">भुगतान राशि / Top-up Amount (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          value={upiAmount}
                          onChange={e => setUpiAmount(e.target.value)}
                          min="10"
                          className="w-full pl-7.5 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-lg text-slate-800"
                          placeholder="Enter amount"
                          required
                        />
                      </div>
                    </div>

                    {/* Fast amount buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[500, 1000, 2000, 5000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setUpiAmount(amt.toString())}
                          className={`py-1.5 border text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            upiAmount === amt.toString()
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          ₹{amt.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>

                    {/* QR Code display container */}
                    <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-100">
                      
                      {/* AUTO-CHECKING ACTIVE BANNER */}
                      <div className="w-full bg-blue-50 border border-blue-100/50 rounded-xl p-2.5 flex items-center justify-between gap-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                          </span>
                          <div className="flex flex-col text-left">
                            <span className="text-[10px] font-bold text-blue-800 leading-tight">स्वचालित भुगतान जांच सक्रिय / Auto Gateway Active</span>
                            <span className="text-[9px] text-blue-500 font-medium">QR स्कैन कर भुगतान करें, 8-15s में स्वतः चेक हो जाएगा!</span>
                          </div>
                        </div>
                        {activeQrSessionId && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await fetch('/api/wallet/qr-session-action', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ sessionId: activeQrSessionId, status: 'success' })
                                });
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm whitespace-nowrap active:scale-95"
                            title="Click to simulate payment completion instantly"
                          >
                            Simulate Pay
                          </button>
                        )}
                      </div>

                      {upiQrMode === 'custom' ? (
                        customQrImage ? (
                          <motion.div 
                            key={`custom-${customQrImage}`}
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="bg-white p-3 rounded-xl shadow-md border border-slate-100 relative"
                          >
                            <img 
                              src={customQrImage}
                              alt="Custom QR Code"
                              className="h-[180px] w-[180px] object-contain block"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-white/5 pointer-events-none rounded-xl border border-slate-200/50"></div>
                          </motion.div>
                        ) : (
                          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-150 text-center space-y-3 w-[180px] h-[180px] flex flex-col items-center justify-center">
                            <Upload className="h-8 w-8 text-slate-300" />
                            <p className="text-[10px] text-slate-400 font-semibold leading-normal">कोई कस्टम QR कोड नहीं मिला</p>
                            <button
                              type="button"
                              onClick={() => setUpiModalTab('settings')}
                              className="text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100 cursor-pointer transition-all"
                            >
                              QR अपलोड करें / Upload QR
                            </button>
                          </div>
                        )
                      ) : (
                        <motion.div 
                          key={`dynamic-${upiId}-${upiMerchantName}-${upiAmount}`}
                          initial={{ opacity: 0, scale: 0.93 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="bg-white p-3 rounded-xl shadow-md border border-slate-100 relative"
                        >
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiMerchantName)}&am=${upiAmount || '1000'}&cu=INR&tn=AgentWalletTopup`
                            )}`}
                            alt="UPI QR Code"
                            className="h-[180px] w-[180px] block"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-white/5 pointer-events-none rounded-xl border border-slate-200/50"></div>
                        </motion.div>
                      )}

                      {/* Download QR Button (Only enabled if we have something to download) */}
                      {(upiQrMode === 'dynamic' || (upiQrMode === 'custom' && customQrImage)) && (
                        <button
                          type="button"
                          onClick={handleDownloadQr}
                          disabled={downloadingQr}
                          className="mt-3 flex items-center justify-center gap-1.5 text-xs bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-1.5 rounded-xl shadow-sm border border-slate-200 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Download className={`h-3.5 w-3.5 text-slate-500 ${downloadingQr ? 'animate-bounce' : ''}`} />
                          {downloadingQr ? 'Downloading...' : 'QR डाउनलोड करें / Download QR'}
                        </button>
                      )}

                      <div className="mt-3 text-center space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-700">
                          <span className="font-semibold text-slate-500">UPI ID:</span>
                          <span className="font-mono font-bold text-slate-800 text-xs truncate max-w-[150px]">{upiId}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(upiId);
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold hover:bg-blue-200 cursor-pointer whitespace-nowrap"
                          >
                            {copiedUpi ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Scan with GPay, PhonePe, Paytm, BHIM</p>
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      onClick={handleUpiVerify}
                      disabled={!upiAmount || Number(upiAmount) <= 0 || (upiQrMode === 'custom' && !customQrImage)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-blue-100 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      मैंने भुगतान कर दिया है / I Have Paid (Verify)
                    </button>

                    {/* Recent QR Payments Section */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <History className="h-3 w-3" />
                          हालिया भुगतान / Recent Payments
                        </h4>
                        <span className="text-[9px] text-slate-400 font-medium">(Recent top-ups)</span>
                      </div>

                      {recentUpiTransactions.length === 0 ? (
                        <div className="text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-[10px] text-slate-400 font-medium">कोई हालिया UPI भुगतान नहीं मिला / No recent payments found</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                          {recentUpiTransactions.slice(0, 3).map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-left">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-extrabold text-slate-800">₹{tx.amount.toLocaleString('en-IN')}</span>
                                <span className="text-[8px] text-slate-400">
                                  {new Date(tx.timestamp).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-mono text-slate-400 bg-slate-200/50 px-1 py-0.5 rounded">
                                  {tx.id.slice(-6).toUpperCase()}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                  <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                  सफल
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: UPI CONFIG / SETTINGS */}
                {upiModalTab === 'settings' && (
                  <div className="space-y-4 py-2 text-left animate-fade-in">
                    {/* Payee Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">मर्चेंट नाम / Merchant Name</label>
                      <input
                        type="text"
                        value={upiMerchantName}
                        onChange={e => setUpiMerchantName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-xs text-slate-800"
                        placeholder="e.g. Digital Seva Portal"
                      />
                    </div>

                    {/* UPI ID */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">यूपीआई आईडी / UPI ID (VPA)</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs text-slate-800"
                        placeholder="e.g. digitalb2b@paytm"
                      />
                    </div>

                    {/* QR Mode */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">क्यूआर कोड मोड / QR Code Mode</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setUpiQrMode('dynamic')}
                          className={`p-3 border text-xs font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            upiQrMode === 'dynamic'
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm font-extrabold'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                        >
                          <QrCode className="h-4 w-4" />
                          <span className="text-[10px] text-center">स्वचालित डायनामिक QR<br/>Dynamic QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiQrMode('custom')}
                          className={`p-3 border text-xs font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                            upiQrMode === 'custom'
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm font-extrabold'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                          }`}
                        >
                          <Upload className="h-4 w-4" />
                          <span className="text-[10px] text-center">कस्टम क्यूआर अपलोड<br/>Custom QR Upload</span>
                        </button>
                      </div>
                    </div>

                    {/* Custom QR Image Upload Block */}
                    {upiQrMode === 'custom' && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5 animate-fade-in">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">कस्टम क्यूआर इमेज / Custom QR Image</label>
                        
                        {customQrImage ? (
                          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-100">
                            <img
                              src={customQrImage}
                              alt="Custom QR Thumbnail"
                              className="h-12 w-12 object-contain rounded border bg-slate-50"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-700 truncate">Custom QR Loaded</p>
                              <p className="text-[9px] text-slate-400">Stored locally in browser</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomQrImage('');
                                localStorage.removeItem('customQrImage');
                              }}
                              className="text-[9px] text-red-600 hover:text-red-700 font-bold bg-red-50 hover:bg-red-100 px-2 py-1 rounded cursor-pointer transition-colors"
                            >
                              हटाएं / Remove
                            </button>
                          </div>
                        ) : (
                          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-white hover:border-blue-400 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleQrUpload}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <Upload className="h-5 w-5 text-slate-400 mb-1" />
                            <p className="text-[10px] font-bold text-slate-700">इमेज चुनें / Click to upload image</p>
                            <p className="text-[8px] text-slate-400 mt-0.5">PNG, JPG, JPEG formats supported</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Save Button */}
                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-100"
                    >
                      {settingsSaved ? (
                        <>
                          <Check className="h-4 w-4" />
                          सेटिंग्स सुरक्षित / Settings Saved!
                        </>
                      ) : (
                        'सेटिंग्स सुरक्षित करें / Save Settings'
                      )}
                    </button>
                  </div>
                )}

                {/* TAB 3: UPI HISTORY */}
                {upiModalTab === 'history' && (
                  <div className="space-y-3 py-2 text-left animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">यूपीआई भुगतान इतिहास / UPI Payment History</h4>
                      <span className="text-[10px] text-slate-500 font-extrabold bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                        कुल: ₹{recentUpiTransactions.reduce((acc, tx) => acc + tx.amount, 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Search / Filter input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="खोजें (राशि या ट्रांसक्शन आईडी) / Search by Amount or ID..."
                        value={upiSearchQuery}
                        onChange={(e) => setUpiSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 pl-8 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium text-slate-850 placeholder-slate-400"
                      />
                      <svg
                        className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Filter logic */}
                    {(() => {
                      const query = upiSearchQuery.toLowerCase();
                      const filtered = recentUpiTransactions.filter(tx => {
                        if (!query) return true;
                        return (
                          tx.amount.toString().includes(query) ||
                          tx.id.toLowerCase().includes(query) ||
                          tx.description.toLowerCase().includes(query)
                        );
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-xs text-slate-500 font-semibold">कोई यूपीआई भुगतान रिकॉर्ड नहीं मिला / No payments match</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {filtered.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-100 transition-colors">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-extrabold text-slate-800">₹{tx.amount.toLocaleString('en-IN')}</span>
                                <span className="text-[10px] font-medium text-slate-500">{tx.description}</span>
                                <span className="text-[9px] text-slate-400">
                                  {new Date(tx.timestamp).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[8px] font-mono text-slate-500 bg-slate-200/50 px-1.5 py-0.5 rounded font-bold">
                                  {tx.id.toUpperCase()}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-100">
                                  <span className="h-1 w-1 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                                  सफल
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
