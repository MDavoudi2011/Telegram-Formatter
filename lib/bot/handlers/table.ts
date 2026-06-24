import { Composer, InlineKeyboard } from "grammy";
import { BotContext, initialSession, sanitizeHtml, containsRTL } from "../types";

export const tableComposer = new Composer<BotContext>();

tableComposer.callbackQuery("create_table", async (ctx) => {
  ctx.session = initialSession();
  ctx.session.step = 'table_headers';
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("لطفاً عنوان‌های جدول (سرستون‌ها) را ارسال کنید.\n(هر عنوان را در یک خط جداگانه بنویسید)");
});

tableComposer.callbackQuery("finish_table", async (ctx) => {
  await ctx.answerCallbackQuery();
  const headers = ctx.session.tableHeaders;
  const rows = ctx.session.tableRows;

  if (!headers || headers.length === 0 || !rows || rows.length === 0) {
    await ctx.reply("❌ داده‌های جدول ناقص است. حداقل یک سرستون و یک سطر اطلاعات نیاز است.");
    ctx.session = initialSession();
    return;
  }

  ctx.session.step = 'table_style';
  
  const keyboard = new InlineKeyboard()
    .text("جدول ساده", "table_style_plain")
    .text("حاشیه‌دار و راه‌راه", "table_style_bordered").row()
    .text("لغو", "cancel");

  await ctx.editMessageText("لطفاً ظاهر جدول خود را انتخاب کنید:", { reply_markup: keyboard });
});

tableComposer.callbackQuery(/table_style_(.+)/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const style = ctx.match[1];
  const headers = ctx.session.tableHeaders;
  const rows = ctx.session.tableRows;

  let html = style === 'bordered' ? "<table bordered striped>\n" : "<table>\n";
  
  html += "<tr>\n";
  for (const h of headers) {
    html += `<th>${sanitizeHtml(h)}</th>\n`;
  }
  html += "</tr>\n";

  for (const row of rows) {
    html += "<tr>\n";
    for (let i = 0; i < headers.length; i++) {
      html += `<td>${sanitizeHtml(row[i] || "-")}</td>\n`;
    }
    html += "</tr>\n";
  }
  html += "</table>";

  try {
    await (ctx.api.raw as any).sendRichMessage({
      chat_id: ctx.chat?.id,
      rich_message: { 
        html: html,
        is_rtl: containsRTL(html) // تشخیص خودکار راست‌چین بودن
      }
    });
    await ctx.reply("✅ جدول شما با موفقیت ارسال شد!\nبرای شروع مجدد /start را بزنید.");
  } catch (err: any) {
    await ctx.reply(`❌ خطا در ارسال پیام:\n${err.message || err}`);
  }
  ctx.session = initialSession();
});

export async function handleTableMessage(ctx: BotContext, lines: string[]) {
  const step = ctx.session.step;

  if (step === 'table_headers') {
    ctx.session.tableHeaders = lines;
    ctx.session.step = 'table_rows';
    ctx.session.currentRow = 1;

    const keyboard = new InlineKeyboard().text("لغو", "cancel");

    await ctx.reply(
      `سرستون‌ها ثبت شدند (${lines.length} ستون).\n\nحالا لطفاً اطلاعات سطر ${ctx.session.currentRow} را وارد کنید. (مقادیر را پشت سر هم و هرکدام در یک خط بنویسید)`,
      { reply_markup: keyboard }
    );
  } else if (step === 'table_rows') {
    ctx.session.tableRows.push(lines);
    ctx.session.currentRow++;

    const keyboard = new InlineKeyboard()
      .text("✅ مرحله بعد (انتخاب ظاهر)", "finish_table").row()
      .text("لغو", "cancel");

    await ctx.reply(
      `سطر قبلی ثبت شد. جدول شما الان ${ctx.session.tableRows.length} سطر دارد.\nدر صورت نیاز سطر ${ctx.session.currentRow} را وارد کنید یا مرحله بعد را بزنید:`,
      { reply_markup: keyboard }
    );
  }
}