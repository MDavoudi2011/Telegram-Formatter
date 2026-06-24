import { Bot, Context, session, SessionFlavor, StorageAdapter } from "grammy";

export interface SessionData {
  step: 'idle' | 'awaiting_list_items' | 'awaiting_table_headers' | 'awaiting_table_row';
  tableHeaders: string[];
  tableRows: string[][];
  currentRow: number;
}

function initial(): SessionData {
  return {
    step: 'idle',
    tableHeaders: [],
    tableRows: [],
    currentRow: 1,
  };
}

declare global {
  var __botSessions: Map<string, string> | undefined;
}
if (!globalThis.__botSessions) {
  globalThis.__botSessions = new Map<string, string>();
}

class MapStorageAdapter implements StorageAdapter<SessionData> {
  private map = globalThis.__botSessions!;
  
  read(key: string): SessionData | undefined {
    const val = this.map.get(key);
    return val ? JSON.parse(val) : undefined;
  }
  
  write(key: string, data: SessionData): void {
    this.map.set(key, JSON.stringify(data));
  }
  
  delete(key: string): void {
    this.map.delete(key);
  }
}

type MyContext = Context & SessionFlavor<SessionData>;

const token = process.env.TELEGRAM_BOT_TOKEN || "DUMMY_TOKEN";
export const bot = new Bot<MyContext>(token);

bot.use(session({ initial, storage: new MapStorageAdapter() }));

// Middleware to log incoming updates
bot.use(async (ctx, next) => {
  console.log(`Received update`, { update: ctx.update });
  await next();
});

// Command handler for /start
bot.command("start", async (ctx) => {
  console.log("کاربر دستور /start را ارسال کرد", { chat_id: ctx.chat?.id });
  ctx.session = initial();
  
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

// Callback query handler
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  console.log(`دکمه شیشه‌ای انتخاب شد: ${data}`, { callbackQuery: ctx.callbackQuery });
  const chatId = ctx.chat?.id;

  if (data === "create_list") {
    ctx.session.step = 'awaiting_list_items';
    await ctx.answerCallbackQuery();
    await ctx.reply("لطفاً موارد لیست را ارسال کنید.\n(هر مورد را در یک خط و با فشردن دکمه Enter در کیبورد خود جدا کنید)");
  } 
  else if (data === "create_table") {
    ctx.session.step = 'awaiting_table_headers';
    await ctx.answerCallbackQuery();
    await ctx.reply("لطفاً عنوان‌های جدول (سرستون‌ها) را ارسال کنید.\n(هر عنوان را در یک خط بنویسید)");
  }
  else if (data === "finish_table") {
    await ctx.answerCallbackQuery();
    const headers = ctx.session.tableHeaders;
    const rows = ctx.session.tableRows;

    if (headers.length === 0) {
      await ctx.reply("جدول خالی است و ایجاد نشد.");
      ctx.session = initial();
      return;
    }

    let html = "<table bordered striped>\n";
    // Headers
    html += "<tr>";
    for (const h of headers) {
      html += `<th>${sanitize(h)}</th>`;
    }
    html += "</tr>\n";

    // Rows
    for (const r of rows) {
      html += "<tr>";
      for (let i = 0; i < headers.length; i++) {
        html += `<td>${sanitize(r[i] || "-")}</td>`;
      }
      html += "</tr>\n";
    }
    html += "</table>";

    try {
      await (ctx.api as any).sendRichMessage({
        chat_id: chatId,
        rich_message: { html: html }
      });
      await ctx.reply("✅ جدول شما با موفقیت ایجاد شد!\nبرای ساخت مجدد می‌توانید از دستور /start استفاده کنید.");
    } catch (err: any) {
      console.error("sendRichMessage Error:", err.message);
      await ctx.reply(`❌ متأسفانه ارسال جدول با خطا مواجه شد:\n${err.message}`);
    }
    
    ctx.session = initial();
  }
  else if (data === "cancel") {
    await ctx.answerCallbackQuery();
    ctx.session = initial();
    await ctx.reply("عملیات لغو شد. برای شروع مجدد از دستور /start استفاده کنید.");
  }
  else {
    await ctx.answerCallbackQuery("عملیات ناشناخته.");
  }
});

// Text message handler
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const step = ctx.session.step;

  if (step === 'idle') {
    await ctx.reply("لطفاً ابتدا از منوی شروع یک گزینه را انتخاب کنید.\n/start");
    return;
  }

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    await ctx.reply("لطفاً متن معتبری وارد کنید.");
    return;
  }

  if (step === 'awaiting_list_items') {
    let html = "<ul>\n";
    for (const line of lines) {
      html += `<li>${sanitize(line)}</li>\n`;
    }
    html += "</ul>";

    try {
      await (ctx.api as any).sendRichMessage({
        chat_id: ctx.chat?.id,
        rich_message: { html: html },
        reply_parameters: { message_id: ctx.message.message_id }
      });
      await ctx.reply("✅ لیست شما با موفقیت ایجاد شد!\nبرای ساخت مجدد می‌توانید از دستور /start استفاده کنید.");
    } catch (err: any) {
      console.error("sendRichMessage Error:", err.message);
      await ctx.reply(`❌ متأسفانه ارسال لیست با خطا مواجه شد:\n${err.message}`);
    }

    ctx.session = initial();
  }
  else if (step === 'awaiting_table_headers') {
    ctx.session.tableHeaders = lines;
    ctx.session.tableRows = [];
    ctx.session.currentRow = 1;
    ctx.session.step = 'awaiting_table_row';

    const keyboard = {
      inline_keyboard: [
        [
          { text: "دریافت خروجی", callback_data: "finish_table" },
          { text: "لغو", callback_data: "cancel" }
        ]
      ]
    };

    await ctx.reply(
      `سرستون‌ها ثبت شدند (${lines.length} ستون).\nلطفاً اطلاعات سطر ${ctx.session.currentRow} را به ترتیب وارد کنید.\n(هر مورد در یک خط)`,
      { reply_markup: keyboard }
    );
  }
  else if (step === 'awaiting_table_row') {
    ctx.session.tableRows.push(lines);
    ctx.session.currentRow++;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "دریافت خروجی", callback_data: "finish_table" },
          { text: "لغو", callback_data: "cancel" }
        ]
      ]
    };

    await ctx.reply(
      `اطلاعات سطر ${ctx.session.currentRow - 1} ثبت شد.\nلطفاً اطلاعات سطر ${ctx.session.currentRow} را وارد کنید.\n(هر مورد در یک خط)\n\nدر صورتی که داده‌های شما تمام شده است روی "دریافت خروجی" کلیک کنید.`,
      { reply_markup: keyboard }
    );
  }
});

function sanitize(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

bot.catch((err) => {
  console.error(`خطای ناشناخته و کلی در ربات`, err);
});
