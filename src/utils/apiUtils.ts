/**
 * API configuration and utility functions
 */

// Base URLs for the blockchain APIs - using Vercel proxy
export const REST_API_URL = '/api/cosmos';
export const RPC_API_URL = '/api/rpc';
export const DENOM = 'atucc';
export const DISPLAY_DENOM = 'UCC';

/**
 * Utility function to make API requests
 * 
 * @param url - The URL to fetch from
 * @param options - Optional fetch options
 * @returns Promise with fetch response
 */
export async function fetchApi(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error('Error fetching:', error);
    throw error;
  }
}

/**
 * Get account balance from LCD endpoint
 * 
 * @param address - The account address to check
 * @returns Promise with balance in display format
 */
export async function getBalance(address: string): Promise<string> {
  try {
    const response = await fetchApi(`${REST_API_URL}/cosmos/bank/v1beta1/balances/${address}`);
    const data = await response.json();
    const balanceObj = data.balances.find((b: { denom: string }) => b.denom === DENOM);
    return balanceObj ? (+balanceObj.amount / 1e18).toFixed(2) : '0';
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw error;
  }
} 