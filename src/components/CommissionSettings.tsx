/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Percent, Coins, Sliders, Edit2, Check, X, 
  AlertCircle, RefreshCw, Layers, ShieldCheck, 
  ArrowRightLeft, Plane, BookOpen, Save
} from 'lucide-react';
import { CommissionRate } from '../types';

export default function CommissionSettings() {
  const [rates, setRates] = useState<CommissionRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Edit fields
  const [editType, setEditType] = useState<'percentage' | 'flat'>('percentage');
  const [editValue, setEditValue] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commissions');
      const data = await res.json();
      if (res.ok) {
        setRates(data);
      }
    } catch (err) {
      console.error('Error fetching commission rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (rate: CommissionRate) => {
    setEditingId(rate.serviceId);
    setEditType(rate.rateType);
    setEditValue(rate.rateValue.toString());
    setFeedback(null);
  };

  const handleSave = async (serviceId: string) => {
    const val = Number(editValue);
    if (isNaN(val) || val < 0) {
      setFeedback({ type: 'error', text: 'Kripya ek valid non-negative commission rate enter karein.' });
      return;
    }

    try {
      const res = await fetch('/api/commissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          rateType: editType,
          rateValue: val
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', text: 'Commission rate successfully update ho gaya hai!' });
        setRates(prev => prev.map(r => r.serviceId === serviceId ? { ...r, rateType: editType, rateValue: val } : r));
        setEditingId(null);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to update commission rate.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Network connection failed.' });
    }
  };

  return (
    <div id="commission-settings-root" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
            <Sliders className="text-blue-600 h-5 w-5" />
            Margin & Commission Console
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Specify agent commissions for AePS, DMT, BBPS, Insurance, Travel and E-Gov services
          </p>
        </div>
        <button
          onClick={fetchRates}
          className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Fetch Rates
        </button>
      </div>

      {feedback && (
        <div className={`mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
        }`}>
          <AlertCircle className="h-4 w-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4 rounded-l-xl">Category</th>
                <th className="py-3 px-4">Connected API Channel</th>
                <th className="py-3 px-4">Commission Model</th>
                <th className="py-3 px-4">Payout Value</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Configure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rates.map(rate => {
                const isEditing = editingId === rate.serviceId;
                return (
                  <tr key={rate.serviceId} className="hover:bg-slate-50/45 transition-colors">
                    
                    {/* Category Column */}
                    <td className="py-3.5 px-4 font-semibold capitalize text-xs">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        rate.category === 'banking' ? 'bg-indigo-50 text-indigo-700' :
                        rate.category === 'insurance' ? 'bg-emerald-50 text-emerald-700' :
                        rate.category === 'utility' ? 'bg-amber-50 text-amber-700' :
                        rate.category === 'travel' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'
                      }`}>
                        {rate.category}
                      </span>
                    </td>

                    {/* Channel Column */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{rate.serviceName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{rate.serviceId}</div>
                    </td>

                    {/* Model Type Column */}
                    <td className="py-3.5 px-4">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditType('percentage')}
                            className={`px-2 py-1 text-xs font-semibold rounded-md ${
                              editType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            % Percent
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditType('flat')}
                            className={`px-2 py-1 text-xs font-semibold rounded-md ${
                              editType === 'flat' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            ₹ Flat
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-600">
                          {rate.rateType === 'percentage' ? (
                            <>
                              <Percent className="h-3.5 w-3.5 text-blue-500" />
                              Percentage Payout
                            </>
                          ) : (
                            <>
                              <Coins className="h-3.5 w-3.5 text-emerald-500" />
                              Flat Fee Margin
                            </>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Value Column */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-sm">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-20 px-2.5 py-1 border border-blue-400 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-semibold"
                        />
                      ) : (
                        <span>
                          {rate.rateType === 'percentage' ? `${rate.rateValue}%` : `₹${rate.rateValue}`}
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleSave(rate.serviceId)}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                            title="Save rate"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(rate)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer text-xs font-semibold"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Adjust
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Helper guide */}
      <div className="mt-6 p-4 bg-blue-50/70 border border-blue-100/60 rounded-2xl flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 space-y-1">
          <p className="font-semibold">Commission Payout Model Guide:</p>
          <p>• **AePS & MicroATM Cashout**: Rates are set to flat (₹12, ₹10) as standard bank guidelines.</p>
          <p>• **Utility Recharges, Health Insurance & Travel Booking**: Are dynamic percentages calculated instantly at checkout.</p>
          <p>• Changes made here are saved in the Express server memory and applied dynamically to all active checkout flows instantly.</p>
        </div>
      </div>

    </div>
  );
}
