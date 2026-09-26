import { MessageCircle, MessageSquare, Phone } from "lucide-react";

type Props = {
  fullName: string;
  // 10-digit Indian mobile number, as stored on the student.
  phone: string;
  monthlyFees: number;
  // "icon" = compact round buttons for list rows; "button" = labelled pills.
  variant?: "icon" | "button";
};

// Owner-initiated contact: each action is a plain link that opens the phone's own
// dialer / WhatsApp / messaging app, so it needs no gateway and costs nothing extra.
export function StudentContactActions({ fullName, phone, monthlyFees, variant = "icon" }: Props) {
  const firstName = fullName.trim().split(/\s+/)[0];
  const message = `Hi ${firstName}, a gentle reminder that your library fee of ₹${monthlyFees} is due. Please pay at the earliest. Thank you.`;

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
