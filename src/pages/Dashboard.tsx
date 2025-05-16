import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ethers } from 'ethers';
import { UCCWallet, WalletInfo, Balance, TokenInfo } from '../utils/UCCWallet';
import { SendTokenModal } from '../components/SendTokenModal';
import ImportToken from '../components/ImportToken';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import TokenList from '../components/TokenList';

export default function Dashboard() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [wallet, setWallet] = useState<UCCWallet | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  // Function to fetch balance with retries
  const fetchBalanceWithRetries = async (address: string) => {
    if (!wallet) return;

    try {
      setIsLoading(true);
      console.log('Fetching balance for address:', address);
      
      const balances = await wallet.getBalance(address);
      console.log('Raw balances response:', JSON.stringify(balances, null, 2));
      
      // Find ATUCC balance with detailed logging
      const atuccBalance = balances.find((b: Balance) => {
        console.log('Checking balance denom:', b.denom);
        return b.denom === 'atucc';
      })?.amount || '0';
      
      console.log('Found ATUCC balance:', atuccBalance);
      
      // Ensure the balance is a valid string before conversion
      if (typeof atuccBalance !== 'string') {
        console.error('Invalid balance format:', atuccBalance);
        return false;
      }

      // Convert from ATUCC (18 decimals) to UCC with validation
      let uccBalance;
      try {
        uccBalance = ethers.utils.formatUnits(atuccBalance, 18);
        console.log('Converted UCC balance:', uccBalance);
      } catch (error) {
        console.error('Error converting balance:', error);
        return false;
      }

      // Validate the converted balance
      const numericBalance = parseFloat(uccBalance);
      if (isNaN(numericBalance)) {
        console.error('Invalid numeric balance after conversion');
        return false;
      }

      // Format the balance with proper decimal places
      const formattedBalance = numericBalance.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      });
      console.log('Final formatted balance:', formattedBalance);

      setBalance(uccBalance);
      return true;
    } catch (error) {
      console.error('Error fetching balance:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling after transaction
  const startPolling = async (address: string) => {
    setIsPolling(true);
    setPollCount(0);
    
    const pollInterval = 2000; // 2 seconds
    const maxAttempts = 5;

    const poll = async () => {
      if (pollCount >= maxAttempts) {
        setIsPolling(false);
        return;
      }

      const success = await fetchBalanceWithRetries(address);
      if (!success) {
        setPollCount(count => count + 1);
        setTimeout(() => poll(), pollInterval);
      } else {
        setIsPolling(false);
      }
    };

    await poll();
  };

  // Handle sending tokens
  const handleSendTokens = async (recipient: string, amount: string) => {
    if (!wallet || !walletInfo) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsSending(true);
      const amountNum = parseFloat(amount);
      
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      console.log('Sending transaction...');
      const result = await wallet.sendTokens(recipient, amountNum);

      if (result.success) {
        toast.success('Transaction sent successfully!');
        console.log('Transaction hash:', result.txHash);
        
        // Start polling for balance updates
        await startPolling(walletInfo.cosmosAddress);
        
        setIsSendModalOpen(false);
      } else {
        console.error('Transaction failed:', result.error);
        toast.error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send transaction');
    } finally {
      setIsSending(false);
    }
  };

  // Initialize wallet and set up polling
  useEffect(() => {
    const initWallet = async () => {
      try {
        console.log('Initializing wallet...');
        const uccWallet = new UCCWallet();
        setWallet(uccWallet);

        // Connect to MetaMask
        const info = await uccWallet.connectWallet();
        console.log('Connected to wallet:', info);
        setWalletInfo(info);

        // Fetch initial balance
        await fetchBalanceWithRetries(info.cosmosAddress);

        // Listen for account changes and transactions
        if (window.ethereum) {
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
          // Listen for new blocks which might contain our transactions
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          provider.on('block', async () => {
            console.log('New block detected, updating balance...');
            if (info.cosmosAddress) {
              await fetchBalanceWithRetries(info.cosmosAddress);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing wallet:', error);
        toast.error('Failed to connect to MetaMask');
        navigate('/');
      }
    };

    initWallet();

    // Cleanup listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        provider.removeAllListeners('block');
      }
    };
  }, [navigate]);

  // Regular balance polling with shorter interval
  useEffect(() => {
    if (!walletInfo?.cosmosAddress || isPolling) return;

    const pollInterval = setInterval(() => {
      fetchBalanceWithRetries(walletInfo.cosmosAddress);
    }, 3000); // Poll every 3 seconds instead of 10

    return () => clearInterval(pollInterval);
  }, [walletInfo?.cosmosAddress, isPolling]);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      navigate('/');
    } else {
      // User switched accounts, update the wallet info
      if (wallet) {
        const info = await wallet.connectWallet();
        setWalletInfo(info);
        await fetchBalanceWithRetries(info.cosmosAddress);
      }
    }
  };

  const handleChainChanged = () => {
    // Reload the page when the chain changes
    window.location.reload();
  };

  const handleDisconnect = () => {
    navigate('/');
  };

  // Load tokens on mount
  useEffect(() => {
    if (wallet) {
      setTokens(wallet.getTokens());
    }
  }, [wallet]);

  // Handle token import
  const handleImportToken = async (address: string, customName?: string): Promise<TokenInfo> => {
    if (!wallet) throw new Error('Wallet not initialized');
    
    const tokenInfo = await wallet.addToken(address, customName);
    setTokens(wallet.getTokens());
    return tokenInfo;
  };

  // Update token balances
  const updateTokenBalances = async () => {
    if (!wallet || !walletInfo) return;
    await wallet.updateAllTokenBalances(walletInfo.ethAddress);
    setTokens(wallet.getTokens());
  };

  // Update balances when wallet is connected
  useEffect(() => {
    if (wallet && walletInfo) {
      updateTokenBalances();
    }
  }, [wallet, walletInfo]);

  // Handle token removal
  const handleRemoveToken = (address: string) => {
    if (!wallet) return;
    
    if (wallet.removeToken(address)) {
      setTokens(wallet.getTokens());
      toast.success('Token removed successfully');
    } else {
      toast.error('Failed to remove token');
    }
  };

  if (!walletInfo) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Connecting to MetaMask...</h2>
            <p className="text-gray-400">Please unlock your MetaMask wallet</p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gradient">UCC Wallet</h1>
              <p className="text-gray-400 mt-1">Your Universe Chain Gateway</p>
            </div>
            <Button variant="secondary" onClick={handleDisconnect}>
              Disconnect Wallet
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Balance Card */}
            <Card className="lg:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Balance</h2>
                  <div className="flex items-center gap-2">
                    {isLoading && (
                      <span className="text-sm text-gray-400">Updating...</span>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchBalanceWithRetries(walletInfo.cosmosAddress)}
                      isLoading={isLoading}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    {isLoading || balance === null ? (
                      <div className="h-10 flex items-center">
                        <div className="animate-pulse bg-gray-700 rounded h-8 w-32"></div>
                      </div>
                    ) : (
                      <>
                        <span className="text-4xl font-bold font-mono">
                          {Number(balance).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6
                          })}
                        </span>
                        <span className="text-xl text-gray-400">UCC</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {isLoading || balance === null ? (
                      <div className="animate-pulse bg-gray-700 rounded h-4 w-24"></div>
                    ) : (
                      <>
                        <p className="text-gray-400">
                          ≈ ${(Number(balance) * 1.5).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} USD
                        </p>
                        <span className="text-xs text-gray-500">(estimated)</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {isLoading ? 'Fetching balance...' : `Last updated: ${new Date().toLocaleTimeString()}`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsSendModalOpen(true)}
                    isLoading={isSending}
                    className="flex-1"
                  >
                    Send
                  </Button>
                  {/* <Button
                    variant="secondary"
                    onClick={() =>
                    className="flex-1"
                  >
                    Receive
                  </Button> */}
                </div>
              </div>
            </Card>

            {/* Network Card */}
            <Card>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Network</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Universe Chain Mainnet</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Chain ID: universe_9000-1
                  </p>
                </div>
              </div>
            </Card>

            {/* Addresses Card */}
            <Card className="lg:col-span-3">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Wallet Addresses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">UCC Address</label>
                    <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded-lg group cursor-pointer" onClick={() => {
                      navigator.clipboard.writeText(walletInfo.cosmosAddress);
                      toast.success('Address copied to clipboard!');
                    }}>
                      <code className="text-sm flex-1 break-all">
                        {walletInfo.cosmosAddress}
                      </code>
                      <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">ETH Address</label>
                    <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded-lg group cursor-pointer" onClick={() => {
                      navigator.clipboard.writeText(walletInfo.ethAddress);
                      toast.success('Address copied to clipboard!');
                    }}>
                      <code className="text-sm flex-1 break-all">
                        {walletInfo.ethAddress}
                      </code>
                      <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Token List */}
          <div className="mt-8">
            <TokenList 
              tokens={tokens} 
              onImportClick={() => setIsImportModalOpen(true)} 
              onRemoveToken={handleRemoveToken}
            />
          </div>
        </motion.div>
      </div>

      {/* Send Token Modal */}
      <SendTokenModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendTokens}
        isLoading={isSending}
      />

      {/* Import Token Modal */}
      <ImportToken
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportToken}
      />
    </div>
  );
} 