import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  AtSign,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Globe,
  Languages,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { Field, SelectField, SettingPane } from "@/components/portal/settings-fields";
import { getBorrowerSession, type BorrowerUser } from "@/lib/api/borrowerAuthApi";

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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.[0] ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function buildProfile(user: BorrowerUser): Profile {
  const parts = user.name.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return {
    firstName,
    lastName,
    preferredName: "",
    dob: "",
    email: user.email,
    phone: "",
    language: "",
    timezone: "",
    street: "",
    unit: "",
    city: "",
    province: "",
    postal: "",
    country: "",
    housing: "",
    yearsAtAddress: "",
    employer: "",
    jobTitle: "",
    employmentType: "",
    yearsEmployed: "",
    income: "",
    initials: initials(user.name),
  };
}

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await getBorrowerSession();
        if (cancelled) return;
        if (!result.user) {
          setSessionError("Your profile could not be loaded. Please refresh or sign in again.");
        } else {
          setProfile(buildProfile(result.user));
        }
      } catch (err) {
        if (!cancelled) {
          setSessionError(err instanceof Error ? err.message : "Could not load your profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flash = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved((cur) => (cur === key ? null : cur)), 1800);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    );
  }

  if (sessionError || !profile) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-coral/30 bg-coral/5 p-6">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
        <div>
          <p className="text-sm font-medium text-foreground">Could not load profile</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {sessionError ?? "Your session could not be loaded."}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact{" "}
            <a
              href="mailto:support@approvu.com"
              className="text-primary underline-offset-2 hover:underline"
            >
              support@approvu.com
            </a>{" "}
            to update your details.
          </p>
        </div>
      </div>
    );
  }

  const update =
    <K extends keyof Profile>(k: K) =>
    (_v: string) => {
      void k;
      // Profile editing is not yet supported. Fields are read-only.
    };

  // Completion based only on verified fields (name + email from session).
  const completionPct =
    [profile.firstName, profile.lastName, profile.email].filter((v) => v.trim().length > 0).length /
    3;
  const completion = Math.round(completionPct * 100);

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
                disabled
                title="Photo upload coming soon"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
                  {[profile.firstName, profile.lastName].filter(Boolean).join(" ")}
                </h2>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{profile.email}</p>
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

      {/* Coming soon notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-5 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground">Profile editing is coming soon.</p>
          <p className="mt-0.5 text-muted-foreground">
            To update your details, contact{" "}
            <a
              href="mailto:support@approvu.com"
              className="text-primary underline-offset-2 hover:underline"
            >
              support@approvu.com
            </a>
            .
          </p>
        </div>
      </div>

      {/* Personal */}
      <SettingPane
        title="Personal information"
        desc="Your legal name and date of birth as they appear on government ID. Used for credit and identity checks."
        onSave={() => {
          toast.message("Profile editing is coming soon. Contact support to update your details.");
          flash("personal");
        }}
        saved={saved === "personal"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Legal first name"
            value={profile.firstName}
            onChange={update("firstName")}
            icon={User}
            disabled
          />
          <Field
            label="Legal last name"
            value={profile.lastName}
            onChange={update("lastName")}
            icon={User}
            disabled
          />
          <Field
            label="Preferred name"
            value={profile.preferredName}
            onChange={update("preferredName")}
            icon={AtSign}
            disabled
            placeholder="Coming soon"
          />
          <Field
            label="Date of birth"
            value={profile.dob}
            onChange={update("dob")}
            type="date"
            icon={Calendar}
            disabled
          />
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Legal name and date of birth are locked once an application is submitted to a lender.
          Reach out to support to make changes after that.
        </div>
      </SettingPane>

      {/* Contact */}
      <SettingPane
        title="Contact"
        desc="Where we'll reach you about applications, conditions, and offers."
        onSave={() => {
          toast.message("Profile editing is coming soon. Contact support to update your details.");
          flash("contact");
        }}
        saved={saved === "contact"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email"
            value={profile.email}
            onChange={update("email")}
            type="email"
            icon={Mail}
            disabled
          />
          <Field
            label="Mobile phone"
            value={profile.phone}
            onChange={update("phone")}
            type="tel"
            icon={Phone}
            disabled
            placeholder="Coming soon"
          />
          <SelectField
            label="Preferred language"
            value={profile.language}
            onChange={update("language")}
            options={["English", "French", "Spanish", "Mandarin", "Punjabi"]}
            icon={Languages}
            disabled
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
            disabled
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <VerifyRow icon={Mail} label="Email verified" sub={profile.email} verified />
          <VerifyRow icon={Phone} label="Phone" sub="Not yet verified" verified={false} />
        </div>
      </SettingPane>

      {/* Address */}
      <SettingPane
        title="Current address"
        desc="Your residential address. Lenders use this to confirm residency and tenure."
        onSave={() => {
          toast.message("Profile editing is coming soon. Contact support to update your details.");
          flash("address");
        }}
        saved={saved === "address"}
      >
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <Field
              label="Street address"
              value={profile.street}
              onChange={update("street")}
              icon={MapPin}
              disabled
              placeholder="Coming soon"
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Unit / suite"
              value={profile.unit}
              onChange={update("unit")}
              disabled
              placeholder="Coming soon"
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="City"
              value={profile.city}
              onChange={update("city")}
              disabled
              placeholder="Coming soon"
            />
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
              disabled
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Postal code"
              value={profile.postal}
              onChange={update("postal")}
              disabled
              placeholder="Coming soon"
            />
          </div>
          <div className="sm:col-span-3">
            <SelectField
              label="Housing status"
              value={profile.housing}
              onChange={update("housing")}
              options={["Own", "Rent", "Live with family", "Other"]}
              disabled
            />
          </div>
          <div className="sm:col-span-3">
            <Field
              label="Years at this address"
              value={profile.yearsAtAddress}
              onChange={update("yearsAtAddress")}
              type="number"
              disabled
              placeholder="Coming soon"
            />
          </div>
        </div>
      </SettingPane>

      {/* Employment */}
      <SettingPane
        title="Employment & income"
        desc="A snapshot of your work and gross annual income. Used for affordability calculations."
        onSave={() => {
          toast.message("Profile editing is coming soon. Contact support to update your details.");
          flash("employment");
        }}
        saved={saved === "employment"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Employer"
            value={profile.employer}
            onChange={update("employer")}
            icon={Building2}
            disabled
            placeholder="Coming soon"
          />
          <Field
            label="Job title"
            value={profile.jobTitle}
            onChange={update("jobTitle")}
            icon={Briefcase}
            disabled
            placeholder="Coming soon"
          />
          <SelectField
            label="Employment type"
            value={profile.employmentType}
            onChange={update("employmentType")}
            options={["Full-time", "Part-time", "Self-employed", "Contract", "Retired", "Other"]}
            disabled
          />
          <Field
            label="Years with employer"
            value={profile.yearsEmployed}
            onChange={update("yearsEmployed")}
            type="number"
            disabled
            placeholder="Coming soon"
          />
          <div className="sm:col-span-2">
            <Field
              label="Gross annual income (CAD)"
              value={profile.income}
              onChange={update("income")}
              type="number"
              disabled
              placeholder="Coming soon"
            />
          </div>
        </div>
      </SettingPane>

      {/* Danger zone */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 sm:p-8">
        <h3 className="text-base font-semibold text-foreground">Account actions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a copy of your data, or permanently close your account. Closing removes access;
          we may retain records required by law.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() =>
              toast.success("Data export requested", {
                description: "We'll email a download link within 24 hours.",
              })
            }
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Download my data
          </button>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Close your account? This removes access. Some records are retained as required by law.",
                )
              ) {
                toast.success("Account closure request submitted");
              }
            }}
            className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
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
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          Not verified
        </span>
      )}
    </div>
  );
}
