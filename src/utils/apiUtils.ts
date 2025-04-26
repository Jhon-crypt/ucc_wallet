/**
 * API configuration and utility functions
 */

// Base URLs for the blockchain APIs
const BASE_API_URL = 'http://145.223.80.193:1317';
const BASE_RPC_URL = 'http://145.223.80.193:26657';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Public URLs that include the CORS proxy
export const REST_API_URL = `${CORS_PROXY}${encodeURIComponent(BASE_API_URL)}`;
export const RPC_API_URL = `${CORS_PROXY}${encodeURIComponent(BASE_RPC_URL)}`;
export const DENOM = 'atucc';
export const DISPLAY_DENOM = 'UCC';

/**
 * Makes a request through the CORS proxy
 * @param endpoint - The API endpoint path (will be appended to BASE_API_URL)
 * @param options - Fetch options
 * @returns Promise with the response
 */
export async function makeProxyRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = `${BASE_API_URL}${endpoint}`;
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(fullUrl)}`;
  console.log('Making request through proxy:', proxyUrl);
  
  const response = await fetch(proxyUrl, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
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
    
    // Try the new endpoint format first
    const response = await makeProxyRequest(`/cosmos/bank/v1beta1/balances/${address}`);
    const data = await response.json();
    console.log('Balance response:', data);
    
    // Handle both new and legacy response formats
    const balances = data.balances || data.result || [];
    console.log('Parsed balances:', balances);
    
    if (!balances || balances.length === 0) {
      console.log('No balances found, returning 0');
      return '0';
    }
    
    const balanceObj = balances.find((b: { denom: string }) => b.denom === DENOM) || { denom: DENOM, amount: '0' };
    console.log('Found balance object:', balanceObj);
    
    const formattedBalance = (+balanceObj.amount / 1e18).toFixed(2);
    console.log('Formatted balance:', formattedBalance);
    
    return formattedBalance;
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    // Try legacy endpoint format as fallback
    try {
      console.log('Trying legacy endpoint format');
      const response = await makeProxyRequest(`/bank/balances/${address}`);
      const data = await response.json();
      console.log('Legacy balance response:', data);
      
      const balances = data.result || [];
      const balanceObj = balances.find((b: { denom: string }) => b.denom === DENOM) || { denom: DENOM, amount: '0' };
      return (+balanceObj.amount / 1e18).toFixed(2);
    } catch (fallbackError) {
      console.error('Failed to fetch balance from legacy endpoint:', fallbackError);
      return '0';
    }
  }
} 