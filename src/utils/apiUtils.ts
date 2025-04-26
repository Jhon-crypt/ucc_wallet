/**
 * API configuration and utility functions
 */

// Base URLs for the blockchain APIs
export const REST_API_URL = 'http://145.223.80.193:1317';
export const RPC_API_URL = 'http://145.223.80.193:26657';
export const DENOM = 'atucc';
export const DISPLAY_DENOM = 'UCC';

/**
 * Utility function to make fetch requests with CORS headers
 * 
 * @param url - The URL to fetch from
 * @param options - Optional fetch options
 * @returns Promise with fetch response
 */
export async function fetchWithCors(url: string, options: RequestInit = {}) {
  // Using cors-anywhere as it handles headers better
  const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
  
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'Origin': 'https://ucc-wallet.vercel.app',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  };

  try {
    const response = await fetch(`${corsProxyUrl}${url}`, defaultOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error('Error fetching through CORS proxy:', error);
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
    console.log('Fetching balance for address:', address);
    const response = await fetchWithCors(`${REST_API_URL}/cosmos/bank/v1beta1/balances/${address}`);
    const data = await response.json();
    console.log('Balance response:', data);
    
    // Handle both new and legacy response formats
    const balances = data.balances || data.result || [];
    console.log('Parsed balances:', balances);
    
    const balanceObj = balances.find((b: { denom: string }) => b.denom === DENOM) || { denom: DENOM, amount: '0' };
    console.log('Found balance object:', balanceObj);
    
    const formattedBalance = (+balanceObj.amount / 1e18).toFixed(2);
    console.log('Formatted balance:', formattedBalance);
    
    return formattedBalance;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    return '0';
  }
} 