import { Bot, Context, webhookCallback } from "grammy";
import { formatText } from "../gemini";

// Initialize the bot. We must handle missing tokens gracefully for the build process.
const token = process.env.TELEGRAM_BOT_TOKEN || "12345:DUMMY_TOKEN_FOR_BUILD_PROCESS";
export const bot = new Bot(token);

// Middleware to log incoming updates (optional, for debugging)
bot.use(async (ctx, next) => {
  console.log(`Received update`);
  await next();
});

// Command handler for /start
bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 <b>Welcome to the Smart Formatter Bot!</b>\\n\\n" +
    "Send me any unstructured text, messy notes, or raw data, and I will help you format it into a beautiful Table or List for Telegram.\\n\\n" +
    "Just send me some text to get started!",
    { parse_mode: "HTML" }
  );
});

// Message handler for text messages
bot.on("message", async (ctx) => {
  const text = ctx.message.text || ctx.message.caption;
  
  if (!text) {
    await ctx.reply("Please send me some text or a captioned image/document to format.");
    return;
  }
  
  // Create an inline keyboard with the 3 formatting options.
  // We use short callback_data to stay well under the 64-byte limit.
  const keyboard = {
    inline_keyboard: [
      [
        { text: "📊 ساخت جدول", callback_data: "format_table" },
        { text: "📝 ساخت لیست شیک", callback_data: "format_list" }
      ],
      [
        { text: "✨ فرمت خودکار هوشمند", callback_data: "format_smart" }
      ]
    ]
  };

  await ctx.reply("Select the format you want to apply to your text:", {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: keyboard
  });
});

// Callback query handler for the inline keyboard buttons
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  
  // We extract the original text from the message that the bot replied to.
  // This solves the 64-byte callback_data limit beautifully, as we don't need
  // to pass the text in the callback data or store it in a database!
  const originalMessage = ctx.callbackQuery.message?.reply_to_message;
  
  const text = originalMessage && ("text" in originalMessage ? originalMessage.text : "caption" in originalMessage ? originalMessage.caption : undefined);

  if (!text) {
    await ctx.answerCallbackQuery({
      text: "❌ Error: Could not find the original text.",
      show_alert: true
    });
    return;
  }
  
  let formatType: "table" | "list" | "smart";
  if (data === "format_table") formatType = "table";
  else if (data === "format_list") formatType = "list";
  else if (data === "format_smart") formatType = "smart";
  else {
    await ctx.answerCallbackQuery("Unknown format type.");
    return;
  }
  
  // Acknowledge the callback immediately to remove loading state on the button
  await ctx.answerCallbackQuery({ text: "⏳ در حال پردازش..." });
  
  // Send a temporary processing message using the requested new 'sendRichMessageDraft'
  let loadingMsgId: number | undefined;
  try {
    const draftRes = await (ctx.api as any).sendRichMessageDraft({
      chat_id: ctx.chat?.id,
      text: "<tg-thinking>در حال پردازش...</tg-thinking>",
      reply_to_message_id: originalMessage.message_id,
      parse_mode: "HTML"
    });
    loadingMsgId = draftRes.message_id;
  } catch (err) {
    // Fallback if the theoretical API throws an error
    const msg = await ctx.reply("<tg-thinking>در حال پردازش...</tg-thinking> ⏳", { 
      parse_mode: "HTML",
      reply_to_message_id: originalMessage.message_id 
    });
    loadingMsgId = msg.message_id;
  }
  
  try {
    const formattedText = await formatText(text, formatType);
    
    // Replace the final message using the requested 'sendRichMessage'
    try {
      await (ctx.api as any).sendRichMessage({
        chat_id: ctx.chat?.id,
        text: formattedText,
        reply_to_message_id: originalMessage.message_id,
        parse_mode: "HTML"
      });
      // Delete the thinking draft if a new rich message was sent
      if (loadingMsgId) {
        await ctx.api.deleteMessage(ctx.chat?.id as number, loadingMsgId).catch(() => {});
      }
    } catch (err) {
      // Fallback using standard editMessageText
      if (loadingMsgId) {
        await ctx.api.editMessageText(
          ctx.chat?.id as number,
          loadingMsgId,
          formattedText,
          { parse_mode: "HTML" }
        );
      }
    }
  } catch (error) {
    console.error("Format Error:", error);
    if (loadingMsgId) {
      await ctx.api.editMessageText(
        ctx.chat?.id as number,
        loadingMsgId,
        "❌ <b>Error:</b> Failed to format the text.",
        { parse_mode: "HTML" }
      ).catch(() => {});
    }
  }
});

// Error handling wrapper
bot.catch((err) => {
  console.error(`Error in bot:`, err);
});
