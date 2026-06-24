import { Composer } from "grammy";
import { BotContext, initialSession, sanitizeHtml } from "../types";

export const tableComposer = new Composer<BotContext>();

tableComposer.callbackQuery("create_table", async (ctx) => {
  ctx.session = initialSession();
  ctx.session.step = 'table_headers';
  await ctx.answerCallbackQuery();
  await ctx.reply("لطفاً عنوان‌های جدول (سرستون‌ها) را ارسال کنید.\\n(هر عنوان را در یک خط جداگانه بنویسید)");
});

tableComposer.callbackQuery("finish_table", async (ctx) => {
  await ctx.answerCallbackQuery();
  const headers = ctx.session.tableHeaders;
  const rows = ctx.session.tableRows;

  if (headers.length === 0) {
    await ctx.reply("جدول شما خالی است.");
    ctx.session = initialSession();
    return;
  }

  let html = "<table bordered striped>\\n<tr>\\n";
  for (const h of headers) {
    html += `<th>${sanitizeHtml(h)}</th>\\n`;
  }
  html += "</tr>\\n";

  for (const row of rows) {
    html += "<tr>\\n";
    for (let i = 0; i < headers.length; i++) {
      html += `<td>${sanitizeHtml(row[i] || "-")}</td>\\n`;
    }
    html += "</tr>\\n";
  }
  html += "</table>";

  try {
    await (ctx.api as any).sendRichMessage({
      chat_id: ctx.chat?.id,
      rich_message: { html: html }
    });
    await ctx.reply("✅ جدول شما با موفقیت ارسال شد!\\nبرای شروع مجدد /start را بزنید.");
  } catch (err: any) {
    console.error("Error sending table rich message:", err);
    await ctx.reply(`❌ خطا در ارسال پیام:\\n${err.message || err}`);
  }
  ctx.session = initialSession();
});

export async function handleTableMessage(ctx: BotContext, lines: string[]) {
  const step = ctx.session.step;

  if (step === 'table_headers') {
    ctx.session.tableHeaders = lines;
    ctx.session.step = 'table_rows';
    ctx.session.currentRow = 1;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "لغو", callback_data: "cancel" }
        ]
      ]
    };

    await ctx.reply(
      `سرستون‌ها ثبت شدند (${lines.length} ستون).\\n\\nحالا لطفاً اطلاعات سطر ${ctx.session.currentRow} را وارد کنید. (هر مورد در یک خط جداگانه)`,
      { reply_markup: keyboard }
    );
  } else if (step === 'table_rows') {
    ctx.session.tableRows.push(lines);
    ctx.session.currentRow++;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "دریافت خروجی جدول", callback_data: "finish_table" },
          { text: "لغو", callback_data: "cancel" }
        ]
      ]
    };

    await ctx.reply(
      `اطلاعات سطر قبلی ثبت شد.\\n\\nلطفاً اطلاعات سطر ${ctx.session.currentRow} را وارد کنید.\\n(در صورتی که داده‌ها تمام شده است روی «دریافت خروجی جدول» کلیک کنید)`,
      { reply_markup: keyboard }
    );
  }
}
