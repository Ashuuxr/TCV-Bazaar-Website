import { createFileRoute } from '@tanstack/react-router'
import Videos from '@/screens/public/Videos'

export const Route = createFileRoute('/_public/videos')({
  head: () => ({
    meta: [
      { title: 'Videos — TCV Bazaar Highlights & Setup' },
      { name: 'description', content: 'Aftermovies, timelapses and highlight reels from past TCV Bazaar Diwali editions.' },
      { property: 'og:title', content: 'Videos — TCV Bazaar Highlights & Setup' },
      { property: 'og:description', content: 'Aftermovies, timelapses and highlight reels from past TCV Bazaar Diwali editions.' },
      { property: 'og:url', content: 'https://tcvbazaar.com/videos' },
    ],
    links: [{ rel: 'canonical', href: 'https://tcvbazaar.com/videos' }],
  }),
  component: () => <Videos />,
})
