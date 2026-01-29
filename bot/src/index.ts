import { Telegraf, Markup, Context } from 'telegraf';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, sendAndConfirmTransaction, VersionedTransaction, TransactionMessage, ComputeBudgetProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { buyToken, sellToken, getTokenBalance, getTokenInfo } from './jupiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'orvex-default-key-change-in-production';
const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is not defined in environment variables');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const connection = new Connection(SOLANA_RPC, 'confirmed');

// DEBUG: Log ALL incoming updates at the middleware level
bot.use((ctx, next) => {
  console.log(`📩 UPDATE: type=${ctx.updateType}`, ctx.message ? `text="${(ctx.message as any).text}"` : '');
  return next();
});

// Data directories
const dataDir = path.join(__dirname, '../data');
const USERS_FILE = path.join(dataDir, 'users.json');
const WALLETS_FILE = path.join(dataDir, 'wallets.json');
const SETTINGS_FILE = path.join(dataDir, 'settings.json');
const POSITIONS_FILE = path.join(dataDir, 'positions.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ============== TYPES ==============

interface WalletData {
  encryptedPrivateKey: string;
  publicKey: string;
  createdAt: number;
}

interface UserSettings {
  priorityFee: number; // in SOL
  mevProtection: boolean;
  defaultBuyAmount: number; // in SOL
  slippage: number; // percentage
}

interface Position {
  tokenMint: string;
  tokenSymbol: string;
  amount: number;
  buyPrice: number;
  timestamp: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  priorityFee: 0.001,
  mevProtection: true,
  defaultBuyAmount: 0.1,
  slippage: 15
};

// ============== USER STORAGE ==============

function loadUsers(): Set<number> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return new Set(JSON.parse(data));
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return new Set();
}

function saveUsers(users: Set<number>): void {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify([...users]), 'utf-8');
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

function addUser(userId: number): void {
  const users = loadUsers();
  if (!users.has(userId)) {
    users.add(userId);
    saveUsers(users);
    console.log(`New user added: ${userId} | Total users: ${users.size}`);
  }
}

function getAllUsers(): number[] {
  return [...loadUsers()];
}

// ============== WALLET STORAGE ==============

function loadWallets(): Record<string, WalletData> {
  try {
    if (fs.existsSync(WALLETS_FILE)) {
      const data = fs.readFileSync(WALLETS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading wallets:', error);
  }
  return {};
}

function saveWallets(wallets: Record<string, WalletData>): void {
  try {
    fs.writeFileSync(WALLETS_FILE, JSON.stringify(wallets, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving wallets:', error);
  }
}

function encryptPrivateKey(privateKey: string): string {
  return CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString();
}

function decryptPrivateKey(encryptedKey: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted || decrypted.length === 0) {
      console.error('❌ Decryption failed: ENCRYPTION_KEY mismatch');
      console.error('The wallet was encrypted with a different key than what is currently in .env');
      return '';
    }

    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error);
    return '';
  }
}

function createWallet(userId: number): { publicKey: string; privateKey: string } {
  const keypair = Keypair.generate();
  const privateKey = bs58.encode(keypair.secretKey);
  const publicKey = keypair.publicKey.toString();

  const wallets = loadWallets();
  wallets[userId.toString()] = {
    encryptedPrivateKey: encryptPrivateKey(privateKey),
    publicKey,
    createdAt: Date.now()
  };
  saveWallets(wallets);

  return { publicKey, privateKey };
}

function getUserWallet(userId: number): WalletData | null {
  const wallets = loadWallets();
  return wallets[userId.toString()] || null;
}

function deleteUserWallet(userId: number): boolean {
  try {
    const wallets = loadWallets();
    const userKey = userId.toString();

    if (wallets[userKey]) {
      delete wallets[userKey];
      saveWallets(wallets);
      console.log(`🗑️ Deleted wallet for user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting wallet:', error);
    return false;
  }
}

function getKeypairFromWallet(userId: number): Keypair | null {
  const wallet = getUserWallet(userId);
  if (!wallet) return null;

  const privateKey = decryptPrivateKey(wallet.encryptedPrivateKey);
  const secretKey = bs58.decode(privateKey);
  return Keypair.fromSecretKey(secretKey);
}

async function getWalletBalance(publicKey: string): Promise<number> {
  try {
    const balance = await connection.getBalance(new PublicKey(publicKey));
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
}

// ============== SETTINGS STORAGE ==============

function loadAllSettings(): Record<string, UserSettings> {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return {};
}

function saveAllSettings(settings: Record<string, UserSettings>): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function getUserSettings(userId: number): UserSettings {
  const allSettings = loadAllSettings();
  return allSettings[userId.toString()] || { ...DEFAULT_SETTINGS };
}

function updateUserSettings(userId: number, updates: Partial<UserSettings>): UserSettings {
  const allSettings = loadAllSettings();
  const current = allSettings[userId.toString()] || { ...DEFAULT_SETTINGS };
  const updated = { ...current, ...updates };
  allSettings[userId.toString()] = updated;
  saveAllSettings(allSettings);
  return updated;
}

// ============== POSITIONS STORAGE ==============

function loadAllPositions(): Record<string, Position[]> {
  try {
    if (fs.existsSync(POSITIONS_FILE)) {
      const data = fs.readFileSync(POSITIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading positions:', error);
  }
  return {};
}

function saveAllPositions(positions: Record<string, Position[]>): void {
  try {
    fs.writeFileSync(POSITIONS_FILE, JSON.stringify(positions, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving positions:', error);
  }
}

function getUserPositions(userId: number): Position[] {
  const allPositions = loadAllPositions();
  return allPositions[userId.toString()] || [];
}

function addPosition(userId: number, position: Position): void {
  const allPositions = loadAllPositions();
  const userPositions = allPositions[userId.toString()] || [];
  userPositions.push(position);
  allPositions[userId.toString()] = userPositions;
  saveAllPositions(allPositions);
}

function removePosition(userId: number, tokenMint: string): void {
  const allPositions = loadAllPositions();
  const userPositions = allPositions[userId.toString()] || [];
  allPositions[userId.toString()] = userPositions.filter(p => p.tokenMint !== tokenMint);
  saveAllPositions(allPositions);
}

// ============== HELPER: Extract token from pump.fun URL ==============

function extractTokenFromUrl(url: string): string | null {
  // pump.fun URL format: https://pump.fun/coin/TOKEN_MINT_ADDRESS
  const match = url.match(/pump\.fun\/(?:coin\/)?([A-Za-z0-9]{32,44})/);
  return match ? match[1] : null;
}

// ============== MESSAGES ==============

const WELCOME_MESSAGE = `<b>ORVEX</b>

<i>Autonomous On-Chain Intelligence</i>

You've connected to an AI-powered surveillance agent monitoring Solana 24/7.

<b>◉</b> Real-time mempool analysis
<b>◉</b> Whale wallet tracking
<b>◉</b> 100x pattern detection
<b>◉</b> Rug & honeypot filtering

Not a bot. An operator.
`;

const NOTIFICATION_MESSAGE = `<b>ALERTS</b>

<b>⚡ How it works:</b>

<code>RPC Nodes</code> → Index chain state
<code>AI Layer</code>  → Process signals
<code>Filters</code>   → Extract alpha
<code>You</code>       → Instant delivery

When Orvex detects a high-conviction move, you'll receive it here. No noise. Pure signal.

<i>The next 100x is always on-chain.</i>
`;

const WALLET_SETUP_MESSAGE = `<b>WALLET</b>

To execute trades directly through Orvex, you need a dedicated trading wallet.

<b>⚡ Features:</b>
<b>◉</b> Instant snipe execution
<b>◉</b> Deposit & withdraw anytime
<b>◉</b> Export private key
<b>◉</b> Full self-custody

Your keys. Your coins.
`;

// ============== HANDLERS ==============

// /start command
bot.start(async (ctx) => {
  try {
    addUser(ctx.from.id);

    await ctx.replyWithHTML(
      WELCOME_MESSAGE,
      Markup.inlineKeyboard([
        [Markup.button.callback('Next  ➜', 'show_notifications')]
      ])
    );
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

// Step 2: Show notifications info
bot.action('show_notifications', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await ctx.replyWithHTML(
      NOTIFICATION_MESSAGE,
      Markup.inlineKeyboard([
        [Markup.button.callback('Next  ➜', 'show_wallet_setup')]
      ])
    );
  } catch (error) {
    console.error('Error sending notification message:', error);
  }
});

// Step 3: Wallet setup prompt
bot.action('show_wallet_setup', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const wallet = getUserWallet(ctx.from.id);

    if (wallet) {
      await ctx.replyWithHTML(
        `<b>◉ WALLET ACTIVE</b>

<code>${wallet.publicKey}</code>

Type /wallet to manage your wallet.

<i>You will be notified when Orvex detects a coin to snipe.</i>`
      );
    } else {
      await ctx.replyWithHTML(
        WALLET_SETUP_MESSAGE,
        Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Create Wallet', 'create_wallet')],
          [Markup.button.callback('📲 Import Wallet', 'import_wallet')]
        ])
      );
    }
  } catch (error) {
    console.error('Error showing wallet setup:', error);
  }
});

// Create wallet
bot.action('create_wallet', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const existingWallet = getUserWallet(ctx.from.id);
    if (existingWallet) {
      await ctx.replyWithHTML(
        `<b>⚠️ Wallet Already Exists</b>

Your wallet:
<code>${existingWallet.publicKey}</code>

Type /wallet to manage your wallet.`
      );
      return;
    }

    const { publicKey } = createWallet(ctx.from.id);

    await ctx.replyWithHTML(
      `<b>✓ WALLET CREATED</b>

Your new Solana wallet:

<code>${publicKey}</code>

<i>Tap the address to copy.</i>

Type /wallet to manage your wallet.

<i>You will be notified when Orvex detects a coin to snipe.</i>`
    );
  } catch (error) {
    console.error('Error creating wallet:', error);
    await ctx.reply('Error creating wallet. Please try again.');
  }
});

// Import wallet
bot.action('import_wallet', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const existingWallet = getUserWallet(ctx.from.id);
    if (existingWallet) {
      await ctx.replyWithHTML(
        `<b>⚠️ Wallet Already Exists</b>

Your wallet:
<code>${existingWallet.publicKey}</code>

Type /wallet to manage your wallet.`
      );
      return;
    }

    await ctx.replyWithHTML(
      `<b>📲 IMPORT WALLET</b>

<b>⚠️ SECURITY WARNING</b>

Send your private key as a message. It will be:
<b>◉</b> Encrypted and stored securely
<b>◉</b> Never shared or exposed
<b>◉</b> Used only for trading

Your private key should be in base58 format (starts with numbers/letters, typically 87-88 characters).

<i>Send your private key now...</i>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancel', 'cancel_import')]
      ])
    );

    // Set pending import state
    const pendingImports = (global as any).pendingImports || {};
    pendingImports[ctx.from.id] = true;
    (global as any).pendingImports = pendingImports;
  } catch (error) {
    console.error('Error showing import prompt:', error);
    await ctx.reply('Error importing wallet. Please try again.');
  }
});

// Cancel import
bot.action('cancel_import', async (ctx) => {
  try {
    await ctx.answerCbQuery('Import cancelled');
    await ctx.deleteMessage();

    const pendingImports = (global as any).pendingImports || {};
    delete pendingImports[ctx.from.id];
  } catch (error) {
    console.error('Error cancelling import:', error);
  }
});

// Function to import wallet from private key
function importWallet(userId: number, privateKey: string): { publicKey: string; success: boolean; error?: string } {
  try {
    // Try to decode the private key
    const secretKey = bs58.decode(privateKey);

    // Validate secret key length (should be 64 bytes)
    if (secretKey.length !== 64) {
      return { publicKey: '', success: false, error: 'Invalid private key format. Should be 64 bytes.' };
    }

    // Create keypair from secret key
    const keypair = Keypair.fromSecretKey(secretKey);
    const publicKey = keypair.publicKey.toString();

    // Save to storage
    const wallets = loadWallets();
    wallets[userId.toString()] = {
      encryptedPrivateKey: encryptPrivateKey(privateKey),
      publicKey,
      createdAt: Date.now()
    };
    saveWallets(wallets);

    return { publicKey, success: true };
  } catch (error) {
    console.error('Error importing wallet:', error);
    return { publicKey: '', success: false, error: 'Invalid private key. Please check and try again.' };
  }
}

// Wallet menu
bot.action('wallet_menu', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const wallet = getUserWallet(ctx.from.id);
    if (!wallet) {
      await ctx.replyWithHTML(
        `<b>No Wallet Found</b>\n\nCreate a new wallet or import an existing one.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Create Wallet', 'create_wallet')],
          [Markup.button.callback('📲 Import Wallet', 'import_wallet')]
        ])
      );
      return;
    }

    const balance = await getWalletBalance(wallet.publicKey);

    await ctx.replyWithHTML(
      `<b>💰 WALLET</b>

<b>Address:</b>
<code>${wallet.publicKey}</code>

<i>Tap the address to copy.</i>

<b>Balance:</b> <code>${balance.toFixed(4)} SOL</code>

Select an option:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('📥 Deposit', 'wallet_deposit'), Markup.button.callback('📤 Withdraw', 'wallet_withdraw')],
        [Markup.button.callback('🔑 Export Key', 'wallet_export'), Markup.button.callback('⚙️ Settings', 'trading_settings')],
        [Markup.button.callback('🔄 Refresh', 'wallet_menu'), Markup.button.callback('🗑️ Delete', 'wallet_delete_warning')]
      ])
    );
  } catch (error) {
    console.error('Error showing wallet menu:', error);
  }
});

// Deposit
bot.action('wallet_deposit', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const wallet = getUserWallet(ctx.from.id);
    if (!wallet) return;

    await ctx.replyWithHTML(
      `<b>📥 DEPOSIT SOL</b>

Send SOL to this address:

<code>${wallet.publicKey}</code>

<i>Tap the address to copy.</i>

<b>⚠️ Only send SOL on the Solana network.</b>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('← Back', 'wallet_menu')]
      ])
    );
  } catch (error) {
    console.error('Error showing deposit:', error);
  }
});

// Withdraw
bot.action('wallet_withdraw', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const wallet = getUserWallet(ctx.from.id);
    if (!wallet) return;

    const balance = await getWalletBalance(wallet.publicKey);

    if (balance <= 0) {
      await ctx.replyWithHTML(
        `<b>📤 WITHDRAW</b>\n\n<b>⚠️ Insufficient balance.</b>\n\nYour balance: <code>0 SOL</code>`,
        Markup.inlineKeyboard([
          [Markup.button.callback('← Back', 'wallet_menu')]
        ])
      );
      return;
    }

    await ctx.replyWithHTML(
      `<b>📤 WITHDRAW SOL</b>

<b>Available:</b> <code>${balance.toFixed(4)} SOL</code>

To withdraw, send a message in this format:

<code>/withdraw [address] [amount]</code>

<b>Example:</b>
<code>/withdraw 9WzDX...abc 0.5</code>

Or withdraw all:
<code>/withdraw [address] all</code>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('← Back', 'wallet_menu')]
      ])
    );
  } catch (error) {
    console.error('Error showing withdraw:', error);
  }
});

// Export private key - warning
bot.action('wallet_export', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await ctx.replyWithHTML(
      `<b>🔑 EXPORT PRIVATE KEY</b>

<b>⚠️ SECURITY WARNING</b>

Your private key grants <b>full access</b> to your wallet. Anyone with this key can steal your funds.

<b>◉</b> Never share it with anyone
<b>◉</b> Never enter it on websites
<b>◉</b> Store it securely offline

Only proceed if you understand the risks.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⚠️ Show Private Key', 'wallet_export_confirm')],
        [Markup.button.callback('← Back', 'wallet_menu')]
      ])
    );
  } catch (error) {
    console.error('Error showing export warning:', error);
  }
});

// Export private key - reveal
bot.action('wallet_export_confirm', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const wallet = getUserWallet(ctx.from.id);
    if (!wallet) {
      console.log('❌ No wallet found for user', ctx.from.id);
      return;
    }

    console.log('🔐 Encrypted key:', wallet.encryptedPrivateKey.substring(0, 50) + '...');
    const privateKey = decryptPrivateKey(wallet.encryptedPrivateKey);
    console.log('🔓 Decrypted key length:', privateKey.length);
    console.log('🔓 Decrypted key (first 10 chars):', privateKey.substring(0, 10));

    if (!privateKey || privateKey.length === 0) {
      await ctx.replyWithHTML(
        `❌ <b>Error: Could not decrypt private key</b>

This happens when the encryption key has changed since the wallet was created.

<b>Options:</b>
• Delete this wallet and create a new one
• Contact support for recovery`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🗑️ Delete Wallet', 'wallet_delete_confirm')],
          [Markup.button.callback('← Back', 'wallet_menu')]
        ])
      );
      return;
    }

    const msg = await ctx.replyWithHTML(
      `<b>🔑 PRIVATE KEY</b>

<code>${privateKey}</code>

<b>⚠️ This message will be deleted in 60 seconds.</b>

<i>Copy and store it safely now.</i>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🗑️ Delete Now', 'delete_key_message')]
      ])
    );

    setTimeout(async () => {
      try {
        await ctx.deleteMessage(msg.message_id);
      } catch (e) {}
    }, 60000);
  } catch (error) {
    console.error('Error exporting key:', error);
  }
});

// Delete key message
bot.action('delete_key_message', async (ctx) => {
  try {
    await ctx.answerCbQuery('Message deleted');
    await ctx.deleteMessage();
  } catch (error) {
    console.error('Error deleting message:', error);
  }
});

// Delete wallet - warning
bot.action('wallet_delete_warning', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await ctx.replyWithHTML(
      `<b>🗑️ DELETE WALLET</b>

<b>⚠️ WARNING</b>

This will permanently delete your wallet from Orvex.

<b>Before deleting:</b>
◉ Make sure you've exported your private key
◉ Withdraw all funds from the wallet
◉ You can create a new wallet afterward

<b>This action cannot be undone.</b>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⚠️ Delete Wallet', 'wallet_delete_confirm')],
        [Markup.button.callback('← Back', 'wallet_menu')]
      ])
    );
  } catch (error) {
    console.error('Error showing delete warning:', error);
  }
});

// Delete wallet - confirm and execute
bot.action('wallet_delete_confirm', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const success = deleteUserWallet(ctx.from.id);

    if (success) {
      await ctx.replyWithHTML(
        `<b>✓ WALLET DELETED</b>

Your wallet has been removed from Orvex.

Would you like to create a new wallet?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Create New Wallet', 'create_wallet')],
          [Markup.button.callback('📲 Import Wallet', 'import_wallet')]
        ])
      );
    } else {
      await ctx.replyWithHTML(
        `<b>❌ ERROR</b>

Failed to delete wallet. Please try again or contact support.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('← Back', 'wallet_menu')]
        ])
      );
    }
  } catch (error) {
    console.error('Error deleting wallet:', error);
    await ctx.reply('Error deleting wallet. Please try again.');
  }
});

// ============== TRADING SETTINGS ==============

bot.action('trading_settings', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const settings = getUserSettings(ctx.from.id);

    await ctx.replyWithHTML(
      `<b>⚙️ TRADING SETTINGS</b>

<b>Priority Fee:</b> <code>${settings.priorityFee} SOL</code>
<b>MEV Protection:</b> <code>${settings.mevProtection ? 'ON ✓' : 'OFF'}</code>
<b>Default Buy:</b> <code>${settings.defaultBuyAmount} SOL</code>
<b>Slippage:</b> <code>${settings.slippage}%</code>

Select an option to modify:`,
      Markup.inlineKeyboard([
        [Markup.button.callback(`💨 Priority: ${settings.priorityFee}`, 'set_priority'), Markup.button.callback(`🛡️ MEV: ${settings.mevProtection ? 'ON' : 'OFF'}`, 'toggle_mev')],
        [Markup.button.callback(`💰 Default: ${settings.defaultBuyAmount}`, 'set_default_buy'), Markup.button.callback(`📊 Slip: ${settings.slippage}%`, 'set_slippage')],
        [Markup.button.callback('← Back', 'wallet_menu')]
      ])
    );
  } catch (error) {
    console.error('Error showing settings:', error);
  }
});

// Toggle MEV Protection
bot.action('toggle_mev', async (ctx) => {
  try {
    const settings = getUserSettings(ctx.from.id);
    const updated = updateUserSettings(ctx.from.id, { mevProtection: !settings.mevProtection });
    await ctx.answerCbQuery(`MEV Protection: ${updated.mevProtection ? 'ON' : 'OFF'}`);

    // Refresh settings menu
    await ctx.editMessageReplyMarkup(
      Markup.inlineKeyboard([
        [Markup.button.callback(`💨 Priority: ${updated.priorityFee}`, 'set_priority'), Markup.button.callback(`🛡️ MEV: ${updated.mevProtection ? 'ON' : 'OFF'}`, 'toggle_mev')],
        [Markup.button.callback(`💰 Default: ${updated.defaultBuyAmount}`, 'set_default_buy'), Markup.button.callback(`📊 Slip: ${updated.slippage}%`, 'set_slippage')],
        [Markup.button.callback('← Back', 'wallet_menu')]
      ]).reply_markup
    );
  } catch (error) {
    console.error('Error toggling MEV:', error);
  }
});

// Priority fee options
bot.action('set_priority', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await ctx.replyWithHTML(
      `<b>💨 PRIORITY FEE</b>

Higher fees = faster transaction confirmation.

Select priority level:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🐢 0.0001 SOL', 'priority_0.0001'), Markup.button.callback('🚶 0.0005 SOL', 'priority_0.0005')],
        [Markup.button.callback('🏃 0.001 SOL', 'priority_0.001'), Markup.button.callback('🚀 0.005 SOL', 'priority_0.005')],
        [Markup.button.callback('⚡ 0.01 SOL', 'priority_0.01'), Markup.button.callback('💎 0.05 SOL', 'priority_0.05')],
        [Markup.button.callback('← Back', 'trading_settings')]
      ])
    );
  } catch (error) {
    console.error('Error showing priority options:', error);
  }
});

// Handle priority selection
bot.action(/^priority_(.+)$/, async (ctx) => {
  try {
    const fee = parseFloat(ctx.match[1]);
    updateUserSettings(ctx.from.id, { priorityFee: fee });
    await ctx.answerCbQuery(`Priority fee set to ${fee} SOL`);
    await ctx.deleteMessage();
  } catch (error) {
    console.error('Error setting priority:', error);
  }
});

// Default buy amount options
bot.action('set_default_buy', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await ctx.replyWithHTML(
      `<b>💰 DEFAULT BUY AMOUNT</b>

This amount will be pre-selected when sniping.

Select default amount:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('0.05 SOL', 'defbuy_0.05'), Markup.button.callback('0.1 SOL', 'defbuy_0.1')],
        [Markup.button.callback('0.25 SOL', 'defbuy_0.25'), Markup.button.callback('0.5 SOL', 'defbuy_0.5')],
        [Markup.button.callback('1 SOL', 'defbuy_1'), Markup.button.callback('2 SOL', 'defbuy_2')],
        [Markup.button.callback('← Back', 'trading_settings')]
      ])
    );
  } catch (error) {
    console.error('Error showing default buy options:', error);
  }
});

// Handle default buy selection
bot.action(/^defbuy_(.+)$/, async (ctx) => {
  try {
    const amount = parseFloat(ctx.match[1]);
    updateUserSettings(ctx.from.id, { defaultBuyAmount: amount });
    await ctx.answerCbQuery(`Default buy set to ${amount} SOL`);
    await ctx.deleteMessage();
  } catch (error) {
    console.error('Error setting default buy:', error);
  }
});

// Slippage options
bot.action('set_slippage', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    await ctx.replyWithHTML(
      `<b>📊 SLIPPAGE TOLERANCE</b>

Higher slippage = more likely to fill, but worse price.

Select slippage:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('5%', 'slip_5'), Markup.button.callback('10%', 'slip_10'), Markup.button.callback('15%', 'slip_15')],
        [Markup.button.callback('20%', 'slip_20'), Markup.button.callback('25%', 'slip_25'), Markup.button.callback('50%', 'slip_50')],
        [Markup.button.callback('← Back', 'trading_settings')]
      ])
    );
  } catch (error) {
    console.error('Error showing slippage options:', error);
  }
});

// Handle slippage selection
bot.action(/^slip_(.+)$/, async (ctx) => {
  try {
    const slippage = parseInt(ctx.match[1]);
    updateUserSettings(ctx.from.id, { slippage });
    await ctx.answerCbQuery(`Slippage set to ${slippage}%`);
    await ctx.deleteMessage();
  } catch (error) {
    console.error('Error setting slippage:', error);
  }
});

// ============== SNIPE / TRADING ==============

// Snipe button handler - shows buy options
bot.action(/^snipe_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const tokenMint = ctx.match[1];
    const wallet = getUserWallet(ctx.from.id);

    if (!wallet) {
      await ctx.replyWithHTML(
        `<b>⚠️ No Wallet</b>\n\nCreate a new wallet or import an existing one to trade.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('⚡ Create Wallet', 'create_wallet')],
          [Markup.button.callback('📲 Import Wallet', 'import_wallet')]
        ])
      );
      return;
    }

    const balance = await getWalletBalance(wallet.publicKey);
    const settings = getUserSettings(ctx.from.id);

    await ctx.replyWithHTML(
      `<b>⚡ SNIPE TOKEN</b>

<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>
<b>Balance:</b> <code>${balance.toFixed(4)} SOL</code>

<b>Settings:</b>
├ Priority: <code>${settings.priorityFee} SOL</code>
├ MEV: <code>${settings.mevProtection ? 'ON' : 'OFF'}</code>
└ Slippage: <code>${settings.slippage}%</code>

<b>Select buy amount:</b>`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('0.1 SOL', `buy_${tokenMint}_0.1`),
          Markup.button.callback('0.25 SOL', `buy_${tokenMint}_0.25`),
          Markup.button.callback('0.5 SOL', `buy_${tokenMint}_0.5`)
        ],
        [
          Markup.button.callback('1 SOL', `buy_${tokenMint}_1`),
          Markup.button.callback('2 SOL', `buy_${tokenMint}_2`),
          Markup.button.callback('5 SOL', `buy_${tokenMint}_5`)
        ],
        [Markup.button.callback('✏️ Custom Amount', `buy_custom_${tokenMint}`)],
        [Markup.button.callback('⚙️ Settings', 'trading_settings'), Markup.button.callback('❌ Cancel', 'cancel_trade')]
      ])
    );
  } catch (error) {
    console.error('Error showing snipe options:', error);
  }
});

// Custom buy amount
bot.action(/^buy_custom_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const tokenMint = ctx.match[1];

    await ctx.replyWithHTML(
      `<b>✏️ CUSTOM AMOUNT</b>

Send the amount of SOL you want to spend:

<b>Example:</b> <code>0.75</code>

<i>Token: ${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</i>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancel', 'cancel_trade')]
      ])
    );

    // Store pending buy state (in production, use proper state management)
    const pendingBuys = (global as any).pendingBuys || {};
    pendingBuys[ctx.from.id] = { tokenMint, action: 'buy' };
    (global as any).pendingBuys = pendingBuys;
  } catch (error) {
    console.error('Error showing custom buy:', error);
  }
});

// Execute buy
bot.action(/^buy_([A-Za-z0-9]+)_([0-9.]+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery('Processing...');

    const tokenMint = ctx.match[1];
    const amount = parseFloat(ctx.match[2]);

    const wallet = getUserWallet(ctx.from.id);
    if (!wallet) return;

    const balance = await getWalletBalance(wallet.publicKey);
    const settings = getUserSettings(ctx.from.id);

    if (balance < amount + settings.priorityFee) {
      await ctx.replyWithHTML(`<b>⚠️ Insufficient balance</b>\n\nRequired: <code>${(amount + settings.priorityFee).toFixed(4)} SOL</code>\nAvailable: <code>${balance.toFixed(4)} SOL</code>`);
      return;
    }

    // Show processing message
    const statusMsg = await ctx.replyWithHTML(
      `<b>⏳ EXECUTING BUY...</b>

<b>Amount:</b> <code>${amount} SOL</code>
<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>
<b>Priority:</b> <code>${settings.priorityFee} SOL</code>
<b>MEV:</b> <code>${settings.mevProtection ? 'Protected' : 'Standard'}</code>

<i>Getting quote from Jupiter...</i>`
    );

    // Get keypair for signing
    const keypair = getKeypairFromWallet(ctx.from.id);
    if (!keypair) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        undefined,
        '❌ Failed to load wallet. Please try again.'
      );
      return;
    }

    // Execute real swap via Jupiter
    const swapResult = await buyToken(
      connection,
      keypair,
      tokenMint,
      amount,
      settings.slippage,
      settings.priorityFee,
      settings.mevProtection
    );

    if (!swapResult.success) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        undefined,
        `<b>❌ BUY FAILED</b>

<b>Error:</b> ${swapResult.error || 'Unknown error'}

<i>Please try again or adjust slippage.</i>`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Record position
    addPosition(ctx.from.id, {
      tokenMint,
      tokenSymbol: 'TOKEN',
      amount: swapResult.outputAmount || 0,
      buyPrice: amount,
      timestamp: Date.now()
    });

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      statusMsg.message_id,
      undefined,
      `<b>✓ BUY EXECUTED</b>

<b>Spent:</b> <code>${amount} SOL</code>
<b>Received:</b> <code>${swapResult.outputAmount?.toLocaleString() || 'N/A'} tokens</code>
<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>

<i>Position opened. Good luck!</i>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.url('View Tx', `https://solscan.io/tx/${swapResult.signature}`)],
          [Markup.button.callback('📈 Sell Position', `sell_${tokenMint}`)]
        ])
      }
    );
  } catch (error) {
    console.error('Error executing buy:', error);
    await ctx.reply('❌ Transaction failed. Please try again.');
  }
});

// Sell position menu
bot.action(/^sell_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const tokenMint = ctx.match[1];
    const wallet = getUserWallet(ctx.from.id);
    if (!wallet) return;

    const settings = getUserSettings(ctx.from.id);

    // Get actual token balance
    const tokenBalance = await getTokenBalance(connection, wallet.publicKey, tokenMint);
    const positions = getUserPositions(ctx.from.id);
    const position = positions.find(p => p.tokenMint === tokenMint);

    if (tokenBalance <= 0) {
      await ctx.replyWithHTML(
        `<b>📈 NO POSITION</b>\n\nYou don't hold any of this token.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('← Back', 'wallet_menu')]
        ])
      );
      return;
    }

    await ctx.replyWithHTML(
      `<b>📈 SELL POSITION</b>

<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>
<b>Balance:</b> <code>${tokenBalance.toLocaleString()} tokens</code>
${position ? `<b>Entry:</b> <code>${position.buyPrice} SOL</code>` : ''}

<b>Settings:</b>
├ Priority: <code>${settings.priorityFee} SOL</code>
└ Slippage: <code>${settings.slippage}%</code>

<b>Select sell amount:</b>`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('25%', `execsell_${tokenMint}_25`),
          Markup.button.callback('50%', `execsell_${tokenMint}_50`),
          Markup.button.callback('75%', `execsell_${tokenMint}_75`)
        ],
        [
          Markup.button.callback('100%', `execsell_${tokenMint}_100`),
          Markup.button.callback('✏️ Custom', `sell_custom_${tokenMint}`)
        ],
        [Markup.button.callback('⚙️ Settings', 'trading_settings'), Markup.button.callback('❌ Cancel', 'cancel_trade')]
      ])
    );
  } catch (error) {
    console.error('Error showing sell options:', error);
  }
});

// Custom sell amount
bot.action(/^sell_custom_(.+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery();
    const tokenMint = ctx.match[1];

    await ctx.replyWithHTML(
      `<b>✏️ CUSTOM SELL %</b>

Send the percentage you want to sell:

<b>Example:</b> <code>33</code> (for 33%)

<i>Token: ${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</i>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Cancel', 'cancel_trade')]
      ])
    );

    const pendingBuys = (global as any).pendingBuys || {};
    pendingBuys[ctx.from.id] = { tokenMint, action: 'sell' };
    (global as any).pendingBuys = pendingBuys;
  } catch (error) {
    console.error('Error showing custom sell:', error);
  }
});

// Execute sell
bot.action(/^execsell_([A-Za-z0-9]+)_([0-9]+)$/, async (ctx) => {
  try {
    await ctx.answerCbQuery('Processing...');

    const tokenMint = ctx.match[1];
    const percentage = parseInt(ctx.match[2]);

    const wallet = getUserWallet(ctx.from.id);
    if (!wallet) return;

    const settings = getUserSettings(ctx.from.id);

    const statusMsg = await ctx.replyWithHTML(
      `<b>⏳ EXECUTING SELL...</b>

<b>Selling:</b> <code>${percentage}%</code>
<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>

<i>Getting token balance...</i>`
    );

    // Get keypair
    const keypair = getKeypairFromWallet(ctx.from.id);
    if (!keypair) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        undefined,
        '❌ Failed to load wallet. Please try again.'
      );
      return;
    }

    // Get current token balance
    const tokenBalance = await getTokenBalance(connection, wallet.publicKey, tokenMint);

    if (tokenBalance <= 0) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        undefined,
        `<b>❌ NO TOKENS</b>\n\nYou don't have any of this token to sell.`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Calculate amount to sell based on percentage
    const sellAmount = Math.floor(tokenBalance * (percentage / 100));

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      statusMsg.message_id,
      undefined,
      `<b>⏳ EXECUTING SELL...</b>

<b>Selling:</b> <code>${percentage}%</code> (${sellAmount.toLocaleString()} tokens)
<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>

<i>Submitting to Jupiter...</i>`,
      { parse_mode: 'HTML' }
    );

    // Execute real swap via Jupiter
    const swapResult = await sellToken(
      connection,
      keypair,
      tokenMint,
      sellAmount,
      settings.slippage,
      settings.priorityFee,
      settings.mevProtection
    );

    if (!swapResult.success) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        undefined,
        `<b>❌ SELL FAILED</b>

<b>Error:</b> ${swapResult.error || 'Unknown error'}

<i>Please try again or adjust slippage.</i>`,
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Remove position if sold 100%
    if (percentage === 100) {
      removePosition(ctx.from.id, tokenMint);
    }

    const solReceived = (swapResult.outputAmount || 0) / LAMPORTS_PER_SOL;

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      statusMsg.message_id,
      undefined,
      `<b>✓ SELL EXECUTED</b>

<b>Sold:</b> <code>${percentage}%</code> (${sellAmount.toLocaleString()} tokens)
<b>Received:</b> <code>${solReceived.toFixed(4)} SOL</code>
<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.url('View Tx', `https://solscan.io/tx/${swapResult.signature}`)]
        ])
      }
    );
  } catch (error) {
    console.error('Error executing sell:', error);
    await ctx.reply('❌ Transaction failed. Please try again.');
  }
});

// Cancel trade
bot.action('cancel_trade', async (ctx) => {
  try {
    await ctx.answerCbQuery('Cancelled');
    await ctx.deleteMessage();

    const pendingBuys = (global as any).pendingBuys || {};
    delete pendingBuys[ctx.from.id];
  } catch (error) {
    console.error('Error cancelling trade:', error);
  }
});

// Handle text messages for custom amounts and wallet import
bot.on('text', async (ctx, next) => {
  // Skip commands - let command handlers handle them
  if (ctx.message.text.startsWith('/')) {
    return next();
  }

  // Check if user is importing a wallet
  const pendingImports = (global as any).pendingImports || {};
  if (pendingImports[ctx.from.id]) {
    const privateKey = ctx.message.text.trim();

    // Delete the message for security
    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.error('Could not delete private key message:', e);
    }

    delete pendingImports[ctx.from.id];

    const result = importWallet(ctx.from.id, privateKey);

    if (!result.success) {
      await ctx.replyWithHTML(
        `<b>❌ IMPORT FAILED</b>

${result.error}

Please try again with a valid Solana private key.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Try Again', 'import_wallet')],
          [Markup.button.callback('⚡ Create New Wallet', 'create_wallet')]
        ])
      );
      return;
    }

    await ctx.replyWithHTML(
      `<b>✓ WALLET IMPORTED</b>

Your wallet has been imported successfully:

<code>${result.publicKey}</code>

<i>Tap the address to copy.</i>

Type /wallet to manage your wallet.

<i>You will be notified when Orvex detects a coin to snipe.</i>`
    );
    return;
  }

  // Handle custom buy/sell amounts
  const pendingBuys = (global as any).pendingBuys || {};
  const pending = pendingBuys[ctx.from.id];

  if (pending) {
    const amount = parseFloat(ctx.message.text);

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Invalid amount. Please enter a valid number.');
      return;
    }

    delete pendingBuys[ctx.from.id];

    if (pending.action === 'buy') {
      // Trigger buy with custom amount
      const tokenMint = pending.tokenMint;
      const wallet = getUserWallet(ctx.from.id);
      if (!wallet) return;

      const balance = await getWalletBalance(wallet.publicKey);
      const settings = getUserSettings(ctx.from.id);

      if (balance < amount + settings.priorityFee) {
        await ctx.replyWithHTML(`<b>⚠️ Insufficient balance</b>\n\nRequired: <code>${(amount + settings.priorityFee).toFixed(4)} SOL</code>\nAvailable: <code>${balance.toFixed(4)} SOL</code>`);
        return;
      }

      await ctx.replyWithHTML(
        `<b>⚡ CONFIRM BUY</b>

<b>Amount:</b> <code>${amount} SOL</code>
<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✓ Confirm Buy', `buy_${tokenMint}_${amount}`)],
          [Markup.button.callback('❌ Cancel', 'cancel_trade')]
        ])
      );
    } else if (pending.action === 'sell') {
      // Trigger sell with custom percentage
      const tokenMint = pending.tokenMint;
      const percentage = Math.min(100, Math.max(1, Math.round(amount)));

      await ctx.replyWithHTML(
        `<b>📈 CONFIRM SELL</b>

<b>Selling:</b> <code>${percentage}%</code>
<b>Token:</b> <code>${tokenMint.slice(0, 8)}...${tokenMint.slice(-8)}</code>`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✓ Confirm Sell', `execsell_${tokenMint}_${percentage}`)],
          [Markup.button.callback('❌ Cancel', 'cancel_trade')]
        ])
      );
    }
  }
});

// ============== COMMANDS ==============

// /withdraw command
bot.command('withdraw', async (ctx) => {
  try {
    const wallet = getUserWallet(ctx.from.id);
    if (!wallet) {
      await ctx.reply('You don\'t have a wallet. Use /start to create one.');
      return;
    }

    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
      await ctx.replyWithHTML(
        `<b>Usage:</b>\n<code>/withdraw [address] [amount]</code>\n\n<b>Example:</b>\n<code>/withdraw 9WzDX...abc 0.5</code>`
      );
      return;
    }

    const [toAddress, amountStr] = args;
    const balance = await getWalletBalance(wallet.publicKey);

    let toPubkey: PublicKey;
    try {
      toPubkey = new PublicKey(toAddress);
    } catch {
      await ctx.reply('Invalid Solana address.');
      return;
    }

    let amount: number;
    const fee = 0.000005;

    if (amountStr.toLowerCase() === 'all') {
      amount = balance - fee;
    } else {
      amount = parseFloat(amountStr);
    }

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('Invalid amount.');
      return;
    }

    if (amount + fee > balance) {
      await ctx.replyWithHTML(`<b>Insufficient balance.</b>\n\nAvailable: <code>${balance.toFixed(4)} SOL</code>`);
      return;
    }

    const statusMsg = await ctx.reply('⏳ Processing withdrawal...');

    try {
      const keypair = getKeypairFromWallet(ctx.from.id);
      if (!keypair) throw new Error('Could not load wallet');

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey,
          lamports: Math.floor(amount * LAMPORTS_PER_SOL)
        })
      );

      const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        `<b>✓ WITHDRAWAL COMPLETE</b>

<b>Amount:</b> <code>${amount.toFixed(4)} SOL</code>
<b>To:</b> <code>${toAddress.slice(0, 8)}...${toAddress.slice(-8)}</code>

<b>Tx:</b> <code>${signature}</code>`,
        { parse_mode: 'HTML' }
      );
    } catch (txError) {
      console.error('Transaction error:', txError);
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        '❌ Withdrawal failed. Please try again.'
      );
    }
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    await ctx.reply('Error processing withdrawal.');
  }
});

// /wallet command
bot.command('wallet', async (ctx) => {
  console.log(`📥 Received /wallet command from user ${ctx.from.id}`);

  const wallet = getUserWallet(ctx.from.id);
  if (!wallet) {
    await ctx.replyWithHTML(
      `<b>No Wallet Found</b>\n\nCreate a new wallet or import an existing one.`,
      Markup.inlineKeyboard([
        [Markup.button.callback('⚡ Create Wallet', 'create_wallet')],
        [Markup.button.callback('📲 Import Wallet', 'import_wallet')]
      ])
    );
    return;
  }

  const balance = await getWalletBalance(wallet.publicKey);

  await ctx.replyWithHTML(
    `<b>💰 WALLET</b>

<b>Address:</b>
<code>${wallet.publicKey}</code>

<i>Tap the address to copy.</i>

<b>Balance:</b> <code>${balance.toFixed(4)} SOL</code>`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📥 Deposit', 'wallet_deposit'), Markup.button.callback('📤 Withdraw', 'wallet_withdraw')],
      [Markup.button.callback('🔑 Export Key', 'wallet_export'), Markup.button.callback('⚙️ Settings', 'trading_settings')],
      [Markup.button.callback('🔄 Refresh', 'wallet_menu'), Markup.button.callback('🗑️ Delete', 'wallet_delete_warning')]
    ])
  );
});

// /help command
bot.help((ctx) => {
  ctx.replyWithHTML(
    `<b>Orvex Commands</b>

/start - Initialize bot
/wallet - Open wallet menu
/withdraw - Withdraw SOL
/help - Show commands`
  );
});

// ============== ADMIN ==============

// Admin: Stats
bot.command('stats', async (ctx) => {
  if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID) return;

  const users = getAllUsers();
  const wallets = loadWallets();

  await ctx.replyWithHTML(
    `<b>Bot Statistics</b>\n\nTotal users: <code>${users.length}</code>\nWallets created: <code>${Object.keys(wallets).length}</code>`
  );
});

// Admin: Broadcast with View + Snipe buttons
bot.command('broadcast', async (ctx) => {
  if (ADMIN_ID && ctx.from.id.toString() !== ADMIN_ID) return;

  const text = ctx.message.text.replace('/broadcast', '').trim();
  const urlMatch = text.match(/^(https?:\/\/\S+)\s+([\s\S]+)$/);

  if (!urlMatch) {
    await ctx.replyWithHTML(
      `<b>Usage:</b>\n<code>/broadcast &lt;pump.fun URL&gt; &lt;message&gt;</code>\n\n<b>Example:</b>\n<code>/broadcast https://pump.fun/coin/ABC123 🚨 New alpha detected!</code>`
    );
    return;
  }

  const [, url, message] = urlMatch;
  const users = getAllUsers();

  if (users.length === 0) {
    await ctx.reply('No users to broadcast to.');
    return;
  }

  // Extract token mint from pump.fun URL
  const tokenMint = extractTokenFromUrl(url);

  await ctx.reply(`Broadcasting to ${users.length} users...`);

  let successful = 0;
  let failed = 0;

  for (const userId of users) {
    try {
      const buttons = tokenMint
        ? [
            [Markup.button.url('🔗 View', url), Markup.button.callback('⚡ Snipe', `snipe_${tokenMint}`)]
          ]
        : [
            [Markup.button.url('🔗 View', url)]
          ];

      await bot.telegram.sendMessage(userId, message, {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard(buttons)
      });
      successful++;
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`Failed to send to ${userId}:`, error);
      failed++;
    }
  }

  await ctx.replyWithHTML(`<b>Broadcast complete</b>\n\nSent: ${successful}\nFailed: ${failed}`);
});

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
});

// Launch bot
console.log('🚀 Starting Orvex Bot...');
console.log('BOT_TOKEN present:', !!BOT_TOKEN);

// Start polling directly
bot.launch();
console.log('✅ Bot is now polling for messages!');
console.log('📱 Send /wallet to @OrvexAI_bot');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
