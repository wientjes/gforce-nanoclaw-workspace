#!/usr/bin/env node

// Simple script to send messages to Telegram
// Usage: node send-telegram.js "Your message here"

const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '.telegram/config.json');
const chatIdPath = path.join(__dirname, '.telegram/chat_id.txt');

if (!fs.existsSync(configPath)) {
  console.error('Config file not found. Run the bot first.');
  process.exit(1);
}

if (!fs.existsSync(chatIdPath)) {
  console.error('Chat ID not found. User needs to /start the bot first.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const chatId = fs.readFileSync(chatIdPath, 'utf8').trim();
const message = process.argv[2] || 'Test message from GForceDawn 🌅';

// Use Markdown for clean formatting
const data = JSON.stringify({
  chat_id: chatId,
  text: message,
  parse_mode: 'Markdown'
});

const options = {
  hostname: 'api.telegram.org',
  path: `/bot${config.token}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Message sent successfully!');
    } else {
      console.error('❌ Error:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
});

req.write(data);
req.end();
