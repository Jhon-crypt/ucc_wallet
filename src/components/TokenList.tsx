import React from 'react';
import { TokenInfo } from '../utils/UCCWallet';

interface TokenListProps {
  tokens: TokenInfo[];
  onImportClick: () => void;
  onRemoveToken: (address: string) => void;
}

export default function TokenList({ tokens, onImportClick, onRemoveToken }: TokenListProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Tokens</h2>
        <button
          onClick={onImportClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 
            transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Import Token
        </button>
      </div>

      <div className="space-y-3">
        {tokens.map((token) => (
          <div
            key={token.address}
            className="flex items-center justify-between p-4 bg-[#111111] rounded-2xl border border-gray-800 
              hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-blue-500">
                  {token.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {token.name}
                  <span className="text-sm text-gray-400">({token.symbol})</span>
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">{token.balance} tokens</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <a
                  href={`https://etherscan.io/token/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono hover:underline"
                >
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </a>
              </div>
              <button
                onClick={() => onRemoveToken(token.address)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove Token"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {tokens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-[#111111] rounded-2xl border border-gray-800">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Tokens Added</h3>
            <p className="text-gray-400 text-center mb-6">Import your first token to get started</p>
            <button
              onClick={onImportClick}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 
                transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Import Token
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 