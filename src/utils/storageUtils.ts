import { WalletInfo } from './walletUtils';

const STORAGE_KEY = 'UCC_WALLET_DETAILS';

interface StoredWalletInfo extends WalletInfo {
  timestamp: number;
}

export const storageUtils = {
  // Save wallet details to local storage
  saveWallet: (walletInfo: WalletInfo) => {
    try {
      const storedData: StoredWalletInfo = {
        ...walletInfo,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
      return true;
    } catch (error) {
      console.error('Failed to save wallet to local storage:', error);
      return false;
    }
  },

  // Get wallet details from local storage
  getWallet: (): StoredWalletInfo | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data) as StoredWalletInfo;
    } catch (error) {
      console.error('Failed to get wallet from local storage:', error);
      return null;
    }
  },

  // Remove wallet details from local storage
  clearWallet: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear wallet from local storage:', error);
      return false;
    }
  },

  // Check if wallet exists in local storage
  hasWallet: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEY);
  }
}; 