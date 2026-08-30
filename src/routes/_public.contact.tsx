import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/screens/public/Contact";

export const Route = createFileRoute("/_public/contact")({
  head: () => ({
    meta: [
      { title: "Contact TCV Bazaar — Gwalior" },
      {
        name: "description",
        content:
          "Call, WhatsApp or write to the TCV Bazaar team at Keshar Towers, Gwalior.",
      },
      { property: "og:title", content: "Contact TCV Bazaar — Gwalior" },
      {
        property: "og:description",
        content:
          "Call, WhatsApp or write to the TCV Bazaar team at Keshar Towers, Gwalior.",
      },
      { property: "og:url", content: "https://tcvbazaar.com/contact" },
    ],
    links: [{ rel: "canonical", href: "https://tcvbazaar.com/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "TCV Bazaar",
          image:
            "https://tcvbazaar.com/__l5e/assets-v1/cc2eb405-05fe-46dc-a8b2-16162b39f2e0/tcv-bazaar-logo.png",
          url: "https://tcvbazaar.com/contact",
          telephone: "+91-96690-04241",
          email: "hello@tcvbazaar.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Keshar Towers",
            addressLocality: "Gwalior",
            addressRegion: "MP",
            addressCountry: "IN",
          },
          areaServed: "Gwalior",
          sameAs: ["https://www.instagram.com/tcvbazaar"],
        }),
      },
    ],
  }),
  component: () => <Contact />,
});
