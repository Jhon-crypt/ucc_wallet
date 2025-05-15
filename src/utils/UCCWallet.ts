import { ethers } from 'ethers';
import { bech32 } from 'bech32';
import { RPC_API_URL } from './api';

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

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
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

// Minimal ERC20 ABI for token interactions
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export class UCCWallet {
  private chainId = 'universe_9000-1';
  private chainName = 'Universe Chain Mainnet';
  private rpcUrl = RPC_API_URL;
  private restUrl = RPC_API_URL;
  private provider: ethers.providers.Web3Provider | null = null;
  private tokens: Map<string, TokenInfo> = new Map();

  constructor() {
    this.rpcUrl = RPC_API_URL;
    this.restUrl = RPC_API_URL;
    if (window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    }
    this.loadSavedTokens();
  }

  // Load saved tokens from localStorage
  private loadSavedTokens() {
    try {
      const savedTokens = localStorage.getItem('customTokens');
      if (savedTokens) {
        const tokenList = JSON.parse(savedTokens) as TokenInfo[];
        tokenList.forEach(token => {
          this.tokens.set(token.address.toLowerCase(), token);
        });
      }
    } catch (error) {
      console.error('Error loading saved tokens:', error);
    }
  }

  // Save tokens to localStorage
  private saveTokens() {
    try {
      const tokenList = Array.from(this.tokens.values());
      localStorage.setItem('customTokens', JSON.stringify(tokenList));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  // Validate token contract
  private async validateTokenContract(tokenAddress: string): Promise<ethers.Contract> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    if (!ethers.utils.isAddress(tokenAddress)) {
      throw new Error('Invalid token address format');
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      // Try to call basic ERC20 functions to validate the contract
      await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      return contract;
    } catch (error) {
      console.error('Token validation error:', error);
      throw new Error('Invalid ERC20 token contract. Please verify the address.');
    }
  }

  // Add a new token
  async addToken(tokenAddress: string): Promise<TokenInfo> {
    try {
      const normalizedAddress = tokenAddress.toLowerCase();
      
      // Check if token is already added
      if (this.tokens.has(normalizedAddress)) {
        throw new Error('Token is already imported');
      }

      // Validate the token contract
      const contract = await this.validateTokenContract(tokenAddress);
      
      // Get token information
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      const tokenInfo: TokenInfo = {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals)
      };

      // Get initial balance if wallet is connected
      if (this.provider) {
        const signer = await this.getSigner();
        const address = await signer.getAddress();
        const balance = await contract.balanceOf(address);
        tokenInfo.balance = ethers.utils.formatUnits(balance, decimals);
      }

      // Save token
      this.tokens.set(normalizedAddress, tokenInfo);
      this.saveTokens();

      return tokenInfo;
    } catch (error) {
      console.error('Error adding token:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to add token');
    }
  }

  // Get token balance
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const token = this.tokens.get(tokenAddress.toLowerCase());
      if (!token) {
        throw new Error('Token not found');
      }

      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const balance = await contract.balanceOf(walletAddress);
      
      return ethers.utils.formatUnits(balance, token.decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  // Update all token balances
  async updateAllTokenBalances(walletAddress: string): Promise<void> {
    try {
      const promises = Array.from(this.tokens.values()).map(async (token) => {
        try {
          const balance = await this.getTokenBalance(token.address, walletAddress);
          token.balance = balance;
        } catch (error) {
          console.error(`Error updating balance for token ${token.symbol}:`, error);
          token.balance = '0';
        }
      });

      await Promise.all(promises);
      this.saveTokens();
    } catch (error) {
      console.error('Error updating token balances:', error);
    }
  }

  // Get list of added tokens
  getTokens(): TokenInfo[] {
    return Array.from(this.tokens.values());
  }

  // Remove a token
  removeToken(tokenAddress: string): boolean {
    const removed = this.tokens.delete(tokenAddress.toLowerCase());
    if (removed) {
      this.saveTokens();
    }
    return removed;
  }

  // Send token
  async sendToken(
    tokenAddress: string,
    recipientAddress: string,
    amount: string
  ): Promise<TransactionResult> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const token = this.tokens.get(tokenAddress.toLowerCase());
      if (!token) {
        throw new Error('Token not found');
      }

      // Convert UCC address to ETH address if needed
      let ethRecipient = recipientAddress;
      if (recipientAddress.startsWith('ucc')) {
        ethRecipient = this.uccToEth(recipientAddress);
      } else if (!recipientAddress.startsWith('0x')) {
        throw new Error('Invalid address format. Please provide a UCC or ETH address');
      }

      const signer = await this.getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      
      // Convert amount to token decimals
      const value = ethers.utils.parseUnits(amount, token.decimals);
      
      // Send transaction
      const tx = await tokenContract.transfer(ethRecipient, value);
      console.log('Token transfer submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Token transfer confirmed:', receipt);

      return {
        success: true,
        txHash: tx.hash
      };
    } catch (error) {
      console.error('Error sending token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send tokens'
      };
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

  // Convert UCC address to ETH
  private uccToEth(uccAddress: string): string {
    try {
      const decoded = bech32.decode(uccAddress);
      const buffer = Buffer.from(bech32.fromWords(decoded.words));
      return '0x' + buffer.toString('hex');
    } catch (error) {
      console.error('Error converting UCC to ETH address:', error);
      throw error;
    }
  }

  // Get balance
  async getBalance(uccAddress: string): Promise<Balance[]> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // Convert UCC address to ETH address for balance check
      const ethAddress = this.uccToEth(uccAddress);
      console.log('Fetching balance for ETH address:', ethAddress);
      
      const balance = await this.provider.getBalance(ethAddress);
      console.log('Raw balance:', balance.toString());
      
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
      
      // Convert UCC address to ETH address if needed
      let ethRecipient = recipientAddress;
      if (recipientAddress.startsWith('ucc')) {
        try {
          ethRecipient = this.uccToEth(recipientAddress);
          console.log('Converted UCC address to ETH address:', ethRecipient);
        } catch (error) {
          console.error('Error converting UCC address:', error);
          throw new Error('Invalid UCC address format');
        }
      } else if (!recipientAddress.startsWith('0x')) {
        throw new Error('Invalid address format. Please provide a UCC or ETH address');
      }

      console.log('Sending to ETH address:', ethRecipient);
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