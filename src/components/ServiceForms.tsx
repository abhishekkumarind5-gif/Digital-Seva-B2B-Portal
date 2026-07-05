/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Fingerprint, ArrowRightLeft, ReceiptText, ShieldCheck, 
  PlaneTakeoff, BookOpen, CreditCard, ChevronRight, CheckCircle, 
  AlertCircle, ArrowRight, RefreshCw, Printer, Download, X
} from 'lucide-react';
import { ServiceCategory } from '../types';

interface ServiceFormsProps {
  category: ServiceCategory;
  serviceId: string;
  serviceName: string;
  walletBalance: number;
  onTransactionSuccess: () => void;
}

export default function ServiceForms({ 
  category, 
  serviceId, 
  serviceName, 
  walletBalance, 
  onTransactionSuccess 
}: ServiceFormsProps) {
  
  // Form common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);

  // Form Fields State
  const [amount, setAmount] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [extraId, setExtraId] = useState<string>(''); // Aadhaar, PAN, Meter ID
  const [extraSelect, setExtraSelect] = useState<string>(''); // Bank, Operator
  const [extraText, setExtraText] = useState<string>(''); // IFSC, Vehicle No, Route

  // Simulated Device Status for AePS / MicroATM
  const [biometricDevice, setBiometricDevice] = useState<'Mantra' | 'Morpho' | 'Startek' | 'Disconnected'>('Mantra');
  const [fingerprintScanned, setFingerprintScanned] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Auto-calculated charge/deductions for DMT
  const parsedAmount = Number(amount) || 0;
  const simulatedDmtCharge = serviceId === 'dmt' ? Math.max(5, parseFloat((parsedAmount * 0.005).toFixed(2))) : 0;

  // Handle Biometric Scan simulation
  const handleBiometricScan = () => {
    if (biometricDevice === 'Disconnected') {
      setError('Biometric Scanner device not found. Please connect Mantra/Morpho device.');
      return;
    }
    setError(null);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setFingerprintScanned(true);
    }, 1500);
  };

  const resetForm = () => {
    setAmount('');
    setCustomerName('');
    setCustomerMobile('');
    setExtraId('');
    setExtraSelect('');
    setExtraText('');
    setFingerprintScanned(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Dynamic Validations
    if (!amount || parsedAmount <= 0) {
      setError('Aapko ek manya (positive) amount enter karna hoga.');
      return;
    }

    if (serviceId === 'aeps' && !fingerprintScanned) {
      setError('Customer biometric fingerprint verify karna compulsory hai.');
      return;
    }

    if (serviceId === 'aeps' && (!extraId || extraId.length !== 12)) {
      setError('Kripya 12-digit Aadhaar Card number enter karein.');
      return;
    }

    if (serviceId === 'pan' && !extraId) {
      setError('Kripya PAN card applicant ka Aadhaar Card number enter karein.');
      return;
    }

    setLoading(true);

    try {
      // Assemble customer details depending on form
      const customerDetails: any = {
        name: customerName || 'Walk-in Customer',
        mobile: customerMobile || undefined,
      };

      if (serviceId === 'aeps' || serviceId === 'microatm') {
        customerDetails.idNumber = `XXXX-XXXX-${extraId.slice(-4)}`;
        customerDetails.operatorName = extraSelect; // Selected Bank
      } else if (serviceId === 'dmt') {
        customerDetails.accountNumber = extraId;
        customerDetails.operatorName = extraSelect; // IFSC Code or Bank Name
        customerDetails.idNumber = extraText; // Bank name
      } else if (category === 'utility') {
        customerDetails.idNumber = extraId; // Consumer No
        customerDetails.operatorName = extraSelect; // Board/Operator
      } else if (category === 'insurance') {
        customerDetails.idNumber = extraId; // Vehicle or Proposer ID
        customerDetails.operatorName = extraSelect; // Insurer Company
      } else if (category === 'travel') {
        customerDetails.travelDetails = `${extraSelect} to ${extraText}`;
      } else if (category === 'egov') {
        customerDetails.idNumber = extraId; // PAN Aadhaar
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          serviceId,
          amount: parsedAmount,
          customerDetails
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server processing error occurred.');
      }

      setReceipt(data.transaction);
      onTransactionSuccess();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Server error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="service-form-root" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-xl mx-auto">
      
      {/* Header with Title and Category Icon */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-wider">
            {category} service
          </span>
          <h2 className="text-lg font-bold text-slate-900 mt-1.5">{serviceName}</h2>
        </div>
        <div className="p-3 bg-slate-50 text-slate-700 rounded-xl">
          {category === 'banking' && <Fingerprint className="h-6 w-6 text-indigo-600" />}
          {category === 'insurance' && <ShieldCheck className="h-6 w-6 text-emerald-600" />}
          {category === 'utility' && <ReceiptText className="h-6 w-6 text-amber-500" />}
          {category === 'travel' && <PlaneTakeoff className="h-6 w-6 text-sky-500" />}
          {category === 'egov' && <BookOpen className="h-6 w-6 text-violet-600" />}
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded-r-xl flex items-start gap-2 animate-shake">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* RENDER FORMS */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* ================= BANKING CATEGORY FORM ================= */}
        {category === 'banking' && serviceId === 'aeps' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer Mobile</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 10 digit Mobile"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer Aadhaar No (UID)</label>
                <input 
                  type="text" 
                  maxLength={12}
                  value={extraId}
                  onChange={e => setExtraId(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest"
                  placeholder="Enter 12 digit Aadhaar"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Select Customer's Bank</label>
              <select 
                value={extraSelect}
                onChange={e => setExtraSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Select Bank --</option>
                <option value="State Bank of India">State Bank of India (SBI)</option>
                <option value="HDFC Bank">HDFC Bank Ltd</option>
                <option value="ICICI Bank">ICICI Bank Ltd</option>
                <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
                <option value="Canara Bank">Canara Bank</option>
                <option value="Union Bank of India">Union Bank of India</option>
                <option value="Paytm Payments Bank">Paytm Payments Bank</option>
              </select>
            </div>

            {/* AePS Biometric Scanner Controller */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Fingerprint className="h-4 w-4 text-rose-500" />
                  Biometric Scan Agent Hub
                </span>
                <select 
                  value={biometricDevice}
                  onChange={e => {
                    setBiometricDevice(e.target.value as any);
                    setFingerprintScanned(false);
                  }}
                  className="text-xs bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none font-medium text-slate-700"
                >
                  <option value="Mantra">Mantra MFS100 (USB)</option>
                  <option value="Morpho">Morpho MSO1300</option>
                  <option value="Startek">Startek FM220</option>
                  <option value="Disconnected">Disconnect Scanner</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="text-xs text-slate-500">
                  {biometricDevice !== 'Disconnected' ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Device connected & active
                    </span>
                  ) : (
                    <span className="text-rose-500 font-medium">No biometric device registered</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleBiometricScan}
                  disabled={scanning || biometricDevice === 'Disconnected'}
                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                    fingerprintScanned 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400'
                  }`}
                >
                  {scanning ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Scanning...
                    </>
                  ) : fingerprintScanned ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      Fingerprint Scanned
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-3.5 w-3.5" />
                      Capture Fingerprint
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {category === 'banking' && serviceId === 'dmt' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Receiver Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Beneficiary Name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Receiver Mobile</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Beneficiary Mobile"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bank Account Number</label>
                <input 
                  type="text" 
                  value={extraId}
                  onChange={e => setExtraId(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="A/C Number"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bank IFSC Code</label>
                <input 
                  type="text" 
                  value={extraText}
                  onChange={e => setExtraText(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. SBIN0001025"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Select Bank</label>
              <select 
                value={extraSelect}
                onChange={e => setExtraSelect(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Select Bank --</option>
                <option value="State Bank of India">State Bank of India</option>
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Punjab National Bank">Punjab National Bank</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
              </select>
            </div>
          </>
        )}

        {category === 'banking' && serviceId === 'microatm' && (
          <>
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-start gap-3">
              <CreditCard className="h-6 w-6 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-sky-900">Micro ATM (mATM) Simulation</h4>
                <p className="text-xs text-sky-700 mt-1">
                  Kripya customer ka debit card terminal machine par swipe/insert karwayein. Dynamic connection active hai.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer Mobile</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Receipt Mobile"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Card Type</label>
                <select 
                  value={extraSelect}
                  onChange={e => setExtraSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="RuPay">RuPay Card</option>
                  <option value="Visa">Visa Card</option>
                  <option value="Mastercard">Mastercard</option>
                </select>
              </div>
            </div>
          </>
        )}


        {/* ================= UTILITY CATEGORY FORM (BBPS / Recharge) ================= */}
        {category === 'utility' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Service Type</label>
                <select 
                  value={extraSelect}
                  onChange={e => setExtraSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {serviceId === 'bbps' ? (
                    <>
                      <option value="Electricity">Electricity Bill</option>
                      <option value="Water">Water Bill</option>
                      <option value="Piped Gas">LPG/Piped Gas</option>
                      <option value="DTH">DTH Recharge</option>
                      <option value="FASTag">FASTag Toll</option>
                    </>
                  ) : (
                    <>
                      <option value="Jio Prepaid">Jio Prepaid</option>
                      <option value="Airtel Prepaid">Airtel Prepaid</option>
                      <option value="VI Prepaid">VI Prepaid</option>
                      <option value="BSNL Special">BSNL Validity</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  {serviceId === 'bbps' ? 'Consumer ID / Meter No' : 'Mobile Number'}
                </label>
                <input 
                  type="text" 
                  value={extraId}
                  onChange={e => setExtraId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder={serviceId === 'bbps' ? 'e.g. 102938475' : '10 digit mobile'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name (Optional)</label>
              <input 
                type="text" 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bill Holder's Name"
              />
            </div>
          </>
        )}


        {/* ================= INSURANCE CATEGORY FORM ================= */}
        {category === 'insurance' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Insurer Partner</label>
                <select 
                  value={extraSelect}
                  onChange={e => setExtraSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Choose Provider --</option>
                  <option value="HDFC ERGO General">HDFC ERGO</option>
                  <option value="ICICI Lombard">ICICI Lombard</option>
                  <option value="LIC of India">Life Insurance Corp (LIC)</option>
                  <option value="Niva Bupa Health">Niva Bupa Health</option>
                  <option value="Bajaj Allianz">Bajaj Allianz Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Vehicle No / Health ID</label>
                <input 
                  type="text" 
                  value={extraId}
                  onChange={e => setExtraId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. BR-01-EA-1234"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Proposer Full Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter policy proposer"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer Phone</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Receive policy WhatsApp"
                  required
                />
              </div>
            </div>
          </>
        )}


        {/* ================= TRAVEL CATEGORY FORM ================= */}
        {category === 'travel' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Departure / Boarding City</label>
                <input 
                  type="text" 
                  value={extraSelect}
                  onChange={e => setExtraSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Boarding from"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Destination City</label>
                <input 
                  type="text" 
                  value={extraText}
                  onChange={e => setExtraText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Traveling to"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Primary Passenger Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Passenger Name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Passenger Contact No</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="SMS Receipt Phone"
                  required
                />
              </div>
            </div>
          </>
        )}


        {/* ================= E-GOV UTILITIES FORM (PAN Cards) ================= */}
        {category === 'egov' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Applicant Full Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="As in Aadhaar card"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Applicant Aadhaar UID</label>
                <input 
                  type="text" 
                  maxLength={12}
                  value={extraId}
                  onChange={e => setExtraId(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-wider"
                  placeholder="12 digit Aadhaar No"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Select Processing Gateway</label>
                <select 
                  value={extraSelect}
                  onChange={e => setExtraSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                >
                  <option value="NSDL Aggregator">NSDL e-Gov Portal</option>
                  <option value="UTI Infrastructure">UTIITS Portal Gateway</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Applicant Mobile</label>
                <input 
                  type="tel" 
                  maxLength={10}
                  value={customerMobile}
                  onChange={e => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Verification Phone"
                  required
                />
              </div>
            </div>
          </>
        )}


        {/* ================= COMMON AMOUNT AND DETAILS ================= */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Transaction Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2.5 text-slate-400 font-semibold text-lg">₹</span>
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="0.00"
              required
            />
          </div>

          {/* Wallet Balance Warning or DMT charge breakdown */}
          <div className="mt-2.5 flex items-center justify-between text-xs px-1">
            {serviceId === 'dmt' && (
              <span className="text-amber-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                DMT Transfer Fee: ₹{simulatedDmtCharge} (Applied on wallet)
              </span>
            )}
            {category !== 'banking' && (
              <span className="text-slate-500 font-medium ml-auto">
                Portal Wallet Balance: <strong className="text-slate-900 font-mono">₹{walletBalance.toLocaleString('en-IN')}</strong>
              </span>
            )}
            {category === 'banking' && (serviceId === 'aeps' || serviceId === 'microatm') && (
              <span className="text-indigo-600 font-semibold flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                This is a cash-out withdrawal (credits wallet balance)
              </span>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={loading || (serviceId === 'aeps' && !fingerprintScanned)}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-100 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Aggregating API Secure Bridge...
              </>
            ) : (
              <>
                Confirm & Pay ₹{parsedAmount ? (parsedAmount + simulatedDmtCharge).toLocaleString('en-IN') : '0'}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>

      </form>

      {/* RECEIPT MODAL MODIFIED TO COMPLY WITH STANDARD IN-PAGE DESIGN */}
      {receipt && (
        <div id="receipt-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative border border-slate-100 animate-slide-up">
            
            <button 
              onClick={() => setReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <div className="mx-auto h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2.5">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Transaction Successful</h3>
              <p className="text-xs text-slate-500 mt-1">Processed securely via NPCI Aggregator Node</p>
            </div>

            <div className="space-y-3.5 py-5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Service Portal:</span>
                <span className="font-semibold text-slate-800">{receipt.serviceName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                  {receipt.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">NPCI Reference (RRN):</span>
                <span className="font-mono text-xs font-semibold text-slate-800">{receipt.referenceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Base Txn Amount:</span>
                <span className="font-mono font-bold text-slate-900">₹{receipt.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600">
                <span className="font-medium">Agent Commission Earned:</span>
                <span className="font-mono font-bold">+₹{receipt.commission.toLocaleString('en-IN')}</span>
              </div>
              {receipt.charge > 0 && (
                <div className="flex justify-between items-center text-rose-500">
                  <span>Routing Service Charge:</span>
                  <span className="font-mono font-bold">-₹{receipt.charge.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <span className="font-medium text-slate-800">Wallet Adjustment Effect:</span>
                <span className={`font-mono font-bold ${receipt.netDeduction < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {receipt.netDeduction < 0 
                    ? `+₹${Math.abs(receipt.netDeduction).toLocaleString('en-IN')} (Credited)` 
                    : `-₹${receipt.netDeduction.toLocaleString('en-IN')} (Debited)`}
                </span>
              </div>

              {receipt.customerDetails && (
                <div className="mt-4 bg-slate-50 rounded-xl p-3 text-xs space-y-1 text-slate-600">
                  <div className="font-semibold text-slate-800 text-xs mb-1 uppercase tracking-wider">Recipient / Customer Info</div>
                  {receipt.customerDetails.name && <div>Name: <strong>{receipt.customerDetails.name}</strong></div>}
                  {receipt.customerDetails.mobile && <div>Mobile: {receipt.customerDetails.mobile}</div>}
                  {receipt.customerDetails.idNumber && <div>ID Number/Aadhaar: <span className="font-mono">{receipt.customerDetails.idNumber}</span></div>}
                  {receipt.customerDetails.operatorName && <div>Provider/Bank: {receipt.customerDetails.operatorName}</div>}
                  {receipt.customerDetails.travelDetails && <div>Route details: {receipt.customerDetails.travelDetails}</div>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <button 
                type="button"
                onClick={() => {
                  alert('Receipt is generated and sent to customer via registered WhatsApp.');
                }}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
              <button 
                type="button"
                onClick={() => setReceipt(null)}
                className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-100 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Done (Vapas Dashboard)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
