import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Mail, PenLine, Scale, UserRound } from "lucide-react";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — approvU Portal" },
      {
        name: "description",
        content: "Book calls with your advisor, signing appointments, and lawyer introductions.",
      },
    ],
  }),
  component: AppointmentsPage,
});

type AptType = "advisor" | "signing" | "lawyer";

const TYPES: { key: AptType; title: string; blurb: string; icon: typeof CalendarDays }[] = [
  {
    key: "advisor",
    title: "Talk to your advisor",
    blurb: "Walk through your application, offers, or any questions.",
    icon: UserRound,
  },
  {
    key: "signing",
    title: "Signing appointment",
    blurb: "Schedule e-signing for commitment letter or disclosures.",
    icon: PenLine,
  },
  {
    key: "lawyer",
    title: "Lawyer introduction",
    blurb: "Get matched with a real-estate lawyer for closing.",
    icon: Scale,
  },
];

function AppointmentsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Appointments"
        description="Book time with your approvU advisor, schedule signing sessions, or get introduced to a real-estate lawyer."
      />

      {/* Upcoming */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Upcoming</h2>
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No appointments scheduled yet.
        </div>
      </section>

      {/* Appointment types — educational */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Book a new appointment</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.key}
                className="rounded-xl border border-border bg-background p-4 text-left"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2 text-sm font-semibold text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.blurb}</p>
              </div>
            );
          })}
        </div>

        {/* Coming soon notice */}
        <div className="mt-6 rounded-xl border border-border bg-muted/40 p-5 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold text-foreground">
            Appointment scheduling is coming soon.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            To book a call with your advisor, contact the approvU team directly.
          </p>
          <a
            href="mailto:support@approvu.com"
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Mail className="h-4 w-4" /> support@approvu.com
          </a>
        </div>
      </section>
    </>
  );
}
