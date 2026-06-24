import { GoogleGenAI } from "@google/genai";
import { sanitizeTelegramHTML } from "../bot/utils";

// Initialize Gemini client using server-side environment variable.
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("CRITICAL: GEMINI_API_KEY is missing or empty in environment variables!");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "DUMMY_KEY" });

const SYSTEM_INSTRUCTIONS = {
  table: `شما یک دستیار هوشمند برای فرمت کردن داده‌ها در تلگرام هستید.
وظیفه شما این است که داده‌های نامنظم را دریافت کرده و آن‌ها را در قالب یک جدول مرتب (table) با استفاده از API جدید Rich Message تلگرام بازگردانید.

قوانین مهم:
۱. حتماً از تگ‌های <table>, <tr>, <th>, و <td> استفاده کنید.
۲. می‌توانید از ویژگی‌هایی مانند <table bordered striped> استفاده کنید.
۳. به هیچ وجه خروجی را داخل بلوک کد مارک‌داون (مثل \`\`\`html) قرار ندهید. مستقیماً تگ‌های HTML را چاپ کنید.
۴. بهترین ستون‌ها را بر اساس متن نامنظم کاربر تشخیص دهید.
۵. خروجی فقط و فقط تگ‌های HTML باشد و هیچ متن اضافه‌ای قبل یا بعد از آن نباشد.`,

  list: `شما یک دستیار هوشمند برای فرمت کردن داده‌ها در تلگرام هستید.
وظیفه شما تبدیل متن‌های نامنظم به یک لیست مرتب با استفاده از API جدید Rich Message تلگرام است.

قوانین مهم:
۱. حتماً از تگ‌های ساختاری لیست مثل <ul>, <ol> و <li> استفاده کنید.
۲. به هیچ وجه خروجی را داخل بلوک کد مارک‌داون (مثل \`\`\`html) قرار ندهید.
۳. از ایموجی دستی برای بولت‌ها استفاده نکنید؛ اجازه دهید تگ <li> به صورت بومی رندر شود.
۴. کلمات مهم را با استفاده از تگ‌های <b> و <i> برجسته کنید.
۵. خروجی فقط و فقط تگ‌های HTML باشد و هیچ متن اضافه‌ای قبل یا بعد از آن نباشد.`,

  smart: `شما یک دستیار هوشمند برای فرمت کردن داده‌ها در تلگرام هستید.
وظیفه شما این است که بهترین و زیباترین قالب را برای متن نامنظم کاربر انتخاب کنید تا خوانایی آن در تلگرام به حداکثر برسد.

قوانین مهم:
۱. از تمام تگ‌های جدید Rich Message تلگرام می‌توانید استفاده کنید: <h1> تا <h6>, <p>, <hr/>, <blockquote>, <table>, <ul>, <ol>, <li>, <b>, <i>, <u>, <s>, <code>, <pre>, <a>.
۲. اگر داده‌ها جدولی هستند از <table> استفاده کنید.
۳. اگر داده‌ها لیستی هستند از <ul> یا <ol> با <li> استفاده کنید.
۴. برای عناوین از <h1> یا <h2>، برای پاراگراف‌ها از <p> و برای خط جداکننده از <hr/> استفاده کنید.
۵. خروجی را داخل بلوک کد مارک‌داون (مثل \`\`\`html) قرار ندهید. مستقیماً HTML خام بدهید.
۶. خروجی نهایی فقط و فقط تگ‌های فرمت شده باشد و هیچ متن اضافه‌ای نداشته باشد.`
};

export async function formatText(text: string, style: "table" | "list" | "smart"): Promise<string> {
  const systemInstruction = SYSTEM_INSTRUCTIONS[style];
  
  try {
    console.log(`[Gemini] Sending request with text length: ${text.length}`);
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      }
    });
    
    let output = response.text || "";
    console.log(`[Gemini] Raw output length: ${output.length}`);
    
    if (output.startsWith("\`\`\`html")) {
      output = output.replace(/^\`\`\`html\n?/, "").replace(/\n?\`\`\`$/, "");
    } else if (output.startsWith("\`\`\`")) {
      output = output.replace(/^\`\`\`[a-z]*\n?/, "").replace(/\n?\`\`\`$/, "");
    }
    
    const finalHtml = sanitizeTelegramHTML(output.trim());
    console.log(`[Gemini] Final sanitized HTML length: ${finalHtml.length}`);
    return finalHtml;
  } catch (error) {
    console.error("[Gemini] API Request Failed:");
    if (error instanceof Error) {
      console.error(error.message, error.stack);
    } else {
      console.error(JSON.stringify(error, null, 2));
    }
    throw new Error("Failed to format text with Gemini.");
  }
}
