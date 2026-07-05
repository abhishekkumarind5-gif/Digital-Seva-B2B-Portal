/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Calendar, CheckCircle2, XCircle, 
  AlertCircle, Filter, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw
} from 'lucide-react';
import { ServiceTransaction, WalletTransaction } from '../types';

interface TransactionsHistoryProps {
  lastUpdated: number;
}

export default function TransactionsHistory({ lastUpdated }: TransactionsHistoryProps) {
  const [activeTab, setActiveTab] = useState<'services' | 'wallet'>('services');
  const [serviceTx, setServiceTx] = useState<ServiceTransaction[]>([]);
  const [walletTx, setWalletTx] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, [lastUpdated, activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'services') {
        const res = await fetch('/api/transactions');
        const data = await res.json();
        if (res.ok) setServiceTx(data);
      } else {
        const res = await fetch('/api/wallet-history');
        const data = await res.json();
        if (res.ok) setWalletTx(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServiceTx = serviceTx.filter(tx => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      tx.id.toLowerCase().includes(q) ||
      tx.referenceNumber.toLowerCase().includes(q) ||
      tx.agentName.toLowerCase().includes(q) ||
      tx.serviceName.toLowerCase().includes(q) ||
      (tx.customerDetails?.name && tx.customerDetails.name.toLowerCase().includes(q)) ||
      (tx.customerDetails?.mobile && tx.customerDetails.mobile.includes(q));

    const matchesCategory = categoryFilter ? tx.category === categoryFilter : true;
    const matchesStatus = statusFilter ? tx.status === statusFilter : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredWalletTx = walletTx.filter(tx => {
    const q = searchQuery.toLowerCase();
    return (
      tx.id.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q)
    );
  });

  return (
    <div id="transaction-history-root" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      
      {/* Tabs */}
      <div className="flex border-b border-slate-100 pb-4 mb-5 justify-between items-center flex-wrap gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('services');
              setSearchQuery('');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            SaaS Services Logs
          </button>
          <button
            onClick={() => {
              setActiveTab('wallet');
              setSearchQuery('');
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'wallet'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Direct Wallet Adjustments
          </button>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Audit Logs
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'services' ? 'Search by ID, RRN, customer, mobile...' : 'Search wallet logs...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        {activeTab === 'services' && (
          <>
            <div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="">-- All Categories --</option>
                <option value="banking">Banking (AePS, DMT)</option>
                <option value="utility">Utilities (BBPS, Recharge)</option>
                <option value="insurance">Insurance Policies</option>
                <option value="travel">Travel (Flights/Trains)</option>
                <option value="egov">E-Governance (PAN)</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              >
                <option value="">-- All Statuses --</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* LOG TABLES */}
      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : activeTab === 'services' ? (
        filteredServiceTx.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Koi matching transactions nahi mile</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-4 rounded-l-xl">Reference / Date</th>
                  <th className="py-2.5 px-4">Agent Name</th>
                  <th className="py-2.5 px-4">Service</th>
                  <th className="py-2.5 px-4">Txn Amount</th>
                  <th className="py-2.5 px-4 text-emerald-600">Commission</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 rounded-r-xl">Net Deduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filteredServiceTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/45 transition-colors">
                    
                    {/* Reference / Date */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 font-mono">{tx.referenceNumber}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(tx.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                      </div>
                    </td>

                    {/* Agent Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{tx.agentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.agentId}</div>
                    </td>

                    {/* Service Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{tx.serviceName}</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide mt-0.5 ${
                        tx.category === 'banking' ? 'bg-indigo-50 text-indigo-700' :
                        tx.category === 'insurance' ? 'bg-emerald-50 text-emerald-700' :
                        tx.category === 'utility' ? 'bg-amber-50 text-amber-700' :
                        tx.category === 'travel' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'
                      }`}>
                        {tx.category}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 text-sm">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Commission */}
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-sm">
                      +₹{tx.commission.toLocaleString('en-IN')}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                        tx.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                        tx.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {tx.status === 'success' && <CheckCircle2 className="h-3 w-3" />}
                        {tx.status === 'pending' && <Clock className="h-3 w-3" />}
                        {tx.status === 'failed' && <XCircle className="h-3 w-3" />}
                        {tx.status}
                      </span>
                    </td>

                    {/* Net Wallet Effect */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                      {tx.netDeduction < 0 ? (
                        <span className="text-emerald-600">+₹{Math.abs(tx.netDeduction).toLocaleString('en-IN')} (Credited)</span>
                      ) : (
                        <span className="text-slate-800">-₹{tx.netDeduction.toLocaleString('en-IN')} (Debited)</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        filteredWalletTx.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Koi matching adjustments nahi mile</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-4 rounded-l-xl">Adjustment ID / Date</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Previous Balance</th>
                  <th className="py-2.5 px-4 rounded-r-xl">Post Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {filteredWalletTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/45 transition-colors">
                    
                    {/* ID / Date */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-mono">{tx.id}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(tx.timestamp).toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${
                          tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {tx.type === 'credit' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        </span>
                        {tx.description}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sm">
                      <span className={tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Previous Balance */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-medium">
                      ₹{tx.prevBalance.toLocaleString('en-IN')}
                    </td>

                    {/* Post Balance */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-950 text-sm">
                      ₹{tx.newBalance.toLocaleString('en-IN')}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

    </div>
  );
}
