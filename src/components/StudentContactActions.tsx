import { MessageCircle, MessageSquare, Phone } from "lucide-react";

type Props = {
  fullName: string;
  // 10-digit Indian mobile number, as stored on the student.
  phone: string;
  monthlyFees: number;
  // Latest payment's coverage end date, if any — drives the message wording
  // (overdue / due soon / paid ahead). Omit if unknown.
  dueDate?: Date | string | null;
  libraryName?: string | null;
  // "icon" = compact round buttons for list rows; "button" = labelled pills.
  variant?: "icon" | "button";
};

const DAY_MS = 24 * 60 * 60 * 1000;
const dateFmt = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Owner-initiated contact: each action is a plain link that opens the phone's own
// dialer / WhatsApp / messaging app, so it needs no gateway and costs nothing extra.
// The owner still taps Send themselves — nothing here sends automatically.
export function buildFeeReminderMessage({
  fullName,
  monthlyFees,
  dueDate,
  libraryName,
}: {
  fullName: string;
  monthlyFees: number;
  dueDate?: Date | string | null;
  libraryName?: string | null;
}): string {
  const firstName = fullName.trim().split(/\s+/)[0];
  const org = libraryName?.trim() || "library";

  if (!dueDate) {
    return `Hi ${firstName}, a gentle reminder that your ${org} fee of ₹${monthlyFees} is due. Please pay at the earliest to keep your seat. Thank you.`;
  }

  const due = new Date(dueDate);
  const diff = due.getTime() - Date.now();
  const days = Math.ceil(Math.abs(diff) / DAY_MS);
  const dateLabel = dateFmt(due);

  if (diff < 0) {
    return `Hi ${firstName}, your ${org} fee of ₹${monthlyFees} was due on ${dateLabel} (${days} day${days === 1 ? "" : "s"} overdue). Please pay at the earliest to keep your seat. Thank you.`;
  }
  if (days <= 7) {
    return `Hi ${firstName}, a gentle reminder that your ${org} fee of ₹${monthlyFees} is due on ${dateLabel} (${days} day${days === 1 ? "" : "s"} left). Please renew at the earliest to keep your seat. Thank you.`;
  }
  return `Hi ${firstName}, just confirming your ${org} membership is active and paid till ${dateLabel}. Thank you for being with us!`;
}

export function StudentContactActions({
  fullName,
  phone,
  monthlyFees,
  dueDate,
  libraryName,
  variant = "icon",
}: Props) {
  const message = buildFeeReminderMessage({ fullName, monthlyFees, dueDate, libraryName });

  const actions = [
    {
      label: "Call",
      href: `tel:${phone}`,
      Icon: Phone,
      style: "bg-badge-green-bg text-badge-green-text",
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,
      Icon: MessageCircle,
      style: "bg-badge-green-bg text-badge-green-text",
      external: true,
    },
    {
      label: "SMS",
      href: `sms:${phone}?body=${encodeURIComponent(message)}`,
      Icon: MessageSquare,
      style: "bg-primary/10 text-primary",
    },
  ];

  return (
    <>
      {actions.map(({ label, href, Icon, style, external }) => {
        const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};
        return variant === "icon" ? (
          <a
            key={label}
            href={href}
            {...externalProps}
            className={`grid h-8 w-8 place-items-center rounded-full hover:opacity-80 ${style}`}
            aria-label={`${label} ${fullName}`}
            title={label}
          >
            <Icon size={16} />
          </a>
        ) : (
          <a
            key={label}
            href={href}
            {...externalProps}
            className={`btn-pill flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase ${style}`}
          >
            <Icon size={14} /> {label}
          </a>
        );
      })}
    </>
  );
}
