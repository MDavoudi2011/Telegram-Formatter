import { Bot, session } from "grammy";
import { BotContext, initialSession } from "./types";
import { GlobalMapStorageAdapter } from "./session";
import { listComposer, handleListMessage } from "./handlers/list";
import { tableComposer, handleTableMessage } from "./handlers/table";

const token = process.env.TELEGRAM_BOT_TOKEN || "DUMMY_TOKEN";
export const bot = new Bot<BotContext>(token);

bot.use(session({ initial: initialSession, storage: new GlobalMapStorageAdapter() }));

// Log updates
bot.use(async (ctx, next) => {
  console.log(`[Update] ID: ${ctx.update.update_id}`);
  await next();
});

// Use Composers
bot.use(listComposer);
bot.use(tableComposer);

bot.command("start", async (ctx) => {
  ctx.session = initialSession();
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: "ساخت لیست", callback_data: "create_list" },
        { text: "ساخت جدول", callback_data: "create_table" }
      ]
    ]
  };

  await ctx.reply(
    "👋 <b>خوش آمدید!</b>\n\nلطفاً یک گزینه را برای شروع ساخت و فرمت‌بندی انتخاب کنید:",
    {
      parse_mode: "HTML",
      reply_markup: keyboard
    }
  );
});

bot.callbackQuery("cancel", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session = initialSession();
  await ctx.reply("عملیات لغو شد. برای شروع مجدد /start را بفرستید.");
});

bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const step = ctx.session.step;

  if (step === 'idle') {
    await ctx.reply("لطفاً ابتدا از منوی شروع یک گزینه را انتخاب کنید.\n/start");
    return;
  }

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    await ctx.reply("متن معتبری یافت نشد.");
    return;
  }

  if (step === 'list_items') {
    await handleListMessage(ctx, lines);
  } else if (step === 'table_headers' || step === 'table_rows') {
    await handleTableMessage(ctx, lines);
  }
});

bot.catch((err) => {
  console.error("Error in bot:", err);
});
