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
  // Using allorigins.win as CORS proxy
  const corsProxyUrl = 'https://api.allorigins.win/raw?url=';
  
  try {
    const response = await fetch(`${corsProxyUrl}${encodeURIComponent(url)}`, options);
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
    const response = await fetchWithCors(`${REST_API_URL}/cosmos/bank/v1beta1/balances/${address}`);
    const data = await response.json();
    const balanceObj = data.balances.find((b: { denom: string }) => b.denom === DENOM);
    return balanceObj ? (+balanceObj.amount / 1e18).toFixed(2) : '0';
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw error;
  }
} 