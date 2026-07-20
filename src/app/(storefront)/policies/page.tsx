import { Truck, Banknote, PackageX, Video, MessageCircle, ChevronDown } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { COD_CHARGE, DELIVERY_ESTIMATE, SITE_NAME } from "@/lib/constants";
import { buildGenericWhatsAppUrl } from "@/lib/whatsapp";

export const metadata = createMetadata({
  title: "Ordering & Delivery Policy",
  description: `How ordering works at ${SITE_NAME}: delivery timelines, payment options, and our claims process.`,
  path: "/policies",
});

const TIMELINE_STEPS = ["Order Started", "Confirmed", "Shipped", "Delivered"];

const SUMMARY_CHIPS = [
  `COD charge: ₹${COD_CHARGE} extra (collected upfront)`,
  "No returns / exchanges",
  "Unboxing video required for damage claims",
];

const SECTIONS = [
  {
    icon: Truck,
    title: "Delivery",
    body: [
      `Orders are delivered within ${DELIVERY_ESTIMATE} across India.`,
      "Once your order ships, we share the courier name and tracking number — you can also see them anytime under My Account → Inquiries.",
    ],
  },
  {
    icon: Banknote,
    title: "Payment",
    body: [
      "We accept online payment (UPI or bank transfer — details are shared on WhatsApp when you order).",
      `Cash on Delivery is available too — the ₹${COD_CHARGE} handling charge is collected upfront (online, before dispatch), while the rest of the order amount is paid in cash on delivery.`,
    ],
  },
  {
    icon: PackageX,
    title: "No returns or exchanges",
    body: [
      "Because sarees are delicate, easily damaged in transit both ways, and often custom-sourced per order, we do not accept returns or exchanges.",
      "Please review the product photos, description, fabric, and measurements carefully — and ask us anything on WhatsApp — before placing your order. We're happy to share extra photos or videos of the actual piece.",
    ],
  },
  {
    icon: Video,
    title: "Damage & wrong-item claims — unboxing video required",
    body: [
      "If your saree arrives damaged or is not what you ordered, we will make it right — but only with a valid unboxing video.",
      "Record a single, uncut, unpaused video that starts before the sealed package is opened and clearly shows the shipping label, the unopened packaging, and the full unwrapping of the saree.",
      "Send the video to us on WhatsApp within 24 hours of delivery. Claims without a valid uncut unboxing video cannot be accepted — this protects both of us.",
    ],
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "What is the delivery timeline?",
    answer: `Orders are delivered within ${DELIVERY_ESTIMATE} across India. Once shipped, we share the courier and tracking number, visible anytime under My Account → Inquiries.`,
  },
  {
    question: "Is Cash on Delivery available?",
    answer: `Yes — the ₹${COD_CHARGE} handling charge is collected upfront (online, before your order ships), and the remaining order amount is paid in cash on delivery. Online payment (UPI/bank transfer) for the full amount is also accepted.`,
  },
  {
    question: "Can I return a saree?",
    answer:
      "We do not accept returns or exchanges, since sarees are delicate and often custom-sourced per order. Please review photos, fabric, and measurements — and ask us anything on WhatsApp — before ordering.",
  },
  {
    question: "Do I need to record an unboxing video?",
    answer:
      "Yes, for any damage or wrong-item claim. Record one uncut, unpaused video starting before the sealed package is opened, and send it to us on WhatsApp within 24 hours of delivery.",
  },
];

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Ordering &amp; Delivery Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything to know before you order — so there are no surprises later.
      </p>

      {/* How an order progresses, at a glance */}
      <div className="mt-8 flex justify-between gap-2 sm:px-6 lg:px-10">
        {TIMELINE_STEPS.map((step, i) => (
          <div
            key={step}
            className="flex flex-1 flex-col items-center gap-2 text-center"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-semibold sm:h-9 sm:w-9">
              {i + 1}
            </span>
            <span className="text-[11px] leading-tight sm:text-xs">{step}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {SUMMARY_CHIPS.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.title} className="border border-border p-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <section.icon className="h-4 w-4" />
              {section.title}
            </h2>
            <div className="mt-2 space-y-2">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Frequently Asked Questions
        </h2>
        <div className="mt-2 divide-y divide-border border-t border-border">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-3 text-sm text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-10 border border-border bg-secondary p-5 text-center">
        <p className="text-sm font-medium">Questions before ordering?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Message us on WhatsApp — we can share extra photos, fabric details, or
          a video of the exact piece.
        </p>
        <a
          href={buildGenericWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <MessageCircle className="h-4 w-4" />
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
