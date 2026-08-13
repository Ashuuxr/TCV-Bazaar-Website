import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SUPABASE_PUBLIC_MEDIA = 'https://drmqujjazvxcubsizmlw.supabase.co/storage/v1'
const galleryImage = (name: string) => `${SUPABASE_PUBLIC_MEDIA}/render/image/public/gallery/${name}?width=1600&quality=75&resize=contain`
export const OFFICIAL_LOGO_URL = '/tcv-bazaar-official-logo.png'
export const OFFICIAL_FAVICON_URL = '/favicon.ico'

/* ---------------- types ---------------- */
export type StallStatus = 'available' | 'reserved' | 'pending' | 'booked' | 'blocked' | 'sold'

export interface ThemeTokens {
  gold: string
  bg: string
  ink: string
  radius: number
  fontDisplay: string
  fontBody: string
  mode: 'light' | 'dark'
}
export interface SiteContent {
  name: string
  tagline: string
  seo: { title: string; description: string; keywords: string }
  contact: { phones: string[]; email: string; address: string }
  social: { instagram: string; whatsapp: string; phone: string }
}
export interface BrandAssets {
  /** Logo shown in light mode / most surfaces. Data URL or absolute URL. */
  logoLight: string
  /** Logo shown in dark mode (or over dark hero). */
  logoDark: string
  /** Optional smaller logo used on mobile widths (≤640px). Falls back to logoLight. */
  logoMobile: string
  /** Browser tab favicon. */
  favicon: string
  /** Header logo height in px (desktop). */
  heightDesktop: number
  /** Header logo height in px (mobile). */
  heightMobile: number
  /** Where the logo sits in the header. */
  position: 'left' | 'center'
}
export interface HeroContent {
  heading: string
  highlight: string
  subheading: string
  videoDataUrl: string
  poster: string
  overlay: number
  showCountdown: boolean
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  playOnMobile?: boolean
  /** Master switch: when false, the hero always uses the fallback (poster/HeroCanvas). */
  enabled?: boolean
  /** Show/hide the hero video overlay independently of `enabled`. */
  visible?: boolean
}
export interface EventInfo {
  name: string
  edition: string
  venue: string
  city: string
  datesLabel: string
  startISO: string
  endISO: string
}
export interface Pkg {
  id: string
  name: string
  price: number
  size: string
  tag: string
  features: string[]
  popular: boolean
  enabled: boolean
}
export interface Stall {
  id: string
  label: string
  zone: string
  x: number; y: number; w: number; h: number
  pkgId: string
  status: StallStatus
  customer?: string
  active?: boolean
  priceOverride?: number | null
  notes?: string | null
  color?: string | null
  sortOrder?: number
}
export interface GalleryItem { id: string; src: string; title: string; category: string }
export interface VideoItem { id: string; title: string; poster: string; src: string; duration: string }
export interface Testimonial { id: string; name: string; role: string; text: string; rating: number }
export interface Faq { id: string; q: string; a: string }
export interface BankAccount {
  id: string; bankName: string; holder: string; number: string; ifsc: string
  branch: string; upi: string; qr: string; instructions: string
  enabled: boolean; isDefault: boolean
}
export interface Booking {
  id: string
  dbId?: string
  createdAt: string
  eventName: string
  pkgId: string
  stallId: string
  business: Record<string, string>
  payType: 'full' | 'advance'
  method: string
  total: number
  subtotal?: number
  gstRate?: number
  gstAmount?: number
  paid: number
  balance: number
  utr: string
  txnId: string
  proof: string
  remarks: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  payStatus: 'pending' | 'partial' | 'paid' | 'refunded'
}
export interface MediaItem {
  id: string; name: string; kind: string; folder: string
  dataUrl: string; size: number; createdAt: string
}
export interface PageContent {
  about: { heading: string; body: string; image: string }
  why: { heading: string; body: string }
  privacy: string
  refund: string
  terms: string
}
export interface Templates {
  emailConfirmation: string
  whatsappConfirmation: string
}
export interface BrochureSection {
  enabled: boolean
  heading: string
  subheading: string
}

export interface CmsState {
  theme: ThemeTokens
  site: SiteContent
  brand: BrandAssets
  hero: HeroContent
  event: EventInfo
  packages: Pkg[]
  stalls: Stall[]
  gallery: GalleryItem[]
  videos: VideoItem[]
  testimonials: Testimonial[]
  faqs: Faq[]
  banks: BankAccount[]
  bookings: Booking[]
  media: MediaItem[]
  pages: PageContent
  templates: Templates
  brochureSection: BrochureSection
  admin: { email: string; twoFactor: boolean }
  activity: { id: string; text: string; at: string }[]

  patch: <K extends keyof CmsState>(key: K, value: CmsState[K]) => void
  log: (text: string) => void
  upsertBooking: (b: Booking) => void
  resetAll: () => void
}

/* ---------------- defaults ---------------- */
// Stalls are the DB's source of truth; seed is empty and hydrated at runtime by useSyncStallsFromCloud.
const stalls: Stall[] = []

export const defaultState = {
  theme: {
    gold: '#b98a2f', bg: '#faf7f1', ink: '#17130c', radius: 16,
    fontDisplay: 'Fraunces', fontBody: 'Inter', mode: 'light' as const,
  },
  site: {
    name: 'TCV Bazaar',
    tagline: 'Where Gwalior Celebrates Together',
    seo: {
      title: 'TCV Bazaar 2026 — Diwali Edition | Gwalior\'s Premium Exhibition',
      description: 'TCV Bazaar is Gwalior\'s premium exhibition & event platform. Book stalls for the Diwali Edition, 23–25 October 2026 at Keshar Towers, Gwalior.',
      keywords: 'TCV Bazaar, Gwalior exhibition, Diwali bazaar, stall booking, Keshar Towers',
    },
    contact: {
      phones: ['+91 7999166397', '+91 9826496138'],
      email: 'thecityvibes.marketing@gmail.com',
      address: 'Keshar Towers, Gwalior, Madhya Pradesh',
    },
    social: {
      instagram: 'https://instagram.com/thecityvibes',
      whatsapp: 'https://wa.me/917999166397',
      phone: '+917999166397',
    },
  },
  brand: {
    logoLight: OFFICIAL_LOGO_URL,
    logoDark: OFFICIAL_LOGO_URL,
    logoMobile: OFFICIAL_LOGO_URL,
    favicon: OFFICIAL_FAVICON_URL,
    heightDesktop: 44,
    heightMobile: 40,
    position: 'left' as const,
  },
  hero: {
    heading: 'Where Gwalior',
    highlight: 'Celebrates Together',
    subheading: 'Gwalior\'s premium exhibition & event platform — three magical Diwali nights of shopping, food, music and celebration at Keshar Towers.',
    videoDataUrl: '',
    poster: galleryImage('DSC_4272.JPG'),
    overlay: 0.55,
    showCountdown: true,
    autoplay: true,
    muted: true,
    loop: true,
    playOnMobile: true,
    enabled: true,
    visible: true,
  },
  event: {
    name: 'TCV Bazaar 2026',
    edition: 'Diwali Edition',
    venue: 'Keshar Towers',
    city: 'Gwalior',
    datesLabel: '23 · 24 · 25 October 2026',
    startISO: '2026-10-23T10:00:00+05:30',
    endISO: '2026-10-25T22:00:00+05:30',
  },
  packages: [
    { id: 'premium', name: 'Premium Tent', price: 40000, size: '10 × 10 ft', tag: 'Hot Spot', popular: true, enabled: true, features: ['Prime hot-spot location', '4 Tables + 2 Chairs', '10×8 ft Branding Banner', 'Tea / Coffee service', 'Dedicated electric point', '3 Collaboration Reels'] },
    { id: 'standard', name: 'Standard Tent', price: 30000, size: '10 × 10 ft', tag: 'Best Seller', popular: false, enabled: true, features: ['4 Tables + 2 Chairs', 'Tea / Coffee service', 'Dedicated electric point', '1 Collaboration Reel'] },
    { id: 'sharing', name: 'Standard Sharing Tent', price: 17000, size: 'Shared 10 × 10 ft', tag: 'Value Pick', popular: false, enabled: true, features: ['Shared premium tent', '2 Tables + 1 Chair', 'Tea / Coffee service', 'Dedicated electric point', '1 Collaboration Reel'] },
    { id: 'tabler', name: 'Tabler', price: 15000, size: 'Open Row', tag: 'Compact', popular: false, enabled: true, features: ['2 Tables + 1 Chair', 'Tea / Coffee service', 'Dedicated electric point', '1 Collaboration Reel'] },
    { id: 'branding', name: 'Branding Spot', price: 5000, size: '10 × 8 ft Banner', tag: 'Visibility', popular: false, enabled: true, features: ['10×8 ft branding banner', 'Premium placement', '1 Collaboration Reel'] },
  ] as Pkg[],
  stalls,
  gallery: [
    { id: 'g1', src: galleryImage('DSC_4272.JPG'), title: 'Premium Exhibitor Tent', category: 'Stalls' },
    { id: 'g2', src: galleryImage('DSC_4297.JPG'), title: 'Festive Shopping', category: 'Visitors' },
    { id: 'g3', src: galleryImage('DSC_4705.JPG'), title: 'Lantern Evenings', category: 'Ambience' },
    { id: 'g4', src: galleryImage('DSC_4814.JPG'), title: 'Diwali Fireworks', category: 'Celebration' },
    { id: 'g5', src: galleryImage('DSC_4917.JPG'), title: 'Fairy Light Avenues', category: 'Ambience' },
    { id: 'g6', src: galleryImage('DSC_4925.JPG'), title: 'Festive Artwork', category: 'Decor' },
  ] as GalleryItem[],
  videos: [
    { id: 'v1', title: 'TCV Bazaar 2025 — Aftermovie', poster: galleryImage('DSC_4814.JPG'), src: '', duration: '1:24' },
    { id: 'v2', title: 'Stall Setup Timelapse', poster: galleryImage('DSC_4272.JPG'), src: '', duration: '0:48' },
    { id: 'v3', title: 'Diwali Night Highlights', poster: galleryImage('DSC_4917.JPG'), src: '', duration: '2:10' },
  ] as VideoItem[],
  testimonials: [
    { id: 't1', name: 'Priya Sharma', role: 'Owner, Gwalior Jewels', text: 'TCV Bazaar gave our brand visibility we could never afford otherwise. We sold out our festive collection by day two and collected 300+ genuine leads.', rating: 5 },
    { id: 't2', name: 'Rohan Agrawal', role: 'Founder, Sharma Foods', text: 'The footfall was unbelievable. The organisers handled everything — power, banners, even our social media reels. Booking was completely online and effortless.', rating: 5 },
    { id: 't3', name: 'Ananya Gupta', role: 'Ananya Crafts', text: 'As a home-grown brand, the sharing tent was the perfect start. The premium audience at Keshar Towers truly appreciates handcrafted work.', rating: 5 },
    { id: 't4', name: 'Vikram Singh', role: 'Director, Singh Electronics', text: 'Professional, punctual and premium. The interactive stall map let us pick the exact hot spot we wanted. We are booking again for 2026.', rating: 5 },
    { id: 't5', name: 'Meera Jain', role: 'Meera\'s Boutique', text: 'From payment to invoice, everything was digital and transparent. The customer portal kept us updated at every step. Highly recommended.', rating: 4 },
    { id: 't6', name: 'Arjun Tomar', role: 'Tomar Home Decor', text: 'Three days of non-stop customers. The marketing support reels brought people directly to our stall asking for products by name.', rating: 5 },
  ] as Testimonial[],
  faqs: [
    { id: 'f1', q: 'When and where is TCV Bazaar 2026?', a: 'TCV Bazaar 2026 — Diwali Edition takes place on 23, 24 and 25 October 2026 at Keshar Towers, Gwalior.' },
    { id: 'f2', q: 'How do I book a stall?', a: 'Everything is online: choose your package, pick your stall on the interactive layout, fill in your business details, pay via UPI / QR / bank transfer and upload your payment proof. You will instantly receive a booking ID.' },
    { id: 'f3', q: 'Can I pay 50% advance?', a: 'Yes. You can pay the full amount or a 50% advance. The remaining balance can be paid later from your customer portal before the event.' },
    { id: 'f4', q: 'What is included in my stall package?', a: 'Every package includes tables, chairs, tea/coffee, an electric point and collaboration reels. Premium tents also include a 10×8 branding banner and a hot-spot location.' },
    { id: 'f5', q: 'How do I know my booking is confirmed?', a: 'Once our team verifies your payment proof, your booking status changes to Confirmed in your customer portal, and your invoice, GST invoice and receipt become available for download.' },
    { id: 'f6', q: 'Is GST invoice available?', a: 'Yes. If you provide your GST number during booking, a GST invoice is automatically generated along with your booking.' },
    { id: 'f7', q: 'What is the refund policy?', a: 'Cancellations made 30+ days before the event receive a full refund. Within 30 days the advance is adjusted against a future edition. See the Refund Policy page for details.' },
    { id: 'f8', q: 'Can I choose my exact stall location?', a: 'Yes — our interactive stall layout shows live availability. Click any available stall to reserve it while you complete your booking.' },
  ] as Faq[],
  banks: [
    { id: 'b1', bankName: 'HDFC Bank', holder: 'The City Vibes Marketing', number: '50200045678901', ifsc: 'HDFC0001234', branch: 'City Centre, Gwalior', upi: 'thecityvibes@hdfcbank', qr: '', instructions: 'Please use your Booking ID as the payment remark. Share the screenshot on WhatsApp after payment.', enabled: true, isDefault: true },
  ] as BankAccount[],
  bookings: [] as Booking[],
  media: [] as MediaItem[],
  pages: {
    about: {
      heading: 'Gwalior\'s Premium Exhibition Platform',
      body: 'TCV Bazaar is where Gwalior comes together to celebrate. Born from the city\'s love for festivals, food and craftsmanship, we curate premium exhibition experiences that connect ambitious businesses, beloved brands and thousands of visitors under one glittering roof.\n\nOur Diwali Edition transforms Keshar Towers into three nights of lights — premium tents, curated brands, live performances, food avenues and festive shopping. For exhibitors, we offer end-to-end support: prime stall locations, marketing reels, on-ground logistics and a premium audience that comes ready to shop.\n\nFor visitors, TCV Bazaar is the city\'s most awaited festive tradition — an evening of discovery, celebration and togetherness.',
      image: galleryImage('DSC_4272.JPG'),
    },
    why: {
      heading: 'Why Brands Choose TCV Bazaar',
      body: 'We engineer every edition for one outcome — real business for our exhibitors.',
    },
    privacy: 'TCV Bazaar ("The City Vibes Marketing") respects your privacy. We collect only the information required to process your booking — business details, contact information and payment references.\n\nYour data is used solely for event communication, invoicing and legal compliance. We never sell your information to third parties. Payment proofs are stored securely and accessed only by our verification team.\n\nYou may request correction or deletion of your data anytime by writing to thecityvibes.marketing@gmail.com.',
    refund: 'Cancellations made 30 or more days before the event start date are eligible for a 100% refund of amounts paid.\n\nCancellations made between 15–29 days before the event receive a 50% refund.\n\nCancellations within 14 days of the event are non-refundable; the paid amount may be adjusted against a future edition at the organiser\'s discretion.\n\nApproved refunds are processed to the original payment method within 7–10 working days.',
    terms: 'By booking a stall at TCV Bazaar you agree to the following terms.\n\n1. Stalls are confirmed only after payment verification. 2. Exhibitors must occupy their stall during all event hours. 3. Sub-letting or sharing beyond the booked package is not permitted. 4. Exhibitors are responsible for their own stock, cash and valuables. 5. Prohibited items include firecrackers, alcohol and any unlawful goods. 6. The organiser may reassign stalls in case of layout changes, with prior notice. 7. Force majeure events may lead to rescheduling; bookings carry forward to the new dates.\n\nJurisdiction: Gwalior, Madhya Pradesh.',
  },
  templates: {
    emailConfirmation: 'Dear {name},\n\nThank you for booking {package} at {event}! Your Booking ID is {booking_id}.\n\nStall: {stall}\nAmount Paid: ₹{paid}\nBalance: ₹{balance}\n\nTrack your booking anytime in your customer portal.\n\nWarm regards,\nTeam TCV Bazaar',
    whatsappConfirmation: 'Namaste {name}! 🪔 Your stall {stall} ({package}) at {event} is booked. Booking ID: {booking_id}. Paid: ₹{paid}, Balance: ₹{balance}. Portal: tcvbazaar.com/portal',
  },
  brochureSection: { enabled: true, heading: 'Download Brochure', subheading: 'Get the full deck as a PDF' } as BrochureSection,
  admin: { email: '', twoFactor: false },
  activity: [] as { id: string; text: string; at: string }[],
}

export const useCms = create<CmsState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      patch: (key, value) => set({ [key]: value } as Partial<CmsState>),
      log: (text) =>
        set({ activity: [{ id: `a${Date.now()}`, text, at: new Date().toISOString() }, ...get().activity].slice(0, 60) }),
      upsertBooking: (b) => {
        const list = get().bookings
        const idx = list.findIndex((x) => x.id === b.id)
        set({ bookings: idx >= 0 ? list.map((x) => (x.id === b.id ? b : x)) : [b, ...list] })
      },
      resetAll: () => set({ ...defaultState }),
    }),
    {
      name: 'tcv-cms-v7',
      // Cloud is the source of truth for CMS content. Persist only local-only
      // state so a stale localStorage blob can never mask fresh cloud data on
      // the public site.
      version: 8,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<Pick<CmsState, 'admin' | 'activity' | 'bookings'>>
        return {
          admin: {
            email: state.admin?.email ?? '',
            twoFactor: state.admin?.twoFactor ?? false,
          },
          activity: state.activity ?? [],
          bookings: state.bookings ?? [],
        }
      },
      partialize: (state) => ({
        admin: { email: state.admin.email, twoFactor: state.admin.twoFactor },
        activity: state.activity,
        bookings: state.bookings,
      }),
    },
  ),
)

export const inr = (n: number) => '₹' + n.toLocaleString('en-IN')
export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`
