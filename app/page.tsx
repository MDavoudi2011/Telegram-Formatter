import { Metadata } from 'next';
import { Layers, Bot, KeySquare, CheckCircle2, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'راه‌اندازی ربات تلگرام',
  description: 'تنظیمات و راه‌اندازی ربات فرمت‌کننده تلگرام',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 p-6 sm:p-12 font-sans selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Hero Section */}
        <header className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2 border border-indigo-500/20">
            <Bot className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-white">
            ربات فرمت‌کننده تلگرام
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl leading-relaxed">
            ربات هوشمند و سرورلس شما آماده است. مراحل زیر را برای تنظیم محیط و راه‌اندازی وب‌هوک دنبال کنید.
          </p>
        </header>

        {/* Configuration Steps */}
        <section className="space-y-6">
          <h2 className="text-2xl font-medium flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            مراحل راه‌اندازی
          </h2>
          
          <div className="grid gap-6">
            {/* Step 1 */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-sans">۱</div>
                تنظیم متغیرهای محیطی
              </div>
              <p className="text-neutral-400 text-sm">
                مطمئن شوید که توکن‌های زیر را در تنظیمات Vercel یا پنل هاست خود وارد کرده‌اید:
              </p>
              <ul className="space-y-3 font-mono text-sm" dir="ltr">
                <li className="flex items-center gap-3 justify-end">
                  <span className="text-neutral-500">از طریق BotFather در تلگرام -</span>
                  <span className="text-emerald-400">TELEGRAM_BOT_TOKEN</span>
                  <KeySquare className="w-4 h-4 text-neutral-500" />
                </li>
                <li className="flex items-center gap-3 justify-end">
                  <span className="text-neutral-500">از طریق Google AI Studio -</span>
                  <span className="text-emerald-400">GEMINI_API_KEY</span>
                  <KeySquare className="w-4 h-4 text-neutral-500" />
                </li>
              </ul>
              
              <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <h3 className="text-indigo-300 font-medium flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" />
                  راهنمای دریافت API رایگان هوش مصنوعی (بدون نیاز به کارت بانکی)
                </h3>
                <p className="text-sm text-indigo-200/80 leading-relaxed">
                  برای دریافت کلید API گوگل جِمینای به صورت <strong>کاملاً رایگان</strong>، وارد سایت <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline underline-offset-4">aistudio.google.com</a> شوید. با اکانت گوگل خود لاگین کنید و در پنل سمت چپ روی دکمه <strong>Get API Key</strong> کلیک کنید. این سرویس در پلن رایگان نیازی به وارد کردن اطلاعات ویزا کارت یا حساب بانکی ندارد و به راحتی کار می‌کند!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-sans">۲</div>
                اتصال وب‌هوک تلگرام
              </div>
              <p className="text-neutral-400 text-sm">
                شما باید به تلگرام بگویید که پیام‌ها را به کدام آدرس ارسال کند. لینک زیر را با اطلاعات خود پر کرده و در مرورگر باز کنید:
              </p>
              <div className="p-4 bg-black rounded-xl overflow-x-auto border border-neutral-800" dir="ltr">
                <code className="text-sm text-indigo-300 whitespace-nowrap">
                  https://api.telegram.org/bot[YOUR_BOT_TOKEN]/setWebhook?url=[YOUR_VERCEL_DOMAIN]/api/webhook
                </code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-sans">۳</div>
                تست ربات
              </div>
              <p className="text-neutral-400 text-sm">
                وارد تلگرام شوید، ربات خود را استارت کنید و یک متن نامرتب برای آن بفرستید!
              </p>
              <ul className="space-y-2 text-sm text-neutral-400 list-disc list-inside ml-2 marker:text-neutral-600">
                <li>یک متن نامنظم بفرستید.</li>
                <li>یکی از گزینه‌های فرمت‌بندی را از منوی شیشه‌ای انتخاب کنید.</li>
                <li>منتظر بمانید تا هوش مصنوعی متن شما را به صورت جادویی مرتب کند!</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Status */}
        <footer className="pt-8 border-t border-neutral-800 flex items-center gap-3 text-sm text-neutral-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          معماری سیستم با موفقیت ایجاد شده و آماده استقرار (Deployment) است.
        </footer>
      </div>
    </main>
  );
}
