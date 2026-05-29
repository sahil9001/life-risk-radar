"use client";

import { AskPanel } from "@/components/AskPanel";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#111827] flex flex-col">
      {/* Floating Capsule Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 md:px-0">
        <div className="bg-white/80 backdrop-blur-md border border-[#E4E2D4] rounded-full flex items-center justify-between px-6 py-3 w-full max-w-2xl shadow-[0_10px_40px_rgba(22,32,27,0.03)]">
          <div className="flex items-center gap-2 select-none">
            <span className="text-lg" role="img" aria-label="satellite">🛰️</span>
            <span className="font-sans font-extrabold text-sm uppercase tracking-wider">Life Risk Radar</span>
          </div>
          <div className="hidden md:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-[#45464c]">
            <Link className="text-[#000000] hover:text-black border-b-2 border-black pb-0.5" href="/">Ask Radar</Link>
            <Link className="hover:text-black transition-colors" href="/dashboard">Risks Board</Link>
            <a className="hover:text-black transition-colors" href="#features">Architecture</a>
          </div>
          <Link
            href="/dashboard"
            className="bg-[#000000] text-white hover:opacity-90 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full"
          >
            Risks Board
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-36 pb-16 px-4 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-[#E4E2D4] shadow-sm select-none">
          <span className="text-xs font-semibold text-[#45464c] flex items-center gap-1.5">
            <span>🪸</span> Powered by Coral SQL &amp; Local AI
          </span>
        </div>
        
        <h1 className="font-display text-4xl md:text-6xl text-primary leading-[1.1] max-w-3xl mx-auto font-normal">
          Find the money and access <span className="italic">risks</span> hidden in your life.
        </h1>
        
        <p className="font-sans text-base md:text-lg text-[#45464c] max-w-2xl mx-auto leading-relaxed">
          Audit your digital footprint with local-first intelligence. Ask questions in plain English or navigate to the Risks Board to perform a full database sweep.
        </p>
      </header>

      {/* Main Body Containers */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 space-y-12 pb-20">
        
        {/* Search Ask panel */}
        <AskPanel />

        {/* Live SQL Visualizer mockup segment from Stitch */}
        <section className="border border-[#E4E2D4] bg-white rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#F1F0E8] select-none text-center md:text-left">
            <h3 className="font-display text-2xl text-primary font-normal mb-1">Deep Insight Engine</h3>
            <p className="text-xs text-[#5C6960]">Watch Life Risk Radar link disparate local datasets to locate anomalies.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-[#E4E2D4]">
            {/* SQL query left */}
            <div className="lg:col-span-7 bg-[#111827] p-6 md:p-8 text-xs text-[#89f5e7] font-mono leading-relaxed space-y-4">
              <div className="flex items-center gap-1.5 select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="ml-2 text-white/40">join_query_engine.sql</span>
              </div>
              <div className="space-y-1 text-white/80">
                <p><span className="text-[#6bd8cb]">SELECT</span> transactions.date, vendors.name, email.subject</p>
                <p><span className="text-[#6bd8cb]">FROM</span> local_financial_sync <span className="text-white/40">AS</span> transactions</p>
                <p><span className="text-[#6bd8cb]">JOIN</span> cloud_inbox <span className="text-white/40">AS</span> email <span className="text-[#6bd8cb]">ON</span> transactions.amount = email.price_tag</p>
                <p><span className="text-[#6bd8cb]">WHERE</span> transactions.status = <span className="text-[#86f2e4]">&apos;active_recurring&apos;</span></p>
                <p><span className="text-[#6bd8cb]">AND</span> email.sentiment = <span className="text-[#86f2e4]">&apos;low_usage_alert&apos;</span>;</p>
              </div>
              <div className="pt-4 border-t border-white/10 text-white/40 select-none">
                <p>Joined 428 tables securely on device.</p>
                <p className="text-[#86f2e4] font-bold">&gt; Found: Notion LLC subscription matching low activity thread</p>
              </div>
            </div>
            {/* Explanation card right */}
            <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between space-y-6 bg-[#FAFAF4]">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-secondary tracking-wider uppercase select-none">Evidence identified</span>
                <h4 className="font-display text-2xl text-primary font-normal">Notion Pro Renewal</h4>
                <p className="text-sm text-[#5C6960] leading-relaxed">
                  Gmail scanning found an upcoming charge email. Local ledger shows $96 recurring payment, but activity metrics show zero logins for the past 4 months.
                </p>
              </div>
              <div className="bg-[#141b2b] text-white p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#89f5e7] tracking-wider uppercase select-none">
                  <span>Smart Assist</span>
                </div>
                <p className="text-xs text-white/80 font-mono italic">
                  &quot;Drafted cancellation email for notion.so support ready for dispatch...&quot;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento features grid */}
        <section id="features" className="space-y-8">
          <div className="text-center select-none space-y-1">
            <h2 className="font-display text-3xl text-primary font-normal">
              Architected for Precision
            </h2>
            <p className="text-sm text-[#5C6960]">
              The core local engines running in parallel on your workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
            {/* Bento item 1 */}
            <div className="md:col-span-8 bg-white border border-[#E4E2D4] rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:border-secondary hover:shadow-md transition-all duration-200">
              <div className="space-y-2">
                <span className="text-xl" role="img" aria-label="ocean wave">🌊</span>
                <h3 className="font-sans font-bold text-lg text-primary">Cross-Channel Joins</h3>
                <p className="text-sm text-[#5C6960] max-w-md">
                  Seamlessly links bank statements, digital mail, and workspace events into a single explainable relational model.
                </p>
              </div>
              <div className="flex gap-2 text-[10px] font-extrabold tracking-wide uppercase select-none">
                <span className="bg-[#F4F4EC] px-2.5 py-1 rounded-md text-[#3C463F]">SQL-first</span>
                <span className="bg-[#F4F4EC] px-2.5 py-1 rounded-md text-[#3C463F]">Local execution</span>
              </div>
            </div>

            {/* Bento item 2 */}
            <div className="md:col-span-4 bg-[#121c2a] text-white rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div className="space-y-2">
                <span className="text-xl" role="img" aria-label="shield">🛡️</span>
                <h3 className="font-sans font-bold text-lg">Privacy Safeguards</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Absolute secrecy. Zero server cloud logging. Sensitive inbox tokens remain localized within your local environment.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between text-xs select-none">
                <span>Encryption</span>
                <span className="text-[#89f5e7] font-mono">AES-256 Active</span>
              </div>
            </div>

            {/* Bento item 3 */}
            <div className="md:col-span-4 bg-white border border-[#E4E2D4] rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:border-secondary hover:shadow-md transition-all duration-200">
              <div className="space-y-2">
                <span className="text-xl" role="img" aria-label="traffic light">🚦</span>
                <h3 className="font-sans font-bold text-lg text-primary">Risk Lanes</h3>
                <p className="text-xs text-[#5C6960] leading-relaxed">
                  Automatic bucket tagging into Financial, Legal, Document-pending, and Double-run lanes.
                </p>
              </div>
              <div className="space-y-1.5 select-none">
                <div className="h-1.5 w-full bg-[#F4F4EC] rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[70%]" />
                </div>
                <div className="h-1.5 w-full bg-[#F4F4EC] rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[40%]" />
                </div>
              </div>
            </div>

            {/* Bento item 4 */}
            <div className="md:col-span-8 bg-white border border-[#E4E2D4] rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:border-secondary hover:shadow-md transition-all duration-200">
              <div className="space-y-2">
                <span className="text-xl" role="img" aria-label="gear">⚙️</span>
                <h3 className="font-sans font-bold text-lg text-primary">Mitigation Blueprints</h3>
                <p className="text-sm text-[#5C6960]">
                  Get interactive action items, dispute briefs, and letter templates. Put risks to bed in a single click.
                </p>
              </div>
              <div className="flex gap-2 text-[10px] font-extrabold tracking-wide uppercase select-none">
                <span className="bg-[#F4F4EC] px-2.5 py-1 rounded-md text-[#3C463F]">Actions ready</span>
                <span className="bg-[#F4F4EC] px-2.5 py-1 rounded-md text-[#3C463F]">One-tap copy</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E4E2D4] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="font-sans font-extrabold text-sm uppercase tracking-wider text-primary select-none">
              🛰️ LIFE RISK RADAR
            </span>
            <p className="text-xs text-[#5C6960]">
              © 2026 Life Risk Radar. Locally computed estate monitoring agent.
            </p>
          </div>
          
          <div className="flex gap-8 text-xs font-semibold text-[#45464c]">
            <div className="flex flex-col gap-1.5">
              <span className="text-primary font-bold uppercase tracking-wider select-none text-[10px]">Resources</span>
              <a href="#" className="hover:text-black transition-colors underline decoration-1">Security Audit</a>
              <a href="#" className="hover:text-black transition-colors underline decoration-1">Privacy Charter</a>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-primary font-bold uppercase tracking-wider select-none text-[10px]">Support</span>
              <a href="#" className="hover:text-black transition-colors underline decoration-1">Documentation</a>
              <a href="#" className="hover:text-black transition-colors underline decoration-1">Contact Details</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
