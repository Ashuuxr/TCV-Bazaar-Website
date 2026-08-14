import { createFileRoute } from '@tanstack/react-router'
import Home from '@/screens/public/Home'

export const Route = createFileRoute('/_public/')({
  head: () => ({
    meta: [
      { title: 'TCV Bazaar 2026 — Diwali Edition, Gwalior' },
      { name: 'description', content: 'Book your stall for TCV Bazaar 2026 — 23–25 October at Keshar Towers, Gwalior. Premium tents, hot-spot locations, three nights of festive shopping.' },
      { property: 'og:title', content: 'TCV Bazaar 2026 — Diwali Edition, Gwalior' },
      { property: 'og:description', content: 'Book your stall for TCV Bazaar 2026 — 23–25 October at Keshar Towers, Gwalior. Premium tents, hot-spot locations, three nights of festive shopping.' },
      { property: 'og:url', content: 'https://tcvbazaar.com/' },
    ],
    links: [{ rel: 'canonical', href: 'https://tcvbazaar.com/' }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'TCV Bazaar',
          url: 'https://tcvbazaar.com/',
          logo: 'https://tcvbazaar.com/tcv-bazaar-official-logo.png',
          sameAs: ['https://www.instagram.com/tcvbazaar'],
        }),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'TCV Bazaar',
          url: 'https://tcvbazaar.com/',
        }),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: 'TCV Bazaar 2026 — Diwali Edition',
          startDate: '2026-10-23',
          endDate: '2026-10-25',
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: 'Keshar Towers',
            address: { '@type': 'PostalAddress', addressLocality: 'Gwalior', addressRegion: 'MP', addressCountry: 'IN' },
          },
          organizer: { '@type': 'Organization', name: 'The City Vibes Marketing', url: 'https://tcvbazaar.com/' },
          url: 'https://tcvbazaar.com/',
        }),
      },
    ],
  }),
  component: () => <Home />,
})
