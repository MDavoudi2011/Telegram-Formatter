import { Composer, InlineKeyboard } from "grammy";
import { BotContext, initialSession, sanitizeHtml } from "../types";

export const listComposer = new Composer<BotContext>();

listComposer.callbackQuery("create_list", async (ctx) => {
  ctx.session = initialSession();
  ctx.session.step = 'list_type';
  
  const keyboard = new InlineKeyboard()
    .text("نقطه‌ای (•)", "list_type_unordered")
    .text("شماره‌دار (1,2,3)", "list_type_ordered").row()
    .text("چک‌لیست (☑️)", "list_type_checkbox").row()
    .text("لغو", "cancel");

  await ctx.answerCallbackQuery();
  await ctx.editMessageText("لطفاً نوع لیست را انتخاب کنید:", { reply_markup: keyboard });
});

// دریافت نوع لیست انتخاب شده
listComposer.callbackQuery(/list_type_(.+)/, async (ctx) => {
  const type = ctx.match[1] as 'unordered' | 'ordered' | 'checkbox';
  ctx.session.listType = type;
  ctx.session.step = 'list_items';
  
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`نوع لیست انتخاب شد. حالا موارد لیست را ارسال کنید.\n(هر مورد را در یک خط جداگانه بنویسید یا بین آن‌ها Enter بزنید)`);
});

listComposer.callbackQuery("finish_list", async (ctx) => {
  await ctx.answerCallbackQuery();
  const items = ctx.session.listItems;
  const type = ctx.session.listType || 'unordered';
  
  if (!items || items.length === 0) {
    await ctx.reply("❌ لیست شما خالی است.");
    ctx.session = initialSession();
    return;
  }

  // ساختاردهی HTML بر اساس نوع انتخاب شده
  let html = type === 'ordered' ? "<ol>\n" : "<ul>\n";
  
  for (const item of items) {
    if (type === 'checkbox') {
      html += `<li><input type="checkbox">${sanitizeHtml(item)}</li>\n`;
    } else {
      html += `<li>${sanitizeHtml(item)}</li>\n`;
    }
  }
  
  html += type === 'ordered' ? "</ol>" : "</ul>";

  try {
    await (ctx.api.raw as any).sendRichMessage({
      chat_id: ctx.chat?.id,
      rich_message: { html: html }
    });
    await ctx.reply("✅ لیست شما با موفقیت ارسال شد!\nبرای شروع مجدد /start را بزنید.");
  } catch (err: any) {
    await ctx.reply(`❌ خطا در ارسال پیام:\n${err.message || err}`);
  }
  ctx.session = initialSession();
});

export async function handleListMessage(ctx: BotContext, lines: string[]) {
  ctx.session.listItems.push(...lines);
  
  const keyboard = new InlineKeyboard()
    .text("✅ دریافت خروجی لیست", "finish_list").row()
    .text("لغو", "cancel");

  await ctx.reply(`تا الان ${ctx.session.listItems.length} مورد ثبت شد.\nمی‌توانید موارد بیشتری بفرستید یا اگر تمام شد دکمه زیر را بزنید:`, {
    reply_markup: keyboard
  });
}