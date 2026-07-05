/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Agent, ServiceTransaction, WalletTransaction, CommissionRate } from './src/types';

// Standard environment check
const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

const app = express();
app.use(express.json());

// In-Memory Database (with realistic initial data to make metrics charts look beautiful out of the box)
let currentAgentId = 'agent-1'; // Default acting agent for simulation
let activeRole: 'agent' | 'admin' = 'agent';

let agents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Abhishek Kumar',
    email: 'abhishekkumarind5@gmail.com',
    phone: '9876543210',
    shopName: 'Abhishek Digital Agency',
    city: 'Patna',
    status: 'active',
    walletBalance: 25430,
    role: 'admin', // The user who logged in can be Admin/Agent
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'agent-2',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '8765432109',
    shopName: 'Priya Seva Kendra',
    city: 'Lucknow',
    status: 'active',
    walletBalance: 12800,
    role: 'agent',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'agent-3',
    name: 'Rajesh Verma',
    email: 'rajesh.verma@example.com',
    phone: '7654321098',
    shopName: 'Verma Net Cafe',
    city: 'Bhopal',
    status: 'active',
    walletBalance: 4500,
    role: 'agent',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'agent-4',
    name: 'Sunil Gupta',
    email: 'sunil.gupta@example.com',
    phone: '6543210987',
    shopName: 'Gupta Communications',
    city: 'Jaipur',
    status: 'inactive',
    walletBalance: 0,
    role: 'agent',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let commissionRates: CommissionRate[] = [
  { category: 'banking', serviceId: 'aeps', serviceName: 'AePS Cash Withdrawal', rateType: 'flat', rateValue: 12 },
  { category: 'banking', serviceId: 'dmt', serviceName: 'DMT (Money Transfer)', rateType: 'percentage', rateValue: 0.4 },
  { category: 'banking', serviceId: 'microatm', serviceName: 'Micro ATM Withdrawal', rateType: 'flat', rateValue: 10 },
  { category: 'insurance', serviceId: 'health', serviceName: 'Health Insurance', rateType: 'percentage', rateValue: 6.5 },
  { category: 'insurance', serviceId: 'auto', serviceName: 'Auto Insurance', rateType: 'percentage', rateValue: 8.0 },
  { category: 'utility', serviceId: 'bbps', serviceName: 'BBPS Utility Bill', rateType: 'flat', rateValue: 2.5 },
  { category: 'utility', serviceId: 'recharge', serviceName: 'Mobile Recharge', rateType: 'percentage', rateValue: 1.8 },
  { category: 'travel', serviceId: 'irctc', serviceName: 'IRCTC Train Booking', rateType: 'flat', rateValue: 15 },
  { category: 'travel', serviceId: 'flight', serviceName: 'Flight Ticket', rateType: 'percentage', rateValue: 3.2 },
  { category: 'egov', serviceId: 'pan', serviceName: 'PAN Card Registration', rateType: 'flat', rateValue: 5 }
];

let serviceTransactions: ServiceTransaction[] = [
  {
    id: 'tx-101',
    agentId: 'agent-1',
    agentName: 'Abhishek Kumar',
    category: 'banking',
    serviceName: 'AePS Cash Withdrawal',
    amount: 5000,
    commission: 12,
    charge: 0,
    netDeduction: -5012, // For cash out, wallet is credited (deduction is negative)
    status: 'success',
    customerDetails: { name: 'Ramesh Singh', mobile: '9988776655', idNumber: 'XXXX-XXXX-3829' },
    referenceNumber: 'RRN9827361827',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4 * 3600000).toISOString()
  },
  {
    id: 'tx-102',
    agentId: 'agent-1',
    agentName: 'Abhishek Kumar',
    category: 'utility',
    serviceName: 'Mobile Recharge',
    amount: 299,
    commission: 5.38,
    charge: 0,
    netDeduction: 293.62, // amount - commission
    status: 'success',
    customerDetails: { mobile: '9123456789', operatorName: 'Jio Prepaid' },
    referenceNumber: 'RRN2039481726',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 3600000).toISOString()
  },
  {
    id: 'tx-103',
    agentId: 'agent-2',
    agentName: 'Priya Sharma',
    category: 'banking',
    serviceName: 'DMT (Money Transfer)',
    amount: 10000,
    commission: 40,
    charge: 50, // DMT charge
    netDeduction: 10010, // amount + charge - commission
    status: 'success',
    customerDetails: { name: 'Sohan Lal', mobile: '9898989898', accountNumber: '30291827364' },
    referenceNumber: 'RRN1029384756',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 8 * 3600000).toISOString()
  },
  {
    id: 'tx-104',
    agentId: 'agent-1',
    agentName: 'Abhishek Kumar',
    category: 'insurance',
    serviceName: 'Health Insurance',
    amount: 8500,
    commission: 552.5,
    charge: 0,
    netDeduction: 7947.5,
    status: 'success',
    customerDetails: { name: 'Kiran Devi', mobile: '9443322110' },
    referenceNumber: 'RRN4837192837',
    timestamp: new Date(Date.now() - 10 * 3600000).toISOString()
  },
  {
    id: 'tx-105',
    agentId: 'agent-3',
    agentName: 'Rajesh Verma',
    category: 'travel',
    serviceName: 'IRCTC Train Booking',
    amount: 1250,
    commission: 15,
    charge: 0,
    netDeduction: 1235,
    status: 'success',
    customerDetails: { name: 'Aman Verma', travelDetails: 'NDLS to PNBE / 3AC' },
    referenceNumber: 'RRN8472910382',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: 'tx-106',
    agentId: 'agent-1',
    agentName: 'Abhishek Kumar',
    category: 'egov',
    serviceName: 'PAN Card Registration',
    amount: 107,
    commission: 5,
    charge: 0,
    netDeduction: 102,
    status: 'pending',
    customerDetails: { name: 'Vikram Seth', mobile: '9555112233', idNumber: 'AADNPS7362K' },
    referenceNumber: 'PAN92837162',
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

let walletTransactions: WalletTransaction[] = [
  {
    id: 'wt-1',
    agentId: 'agent-1',
    type: 'credit',
    amount: 20000,
    prevBalance: 5418,
    newBalance: 25418,
    description: 'Bank Transfer Top-up (Approved)',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper functions
const getAgent = (id: string) => agents.find(a => a.id === id);

// ==========================================
// API Endpoints
// ==========================================

// 1. Switch Active Acting Agent / Role for Admin Dashboard Simulation
app.get('/api/me', (req, res) => {
  const me = getAgent(currentAgentId);
  if (!me) {
    return res.status(404).json({ error: 'Acting user not found' });
  }
  res.json({
    ...me,
    simulatedRole: activeRole // We allow simulating agent/admin roles dynamically
  });
});

app.post('/api/me/switch-role', (req, res) => {
  const { role } = req.body;
  if (role === 'admin' || role === 'agent') {
    activeRole = role;
    return res.json({ success: true, simulatedRole: activeRole });
  }
  res.status(400).json({ error: 'Invalid role' });
});

app.post('/api/me/switch-agent', (req, res) => {
  const { agentId } = req.body;
  const targetAgent = getAgent(agentId);
  if (targetAgent) {
    currentAgentId = agentId;
    return res.json({ success: true, currentAgentId });
  }
  res.status(400).json({ error: 'Invalid agent ID' });
});

// 2. Agents Management
app.get('/api/agents', (req, res) => {
  res.json(agents);
});

app.post('/api/agents', (req, res) => {
  const { name, email, phone, shopName, city, role } = req.body;
  if (!name || !email || !phone || !shopName || !city) {
    return res.status(400).json({ error: 'Missing required agent parameters' });
  }

  const newAgent: Agent = {
    id: `agent-${Date.now()}`,
    name,
    email,
    phone,
    shopName,
    city,
    status: 'active',
    walletBalance: 0,
    role: role || 'agent',
    createdAt: new Date().toISOString()
  };

  agents.push(newAgent);
  res.status(210).json(newAgent);
});

app.put('/api/agents/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const agent = getAgent(id);
  if (agent) {
    agent.status = status;
    return res.json({ success: true, agent });
  }
  res.status(404).json({ error: 'Agent not found' });
});

// 3. Commission Configurations
app.get('/api/commissions', (req, res) => {
  res.json(commissionRates);
});

app.put('/api/commissions', (req, res) => {
  const { serviceId, rateType, rateValue } = req.body;
  const target = commissionRates.find(r => r.serviceId === serviceId);
  if (target) {
    target.rateType = rateType;
    target.rateValue = Number(rateValue);
    return res.json({ success: true, commissionRate: target });
  }
  res.status(404).json({ error: 'Service rate configuration not found' });
});

// 4. Wallet direct management by Admin
app.post('/api/wallet/credit-debit', (req, res) => {
  const { agentId, type, amount, description } = req.body;
  const agent = getAgent(agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  const value = Number(amount);
  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const prev = agent.walletBalance;
  let nextBalance = prev;

  if (type === 'credit') {
    nextBalance = prev + value;
  } else if (type === 'debit') {
    if (prev < value) {
      return res.status(400).json({ error: 'Insufficient agent wallet balance' });
    }
    nextBalance = prev - value;
  } else {
    return res.status(400).json({ error: 'Invalid adjustment type' });
  }

  agent.walletBalance = parseFloat(nextBalance.toFixed(2));

  const walletTx: WalletTransaction = {
    id: `wt-${Date.now()}`,
    agentId,
    type,
    amount: value,
    prevBalance: prev,
    newBalance: agent.walletBalance,
    description: description || `Admin Manual ${type === 'credit' ? 'Top-up' : 'Deduction'}`,
    timestamp: new Date().toISOString()
  };

  walletTransactions.unshift(walletTx);
  res.json({ success: true, agentBalance: agent.walletBalance, walletTx });
});

// Self Wallet Gateway Topup (by Agent)
app.post('/api/wallet/topup', (req, res) => {
  const { amount } = req.body;
  const agent = getAgent(currentAgentId);
  if (!agent) {
    return res.status(404).json({ error: 'Active agent session not found' });
  }
  const value = Number(amount);
  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ error: 'Invalid top-up amount' });
  }

  const prev = agent.walletBalance;
  agent.walletBalance = parseFloat((prev + value).toFixed(2));

  const walletTx: WalletTransaction = {
    id: `wt-${Date.now()}`,
    agentId: currentAgentId,
    type: 'credit',
    amount: value,
    prevBalance: prev,
    newBalance: agent.walletBalance,
    description: 'Instant Portal Wallet Top-up (UPI/Gateway)',
    timestamp: new Date().toISOString()
  };

  walletTransactions.unshift(walletTx);
  res.json({ success: true, walletBalance: agent.walletBalance, walletTx });
});

// Real-Time Auto-Checking UPI QR Sessions Database
interface QrSession {
  id: string;
  agentId: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  autoSucceedAt: number;
}
let pendingQrSessions: QrSession[] = [];

// Initiate a real-time auto-checking QR payment session
app.post('/api/wallet/qr-session', (req, res) => {
  const { amount, agentId } = req.body;
  const value = Number(amount);
  if (isNaN(value) || value <= 0) {
    return res.status(400).json({ error: 'Invalid top-up amount' });
  }
  const targetAgentId = agentId || currentAgentId;
  const agent = getAgent(targetAgentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent session not found' });
  }

  const sessionId = `qrsx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Set the session to auto-succeed in 8 to 15 seconds to simulate a user scanning the QR on their mobile and successfully paying
  const newSession: QrSession = {
    id: sessionId,
    agentId: targetAgentId,
    amount: value,
    status: 'pending',
    timestamp: new Date().toISOString(),
    autoSucceedAt: Date.now() + (8 + Math.floor(Math.random() * 7)) * 1000
  };

  pendingQrSessions.push(newSession);
  res.json({ success: true, session: newSession });
});

// Check status / Poll endpoint for automatic payment verification
app.get('/api/wallet/qr-session-status', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId parameter' });
  }

  const session = pendingQrSessions.find(s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Active payment session not found' });
  }

  // If session is still pending but the simulated countdown has finished, auto-approve it
  if (session.status === 'pending' && Date.now() >= session.autoSucceedAt) {
    session.status = 'success';

    const agent = getAgent(session.agentId);
    if (agent) {
      const prev = agent.walletBalance;
      agent.walletBalance = parseFloat((prev + session.amount).toFixed(2));

      const walletTx: WalletTransaction = {
        id: `wt-${Date.now()}`,
        agentId: session.agentId,
        type: 'credit',
        amount: session.amount,
        prevBalance: prev,
        newBalance: agent.walletBalance,
        description: 'Instant Auto-Detected UPI QR Top-up (Gateway)',
        timestamp: new Date().toISOString()
      };

      walletTransactions.unshift(walletTx);
    }
  }

  res.json({ success: true, status: session.status, amount: session.amount });
});

// Force action endpoint to immediately simulate success/failure for instant manual testing
app.post('/api/wallet/qr-session-action', (req, res) => {
  const { sessionId, status } = req.body;
  if (!sessionId || !status || !['success', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const session = pendingQrSessions.find(s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Active payment session not found' });
  }

  if (session.status === 'pending') {
    session.status = status;

    if (status === 'success') {
      const agent = getAgent(session.agentId);
      if (agent) {
        const prev = agent.walletBalance;
        agent.walletBalance = parseFloat((prev + session.amount).toFixed(2));

        const walletTx: WalletTransaction = {
          id: `wt-${Date.now()}`,
          agentId: session.agentId,
          type: 'credit',
          amount: session.amount,
          prevBalance: prev,
          newBalance: agent.walletBalance,
          description: 'Instant Auto-Detected UPI QR Top-up (Simulated)',
          timestamp: new Date().toISOString()
        };

        walletTransactions.unshift(walletTx);
      }
    }
  }

  res.json({ success: true, status: session.status, amount: session.amount });
});

// 5. Service Transactions List
app.get('/api/transactions', (req, res) => {
  // Return all or filtered transactions
  const { agentId, category } = req.query;
  let filtered = serviceTransactions;
  if (agentId) {
    filtered = filtered.filter(t => t.agentId === agentId);
  }
  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }
  res.json(filtered);
});

app.get('/api/wallet-history', (req, res) => {
  const { agentId } = req.query;
  let filtered = walletTransactions;
  if (agentId) {
    filtered = filtered.filter(w => w.agentId === agentId);
  }
  res.json(filtered);
});

// 6. Submit Multi-Service Transaction (AePS, DMT, BBPS, Insurance, Travel, E-Gov)
app.post('/api/transactions', (req, res) => {
  const { category, serviceId, amount, customerDetails } = req.body;
  const agent = getAgent(currentAgentId);

  if (!agent) {
    return res.status(404).json({ error: 'Active Agent session not found' });
  }
  if (agent.status === 'inactive') {
    return res.status(403).json({ error: 'Agent profile is suspended/inactive. Transactions blocked.' });
  }

  const txnAmount = Number(amount);
  if (isNaN(txnAmount) || txnAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  // 1. Fetch relevant commission config
  const rateConfig = commissionRates.find(r => r.serviceId === serviceId);
  if (!rateConfig) {
    return res.status(400).json({ error: `Invalid service ID: ${serviceId}` });
  }

  // 2. Calculate Commission Earned by Agent
  let commission = 0;
  if (rateConfig.rateType === 'percentage') {
    commission = parseFloat((txnAmount * (rateConfig.rateValue / 100)).toFixed(2));
  } else {
    commission = rateConfig.rateValue;
  }

  // DMT (Domestic Money Transfer) includes a standard routing charge (e.g., 0.5% or ₹10 flat). Let's simulate a charge of 0.5% for DMT
  let charge = 0;
  if (serviceId === 'dmt') {
    charge = parseFloat((txnAmount * 0.005).toFixed(2));
    if (charge < 5) charge = 5; // Minimum ₹5 charge for DMT
  }

  // 3. Determine Wallet Balance Effect
  // For Banking Cash Withdrawal (AePS / MicroATM):
  // The agent gives cash to customer. The portal CREDITS the wallet with (amount + commission)
  // For standard payments (DMT, BBPS, Recharge, Insurance, Travel, E-Gov):
  // The agent pays using their wallet. The wallet is DEBITED with (amount + charge - commission)
  const isCashWithdrawal = serviceId === 'aeps' || serviceId === 'microatm';

  const prevWalletBalance = agent.walletBalance;
  let netDeduction = 0;
  let newWalletBalance = prevWalletBalance;

  if (isCashWithdrawal) {
    // Credit flow: Agent hands out paper cash, wallet gets amount + commission
    netDeduction = -(txnAmount + commission); // Negative deduction = Credit
    newWalletBalance = prevWalletBalance + (txnAmount + commission);
  } else {
    // Debit flow: Agent pays bills/booking from wallet. Deduct amount + charges, add commission
    netDeduction = txnAmount + charge - commission;
    if (prevWalletBalance < netDeduction) {
      return res.status(400).json({
        error: `Insufficient Wallet Balance. Required: ₹${netDeduction.toFixed(2)}, Available: ₹${prevWalletBalance.toFixed(2)}. Please top up your wallet.`
      });
    }
    newWalletBalance = prevWalletBalance - netDeduction;
  }

  // 4. Update Agent Wallet State
  agent.walletBalance = parseFloat(newWalletBalance.toFixed(2));

  // Create Reference Number
  const rrnPrefix = serviceId.toUpperCase().slice(0, 3);
  const rrnSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
  const referenceNumber = `${rrnPrefix}${rrnSuffix}`;

  // 5. Record Service Transaction
  const newTxn: ServiceTransaction = {
    id: `tx-${Date.now()}`,
    agentId: agent.id,
    agentName: agent.name,
    category,
    serviceName: rateConfig.serviceName,
    amount: txnAmount,
    commission,
    charge,
    netDeduction,
    status: 'success', // Simulated instant success API aggregator response
    customerDetails: customerDetails || {},
    referenceNumber,
    timestamp: new Date().toISOString()
  };

  serviceTransactions.unshift(newTxn);

  // 6. Record Wallet Debit/Credit Transaction history
  const walletTx: WalletTransaction = {
    id: `wt-${Date.now()}`,
    agentId: agent.id,
    type: isCashWithdrawal ? 'credit' : 'debit',
    amount: isCashWithdrawal ? (txnAmount + commission) : netDeduction,
    prevBalance: prevWalletBalance,
    newBalance: agent.walletBalance,
    description: `${rateConfig.serviceName} Ref: ${referenceNumber}`,
    timestamp: new Date().toISOString()
  };

  walletTransactions.unshift(walletTx);

  res.json({
    success: true,
    transaction: newTxn,
    walletBalance: agent.walletBalance,
    message: isCashWithdrawal
      ? `Cashout successful. ₹${txnAmount} credited to wallet with ₹${commission} commission.`
      : `Payment successful. ₹${netDeduction.toFixed(2)} deducted from wallet (net of ₹${commission} commission).`
  });
});

// 7. General Dynamic Aggregate Dashboard Metrics
app.get('/api/stats', (req, res) => {
  const agentId = req.query.agentId as string || currentAgentId;
  const filteredTx = serviceTransactions.filter(t => t.agentId === agentId);
  const agentObj = getAgent(agentId);

  const totalVolume = filteredTx.reduce((acc, t) => acc + t.amount, 0);
  const totalCommission = filteredTx.reduce((acc, t) => acc + t.commission, 0);
  const successCount = filteredTx.filter(t => t.status === 'success').length;
  const successRate = filteredTx.length > 0 ? parseFloat(((successCount / filteredTx.length) * 100).toFixed(1)) : 100;

  res.json({
    totalVolume,
    totalCommission,
    walletBalance: agentObj ? agentObj.walletBalance : 0,
    successRate,
    transactionCount: filteredTx.length
  });
});

// Serve frontend assets in production, handle Vite development mode
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`B2B SaaS API Aggregator Server running on http://localhost:${PORT}`);
  });
}

startServer();
