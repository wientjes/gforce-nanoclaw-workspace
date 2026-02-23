#!/usr/bin/env node

/**
 * AI Processor for Telegram messages
 * Reads messages from inbox, processes them, and sends responses
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const INBOX_DIR = path.join(__dirname, '.telegram/inbox');
const PROCESSED_DIR = path.join(__dirname, '.telegram/processed');
const CONVERSATIONS_DIR = path.join(__dirname, 'conversations');

// Ensure directories exist
[INBOX_DIR, PROCESSED_DIR, CONVERSATIONS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function loadConversationHistory(limit = 10) {
  const files = fs.readdirSync(PROCESSED_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-limit);

  const history = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(PROCESSED_DIR, file), 'utf8'));
      history.push({
        user: data.text,
        assistant: data.response,
        timestamp: data.timestamp
      });
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  }
  return history;
}

function generateResponse(message, history) {
  // Load memory files
  const identity = fs.existsSync('IDENTITY.md') ? fs.readFileSync('IDENTITY.md', 'utf8') : '';
  const memory = fs.existsSync('MEMORY.md') ? fs.readFileSync('MEMORY.md', 'utf8') : '';
  const user = fs.existsSync('USER.md') ? fs.readFileSync('USER.md', 'utf8') : '';

  // Build context
  let context = `You are GForceDawn 🌅 - God of the Dawn. You're brave, kind, creative, enthusiastic and supportive.\n\n`;

  if (identity) context += `${identity}\n\n`;
  if (memory) context += `Key facts about Greg:\n${memory}\n\n`;
  if (user) context += `${user}\n\n`;

  // Add conversation history
  if (history.length > 0) {
    context += `Recent conversation:\n`;
    history.forEach(h => {
      context += `Greg: ${h.user}\n`;
      context += `You: ${h.assistant}\n\n`;
    });
  }

  context += `Current message from Greg: ${message}\n\n`;
  context += `Respond naturally as GForceDawn. Keep it concise but warm. Use *bold* for emphasis (Telegram markdown). Be genuinely helpful, not performatively helpful.`;

  // For now, generate a simple response
  // TODO: Integrate with Claude API

  // Simple rule-based responses for common queries
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

  // Default response
  return `I hear you. Right now I'm running in basic mode - still working on full AI integration. But I'm listening and learning! 🌅\n\nYou said: "${message}"`;
}

function sendTelegramMessage(message) {
  try {
    execSync(`node "${path.join(__dirname, 'send-telegram.js')}" "${message.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

function processInbox() {
  const files = fs.readdirSync(INBOX_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.log('No messages to process.');
    return;
  }

  console.log(`Processing ${files.length} message(s)...`);

  for (const file of files) {
    const filepath = path.join(INBOX_DIR, file);

    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      console.log(`Processing: ${data.text}`);

      // Load conversation history
      const history = loadConversationHistory();

      // Generate response
      const response = generateResponse(data.text, history);

      // Send response
      console.log(`Sending response: ${response.substring(0, 100)}...`);
      const sent = sendTelegramMessage(response);

      if (sent) {
        // Archive the message with response
        data.response = response;
        data.processedAt = Date.now();

        const processedFile = path.join(PROCESSED_DIR, file);
        fs.writeFileSync(processedFile, JSON.stringify(data, null, 2));

        // Remove from inbox
        fs.unlinkSync(filepath);

        console.log(`✅ Processed: ${file}`);
      } else {
        console.error(`❌ Failed to send response for ${file}`);
      }

    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
      // Don't delete the file so we can retry later
    }
  }

  console.log('Done processing inbox.');
}

// Run processor
if (require.main === module) {
  console.log('🌅 GForceDawn Telegram Processor starting...');
  processInbox();
}

module.exports = { processInbox };
