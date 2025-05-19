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
  private provider: ethers.providers.Web3Provider | null = null;
  private rpcProvider: ethers.providers.JsonRpcProvider;
  private tokens: Map<string, TokenInfo> = new Map();

  constructor() {
    if (window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    }
    // Initialize RPC provider for Ethereum mainnet
    this.rpcProvider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
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
    try {
      // Use RPC provider instead of MetaMask provider for token validation
      const code = await this.rpcProvider.getCode(tokenAddress);
      if (code === '0x') {
        throw new Error('No contract found at this address');
      }

      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.rpcProvider);
      
      // Try to call basic ERC20 functions to validate the contract
      try {
        const [name, symbol, decimals] = await Promise.all([
          contract.name().catch(() => 'Unknown Token'),
          contract.symbol().catch(() => 'UNKNOWN'),
          contract.decimals().catch(() => 18)
        ]);

        console.log('Token contract validated:', { name, symbol, decimals });
        return contract;
      } catch (err) {
        console.error('Error validating token functions:', err);
        throw new Error('Invalid ERC20 token contract. The contract does not implement the required functions.');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Invalid ERC20 token contract. Please verify the address.');
    }
  }

  // Add a new token
  async addToken(address: string, customName?: string): Promise<TokenInfo> {
    try {
      // Normalize the address
      if (!address.startsWith('0x')) {
        address = '0x' + address;
      }
      
      // Validate address format
      if (!ethers.utils.isAddress(address)) {
        throw new Error('Invalid token address format');
      }

      // Check if token already exists
      const existingToken = this.tokens.get(address.toLowerCase());
      if (existingToken) {
        return existingToken;
      }

      // First verify the contract exists
      const code = await this.rpcProvider.getCode(address);
      if (code === '0x') {
        throw new Error('No contract found at this address');
      }

      // Function signatures for direct calls
      const NAME_SIG = '0x06fdde03';      // bytes4(keccak256('name()'))
      const SYMBOL_SIG = '0x95d89b41';    // bytes4(keccak256('symbol()'))
      const DECIMALS_SIG = '0x313ce567';  // bytes4(keccak256('decimals()'))
      const BYTES32_NAME_SIG = '0xa3f4df7e'; // bytes4(keccak256('NAME()'))
      const BYTES32_SYMBOL_SIG = '0xb76a7f31'; // bytes4(keccak256('SYMBOL()'))

      // Try to get token information with fallbacks using low-level calls
      let name = 'Unknown Token';
      let symbol = 'UNKNOWN';
      let decimals = 18;

      try {
        // Try standard string name() first
        let nameData = await this.rpcProvider.call({
          to: address,
          data: NAME_SIG
        });

        if (!nameData || nameData === '0x') {
          // Try bytes32 NAME() as fallback
          nameData = await this.rpcProvider.call({
            to: address,
            data: BYTES32_NAME_SIG
          });
          if (nameData && nameData !== '0x') {
            // Remove trailing zeros from bytes32
            name = ethers.utils.parseBytes32String(nameData);
          }
        } else {
          // Decode standard string name
          const decodedName = ethers.utils.defaultAbiCoder.decode(['string'], nameData)[0];
          if (decodedName) name = decodedName;
        }
      } catch (error) {
        console.warn('Failed to get token name:', error);
      }

      try {
        // Try standard string symbol() first
        let symbolData = await this.rpcProvider.call({
          to: address,
          data: SYMBOL_SIG
        });

        if (!symbolData || symbolData === '0x') {
          // Try bytes32 SYMBOL() as fallback
          symbolData = await this.rpcProvider.call({
            to: address,
            data: BYTES32_SYMBOL_SIG
          });
          if (symbolData && symbolData !== '0x') {
            // Remove trailing zeros from bytes32
            symbol = ethers.utils.parseBytes32String(symbolData);
          }
        } else {
          // Decode standard string symbol
          const decodedSymbol = ethers.utils.defaultAbiCoder.decode(['string'], symbolData)[0];
          if (decodedSymbol) symbol = decodedSymbol;
        }
      } catch (error) {
        console.warn('Failed to get token symbol:', error);
      }

      try {
        // Try to get decimals
        const decimalsData = await this.rpcProvider.call({
          to: address,
          data: DECIMALS_SIG
        });
        if (decimalsData && decimalsData !== '0x') {
          const decodedDecimals = ethers.utils.defaultAbiCoder.decode(['uint8'], decimalsData)[0];
          if (typeof decodedDecimals === 'number') decimals = decodedDecimals;
        }
      } catch (error) {
        console.warn('Failed to get token decimals:', error);
      }

      console.log('Token info retrieved:', { name, symbol, decimals });

      // Create token info with custom name if provided
      const tokenInfo: TokenInfo = {
        address,
        name: customName || name,
        symbol,
        decimals,
        balance: '0'
      };

      // Add to tokens list
      this.tokens.set(address.toLowerCase(), tokenInfo);
      
      // Try to get initial balance if we have a connected wallet
      if (this.provider) {
        try {
          const signer = await this.getSigner();
          const walletAddress = await signer.getAddress();
          const BALANCE_OF_SIG = '0x70a08231000000000000000000000000' + walletAddress.slice(2);
          const balanceData = await this.rpcProvider.call({
            to: address,
            data: BALANCE_OF_SIG
          });
          if (balanceData && balanceData !== '0x') {
            const balance = ethers.BigNumber.from(balanceData);
            tokenInfo.balance = ethers.utils.formatUnits(balance, decimals);
          }
        } catch (error) {
          console.warn('Failed to get initial balance:', error);
          tokenInfo.balance = '0';
        }
      }

      // Save tokens to localStorage
      this.saveTokens();

      return tokenInfo;
    } catch (error) {
      console.error('Error adding token:', error);
      throw error;
    }
  }

  // Helper method to safely call contract methods with timeout
  private async _safeContractCall<T>(
    call: () => Promise<T>,
    defaultValue: T
  ): Promise<T> {
    try {
      const result = await Promise.race([
        call(),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error('Contract call timeout')), 5000)
        )
      ]) as T;
      return result;
    } catch (error) {
      console.warn('Contract call failed:', error);
      return defaultValue;
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