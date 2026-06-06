import { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";

const HUB_URL = "https://www.micro-saas.it";
const CONTACT_URL = "https://www.micro-saas.it/contatti";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: ReactNode;
}

/** Shared shell for the public legal pages (Privacy, Terms). */
export function LegalLayout({ title, subtitle, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="sg-app-bg min-h-screen flex flex-col font-sans">
      <header className="sticky top-0 z-50" style={{ background: "rgba(7,11,26,0.9)", backdropFilter: "blur(20px) saturate(1.8)", WebkitBackdropFilter: "blur(20px) saturate(1.8)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="sg-accent-bar" />
        <div className="max-w-3xl w-full mx-auto px-6 flex items-center justify-between gap-4 min-h-[56px]">
          <Link href="/" className="flex items-center"><Logo size={36} /></Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Back to site
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-extrabold text-white mb-2">{title}</h1>
        {subtitle && <p className="text-lg mb-2" style={{ color: "#cbd5e1" }}>{subtitle}</p>}
        <p className="text-sm mb-10" style={{ color: "#64748b" }}>Last updated: {lastUpdated} · Version 1.0</p>
        <div className="sg-legal-prose">{children}</div>
      </main>

      <footer className="py-10 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: "#64748b" }}>
          <span>© {new Date().getFullYear()} Micro SaaS — Filippo Piconese.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-300">Terms</Link>
            <a href={CONTACT_URL} target="_blank" rel="noopener" className="hover:text-slate-300">Contatti</a>
            <a href={HUB_URL} target="_blank" rel="noopener" className="hover:text-slate-300">micro-saas.it</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
