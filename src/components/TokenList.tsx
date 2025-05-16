import React from 'react';
import { TokenInfo } from '../utils/UCCWallet';

interface TokenListProps {
  tokens: TokenInfo[];
  onImportClick: () => void;
}

export default function TokenList({ tokens, onImportClick }: TokenListProps) {
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
                <span className="text-lg font-bold text-blue-500">{token.symbol.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{token.symbol}</h3>
                <p className="text-sm text-gray-400">{token.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-lg font-medium text-white">{token.balance}</p>
                <a
                  href={`https://etherscan.io/token/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono hover:underline"
                >
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                </a>
              </div>
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