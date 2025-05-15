import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { TokenInfo } from '../utils/UCCWallet';
import { ethers } from 'ethers';

interface ImportTokenProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tokenAddress: string) => Promise<TokenInfo>;
}

export default function ImportToken({ isOpen, onClose, onImport }: ImportTokenProps) {
  const [tokenAddress, setTokenAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [searchedAddress, setSearchedAddress] = useState('');

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenAddress(e.target.value.trim());
    setTokenInfo(null); // Reset token info when address changes
  };

  const handleSearch = async () => {
    if (!tokenAddress) return;
    
    setIsLoading(true);
    try {
      console.log('Searching for token:', tokenAddress);
      const info = await onImport(tokenAddress);
      console.log('Token found:', info);
      setTokenInfo(info);
      setSearchedAddress(tokenAddress);
      toast.success('Token found! Click Import to add it to your wallet.');
    } catch (err) {
      const error = err as Error;
      console.error('Token search error:', error);
      toast.error(error.message || 'Invalid token address or contract');
      setTokenInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!tokenInfo || !searchedAddress) return;

    setIsLoading(true);
    try {
      console.log('Importing token:', searchedAddress);
      await onImport(searchedAddress);
      toast.success(`${tokenInfo.symbol} token imported successfully!`);
      setTokenAddress('');
      setTokenInfo(null);
      setSearchedAddress('');
      onClose();
    } catch (err) {
      const error = err as Error;
      console.error('Token import error:', error);
      toast.error(error.message || 'Failed to import token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-gray-900 p-6 shadow-xl border border-gray-800">
          <Dialog.Title className="text-xl font-bold mb-4 text-white">
            Import Token
          </Dialog.Title>

          <div className="space-y-4">
            {/* Token Address Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Token Contract Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={handleAddressChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter token contract address"
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={!tokenAddress || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-400">
                Enter the token contract address (with or without '0x' prefix)
              </p>
            </div>

            {/* Token Info */}
            {tokenInfo && (
              <div className="border border-gray-700 rounded-lg p-4 space-y-2 bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300">Token Symbol:</span>
                  <span className="text-white">{tokenInfo.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300">Token Name:</span>
                  <span className="text-white">{tokenInfo.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300">Decimals:</span>
                  <span className="text-white">{tokenInfo.decimals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-300">Contract:</span>
                  <span className="text-white font-mono text-sm">
                    {tokenInfo.address.slice(0, 6)}...{tokenInfo.address.slice(-4)}
                  </span>
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="text-sm text-yellow-500 bg-yellow-900/50 p-3 rounded-lg border border-yellow-800/50">
              <p>Anyone can create a token, including fake versions of existing tokens. Learn about scams and security risks before adding custom tokens.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!tokenInfo || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Importing...' : 'Import Token'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 