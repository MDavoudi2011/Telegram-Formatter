import { Bot, session } from "grammy";
import { BotContext, initialSession } from "./types";
import { GlobalMapStorageAdapter } from "./session";
import { listComposer, handleListMessage } from "./handlers/list";
import { tableComposer, handleTableMessage } from "./handlers/table";

const token = process.env.TELEGRAM_BOT_TOKEN || "DUMMY_TOKEN";
export const bot = new Bot<BotContext>(token);

// توجه: استفاده از حافظه محلی برای نشست‌ها در Vercel موقتی است.
bot.use(session({ initial: initialSession, storage: new GlobalMapStorageAdapter() }));

bot.use(async (ctx, next) => {
  console.log(`[Update] ID: ${ctx.update.update_id}`);
  await next();
});

bot.use(listComposer);
bot.use(tableComposer);

bot.command("start", async (ctx) => {
  ctx.session = initialSession();
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: "📝 ساخت لیست", callback_data: "create_list" },
        { text: "📊 ساخت جدول", callback_data: "create_table" }
      ]
    ]
  };

  await ctx.reply(
    "👋 <b>خوش آمدید!</b>\n\nلطفاً یک گزینه را برای شروع انتخاب کنید:",
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
  // تبدیل حروف \n متنی به اینتر واقعی برای رفع مشکل رفتن به خط بعد
  const rawText = ctx.message.text.replace(/\\n/g, '\n');
  const step = ctx.session.step;

  // مدیریت خطای خاموش شدن سرور Vercel و پاک شدن رم
  if (step === 'idle') {
    await ctx.reply("⚠️ به نظر می‌رسد زمان نشست شما منقضی شده است (خاموشی موقت سرور). لطفاً مجدداً از منوی شروع یک گزینه را انتخاب کنید.\n/start");
    return;
  }

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l !== "");
  
  if (lines.length === 0) {
      await ctx.reply("متن ارسالی خالی بود. لطفاً دوباره امتحان کنید.");
      return;
  }

  if (step === 'list_items') {
    await handleListMessage(ctx, lines);
  } else if (step === 'table_headers' || step === 'table_rows') {
    await handleTableMessage(ctx, lines);
  }
});