import { createFileRoute } from "@tanstack/react-router";
import Faq from "@/screens/public/Faq";

const FAQS: { q: string; a: string }[] = [
  {
    q: "When is TCV Bazaar 2026?",
    a: "The Diwali Edition runs 23–25 October 2026 at Keshar Towers, Gwalior — three evenings of festive shopping, food and music.",
  },
  {
    q: "How do I book a stall?",
    a: "Choose a package on the Packages page, pick your stall on the live layout, then pay online. You get an instant Booking ID and confirmation.",
  },
  {
    q: "What payment is required to confirm a stall?",
    a: "A 50% advance confirms your stall. The balance is due before setup on 22 October 2026.",
  },
  {
    q: "Do you provide a GST invoice?",
    a: "Yes. Enter your GST number during booking and 18% GST is added; a proper GST invoice is issued instantly.",
  },
  {
    q: "What is included in a stall package?",
    a: "Every package includes a branded tent, table, chairs, lighting, power point and inclusion in TCV Bazaar marketing.",
  },
  {
    q: "Can I cancel or transfer my booking?",
    a: "See our Refund Policy for cancellation windows. Transfers to another brand are allowed with prior written approval.",
  },
];

export const Route = createFileRoute("/_public/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — TCV Bazaar Bookings, Payments & Packages" },
      {
        name: "description",
        content:
          "Answers about dates, stall booking, 50% advance, package inclusions, GST invoices, refund policy and the interactive stall layout.",
      },
      {
        property: "og:title",
        content: "FAQ — TCV Bazaar Bookings, Payments & Packages",
      },
      {
        property: "og:description",
        content:
          "Answers about dates, stall booking, 50% advance, package inclusions, GST invoices, refund policy and the interactive stall layout.",
      },
      { property: "og:url", content: "https://tcvbazaar.com/faq" },
    ],
    links: [{ rel: "canonical", href: "https://tcvbazaar.com/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: () => <Faq />,
});
