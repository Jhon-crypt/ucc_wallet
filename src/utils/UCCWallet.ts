import { ethers } from 'ethers';
import { bech32 } from 'bech32';
import { RPC_API_URL, makeProxyRequest } from './apiUtils';

export interface Balance {
  denom: string;
  amount: string;
}

export interface WalletInfo {
  ethAddress: string;
  cosmosAddress: string;
  mnemonic?: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  recipient?: string;
  amount?: string;
  error?: string;
}

interface EthereumRequest {
  method: string;
  params?: unknown[];
}

interface EthereumProvider {
  request: (args: EthereumRequest) => Promise<unknown>;
  isMetaMask?: boolean;
  on: (event: string, callback: (params: unknown) => void) => void;
  removeListener: (event: string, callback: (params: unknown) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export class UCCWallet {
  private rpcUrl: string;

  constructor() {
    // Remove the 'https://api.allorigins.win/raw?url=' prefix from RPC_API_URL
    this.rpcUrl = decodeURIComponent(RPC_API_URL.replace('https://api.allorigins.win/raw?url=', ''));
  }

  // Generate new wallet
  async generateWallet(): Promise<WalletInfo> {
    const wallet = ethers.Wallet.createRandom();
    return {
      ethAddress: wallet.address,
      cosmosAddress: this.ethToUcc(wallet.address),
      mnemonic: wallet.mnemonic.phrase
    };
  }

  // Import wallet from mnemonic
  async importFromMnemonic(mnemonic: string): Promise<WalletInfo> {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    return {
      ethAddress: wallet.address,
      cosmosAddress: this.ethToUcc(wallet.address),
      mnemonic
    };
  }

  // Import wallet from private key
  async importFromPrivateKey(privateKey: string): Promise<WalletInfo> {
    const wallet = new ethers.Wallet(privateKey);
    return {
      ethAddress: wallet.address,
      cosmosAddress: this.ethToUcc(wallet.address)
    };
  }

  // Connect to MetaMask and get wallet info
  async connectWallet(): Promise<WalletInfo> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const ethAddress = accounts[0];
      const cosmosAddress = this.ethToUcc(ethAddress);

      // Request network switch
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2328' }], // Chain ID 9000
        });
      } catch (switchError: unknown) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError && typeof switchError === 'object' && 'code' in switchError && switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x2328', // Chain ID 9000
              chainName: 'Universe Chain',
              nativeCurrency: {
                name: 'UCC',
                symbol: 'UCC',
                decimals: 18
              },
              rpcUrls: [this.rpcUrl],
              blockExplorerUrls: [''] // Add block explorer URL if available
            }]
          });
        } else {
          throw switchError;
        }
      }

      return {
        ethAddress,
        cosmosAddress
      };
    } catch (error: unknown) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Get balance
  async getBalance(address: string): Promise<Balance[]> {
    try {
      console.log('Fetching balance for address:', address);

      const response = await makeProxyRequest(`/cosmos/bank/v1beta1/balances/${address}`);
      const data = await response.json();
      console.log('Balance response:', data);

      // Extract balances from the response
      let balances = data.balances || [];
      
      // If balances is empty, try the legacy format
      if (!balances.length && data.result) {
        console.log('Using legacy balance format');
        balances = data.result;
      }

      console.log('Raw balances:', balances);
      
      // If still no balances, return zero balance
      if (!balances.length) {
        console.log('No balances found, returning zero balance');
        return [{
          denom: 'atucc',
          amount: '0'
        }];
      }

      // Filter for atucc balance
      const atuccBalance = balances.find((b: Balance) => b.denom === 'atucc') || {
        denom: 'atucc',
        amount: '0'
      };
      console.log('ATUCC balance:', atuccBalance);

      // Convert amount to string if it's a number
      if (typeof atuccBalance.amount === 'number') {
        atuccBalance.amount = atuccBalance.amount.toString();
      }

      return [atuccBalance];
    } catch (error) {
      console.error('Error fetching balance:', error);
      // Return zero balance instead of throwing
      return [{
        denom: 'atucc',
        amount: '0'
      }];
    }
  }

  // Convert ETH address to UCC
  private ethToUcc(ethAddress: string): string {
    const addressBuffer = Buffer.from(ethAddress.slice(2), 'hex');
    const words = bech32.toWords(addressBuffer);
    return bech32.encode('ucc', words);
  }
} 