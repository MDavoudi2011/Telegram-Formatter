import { Composer } from "grammy";
import { BotContext, initialSession, sanitizeHtml } from "../types";

export const listComposer = new Composer<BotContext>();

listComposer.callbackQuery("create_list", async (ctx) => {
  ctx.session = initialSession();
  ctx.session.step = 'list_items';
  await ctx.answerCallbackQuery();
  await ctx.reply("لطفاً موارد لیست را ارسال کنید.\n(هر مورد را در یک خط جداگانه بنویسید یا بین آن‌ها Enter بزنید)");
});

listComposer.callbackQuery("finish_list", async (ctx) => {
  await ctx.answerCallbackQuery();
  const items = ctx.session.listItems;
  
  // جلوگیری از ارور 400 (متن خالی)
  if (!items || items.length === 0) {
    await ctx.reply("❌ لیست شما خالی است. هیچ دیتایی برای ساخت ارسال نشده است.");
    ctx.session = initialSession();
    return;
  }

  let html = "<ul>\n";
  for (const item of items) {
    html += `<li>${sanitizeHtml(item)}</li>\n`;
  }
  html += "</ul>";

  try {
    // استفاده از متد raw برای فراخوانی API جدید
    await (ctx.api.raw as any).sendRichMessage({
      chat_id: ctx.chat?.id,
      rich_message: { html: html }
    });
    await ctx.reply("✅ لیست شما با موفقیت ارسال شد!\nبرای شروع مجدد /start را بزنید.");
  } catch (err: any) {
    console.error("Error sending list rich message:", err);
    await ctx.reply(`❌ خطا در ارسال پیام:\n${err.message || err}`);
  }
  ctx.session = initialSession();
});

export async function handleListMessage(ctx: BotContext, lines: string[]) {
  ctx.session.listItems.push(...lines);
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ دریافت خروجی لیست", callback_data: "finish_list" },
        { text: "لغو", callback_data: "cancel" }
      ]
    ]
  };

  await ctx.reply(`تا الان ${ctx.session.listItems.length} مورد ثبت شد.\nمی‌توانید موارد بیشتری بفرستید یا اگر تمام شد دکمه زیر را بزنید:`, {
    reply_markup: keyboard
  });
}