import { useState } from "react";
import {
  Mail,
  Send,
  Share2,
  Link as LinkIcon,
  MessageCircle,
  Linkedin,
  Facebook,
  Phone,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const PUBLIC_SHARE_TEXT = "I checked my mortgage path with approvU.";
const SECURE_LINK = "https://approvu.app/snapshot/secure-preview";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

function SuccessNote({ message }: { message: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 text-sm text-secondary">
      <CheckCircle2 className="h-4 w-4" />
      {message}
    </div>
  );
}

function EmailMySnapshotCard() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <Card>
      <CardHeader
        icon={<Mail className="h-4 w-4" />}
        title="Email My Snapshot"
        description="We’ll send a copy of this snapshot to your inbox so you can review it later."
      />
      <div className="space-y-3">
        <div>
          <Label htmlFor="snap-email" className="text-xs">Email address</Label>
          <Input
            id="snap-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="snap-firstname" className="text-xs">First name (optional)</Label>
          <Input
            id="snap-firstname"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1"
          />
        </div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
          />
          <span>
            I agree that approvU may email me a copy of this snapshot and follow up about my
            mortgage options.
          </span>
        </label>
        <Button
          className="w-full"
          disabled={!email || !consent}
          onClick={() => setSent(true)}
        >
          Email My Snapshot
        </Button>
        {sent && <SuccessNote message="Snapshot emailed successfully." />}
      </div>
    </Card>
  );
}

function SendToRealtorCard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Card>
      <CardHeader
        icon={<Send className="h-4 w-4" />}
        title="Send to My Realtor"
        description="Share your snapshot with your realtor so they understand your buying position."
      />
      <div className="space-y-3">
        <div>
          <Label htmlFor="realtor-name" className="text-xs">Realtor name</Label>
          <Input
            id="realtor-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="realtor-email" className="text-xs">Realtor email</Label>
          <Input
            id="realtor-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="realtor-msg" className="text-xs">Message (optional)</Label>
          <Textarea
            id="realtor-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mt-1"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Only send this if you are comfortable sharing your mortgage snapshot with this person.
        </p>
        <Button
          className="w-full"
          disabled={!name || !email}
          onClick={() => setSent(true)}
        >
          Send to My Realtor
        </Button>
        {sent && <SuccessNote message="Snapshot sent to realtor." />}
      </div>
    </Card>
  );
}

function ShareSnapshotCard() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SECURE_LINK);
    } catch {
      // ignore in prototype
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareEmail = `mailto:?subject=${encodeURIComponent("My approvU snapshot")}&body=${encodeURIComponent(PUBLIC_SHARE_TEXT)}`;
  const shareWa = `https://wa.me/?text=${encodeURIComponent(PUBLIC_SHARE_TEXT)}`;
  const shareLi = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://approvu.app")}`;
  const shareFb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://approvu.app")}`;

  const ShareBtn = ({
    icon,
    label,
    onClick,
    href,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    href?: string;
  }) => {
    const cls =
      "flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted";
    if (href) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={cls}>
          {icon}
          {label}
        </a>
      );
    }
    return (
      <button type="button" onClick={onClick} className={cls}>
        {icon}
        {label}
      </button>
    );
  };

  return (
    <Card>
      <CardHeader
        icon={<Share2 className="h-4 w-4" />}
        title="Share Snapshot"
        description="Public shares only say you checked your mortgage path — your details stay private."
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <ShareBtn icon={<LinkIcon className="h-3.5 w-3.5" />} label="Copy link" onClick={copyLink} />
        <ShareBtn icon={<Mail className="h-3.5 w-3.5" />} label="Email" href={shareEmail} />
        <ShareBtn icon={<MessageCircle className="h-3.5 w-3.5" />} label="WhatsApp" href={shareWa} />
        <ShareBtn icon={<Linkedin className="h-3.5 w-3.5" />} label="LinkedIn" href={shareLi} />
        <ShareBtn icon={<Facebook className="h-3.5 w-3.5" />} label="Facebook" href={shareFb} />
      </div>
      {copied && <SuccessNote message="Secure link copied." />}
    </Card>
  );
}

function TalkToBrokerCard() {
  return (
    <Card>
      <CardHeader
        icon={<Phone className="h-4 w-4" />}
        title="Talk to a Broker"
        description="Have questions about your snapshot? A licensed mortgage broker can help you understand your next step."
      />
      <Button variant="outline" className="w-full">Book a free call</Button>
    </Card>
  );
}

function EditInputsCard({ onEdit }: { onEdit?: () => void }) {
  return (
    <Card>
      <CardHeader
        icon={<Pencil className="h-4 w-4" />}
        title="Edit My Inputs"
        description="Go back and update your answers if something does not look right."
      />
      <Button variant="outline" className="w-full" onClick={onEdit}>
        Edit my answers
      </Button>
    </Card>
  );
}

export function SnapshotShareSection({ onEdit }: { onEdit?: () => void }) {
  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          Save or Share Your Snapshot
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep a copy, share it with people who help you buy, or talk to a broker.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <EmailMySnapshotCard />
        <SendToRealtorCard />
        <ShareSnapshotCard />
        <div className="grid gap-4">
          <TalkToBrokerCard />
          <EditInputsCard onEdit={onEdit} />
        </div>
      </div>
    </section>
  );
}