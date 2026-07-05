/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServiceCategory = 'banking' | 'insurance' | 'utility' | 'travel' | 'egov';

export interface ServiceItem {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string;
  icon: string;
  path: string;
  isPinned?: boolean;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  city: string;
  status: 'active' | 'inactive';
  walletBalance: number;
  role: 'agent' | 'admin';
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  agentId: string;
  type: 'credit' | 'debit';
  amount: number;
  prevBalance: number;
  newBalance: number;
  description: string;
  timestamp: string;
}

export interface ServiceTransaction {
  id: string;
  agentId: string;
  agentName: string;
  category: ServiceCategory;
  serviceName: string;
  amount: number;
  commission: number;
  charge: number;
  netDeduction: number;
  status: 'success' | 'pending' | 'failed';
  customerDetails: {
    name?: string;
    mobile?: string;
    accountNumber?: string;
    idNumber?: string; // Aadhaar, PAN, etc.
    operatorName?: string;
    vehicleNo?: string;
    travelDetails?: string;
  };
  referenceNumber: string;
  timestamp: string;
}

export interface CommissionRate {
  category: ServiceCategory;
  serviceId: string;
  serviceName: string;
  rateType: 'percentage' | 'flat';
  rateValue: number; // e.g. 0.5% or ₹10 flat
}

export interface DashboardStats {
  totalVolume: number;
  totalCommission: number;
  walletBalance: number;
  successRate: number;
  transactionCount: number;
}
