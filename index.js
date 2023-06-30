require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const Moralis = require("moralis").default;

const API_KEY =
  "oTYn0f5pNUHXTNgtSsDMtohMoPMB855Oocd4AIHHBosAhDh2EdlRwuzHRHsTmAue";
const BOT_TOKEN = "6327508524:AAHlsDZB-grWiIRW_AGv0pHPMOWnGcWFDYs";

const botsToKeep = [
  "Bobby_Bot_Trending",
  "BobbyBuyBot",
  "MissRose_bot",
  "Token_420chan_Bot",
  "four20chan_security_bot",
];

// Initialize Moralis
async function initializeMoralis() {
  try {
    await Moralis.start({ apiKey: API_KEY });
    console.log("Moralis initialized");
  } catch (error) {
    console.error("Failed to initialize Moralis: ", error);
  }
}

// Create a new instance of the TelegramBot with your bot token
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Delete a message using the provided Telegram bot instance
async function deleteMessage(bot, chatId, messageId) {
  try {
    await bot.deleteMessage(chatId, messageId);
    console.log("Message deleted");
  } catch (error) {
    console.error("Failed to delete message: ", error);
  }
}

// Kick a chat member using the provided Telegram bot instance
async function kickChatMember(chatId, memberId) {
  try {
    await bot.banChatMember(chatId, memberId);
    console.log("Chat member kicked");
  } catch (error) {
    console.error("Failed to kick the chat member: ", error);
  }
}

bot.on("new_chat_members", (msg) => {
  const { is_bot, username } = msg.new_chat_member;
  const isBot = is_bot;
  const chatId = msg.chat.id;
  const fromId = msg.new_chat_member.id;
  if (isBot && !botsToKeep.includes(username)) {
    bot.banChatMember(chatId, fromId);
  }
});

// Fetch token data from Moralis EvmApi
async function getToken() {
  try {
    const response = await Moralis.EvmApi.token.getTokenPrice({
      chain: "0x1",
      address: "0xa5ebe5507b6c725cbc283f8ade236fe8b8d41f91",
    });

    const data = response.raw;
    const ethPrice =
      parseFloat(data.nativePrice.value) /
      Math.pow(10, data.nativePrice.decimals);

    return {
      address: data.tokenAddress,
      eth: Number(ethPrice).toFixed(18),
      usd: Number(data.usdPriceFormatted).toFixed(12),
      supply: "420 Trillion ",
      symbol: data.tokenSymbol,
    };
  } catch (error) {
    console.error("Failed to fetch token data: ", error);
  }
}

// Send token details to a specific chat using the provided Telegram bot instance
async function sendTokenDetails(bot, chatId) {
  const token = await getToken();

  if (token) {
    const message =
      `🍀 ERC-20 Token Freshly launched\n\n` +
      `📄 Contract: ${token.address}\n` +
      `💵 ${token.eth} ETH ($${token.usd}) \n` +
      `🪙 ${token.supply} 420chan\n` +
      `🔹 https://bit.ly/420ChanDexTools\n\n` +
      `🔼 Low Market Cap\n` +
      `🐦 TW: @420chan_token\n` +
      `📱 TikTok: @420chan_token\n`;

    try {
      await bot.sendMessage(chatId, message);
      console.log("Token details sent");
    } catch (error) {
      console.error("Failed to send token details: ", error);
    }
  }
}

// Handle the "/help" command
function handleHelpCommand(bot, chatId) {
  const helpText = [
    "/rules - Get information about the group rules",
    "/help - Get the list of commands",
  ].join("\n");

  bot.sendMessage(chatId, "Available commands:\n\n" + helpText);
}

// Handle the "/rules" command
function handleRulesCommand(bot, chatId) {
  const rules =
    "🪴 Welcome To The Official 420chan Channel\n" +
    "📕 Follow The Rules Or Get Banned\n" +
    "🚫 Spam\n" +
    "🚫 Scam\n" +
    "🚫 Disrespect";

  bot.sendMessage(chatId, rules);
}

// Handle the message event
async function handleMessage(msg) {
  const isBot = msg.from.is_bot ?? false;
  const chatId = msg.chat.id;
  const fromId = msg.from.id;
  const messageId = msg.message_id;

  if (isBot && !botsToKeep.includes(msg.from.username)) {
    try {
      await deleteMessage(bot, chatId, messageId);
      await kickChatMember(bot, chatId, fromId);
      console.log("Bot has been kicked from the chat");
    } catch (error) {
      console.error("Failed to delete message or kick the bot: ", error);
    }
  } else {
    console.log("Not a bot... in on message main group");
  }
}

// Initialize Moralis
initializeMoralis().catch((error) => {
  console.error("Failed to initialize Moralis: ", error);
});

// Handle the message event
bot.on("message", (msg) => {
  handleMessage(msg).catch((error) => {
    console.error("Error in handling message: ", error);
  });
});

const app = express();

const port = process.env.PORT ?? 3000;
app.listen(port, async () => {
  bot.startPolling();
  console.log(`Server running on port ${port}`);
});
