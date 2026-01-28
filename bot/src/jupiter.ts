import { Connection, Keypair, VersionedTransaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

// SOL mint address (native SOL wrapped)
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: any[];
  swapMode: string;
  otherAmountThreshold: string;
}

export interface SwapResult {
  success: boolean;
  signature?: string;
  error?: string;
  inputAmount?: number;
  outputAmount?: number;
}

/**
 * Get a quote from Jupiter for swapping tokens
 */
export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number, // in lamports or smallest unit
  slippageBps: number = 1500 // 15% default
): Promise<QuoteResponse | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      swapMode: 'ExactIn'
    });

    const response = await fetch(`${JUPITER_QUOTE_API}?${params}`);

    if (!response.ok) {
      console.error('Quote API error:', await response.text());
      return null;
    }

    const quote = await response.json();
    return quote;
  } catch (error) {
    console.error('Error getting quote:', error);
    return null;
  }
}

/**
 * Execute a swap using Jupiter
 */
export async function executeSwap(
  connection: Connection,
  keypair: Keypair,
  quoteResponse: QuoteResponse,
  priorityFeeLamports: number = 1000000, // 0.001 SOL default
  useJitoMev: boolean = false
): Promise<SwapResult> {
  try {
    // Get swap transaction from Jupiter
    const swapResponse = await fetch(JUPITER_SWAP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: keypair.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: priorityFeeLamports
      })
    });

    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();
      console.error('Swap API error:', errorText);
      return { success: false, error: `Swap API error: ${errorText}` };
    }

    const swapData = await swapResponse.json();

    if (swapData.error) {
      return { success: false, error: swapData.error };
    }

    // Deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // Sign the transaction
    transaction.sign([keypair]);

    // Get latest blockhash for confirmation
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');

    // Send transaction
    let signature: string;

    if (useJitoMev) {
      // Send via Jito for MEV protection
      signature = await sendViaJito(transaction, connection);
    } else {
      // Send normally
      signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true,
        maxRetries: 3
      });
    }

    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    }, 'confirmed');

    if (confirmation.value.err) {
      return {
        success: false,
        error: `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
        signature
      };
    }

    return {
      success: true,
      signature,
      inputAmount: parseInt(quoteResponse.inAmount),
      outputAmount: parseInt(quoteResponse.outAmount)
    };
  } catch (error) {
    console.error('Error executing swap:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send transaction via Jito for MEV protection
 */
async function sendViaJito(
  transaction: VersionedTransaction,
  connection: Connection
): Promise<string> {
  const JITO_ENDPOINTS = [
    'https://mainnet.block-engine.jito.wtf/api/v1/transactions',
    'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/transactions',
    'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/transactions',
    'https://ny.mainnet.block-engine.jito.wtf/api/v1/transactions',
    'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/transactions'
  ];

  const serializedTx = Buffer.from(transaction.serialize()).toString('base64');

  // Try each Jito endpoint
  for (const endpoint of JITO_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sendTransaction',
          params: [serializedTx, { encoding: 'base64' }]
        })
      });

      const result = await response.json();

      if (result.result) {
        return result.result;
      }
    } catch (error) {
      console.error(`Jito endpoint ${endpoint} failed:`, error);
      continue;
    }
  }

  // Fallback to normal send if all Jito endpoints fail
  console.log('All Jito endpoints failed, falling back to normal send');
  return await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: true,
    maxRetries: 3
  });
}

/**
 * Buy a token with SOL
 */
export async function buyToken(
  connection: Connection,
  keypair: Keypair,
  tokenMint: string,
  solAmount: number, // in SOL
  slippagePercent: number = 15,
  priorityFee: number = 0.001, // in SOL
  useMevProtection: boolean = true
): Promise<SwapResult> {
  const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
  const slippageBps = slippagePercent * 100;
  const priorityFeeLamports = Math.floor(priorityFee * LAMPORTS_PER_SOL);

  // Get quote: SOL -> Token
  const quote = await getQuote(SOL_MINT, tokenMint, lamports, slippageBps);

  if (!quote) {
    return { success: false, error: 'Failed to get quote. Token may not have liquidity.' };
  }

  console.log(`Quote received: ${solAmount} SOL -> ${parseInt(quote.outAmount)} tokens`);
  console.log(`Price impact: ${quote.priceImpactPct}%`);

  // Check price impact
  const priceImpact = parseFloat(quote.priceImpactPct);
  if (priceImpact > 30) {
    return { success: false, error: `Price impact too high: ${priceImpact.toFixed(2)}%` };
  }

  // Execute swap
  return await executeSwap(connection, keypair, quote, priorityFeeLamports, useMevProtection);
}

/**
 * Sell a token for SOL
 */
export async function sellToken(
  connection: Connection,
  keypair: Keypair,
  tokenMint: string,
  tokenAmount: number, // in smallest units (raw amount)
  slippagePercent: number = 15,
  priorityFee: number = 0.001, // in SOL
  useMevProtection: boolean = true
): Promise<SwapResult> {
  const slippageBps = slippagePercent * 100;
  const priorityFeeLamports = Math.floor(priorityFee * LAMPORTS_PER_SOL);

  // Get quote: Token -> SOL
  const quote = await getQuote(tokenMint, SOL_MINT, tokenAmount, slippageBps);

  if (!quote) {
    return { success: false, error: 'Failed to get quote. Token may not have liquidity.' };
  }

  console.log(`Quote received: ${tokenAmount} tokens -> ${parseInt(quote.outAmount) / LAMPORTS_PER_SOL} SOL`);
  console.log(`Price impact: ${quote.priceImpactPct}%`);

  // Execute swap
  return await executeSwap(connection, keypair, quote, priorityFeeLamports, useMevProtection);
}

/**
 * Get token balance for a wallet
 */
export async function getTokenBalance(
  connection: Connection,
  walletAddress: string,
  tokenMint: string
): Promise<number> {
  try {
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(tokenMint);

    // Get token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
      mint
    });

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
    return parseInt(balance.amount);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
}

/**
 * Get token info (decimals, supply, etc.)
 */
export async function getTokenInfo(
  connection: Connection,
  tokenMint: string
): Promise<{ decimals: number; supply: number } | null> {
  try {
    const mint = new PublicKey(tokenMint);
    const info = await connection.getParsedAccountInfo(mint);

    if (!info.value || !('parsed' in info.value.data)) {
      return null;
    }

    const parsed = info.value.data.parsed;
    return {
      decimals: parsed.info.decimals,
      supply: parseInt(parsed.info.supply)
    };
  } catch (error) {
    console.error('Error getting token info:', error);
    return null;
  }
}
