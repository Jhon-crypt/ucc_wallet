import { ethers } from 'ethers';
import { bech32 } from 'bech32';
import { axiosWithCors, REST_API_URL, RPC_API_URL } from './api';
import { AxiosError } from 'axios';

export interface Balance {
  denom: string;
  amount: string;
}

export interface WalletInfo {
  ethAddress: string;
  cosmosAddress: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface BalanceResponse {
  balances: Balance[];
  result?: Balance[];
}

interface EthereumRequestParams {
  method: string;
  params?: unknown[];
}

interface EthereumProvider {
  request: (args: EthereumRequestParams) => Promise<unknown>;
  on: (event: string, handler: (params: string[]) => void) => void;
  removeListener: (event: string, handler: (params: string[]) => void) => void;
}

declare global {
  interface Window {
    ethereum: EthereumProvider;
  }
}

export class UCCWallet {
  private chainId = 'universe_9000-1';
  private chainName = 'Universe Chain Mainnet';
  private rpcUrl = 'http://145.223.80.193:8545';
  private restUrl = 'http://145.223.80.193:1317';
  private provider: ethers.providers.Web3Provider | null = null;

  constructor() {
    this.rpcUrl = RPC_API_URL;
    this.restUrl = REST_API_URL;
    if (window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    }
  }

  // Connect to MetaMask and get wallet info
  async connectWallet(): Promise<WalletInfo> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];
      
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
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  // Get MetaMask signer
  private async getSigner(): Promise<ethers.Signer> {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask.');
    }

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    // Create Web3Provider and get signer
    const metamaskProvider = new ethers.providers.Web3Provider(window.ethereum);
    return metamaskProvider.getSigner();
  }

  // Convert ETH address to UCC
  private ethToUcc(ethAddress: string): string {
    const addressBuffer = Buffer.from(ethAddress.slice(2), 'hex');
    const words = bech32.toWords(addressBuffer);
    return bech32.encode('ucc', words);
  }

  // Get balance
  async getBalance(address: string): Promise<Balance[]> {
    try {
      // Use Web3Provider to get balance directly like MetaMask does
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      
      // Convert the balance to our format
      return [{
        denom: 'atucc',
        amount: balance.toString()
      }];
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  // Send UCC tokens using MetaMask
  async sendTokens(
    recipientAddress: string,
    uccAmount: number
  ): Promise<TransactionResult> {
    try {
      console.log('Initiating token transfer via MetaMask...');
      
      // Get signer from MetaMask
      const signer = await this.getSigner();
      
      // Ensure recipient is in ETH format
      const ethRecipient = recipientAddress;
      if (!recipientAddress.startsWith('0x')) {
        // TODO: Add conversion from UCC to ETH address if needed
        throw new Error('Please provide an ETH address');
      }

      console.log('Sending to address:', ethRecipient);
      console.log('Amount:', uccAmount);

      // Send transaction
      const tx = await signer.sendTransaction({
        to: ethRecipient,
        value: ethers.utils.parseEther(uccAmount.toString())
      });

      console.log('Transaction submitted:', tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return {
        success: true,
        txHash: tx.hash,
        error: undefined
      };
    } catch (error) {
      console.error('Error sending tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send tokens'
      };
    }
  }

  // Generate new wallet
  async generateWallet(): Promise<{ mnemonic: string; address: string }> {
    const wallet = ethers.Wallet.createRandom();
    const address = this.ethToUcc(wallet.address);
    return {
      mnemonic: wallet.mnemonic.phrase,
      address
    };
  }

  // Import wallet from mnemonic
  async importFromMnemonic(mnemonic: string): Promise<{ address: string }> {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    const address = this.ethToUcc(wallet.address);
    return { address };
  }

  // Import wallet from private key
  async importFromPrivateKey(privateKey: string): Promise<{ address: string }> {
    const wallet = new ethers.Wallet(privateKey);
    const address = this.ethToUcc(wallet.address);
    return { address };
  }
} 