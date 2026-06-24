import { Bot, Context, webhookCallback } from "grammy";
import { formatText } from "../gemini";

// Initialize the bot. We must handle missing tokens gracefully for the build process.
const token = process.env.TELEGRAM_BOT_TOKEN || "12345:DUMMY_TOKEN_FOR_BUILD_PROCESS";
export const bot = new Bot(token);

// Middleware to log incoming updates (optional, for debugging)
bot.use(async (ctx, next) => {
  console.log(`Received update`, { update: ctx.update });
  await next();
});

// Command handler for /start
bot.command("start", async (ctx) => {
  console.log("کاربر دستور /start را ارسال کرد", { chat_id: ctx.chat?.id });
  await ctx.reply(
    "👋 <b>به ربات فرمت‌کننده هوشمند خوش آمدید!</b>\n\n" +
    "متن‌های نامرتب، یادداشت‌ها یا داده‌های خام خود را بفرستید تا آن‌ها را به یک جدول یا لیست مرتب برای تلگرام تبدیل کنم.\n\n" +
    "برای شروع، فقط کافیست یک متن ارسال کنید!",
    { parse_mode: "HTML" }
  );
});

// Message handler for text messages
bot.on("message", async (ctx) => {
  const text = ctx.message.text || ctx.message.caption;
  
  if (!text) {
    console.warn("پیام بدون متن یا کپشن دریافت شد", { message: ctx.message });
    await ctx.reply("لطفاً یک متن یا تصویری که دارای توضیحات (کپشن) است ارسال کنید.");
    return;
  }
  
  console.log("دریافت متن برای فرمت‌بندی", { text_length: text.length });
  
  // Create an inline keyboard with the 3 formatting options.
  // We use short callback_data to stay well under the 64-byte limit.
  const keyboard = {
    inline_keyboard: [
      [
        { text: "ساخت جدول", callback_data: "format_table" },
        { text: "ساخت لیست", callback_data: "format_list" }
      ],
      [
        { text: "فرمت خودکار", callback_data: "format_smart" }
      ]
    ]
  };

  await ctx.reply("لطفاً قالب مورد نظر خود را انتخاب کنید:", {
    reply_to_message_id: ctx.message.message_id,
    reply_markup: keyboard
  });
});

// Callback query handler for the inline keyboard buttons
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  console.log(`دکمه شیشه‌ای انتخاب شد: ${data}`, { callbackQuery: ctx.callbackQuery });
  
  // We extract the original text from the message that the bot replied to.
  // This solves the 64-byte callback_data limit beautifully, as we don't need
  // to pass the text in the callback data or store it in a database!
  const originalMessage = ctx.callbackQuery.message?.reply_to_message;
  
  const text = originalMessage && ("text" in originalMessage ? originalMessage.text : "caption" in originalMessage ? originalMessage.caption : undefined);

  if (!text) {
    console.error("متن اصلی پیام برای دکمه پیدا نشد", { originalMessage });
    await ctx.answerCallbackQuery({
      text: "❌ خطا: متن اصلی پیام پیدا نشد.",
      show_alert: true
    });
    return;
  }
  
  let formatType: "table" | "list" | "smart";
  if (data === "format_table") formatType = "table";
  else if (data === "format_list") formatType = "list";
  else if (data === "format_smart") formatType = "smart";
  else {
    console.warn("دیتای ناشناخته دکمه", { data });
    await ctx.answerCallbackQuery("نوع فرمت ناشناخته است.");
    return;
  }
  
  // Acknowledge the callback immediately to remove loading state on the button
  await ctx.answerCallbackQuery({ text: "⏳ در حال بررسی..." });
  
  // Send native "typing" action to make it feel responsive
  await ctx.replyWithChatAction("typing").catch(() => {});
  
  let useFallback = false;
  let fallbackMsgId: number | undefined;

  try {
    console.log("Attempting sendRichMessageDraft API call...");
    const draftRes = await (ctx.api as any).sendRichMessageDraft({
      chat_id: ctx.chat?.id,
      draft_id: Date.now(),
      rich_message: { html: "<tg-thinking>در حال پردازش...</tg-thinking>" }
    });
    console.log("sendRichMessageDraft succeeded");
  } catch (err: any) {
    console.error("sendRichMessageDraft failed, using fallback ctx.reply", err.message);
    useFallback = true;
    
    // Fallback if the theoretical API throws an error
    const msg = await ctx.reply("⏳ <i>در حال پردازش و ارتباط با هوش مصنوعی...</i>", { 
      parse_mode: "HTML",
      reply_parameters: { message_id: originalMessage.message_id } 
    });
    fallbackMsgId = msg.message_id;
  }
  
  try {
    console.log(`ارسال درخواست به Gemini (قالب: ${formatType})...`);
    const formattedText = await formatText(text, formatType);
    console.log(`پردازش موفق Gemini`, { result_length: formattedText.length });
    
    if (!useFallback) {
      try {
        console.log("Attempting sendRichMessage API call...");
        await (ctx.api as any).sendRichMessage({
          chat_id: ctx.chat?.id,
          rich_message: { html: formattedText },
          reply_parameters: { message_id: originalMessage.message_id }
        });
        console.log("sendRichMessage succeeded");
      } catch (err: any) {
        console.error("sendRichMessage failed, using fallback reply", err.message);
        // Fallback using standard reply
        await ctx.reply(formattedText, { 
          parse_mode: "HTML",
          reply_parameters: { message_id: originalMessage.message_id }
        }).catch((replyErr) => {
          console.error("Fallback reply failed too:", replyErr.message);
          ctx.reply("متن قالب‌بندی شده دارای تگ‌های نامعتبر برای این نسخه از تلگرام بود:\n\n" + formattedText.replace(/</g, '&lt;').replace(/>/g, '&gt;'), {
            parse_mode: "HTML",
            reply_parameters: { message_id: originalMessage.message_id }
          }).catch(() => {});
        });
      }
    } else {
      // Fallback using standard editMessageText
      if (fallbackMsgId) {
        await ctx.api.editMessageText(
          ctx.chat?.id as number,
          fallbackMsgId,
          formattedText,
          { parse_mode: "HTML" }
        ).catch((editErr) => {
          console.error("Fallback editMessageText failed too:", editErr.message);
          ctx.api.editMessageText(
            ctx.chat?.id as number,
            fallbackMsgId as number,
            "متن قالب‌بندی شده دارای تگ‌های نامعتبر برای این نسخه از تلگرام بود:\n\n" + formattedText.replace(/</g, '&lt;').replace(/>/g, '&gt;'),
            { parse_mode: "HTML" }
          ).catch(() => {});
        });
      }
    }
  } catch (error: any) {
    console.error("خطا در هنگام ارتباط با Gemini", error.message || error);
    const errorMsg = "❌ <b>خطا:</b> متأسفانه در ارتباط با هوش مصنوعی مشکلی رخ داد. لطفاً دوباره تلاش کنید.";
    
    if (useFallback && fallbackMsgId) {
      await ctx.api.editMessageText(
        ctx.chat?.id as number,
        fallbackMsgId,
        errorMsg,
        { parse_mode: "HTML" }
      ).catch(() => {});
    } else {
      await ctx.reply(errorMsg, { parse_mode: "HTML", reply_parameters: { message_id: originalMessage.message_id } }).catch(() => {});
    }
  }
});

// Error handling wrapper
bot.catch((err) => {
  console.error(`خطای ناشناخته و کلی در ربات`, err);
});
