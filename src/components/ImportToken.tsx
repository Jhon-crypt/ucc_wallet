import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { TokenInfo } from '../utils/UCCWallet';
import { ethers } from 'ethers';

interface ImportTokenProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tokenAddress: string, customName?: string) => Promise<TokenInfo>;
}

export default function ImportToken({ isOpen, onClose, onImport }: ImportTokenProps) {
  const [tokenAddress, setTokenAddress] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenPreview, setTokenPreview] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedWallet, setGeneratedWallet] = useState<{address: string; privateKey: string} | null>(null);

  const resetState = () => {
    setTokenAddress('');
    setCustomName('');
    setTokenPreview(null);
    setError(null);
    setIsLoading(false);
    setGeneratedWallet(null);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setTokenAddress(value);
    setTokenPreview(null);
    setError(null);
    setGeneratedWallet(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
  };

  const generateNewWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    setGeneratedWallet({
      address: wallet.address,
      privateKey: wallet.privateKey
    });
  };

  const handlePreview = async () => {
    if (!tokenAddress || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      // Normalize the address
      const normalizedAddress = tokenAddress.startsWith('0x') ? tokenAddress : `0x${tokenAddress}`;
      
      // Validate address format first
      if (!ethers.utils.isAddress(normalizedAddress)) {
        throw new Error('Invalid token address format');
      }

      // Use Ethereum mainnet provider for validation
      const provider = new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
      
      // Check if there's contract code at the address
      const code = await provider.getCode(normalizedAddress).catch(() => '0x');
      if (code === '0x') {
        throw new Error('No contract found at this address');
      }

      // Create contract instance
      const tokenContract = new ethers.Contract(
        normalizedAddress,
        [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)'
        ],
        provider
      );

      // Get token information
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name().catch(() => 'Unknown Token'),
        tokenContract.symbol().catch(() => 'UNKNOWN'),
        tokenContract.decimals().catch(() => 18)
      ]);

      // Set token preview
      setTokenPreview({
        address: normalizedAddress,
        name: customName || name,
        symbol,
        decimals,
        balance: '0'
      });

      // Generate wallet for the token
      generateNewWallet();
    } catch (err) {
      console.error('Token preview error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load token information';
      setError(errorMessage);
      setTokenPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!tokenPreview || isLoading) return;
    
    setIsLoading(true);
    try {
      await onImport(tokenPreview.address, customName);
      toast.success(`${tokenPreview.symbol} token imported successfully!`);
      resetState();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import token';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handlePreview();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/90" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="w-full max-w-2xl rounded-3xl bg-[#0a0a0a] p-8 shadow-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-2xl font-bold mb-8 text-white flex justify-between items-center sticky top-0 bg-[#0a0a0a] py-2">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Import Token
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Dialog.Title>

          <div className="space-y-6">
            {/* Token Address Input */}
            <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800">
              <label className="block text-base font-semibold text-gray-300 mb-3">
                Token Contract Address
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={handleAddressChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter token contract address (0x...)"
                  className="flex-1 rounded-xl border-2 border-gray-800 bg-black px-4 py-3 text-lg text-white placeholder-gray-600 
                    focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-700 transition-colors"
                  disabled={isLoading}
                />
                <button
                  onClick={handlePreview}
                  disabled={!tokenAddress || isLoading}
                  className="px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px]
                    hover:shadow-lg hover:shadow-blue-500/20 whitespace-nowrap"
                >
                  {isLoading ? 'Loading...' : 'Preview'}
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm font-medium text-red-400">{error}</p>
              )}
            </div>

            {/* Custom Token Name Input */}
            <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800">
              <label className="block text-base font-semibold text-gray-300 mb-3">
                Custom Token Name (Optional)
              </label>
              <input
                type="text"
                value={customName}
                onChange={handleNameChange}
                placeholder="Enter custom token name"
                className="w-full rounded-xl border-2 border-gray-800 bg-black px-4 py-3 text-lg text-white placeholder-gray-600 
                  focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-gray-700 transition-colors"
                disabled={isLoading}
              />
            </div>

            {/* Token Preview */}
            {tokenPreview && (
              <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Token Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-gray-800">
                    <span className="text-base font-medium text-gray-400">Token Symbol</span>
                    <span className="text-lg font-bold text-white">{tokenPreview.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-800">
                    <span className="text-base font-medium text-gray-400">Token Name</span>
                    <span className="text-lg text-white">{customName || tokenPreview.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-800">
                    <span className="text-base font-medium text-gray-400">Decimals</span>
                    <span className="text-lg text-white">{tokenPreview.decimals}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-base font-medium text-gray-400">Contract</span>
                    <a 
                      href={`https://etherscan.io/token/${tokenPreview.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-mono text-base hover:underline transition-colors"
                    >
                      {tokenPreview.address.slice(0, 6)}...{tokenPreview.address.slice(-4)}
                    </a>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleImport}
                      disabled={isLoading}
                      className="w-full px-6 py-3 bg-blue-600 text-white text-lg font-medium rounded-xl 
                        hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all 
                        duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      {isLoading ? 'Importing...' : 'Import Token'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Wallet */}
            {generatedWallet && (
              <div className="bg-[#111111] rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Generated Wallet
                </h3>
                <div className="space-y-4">
                  <div className="rounded-lg bg-black/50 p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Wallet Address</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedWallet.address)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-sm text-white break-all">{generatedWallet.address}</p>
                  </div>
                  <div className="rounded-lg bg-black/50 p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-400">Private Key</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(generatedWallet.privateKey)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="font-mono text-sm text-white break-all">{generatedWallet.privateKey}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-200">
                  Store your private key securely. Never share it with anyone. Anyone with your private key can access your tokens. Make sure to verify the token contract on Etherscan before importing.
                </p>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 