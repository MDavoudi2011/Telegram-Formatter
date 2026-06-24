import { Metadata } from 'next';
import { Layers, Bot, KeySquare, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Telegram Format Bot Setup',
  description: 'Setup and manage your Telegram Format Bot.',
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
            Telegram Format Bot
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl leading-relaxed">
            Your serverless AI-powered Telegram bot is ready. Follow the steps below to configure your environment and set up the webhook.
          </p>
        </header>

        {/* Configuration Steps */}
        <section className="space-y-6">
          <h2 className="text-2xl font-medium flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Configuration Steps
          </h2>
          
          <div className="grid gap-6">
            {/* Step 1 */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm">1</div>
                Environment Variables
              </div>
              <p className="text-neutral-400 text-sm">
                Ensure you have set the following secrets in your environment or Vercel dashboard:
              </p>
              <ul className="space-y-3 font-mono text-sm">
                <li className="flex items-center gap-3">
                  <KeySquare className="w-4 h-4 text-neutral-500" />
                  <span className="text-emerald-400">TELEGRAM_BOT_TOKEN</span>
                  <span className="text-neutral-500">- From BotFather</span>
                </li>
                <li className="flex items-center gap-3">
                  <KeySquare className="w-4 h-4 text-neutral-500" />
                  <span className="text-emerald-400">GEMINI_API_KEY</span>
                  <span className="text-neutral-500">- From Google AI Studio</span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm">2</div>
                Set Webhook
              </div>
              <p className="text-neutral-400 text-sm">
                You must tell Telegram where to send messages. Run this command in your terminal or browser, replacing the brackets with your actual data:
              </p>
              <div className="p-4 bg-black rounded-xl overflow-x-auto border border-neutral-800">
                <code className="text-sm text-indigo-300 whitespace-nowrap">
                  https://api.telegram.org/bot[YOUR_BOT_TOKEN]/setWebhook?url=[YOUR_VERCEL_DOMAIN]/api/webhook
                </code>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-lg font-medium">
                <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-sm">3</div>
                Test Your Bot
              </div>
              <p className="text-neutral-400 text-sm">
                Open Telegram, start a chat with your bot, and send some unstructured text!
              </p>
              <ul className="space-y-2 text-sm text-neutral-400 list-disc list-inside ml-2">
                <li>Send messy notes.</li>
                <li>Click a formatting option from the inline keyboard.</li>
                <li>Watch the bot magically format your text using Gemini!</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Status */}
        <footer className="pt-8 border-t border-neutral-800 flex items-center gap-3 text-sm text-neutral-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          System architecture initialized and ready for production deployment.
        </footer>
      </div>
    </main>
  );
}
