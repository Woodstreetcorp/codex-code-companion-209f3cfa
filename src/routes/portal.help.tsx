import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  FileText,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/help")({
  head: () => ({
    meta: [
      { title: "Help Center — approvU Portal" },
      { name: "description", content: "Searchable answers to common mortgage and portal questions, plus contact options." },
    ],
  }),
  component: HelpPage,
});

type Topic = "Documents" | "Application" | "Offers" | "Conditions" | "Closing" | "Account" | "Privacy";
type Faq = { id: string; q: string; a: string; topic: Topic };

const FAQS: Faq[] = [
  { id: "f1", topic: "Documents", q: "Why do you need my Notice of Assessment (NOA)?", a: "Lenders use your most recent NOA from the CRA to confirm declared income and that taxes are filed. It's especially important for self-employed borrowers and bonus/commission income." },
  { id: "f2", topic: "Documents", q: "How recent do my pay stubs need to be?", a: "Pay stubs must be dated within the last 30 days. If you're paid bi-weekly, send the two most recent." },
  { id: "f3", topic: "Documents", q: "Can I take a photo with my phone instead of scanning?", a: "Yes. Use the mobile capture button in the Document Vault — we'll auto-crop and convert to PDF for you." },
  { id: "f4", topic: "Application", q: "How long does pre-approval take?", a: "Most snapshots complete in under 5 minutes. A full pre-approval with verified docs typically takes 24–48 hours after all documents are uploaded." },
  { id: "f5", topic: "Application", q: "Will applying affect my credit score?", a: "A snapshot uses a soft inquiry that does not affect your score. A formal application requires a hard inquiry, disclosed before it happens." },
  { id: "f6", topic: "Offers", q: "How are offers from lenders ranked?", a: "We rank offers by your selected priorities (rate, payment, flexibility, prepayment) and show side-by-side comparisons. You always choose." },
  { id: "f7", topic: "Conditions", q: "What is a lender condition?", a: "Conditions are items the lender needs satisfied before funding — e.g. appraisal, proof of down payment, insurance binder. Track them in the Conditions tab of your application." },
  { id: "f8", topic: "Closing", q: "Do I need a lawyer for closing?", a: "Yes — every Canadian mortgage closing requires a lawyer or notary (in Quebec). We can introduce you to a vetted lawyer through Appointments." },
  { id: "f9", topic: "Account", q: "How do I change my email or phone?", a: "Go to Settings → Profile. Changes to your email require re-verification." },
  { id: "f10", topic: "Privacy", q: "Who can see my documents?", a: "Only you, your assigned advisor, and lenders you explicitly authorize. The Activity tab in the Document Vault shows every access event." },
  { id: "f11", topic: "Privacy", q: "How do I withdraw my consent?", a: "Settings → Privacy lets you withdraw specific consents at any time. Active applications may be paused if required disclosures are withdrawn." },
];

const TOPICS: Topic[] = ["Documents", "Application", "Offers", "Conditions", "Closing", "Account", "Privacy"];

function HelpPage() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic | "All">("All");
  const [openId, setOpenId] = useState<string | null>(FAQS[0].id);

  const results = useMemo(() => {
    return FAQS.filter((f) => {
      if (topic !== "All" && f.topic !== topic) return false;
      if (query && !`${f.q} ${f.a}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, topic]);

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Help Center"
        description="Search answers, browse by topic, or reach out for one-on-one support."
      />

      {/* Search */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles (e.g. NOA, pre-approval, condition)…"
            className="w-full rounded-md border border-border bg-background py-2.5 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["All", ...TOPICS] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                topic === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link to="/portal/messages" className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
          <span className="rounded-xl bg-primary/10 p-2 text-primary"><MessageSquare className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-semibold text-foreground">Message your advisor</p>
            <p className="text-xs text-muted-foreground">Threaded, secure, per application.</p>
          </div>
        </Link>
        <Link to="/portal/appointments" className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
          <span className="rounded-xl bg-secondary/15 p-2 text-secondary"><LifeBuoy className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-semibold text-foreground">Book a 15-min call</p>
            <p className="text-xs text-muted-foreground">Talk to a licensed advisor.</p>
          </div>
        </Link>
        <a href="tel:+18005550199" className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary/40">
          <span className="rounded-xl bg-mint/30 p-2 text-foreground"><Phone className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-semibold text-foreground">Call support</p>
            <p className="text-xs text-muted-foreground">1-800-555-0199 · Mon–Sat 8a–8p ET</p>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {results.length} {results.length === 1 ? "answer" : "answers"}
          {topic !== "All" && <span className="text-muted-foreground"> · {topic}</span>}
        </h2>
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-foreground">No matching articles.</p>
            <p className="text-xs text-muted-foreground">Try a different keyword or message your advisor.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {results.map((f) => {
              const open = openId === f.id;
              return (
                <li key={f.id}>
                  <button
                    onClick={() => setOpenId(open ? null : f.id)}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-muted/30"
                    aria-expanded={open}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{f.q}</p>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{f.topic}</p>
                    </div>
                    <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="border-t border-border/60 bg-background/40 px-4 py-3 text-sm text-foreground/90">
                      {f.a}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Resources */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Mortgage guides</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a className="text-primary hover:underline" href="#">First-time homebuyer checklist</a></li>
            <li><a className="text-primary hover:underline" href="#">Understanding the stress test</a></li>
            <li><a className="text-primary hover:underline" href="#">Renewal vs refinance vs HELOC</a></li>
            <li><a className="text-primary hover:underline" href="#">Closing costs explained</a></li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Policies & disclosures</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /><a className="text-primary hover:underline" href="#">Privacy policy</a></li>
            <li className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /><a className="text-primary hover:underline" href="#">FCAC consumer guide</a></li>
            <li className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /><a className="text-primary hover:underline" href="#">Brokerage disclosure</a></li>
            <li className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /><a className="text-primary hover:underline" href="#">Complaints process</a></li>
          </ul>
        </div>
      </section>
    </>
  );
}