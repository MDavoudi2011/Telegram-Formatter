import { Bot, Context, session, SessionFlavor, StorageAdapter } from "grammy";
import fs from 'fs';
import path from 'path';

export interface SessionData {
  step: 'idle' | 'list_items' | 'table_headers' | 'table_rows';
  listItems: string[];
  tableHeaders: string[];
  tableRows: string[][];
  currentRow: number;
}

function initial(): SessionData {
  return {
    step: 'idle',
    listItems: [],
    tableHeaders: [],
    tableRows: [],
    currentRow: 1,
  };
}

class FileStorageAdapter implements StorageAdapter<SessionData> {
  // Use /tmp which is the only writable directory in Vercel Serverless
  private filePath = path.join('/tmp', 'sessions.json');

  private readAll(): Record<string, string> {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      }
    } catch (e) {}
    return {};
  }

  private writeAll(data: Record<string, string>) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to write session data to /tmp", e);
    }
  }

  read(key: string): SessionData | undefined {
    const all = this.readAll();
    return all[key] ? JSON.parse(all[key]) : undefined;
  }

  write(key: string, data: SessionData): void {
    const all = this.readAll();
    all[key] = JSON.stringify(data);
    this.writeAll(all);
  }

  delete(key: string): void {
    const all = this.readAll();
    delete all[key];
    this.writeAll(all);
  }
}

type MyContext = Context & SessionFlavor<SessionData>;

const token = process.env.TELEGRAM_BOT_TOKEN || "DUMMY_TOKEN";
export const bot = new Bot<MyContext>(token);

bot.use(session({ initial, storage: new FileStorageAdapter() }));

bot.command("start", async (ctx) => {
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

bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const chatId = ctx.chat?.id;

  if (data === "create_list") {
    ctx.session = initial();
    ctx.session.step = 'list_items';
    await ctx.answerCallbackQuery();
    await ctx.reply("لطفاً موارد لیست را ارسال کنید.\n(هر مورد را در یک خط جداگانه بنویسید)");
  } 
  else if (data === "create_table") {
    ctx.session = initial();
    ctx.session.step = 'table_headers';
    await ctx.answerCallbackQuery();
    await ctx.reply("لطفاً عنوان‌های جدول (سرستون‌ها) را ارسال کنید.\n(هر عنوان را در یک خط جداگانه بنویسید)");
  }
  else if (data === "finish_list") {
    await ctx.answerCallbackQuery();
    const items = ctx.session.listItems;
    if (items.length === 0) {
      await ctx.reply("لیست شما خالی است.");
      return;
    }

    let markdown = "";
    for (const item of items) {
      markdown += `- ${item}\n`;
    }

    try {
      await (ctx.api as any).sendRichMessage({
        chat_id: chatId,
        rich_message: { markdown: markdown }
      });
      await ctx.reply("✅ لیست شما با موفقیت ارسال شد!\nبرای شروع مجدد /start را بزنید.");
      ctx.session = initial();
    } catch (err: any) {
      console.error(err);
      await ctx.reply(`❌ خطا در ارسال پیام: ${err.message || err}`);
    }
  }
  else if (data === "finish_table") {
    await ctx.answerCallbackQuery();
    const headers = ctx.session.tableHeaders;
    const rows = ctx.session.tableRows;

    if (headers.length === 0) {
      await ctx.reply("جدول شما خالی است.");
      return;
    }

    let markdown = "| " + headers.join(" | ") + " |\n";
    markdown += "|" + headers.map(() => "---").join("|") + "|\n";

    for (const row of rows) {
      const paddedRow = headers.map((_, i) => row[i] || "-");
      markdown += "| " + paddedRow.join(" | ") + " |\n";
    }

    try {
      await (ctx.api as any).sendRichMessage({
        chat_id: chatId,
        rich_message: { markdown: markdown }
      });
      await ctx.reply("✅ جدول شما با موفقیت ارسال شد!\nبرای شروع مجدد /start را بزنید.");
      ctx.session = initial();
    } catch (err: any) {
      console.error(err);
      await ctx.reply(`❌ خطا در ارسال پیام: ${err.message || err}`);
    }
  }
  else if (data === "cancel") {
    await ctx.answerCallbackQuery();
    ctx.session = initial();
    await ctx.reply("عملیات لغو شد. برای شروع مجدد /start را بفرستید.");
  }
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
    ctx.session.listItems.push(...lines);
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: "دریافت خروجی لیست", callback_data: "finish_list" },
          { text: "لغو", callback_data: "cancel" }
        ]
      ]
    };

    await ctx.reply(
      `موارد دریافت شدند (تعداد کل: ${ctx.session.listItems.length} مورد).\nمی‌توانید موارد بیشتری بفرستید تا به این لیست اضافه شود، یا روی دکمه زیر کلیک کنید:`,
      { reply_markup: keyboard }
    );
  }
  else if (step === 'table_headers') {
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
      `سرستون‌ها ثبت شدند (${lines.length} ستون).\n\nحالا لطفاً اطلاعات سطر ${ctx.session.currentRow} را وارد کنید. (هر مورد در یک خط جداگانه)`,
      { reply_markup: keyboard }
    );
  }
  else if (step === 'table_rows') {
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
      `اطلاعات سطر قبلی ثبت شد.\n\nلطفاً اطلاعات سطر ${ctx.session.currentRow} را وارد کنید.\n(در صورتی که داده‌ها تمام شده است روی «دریافت خروجی جدول» کلیک کنید)`,
      { reply_markup: keyboard }
    );
  }
});

bot.catch((err) => {
  console.error("Error in bot:", err);
});
