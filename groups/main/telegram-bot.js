#!/usr/bin/env node

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '.telegram/config.json'), 'utf8'));
const token = config.token;

// Create bot
const bot = new TelegramBot(token, { polling: true });

// Store Greg's chat ID when he first messages
let gregChatId = null;
const chatIdFile = path.join(__dirname, '.telegram/chat_id.txt');

// Load saved chat ID if exists
if (fs.existsSync(chatIdFile)) {
  gregChatId = fs.readFileSync(chatIdFile, 'utf8').trim();
  console.log(`Loaded saved chat ID: ${gregChatId}`);
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  gregChatId = chatId;
  fs.writeFileSync(chatIdFile, chatId.toString());

  bot.sendMessage(chatId,
    '🌅 <b>GForceDawn here!</b>\n\n' +
    'I\'m connected and ready to help. You can:\n\n' +
    '• Chat with me naturally\n' +
    '• Get your wind-down reminders (6 PM, 7 PM, 9 PM)\n' +
    '• Ask me questions\n' +
    '• Send commands\n\n' +
    'Type /help to see available commands.',
    { parse_mode: 'HTML' }
  );
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '<b>Available Commands:</b>\n\n' +
    '/start - Initialize the bot\n' +
    '/help - Show this help message\n' +
    '/status - Check bot status\n' +
    '/reminders - Show upcoming reminders\n\n' +
    'You can also just chat with me naturally! 🌅',
    { parse_mode: 'HTML' }
  );
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '✅ <b>Bot Status: Online</b>\n\n' +
    `Chat ID: ${chatId}\n` +
    `Username: @${config.botUsername}\n` +
    `Uptime: ${Math.floor(process.uptime())}s\n\n` +
    'All systems operational. 🌅',
    { parse_mode: 'HTML' }
  );
});

// Handle /reminders command
bot.onText(/\/reminders/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId,
    '⏰ <b>Your Daily Reminders:</b>\n\n' +
    '• 6:00 PM - Gentle wind-down reminder\n' +
    '• 7:00 PM - Start bedtime routine\n' +
    '• 9:00 PM - Lights out!\n\n' +
    'All times are in your local timezone.\n' +
    'Target wake: 5:19 AM for Brahma Muhurta 🌅',
    { parse_mode: 'HTML' }
  );
});

// Handle all other messages
bot.on('message', (msg) => {
  // Skip if it's a command (already handled above)
  if (msg.text && msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const text = msg.text;

  // Save chat ID if not saved
  if (!gregChatId) {
    gregChatId = chatId;
    fs.writeFileSync(chatIdFile, chatId.toString());
  }

  // Log the message
  console.log(`Received: ${text}`);

  // Save to inbox for AI processing
  const timestamp = Date.now();
  const inboxFile = path.join(__dirname, '.telegram/inbox', `${timestamp}.json`);
  const messageData = {
    chatId,
    text,
    timestamp,
    username: msg.from.username,
    firstName: msg.from.first_name,
    messageId: msg.message_id
  };

  fs.writeFileSync(inboxFile, JSON.stringify(messageData, null, 2));
  console.log(`Message queued for AI processing: ${inboxFile}`);

  // Send typing indicator
  bot.sendChatAction(chatId, 'typing');
});

// Export function to send messages programmatically
async function sendMessage(message) {
  if (!gregChatId) {
    console.error('No chat ID available. User needs to /start the bot first.');
    return false;
  }

  try {
    await bot.sendMessage(gregChatId, message, { parse_mode: 'HTML' });
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

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

console.log('🌅 GForceDawn Telegram Bot is running...');
console.log('Waiting for messages...');

// Export for use in other scripts
module.exports = { sendMessage, bot };
