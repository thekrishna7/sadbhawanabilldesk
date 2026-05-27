import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// IP Configuration for local syncing (Run 'ipconfig' in command prompt to find your IP)
const LOCAL_IP = 'localhost'; // Change this to your computer's local IP (e.g. '192.168.1.15') for testing on physical devices
const API_BASE_URL = __DEV__
  ? `http://${LOCAL_IP}:3001/api`
  : 'https://sadbhawanabilldesk.vercel.app/api';

export interface User {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  address?: string;
  phone?: string;
  logo?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  isProfileComplete?: boolean;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE' | 'DRAFT';
  notes?: string;
  syncStatus: 'synced' | 'pending';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface AppState {
  // Auth
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, token: string, user: User) => void;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => Promise<boolean>;

  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'syncStatus'>) => Promise<string>;
  deleteInvoice: (id: string) => Promise<boolean>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<boolean>;
  syncInvoices: () => Promise<void>;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<Customer>;

  // App Settings
  isDarkMode: boolean;
  toggleTheme: () => void;
  isOffline: boolean;
  setOfflineStatus: (status: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth Initial State
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, apiToken, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false, invoices: [], customers: [] }),
      
      updateProfile: async (profileData) => {
        const currentUser = get().user;
        if (!currentUser) return false;

        const updatedUser = {
          ...currentUser,
          ...profileData,
          isProfileComplete: !!(
            (profileData.businessName || currentUser.businessName) &&
            (profileData.address || currentUser.address) &&
            (profileData.phone || currentUser.phone) &&
            (profileData.bankName || currentUser.bankName) &&
            (profileData.accountNumber || currentUser.accountNumber) &&
            (profileData.ifscCode || currentUser.ifscCode)
          ),
        };

        set({ user: updatedUser });

        // Try syncing profile to Vercel if online
        if (!get().isOffline && get().token) {
          try {
            await axios.put(
              `${API_BASE_URL}/profile`,
              profileData,
              { headers: { Authorization: `Bearer ${get().token}` } }
            );
          } catch (e) {
            console.warn('Failed to sync profile update, saved locally.', e);
          }
        }
        return true;
      },

      // Invoices Initial State
      invoices: [],
      
      addInvoice: async (invoiceData) => {
        const id = 'inv_' + Math.random().toString(36).substr(2, 9);
        const newInvoice: Invoice = {
          ...invoiceData,
          id,
          syncStatus: get().isOffline ? 'pending' : 'synced',
        };

        set((state) => ({ invoices: [newInvoice, ...state.invoices] }));

        // Try syncing to Vercel
        if (!get().isOffline && get().token) {
          try {
            await axios.post(
              `${API_BASE_URL}/invoices`,
              newInvoice,
              { headers: { Authorization: `Bearer ${get().token}` } }
            );
          } catch (e) {
            console.warn('Failed to sync new invoice, saved offline.', e);
            // Revert sync status to pending
            set((state) => ({
              invoices: state.invoices.map((inv) =>
                inv.id === id ? { ...inv, syncStatus: 'pending' } : inv
              ),
            }));
          }
        }
        return id;
      },

      deleteInvoice: async (id) => {
        set((state) => ({ invoices: state.invoices.filter((inv) => inv.id !== id) }));
        
        if (!get().isOffline && get().token) {
          try {
            await axios.delete(`${API_BASE_URL}/invoices/${id}`, {
              headers: { Authorization: `Bearer ${get().token}` },
            });
          } catch (e) {
            console.warn('Failed to sync invoice deletion.', e);
          }
        }
        return true;
      },

      updateInvoiceStatus: async (id, status) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, status, syncStatus: get().isOffline ? 'pending' : inv.syncStatus } : inv
          ),
        }));

        if (!get().isOffline && get().token) {
          try {
            await axios.patch(
              `${API_BASE_URL}/invoices/${id}`,
              { status },
              { headers: { Authorization: `Bearer ${get().token}` } }
            );
          } catch (e) {
            console.warn('Failed to sync status update.', e);
          }
        }
        return true;
      },

      syncInvoices: async () => {
        const pendingInvoices = get().invoices.filter((inv) => inv.syncStatus === 'pending');
        if (pendingInvoices.length === 0 || get().isOffline || !get().token) return;

        console.log(`Syncing ${pendingInvoices.length} offline invoices...`);
        for (const invoice of pendingInvoices) {
          try {
            await axios.post(
              `${API_BASE_URL}/invoices`,
              invoice,
              { headers: { Authorization: `Bearer ${get().token}` } }
            );
            // Mark as synced
            set((state) => ({
              invoices: state.invoices.map((inv) =>
                inv.id === invoice.id ? { ...inv, syncStatus: 'synced' } : inv
              ),
            }));
          } catch (e) {
            console.error(`Failed to sync invoice ${invoice.id}:`, e);
          }
        }
      },

      // Customers Initial State
      customers: [],
      
      addCustomer: async (customerData) => {
        const id = 'cust_' + Math.random().toString(36).substr(2, 9);
        const newCustomer: Customer = { ...customerData, id };

        set((state) => ({ customers: [...state.customers, newCustomer] }));

        if (!get().isOffline && get().token) {
          try {
            const res = await axios.post(
              `${API_BASE_URL}/customers`,
              newCustomer,
              { headers: { Authorization: `Bearer ${get().token}` } }
            );
            return res.data;
          } catch (e) {
            console.warn('Failed to sync new customer.', e);
          }
        }
        return newCustomer;
      },

      // App Settings State
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      isOffline: false,
      setOfflineStatus: (isOffline) => {
        set({ isOffline });
        if (!isOffline) {
          get().syncInvoices();
        }
      },
    }),
    {
      name: 'sadbhawana-billdesk-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
