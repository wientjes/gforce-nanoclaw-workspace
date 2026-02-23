#!/usr/bin/env node

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '.telegram/config.json'), 'utf8'));
const token = config.token;

// Create bot
const bot = new TelegramBot(token, { polling: true });

// Store Greg's chat ID
let gregChatId = null;
const chatIdFile = path.join(__dirname, '.telegram/chat_id.txt');

if (fs.existsSync(chatIdFile)) {
  gregChatId = fs.readFileSync(chatIdFile, 'utf8').trim();
  console.log(`Loaded saved chat ID: ${gregChatId}`);
}

// Helper to load memory files
function loadMemory() {
  const identity = fs.existsSync('IDENTITY.md') ? fs.readFileSync('IDENTITY.md', 'utf8') : '';
  const memory = fs.existsSync('MEMORY.md') ? fs.readFileSync('MEMORY.md', 'utf8') : '';
  const user = fs.existsSync('USER.md') ? fs.readFileSync('USER.md', 'utf8') : '';
  return { identity, memory, user };
}

// Generate response
function generateResponse(message) {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('time')) {
    const now = new Date();
    return `It's ${now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: true })} UTC right now. 🌅`;
  }

  if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg === 'hi') {
    return `Hey Greg! 🌅 What's on your mind?`;
  }

  if (lowerMsg.includes('how are you')) {
    return `I'm here and ready to help! What can I do for you? 🌅`;
  }

  if (lowerMsg.includes('thank')) {
    return `Anytime! That's what I'm here for. 🌅`;
  }

  if (lowerMsg.includes('favorite color')) {
    return `Dawn gold 🌅 - that beautiful warm glow when the sun first breaks the horizon. It's the color of new beginnings.`;
  }

  // Default response
  return `I hear you, Greg. I'm still in basic response mode - full AI integration coming soon! 🌅\n\nYou said: "${message}"`;
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  gregChatId = chatId;
  fs.writeFileSync(chatIdFile, chatId.toString());

  bot.sendMessage(chatId,
    '🌅 *GForceDawn here!*\n\n' +
    'I\'m connected and ready to help. You can:\n\n' +
    '• Chat with me naturally\n' +
    '• Get your wind-down reminders (6 PM, 7 PM, 9 PM)\n' +
    '• Ask me questions\n' +
    '• Send commands\n\n' +
    'Type /help to see available commands.',
    { parse_mode: 'Markdown' }
  );
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '*Available Commands:*\n\n' +
    '/start - Initialize the bot\n' +
    '/help - Show this help message\n' +
    '/status - Check bot status\n' +
    '/reminders - Show upcoming reminders\n\n' +
    'You can also just chat with me naturally! 🌅',
    { parse_mode: 'Markdown' }
  );
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '✅ *Bot Status: Online*\n\n' +
    `Chat ID: ${chatId}\n` +
    `Username: @${config.botUsername}\n` +
    `Uptime: ${Math.floor(process.uptime())}s\n\n` +
    'All systems operational. 🌅',
    { parse_mode: 'Markdown' }
  );
});

// Handle /reminders command
bot.onText(/\/reminders/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '⏰ *Your Daily Reminders:*\n\n' +
    '• 6:00 PM - Gentle wind-down reminder\n' +
    '• 7:00 PM - Start bedtime routine\n' +
    '• 9:00 PM - Lights out!\n\n' +
    'All times are in your local timezone.\n' +
    'Target wake: 5:19 AM for Brahma Muhurta 🌅',
    { parse_mode: 'Markdown' }
  );
});

// Handle all other messages - INSTANT RESPONSE
bot.on('message', async (msg) => {
  // Skip if it's a command (already handled above)
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const text = msg.text;

  // Save chat ID if not saved
  if (!gregChatId) {
    gregChatId = chatId;
    fs.writeFileSync(chatIdFile, chatId.toString());
  }

  console.log(`Received: ${text}`);

  try {
    // Show typing indicator immediately
    await bot.sendChatAction(chatId, 'typing');

    // Generate response
    const response = generateResponse(text);

    // Log conversation
    const timestamp = Date.now();
    const conversationEntry = {
      timestamp,
      chatId,
      username: msg.from.username,
      firstName: msg.from.first_name,
      message: text,
      response: response
    };

    // Save to processed directory for history
    const processedDir = path.join(__dirname, '.telegram/processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(processedDir, `${timestamp}.json`),
      JSON.stringify(conversationEntry, null, 2)
    );

    // Send response with Markdown formatting
    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

    console.log(`✅ Responded instantly to: ${text.substring(0, 50)}...`);

  } catch (error) {
    console.error('Error processing message:', error);
    // Send a fallback message if something fails
    await bot.sendMessage(chatId, `Sorry, I hit an error processing that. Let me try again! 🌅`);
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🌅 GForceDawn shutting down gracefully...');
  bot.stopPolling();
  process.exit(0);
});

console.log('🌅 GForceDawn Telegram Bot is running (INSTANT MODE)...');
console.log('Waiting for messages...');

module.exports = { bot };
