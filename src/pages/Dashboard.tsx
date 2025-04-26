import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { UCCWallet, WalletInfo, Balance } from '../utils/UCCWallet';
import { SendTokenModal } from '../components/SendTokenModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [wallet, setWallet] = useState<UCCWallet | null>(null);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  // Function to fetch balance
  const fetchBalance = async (address: string) => {
    if (!wallet) return;

    try {
      setIsLoading(true);
      console.log('Fetching balance for address:', address);
      
      const balances = await wallet.getBalance(address);
      console.log('Raw balances:', balances);
      
      // Find ATUCC balance
      const atuccBalance = balances.find((b: Balance) => b.denom === 'atucc')?.amount || '0';
      console.log('ATUCC balance:', atuccBalance);
      
      // Convert from ATUCC (18 decimals) to UCC using BigNumber
      const uccBalanceBN = ethers.BigNumber.from(atuccBalance);
      const uccBalance = ethers.utils.formatUnits(uccBalanceBN, 18);
      console.log('Converted UCC balance:', uccBalance);

      // Format the balance with proper decimal places
      const formattedBalance = Number(uccBalance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      });
      console.log('Formatted balance:', formattedBalance);

      setBalance(uccBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Failed to fetch balance');
      setBalance('0.00');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize wallet and connect
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
        console.log('Fetching initial balance for:', info.cosmosAddress);
        await fetchBalance(info.cosmosAddress);

        // Listen for account changes
        if (window.ethereum) {
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
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
      }
    };
  }, [navigate]);

  // Set up periodic balance refresh
  useEffect(() => {
    if (!walletInfo?.cosmosAddress) return;

    console.log('Setting up balance refresh interval');
    // Fetch balance immediately
    fetchBalance(walletInfo.cosmosAddress);

    // Then fetch every 30 seconds
    const interval = setInterval(() => {
      console.log('Refreshing balance...');
      fetchBalance(walletInfo.cosmosAddress);
    }, 30000);

    return () => clearInterval(interval);
  }, [walletInfo?.cosmosAddress]);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      navigate('/');
    } else {
      // User switched accounts, update the wallet info
      if (wallet) {
        const info = await wallet.connectWallet();
        setWalletInfo(info);
        await fetchBalance(info.cosmosAddress);
      }
    }
  };

  const handleChainChanged = () => {
    // Reload the page when the chain changes
    window.location.reload();
  };

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
        // Refresh balance after successful transaction
        await fetchBalance(walletInfo.cosmosAddress);
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

  const handleDisconnect = () => {
    navigate('/');
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
    <Layout>
      <div className="max-w-6xl mx-auto">
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
                      onClick={() => fetchBalance(walletInfo.cosmosAddress)}
                      isLoading={isLoading}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-2">
                    {isLoading ? (
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
                    <p className="text-gray-400">
                      ≈ ${(Number(balance) * 1.5).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} USD
                    </p>
                    <span className="text-xs text-gray-500">(estimated)</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Last updated: {new Date().toLocaleTimeString()}
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
        </motion.div>
      </div>

      {/* Send Token Modal */}
      <SendTokenModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendTokens}
        isLoading={isSending}
      />
    </Layout>
  );
} 