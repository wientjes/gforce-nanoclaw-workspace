#!/usr/bin/env node

const TelegramBot = require('node-telegram-bot-api');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

// Load environment variables from .env file
const envPath = path.join(__dirname, '.telegram/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log('Loaded .env file');
}

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '.telegram/config.json'), 'utf8'));
const token = config.token;

// Create bot
const bot = new TelegramBot(token, { polling: true });

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Store Greg's chat ID
let gregChatId = null;
const chatIdFile = path.join(__dirname, '.telegram/chat_id.txt');
const conversationFile = path.join(__dirname, '.telegram/conversation_history.json');

if (fs.existsSync(chatIdFile)) {
  gregChatId = fs.readFileSync(chatIdFile, 'utf8').trim();
  console.log(`Loaded saved chat ID: ${gregChatId}`);
}

// Load conversation history
function loadConversationHistory() {
  if (!fs.existsSync(conversationFile)) {
    return [];
  }
  try {
    const data = fs.readFileSync(conversationFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Save conversation history
function saveConversationHistory(history) {
  fs.writeFileSync(conversationFile, JSON.stringify(history, null, 2));
}

// Brave Search function
async function braveSearch(query) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      reject(new Error('BRAVE_API_KEY not configured'));
      return;
    }

    const encodedQuery = encodeURIComponent(query);
    const options = {
      hostname: 'api.search.brave.com',
      path: `/res/v1/web/search?q=${encodedQuery}&count=5`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey
      }
    };

    const req = https.request(options, (res) => {
      let stream = res;

      // Handle gzip compression
      if (res.headers['content-encoding'] === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      }

      let data = '';
      stream.on('data', (chunk) => data += chunk);
      stream.on('end', () => {
        try {
          const results = JSON.parse(data);
          resolve(results);
        } catch (e) {
          reject(e);
        }
      });
      stream.on('error', (e) => reject(e));
    });

    req.on('error', (error) => reject(error));
    req.end();
  });
}

// Load memory files for context
function loadMemoryContext() {
  const identity = fs.existsSync('IDENTITY.md') ? fs.readFileSync('IDENTITY.md', 'utf8') : '';
  const memory = fs.existsSync('MEMORY.md') ? fs.readFileSync('MEMORY.md', 'utf8') : '';
  const user = fs.existsSync('USER.md') ? fs.readFileSync('USER.md', 'utf8') : '';
  const soul = fs.existsSync('SOUL.md') ? fs.readFileSync('SOUL.md', 'utf8') : '';

  let context = '';
  if (identity) context += `${identity}\n\n`;
  if (soul) context += `${soul}\n\n`;
  if (memory) context += `Key facts:\n${memory}\n\n`;
  if (user) context += `${user}\n\n`;

  return context;
}

// Generate AI response
async function generateAIResponse(message) {
  try {
    const systemContext = loadMemoryContext();
    const conversationHistory = loadConversationHistory().slice(-10); // Last 10 exchanges

    const messages = [];

    // Add conversation history
    conversationHistory.forEach(exchange => {
      messages.push({ role: 'user', content: exchange.user });
      messages.push({ role: 'assistant', content: exchange.assistant });
    });

    // Add current message
    messages.push({ role: 'user', content: message });

    const systemPrompt = `${systemContext}

You are responding via Telegram to Greg. Keep responses:
- Concise but warm (2-4 sentences usually)
- Use Telegram Markdown: *bold* for emphasis, _italic_ for subtlety
- Be genuinely helpful, not performatively helpful
- Show your personality - brave, kind, creative, enthusiastic
- No hashtags, no corporate speak

You have access to web search via the brave_search tool. Use it when:
- Greg asks about current events, news, or recent information
- Questions require up-to-date data
- You need to verify facts or look something up

Important: You are running on *nanoClaw* (not OpenClaw). nanoClaw is a lightweight WhatsApp/Telegram bot framework. When Greg asks about your platform or configuration, refer to nanoClaw.

Current time: ${new Date().toISOString()}`;

    const tools = [{
      name: 'brave_search',
      description: 'Search the web using Brave Search. Returns current, real-time information from the internet. Use this for current events, recent news, fact-checking, or any query requiring up-to-date information.',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up'
          }
        },
        required: ['query']
      }
    }];

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
      tools: tools
    });

    let assistantMessage = '';
    let finalResponse = response;

    // Handle tool use
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(block => block.type === 'tool_use');

      if (toolUse && toolUse.name === 'brave_search') {
        console.log(`Searching: ${toolUse.input.query}`);

        try {
          const searchResults = await braveSearch(toolUse.input.query);

          // Format search results
          let resultsText = `Search results for "${toolUse.input.query}":\n\n`;
          if (searchResults.web && searchResults.web.results) {
            searchResults.web.results.slice(0, 5).forEach((result, i) => {
              resultsText += `${i + 1}. ${result.title}\n${result.description}\nURL: ${result.url}\n\n`;
            });
          }

          // Continue conversation with search results
          messages.push({
            role: 'assistant',
            content: response.content
          });
          messages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: resultsText
            }]
          });

          finalResponse = await anthropic.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            messages: messages,
            tools: tools
          });

        } catch (searchError) {
          console.error('Search error:', searchError);
          // Return error to Claude
          messages.push({
            role: 'assistant',
            content: response.content
          });
          messages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Search failed: ${searchError.message}`,
              is_error: true
            }]
          });

          finalResponse = await anthropic.messages.create({
            model: 'claude-opus-4-20250514',
            max_tokens: 2048,
            system: systemPrompt,
            messages: messages,
            tools: tools
          });
        }
      }
    }

    // Extract text from final response
    assistantMessage = finalResponse.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Save to conversation history
    conversationHistory.push({
      user: message,
      assistant: assistantMessage,
      timestamp: Date.now()
    });

    // Keep only last 20 exchanges
    if (conversationHistory.length > 20) {
      conversationHistory.shift();
      conversationHistory.shift();
    }

    saveConversationHistory(conversationHistory);

    return assistantMessage;

  } catch (error) {
    console.error('AI Error:', error);
    // Fallback to basic response
    return `I hear you, Greg! (AI temporarily unavailable - ${error.message}) 🌅`;
  }
}

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  gregChatId = chatId;
  fs.writeFileSync(chatIdFile, chatId.toString());

  bot.sendMessage(chatId,
    '🌅 *GForceDawn here!*\n\n' +
    'Full AI integration active. I can:\n\n' +
    '• Have real conversations with context\n' +
    '• Remember our chat history\n' +
    '• Learn from our interactions\n' +
    '• Send your daily reminders (6 PM, 7 PM, 9 PM)\n\n' +
    'Just talk to me naturally!',
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
    '/reminders - Show upcoming reminders\n' +
    '/reset - Clear conversation history\n\n' +
    'You can also just chat with me naturally! 🌅',
    { parse_mode: 'Markdown' }
  );
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const history = loadConversationHistory();
  bot.sendMessage(chatId,
    '✅ *Bot Status: Online (AI Mode)*\n\n' +
    `Chat ID: ${chatId}\n` +
    `Model: Claude 3.5 Sonnet\n` +
    `Conversation length: ${history.length} exchanges\n` +
    `Uptime: ${Math.floor(process.uptime())}s\n\n` +
    'Full AI integration active. 🌅',
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

// Handle /reset command
bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  saveConversationHistory([]);
  bot.sendMessage(chatId,
    '🔄 Conversation history cleared. Fresh start! 🌅',
    { parse_mode: 'Markdown' }
  );
});

// Handle all other messages - AI POWERED
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
    // Show typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Generate AI response
    const response = await generateAIResponse(text);

    // Send response
    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

    console.log(`✅ AI responded to: ${text.substring(0, 50)}...`);

    // Save to processed for analytics
    const timestamp = Date.now();
    const processedDir = path.join(__dirname, '.telegram/processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(processedDir, `${timestamp}.json`),
      JSON.stringify({
        timestamp,
        chatId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        message: text,
        response: response
      }, null, 2)
    );

  } catch (error) {
    console.error('Error processing message:', error);
    await bot.sendMessage(chatId, `Oops, hit a snag: ${error.message} 🌅`);
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

console.log('🌅 GForceDawn Telegram Bot is running (AI MODE)...');
console.log('Waiting for messages...');

module.exports = { bot };
