import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Video,
  Scale,
  PenLine,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/portal/ui";

export const Route = createFileRoute("/portal/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — approvU Portal" },
      { name: "description", content: "Book calls with your advisor, signing appointments, and lawyer introductions." },
    ],
  }),
  component: AppointmentsPage,
});

type AptType = "advisor" | "signing" | "lawyer";
type Apt = {
  id: string;
  type: AptType;
  title: string;
  with: string;
  at: string;
  duration: string;
  mode: "Video" | "Phone" | "In-Person";
  location?: string;
  status: "Confirmed" | "Pending";
};

const UPCOMING: Apt[] = [
  { id: "a1", type: "advisor", title: "Mortgage strategy review", with: "Sarah Chen, approvU Advisor", at: "Wed May 14 · 2:00 PM", duration: "30 min", mode: "Video", status: "Confirmed" },
  { id: "a2", type: "signing", title: "Commitment letter signing", with: "MapleTrust + Sarah Chen", at: "Fri May 16 · 10:30 AM", duration: "20 min", mode: "Video", status: "Pending" },
];

const TYPES: { key: AptType; title: string; blurb: string; icon: typeof CalendarDays; durations: string[] }[] = [
  { key: "advisor", title: "Talk to your advisor", blurb: "Walk through your application, offers, or any questions.", icon: UserRound, durations: ["15 min", "30 min", "45 min"] },
  { key: "signing", title: "Signing appointment", blurb: "Schedule e-signing for commitment letter or disclosures.", icon: PenLine, durations: ["20 min", "30 min"] },
  { key: "lawyer", title: "Lawyer introduction", blurb: "Get matched with a real-estate lawyer for closing.", icon: Scale, durations: ["30 min"] },
];

const SLOTS = [
  { date: "Tue May 13", times: ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"] },
  { date: "Wed May 14", times: ["10:00 AM", "1:00 PM", "3:30 PM"] },
  { date: "Thu May 15", times: ["9:30 AM", "12:00 PM", "2:30 PM", "5:00 PM"] },
  { date: "Fri May 16", times: ["10:30 AM", "2:00 PM"] },
];

function ModeIcon({ mode }: { mode: Apt["mode"] }) {
  if (mode === "Video") return <Video className="h-3.5 w-3.5" />;
  if (mode === "Phone") return <Phone className="h-3.5 w-3.5" />;
  return <MapPin className="h-3.5 w-3.5" />;
}

function AppointmentsPage() {
  const [type, setType] = useState<AptType>("advisor");
  const [duration, setDuration] = useState<string>("30 min");
  const [mode, setMode] = useState<Apt["mode"]>("Video");
  const [slot, setSlot] = useState<{ date: string; time: string } | null>(null);
  const [upcoming, setUpcoming] = useState(UPCOMING);

  const meta = useMemo(() => TYPES.find((t) => t.key === type)!, [type]);

  const book = () => {
    if (!slot) {
      toast.error("Pick a date and time first.");
      return;
    }
    setUpcoming((prev) => [
      {
        id: `a${Date.now()}`,
        type,
        title: meta.title,
        with: type === "lawyer" ? "Lawyer to be matched" : "Sarah Chen, approvU",
        at: `${slot.date} · ${slot.time}`,
        duration,
        mode,
        status: "Confirmed",
      },
      ...prev,
    ]);
    setSlot(null);
    toast.success(`Appointment booked for ${slot.date} at ${slot.time}`);
  };

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
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No upcoming appointments. Book one below.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((a) => (
              <li key={a.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.with}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    a.status === "Confirmed" ? "bg-mint/30 text-foreground" : "bg-yellow/30 text-foreground"
                  }`}>
                    {a.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {a.at}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.duration}</span>
                  <span className="inline-flex items-center gap-1"><ModeIcon mode={a.mode} /> {a.mode}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    Reschedule
                  </button>
                  <button
                    onClick={() => {
                      setUpcoming((prev) => prev.filter((x) => x.id !== a.id));
                      toast.success("Appointment cancelled");
                    }}
                    className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-coral hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Booking */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Book a new appointment</h2>

        {/* Type */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = type === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setType(t.key);
                  setDuration(t.durations[0]);
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  active ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"
                }`}
              >
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-2 text-sm font-semibold text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.blurb}</p>
              </button>
            );
          })}
        </div>

        {/* Duration & mode */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Duration</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {meta.durations.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    duration === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Mode</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(["Video", "Phone", "In-Person"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  <ModeIcon mode={m} /> {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Slots */}
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Available times</p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SLOTS.map((day) => (
              <div key={day.date} className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs font-semibold text-foreground">{day.date}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {day.times.map((t) => {
                    const active = slot?.date === day.date && slot?.time === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSlot({ date: day.date, time: t })}
                        className={`rounded-md border px-2 py-1 text-xs ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Calendar invite and reminders sent automatically.
          </p>
          <button
            onClick={book}
            disabled={!slot}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {slot ? `Book ${slot.date} · ${slot.time}` : "Pick a time to book"}
          </button>
        </div>
      </section>
    </>
  );
}