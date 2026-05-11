import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AtSign,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Globe,
  Languages,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { Field, SelectField, SettingPane } from "@/components/portal/settings-fields";

export const Route = createFileRoute("/portal/settings/profile")({
  head: () => ({
    meta: [
      { title: "Profile — approvU Settings" },
      {
        name: "description",
        content:
          "Manage your personal details, contact info, address, and employment used across your mortgage applications.",
      },
    ],
  }),
  component: ProfilePage,
});

type Profile = {
  firstName: string;
  lastName: string;
  preferredName: string;
  dob: string;
  email: string;
  phone: string;
  language: string;
  timezone: string;
  street: string;
  unit: string;
  city: string;
  province: string;
  postal: string;
  country: string;
  housing: string;
  yearsAtAddress: string;
  employer: string;
  jobTitle: string;
  employmentType: string;
  yearsEmployed: string;
  income: string;
  initials: string;
};

const INITIAL: Profile = {
  firstName: "Alex",
  lastName: "Thompson",
  preferredName: "Alex",
  dob: "1990-04-12",
  email: "alex.thompson@email.com",
  phone: "(416) 555-0142",
  language: "English",
  timezone: "America/Toronto",
  street: "123 Maple Avenue",
  unit: "Apt 504",
  city: "Toronto",
  province: "Ontario",
  postal: "M5V 2T6",
  country: "Canada",
  housing: "Rent",
  yearsAtAddress: "3",
  employer: "Northwind Technologies",
  jobTitle: "Senior Product Manager",
  employmentType: "Full-time",
  yearsEmployed: "4",
  income: "138000",
  initials: "AT",
};

function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(INITIAL);
  const [saved, setSaved] = useState<string | null>(null);

  const update = <K extends keyof Profile>(k: K) => (v: string) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const completion = useMemo(() => {
    const fields = Object.values(profile).filter((v) => typeof v === "string");
    const filled = fields.filter((v) => v && v.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const flash = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved((cur) => (cur === key ? null : cur)), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Identity hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-secondary/10 p-6 shadow-sm sm:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-semibold text-primary-foreground shadow-md ring-4 ring-background">
                {profile.initials}
              </div>
              <button
                aria-label="Upload photo"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:bg-muted"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
                  {profile.firstName} {profile.lastName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-medium text-mint">
                  <BadgeCheck className="h-3 w-3" /> ID Verified
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {profile.email} · {profile.phone}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since 2023 · Customer ID #AT-90412
              </p>
            </div>
          </div>

          <div className="w-full max-w-xs rounded-xl border border-border/70 bg-card/80 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Profile completion</span>
              <span className="font-semibold text-foreground">{completion}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-secondary" />
              Complete profiles process 2× faster
            </p>
          </div>
        </div>
      </section>

      {/* Personal */}
      <SettingPane
        title="Personal information"
        desc="Your legal name and date of birth as they appear on government ID. Used for credit and identity checks."
        onSave={() => flash("personal")}
        saved={saved === "personal"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Legal first name" value={profile.firstName} onChange={update("firstName")} icon={User} />
          <Field label="Legal last name" value={profile.lastName} onChange={update("lastName")} icon={User} />
          <Field label="Preferred name" value={profile.preferredName} onChange={update("preferredName")} icon={AtSign} />
          <Field label="Date of birth" value={profile.dob} onChange={update("dob")} type="date" icon={Calendar} />
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Legal name and date of birth are locked once an application is submitted to a lender. Reach out to support to make changes after that.
        </div>
      </SettingPane>

      {/* Contact */}
      <SettingPane
        title="Contact"
        desc="Where we'll reach you about applications, conditions, and offers."
        onSave={() => flash("contact")}
        saved={saved === "contact"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" value={profile.email} onChange={update("email")} type="email" icon={Mail} />
          <Field label="Mobile phone" value={profile.phone} onChange={update("phone")} type="tel" icon={Phone} />
          <SelectField
            label="Preferred language"
            value={profile.language}
            onChange={update("language")}
            options={["English", "French", "Spanish", "Mandarin", "Punjabi"]}
            icon={Languages}
          />
          <SelectField
            label="Time zone"
            value={profile.timezone}
            onChange={update("timezone")}
            options={[
              "America/Toronto",
              "America/Vancouver",
              "America/Edmonton",
              "America/Halifax",
              "America/St_Johns",
            ]}
            icon={Globe}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <VerifyRow icon={Mail} label="Email verified" sub={profile.email} verified />
          <VerifyRow icon={Phone} label="Phone verified" sub={profile.phone} verified />
        </div>
      </SettingPane>

      {/* Address */}
      <SettingPane
        title="Current address"
        desc="Your residential address. Lenders use this to confirm residency and tenure."
        onSave={() => flash("address")}
        saved={saved === "address"}
      >
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Field label="Street address" value={profile.street} onChange={update("street")} icon={MapPin} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Unit / suite" value={profile.unit} onChange={update("unit")} />
          </div>
          <div className="sm:col-span-2">
            <Field label="City" value={profile.city} onChange={update("city")} />
          </div>
          <div className="sm:col-span-2">
            <SelectField
              label="Province"
              value={profile.province}
              onChange={update("province")}
              options={[
                "Ontario",
                "Quebec",
                "British Columbia",
                "Alberta",
                "Manitoba",
                "Saskatchewan",
                "Nova Scotia",
                "New Brunswick",
                "Newfoundland and Labrador",
                "Prince Edward Island",
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="Postal code" value={profile.postal} onChange={update("postal")} />
          </div>
          <div className="sm:col-span-3">
            <SelectField
              label="Housing status"
              value={profile.housing}
              onChange={update("housing")}
              options={["Own", "Rent", "Live with family", "Other"]}
            />
          </div>
          <div className="sm:col-span-3">
            <Field
              label="Years at this address"
              value={profile.yearsAtAddress}
              onChange={update("yearsAtAddress")}
              type="number"
            />
          </div>
        </div>
      </SettingPane>

      {/* Employment */}
      <SettingPane
        title="Employment & income"
        desc="A snapshot of your work and gross annual income. Used for affordability calculations."
        onSave={() => flash("employment")}
        saved={saved === "employment"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employer" value={profile.employer} onChange={update("employer")} icon={Building2} />
          <Field label="Job title" value={profile.jobTitle} onChange={update("jobTitle")} icon={Briefcase} />
          <SelectField
            label="Employment type"
            value={profile.employmentType}
            onChange={update("employmentType")}
            options={["Full-time", "Part-time", "Self-employed", "Contract", "Retired", "Other"]}
          />
          <Field
            label="Years with employer"
            value={profile.yearsEmployed}
            onChange={update("yearsEmployed")}
            type="number"
          />
          <div className="sm:col-span-2">
            <Field
              label="Gross annual income (CAD)"
              value={profile.income}
              onChange={update("income")}
              type="number"
            />
          </div>
        </div>
      </SettingPane>

      {/* Danger zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8">
        <h3 className="text-base font-semibold text-foreground">Account actions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a copy of your data, or permanently close your account. Closing removes access; we may retain records required by law.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Download my data
          </button>
          <button className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
            Close account
          </button>
        </div>
      </div>
    </div>
  );
}

function VerifyRow({
  icon: Icon,
  label,
  sub,
  verified,
}: {
  icon: typeof User;
  label: string;
  sub: string;
  verified: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      {verified ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[11px] font-medium text-mint">
          <CheckCircle2 className="h-3 w-3" /> Verified
        </span>
      ) : (
        <button className="text-xs font-medium text-primary hover:underline">Verify</button>
      )}
    </div>
  );
}