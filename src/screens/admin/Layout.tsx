import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "@/lib/router-compat";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Globe,
  History,
  Image as ImageIcon,
  Landmark,
  BookOpen,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Package,
  Palette,
  PanelTop,
  Play,
  QrCode,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
  Wallet,
  FileSpreadsheet,
  ShieldCheck,
  ClipboardList,
  Radar,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useHydrated } from "@/lib/use-hydrated";
import { useApplyTheme } from "@/components/Theme";
import { supabase } from "@/integrations/supabase/client";
import {
  useSyncAdminBookings,
  useSyncStallsFromCloud,
  useSyncSiteContent,
  useAutoPushSiteContent,
} from "@/lib/useCloudSync";
import { getMyRoles } from "@/lib/users.functions";
import { useApplyBrand } from "@/lib/useApplyBrand";

const nav = [
  {
    group: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/reports", label: "Reports", icon: FileSpreadsheet },
    ],
  },
  {
    group: "Website",
    items: [
      { to: "/admin/cms", label: "Website CMS", icon: Globe },
      { to: "/admin/media", label: "Media Library", icon: ImageIcon },
      { to: "/admin/theme", label: "Theme Builder", icon: Palette },
      { to: "/admin/logos", label: "Logo Manager", icon: ImageIcon },
      { to: "/admin/hero", label: "Hero Manager", icon: PanelTop },
      { to: "/admin/gallery", label: "Gallery Manager", icon: ImageIcon },
      { to: "/admin/videos", label: "Video Manager", icon: Play },
      { to: "/admin/brochures", label: "Brochure Manager", icon: BookOpen },
      { to: "/admin/seo", label: "SEO Manager", icon: Search },
    ],
  },
  {
    group: "Event & Sales",
    items: [
      { to: "/admin/events", label: "Event Manager", icon: CalendarDays },
      { to: "/admin/packages", label: "Package Manager", icon: Package },
      { to: "/admin/stalls", label: "Stall Manager", icon: LayoutGrid },
      { to: "/admin/bookings", label: "Booking Manager", icon: FileText },
      { to: "/admin/customers", label: "Customer Manager", icon: Users },
      { to: "/admin/payments", label: "Payment Manager", icon: CreditCard },
      { to: "/admin/invoices", label: "Invoice Manager", icon: Wallet },
    ],
  },
  {
    group: "Money & Comms",
    items: [
      { to: "/admin/messages", label: "Contact Messages", icon: Mail },
      { to: "/admin/banks", label: "Bank Manager", icon: Landmark },
      { to: "/admin/banks?tab=qr", label: "QR Manager", icon: QrCode },
      { to: "/admin/banks?tab=upi", label: "UPI Manager", icon: Sparkles },
      {
        to: "/admin/templates?tab=email",
        label: "Email Templates",
        icon: Mail,
      },
      {
        to: "/admin/templates?tab=whatsapp",
        label: "WhatsApp Templates",
        icon: MessageSquare,
      },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/admin/history", label: "Version History", icon: History },
      { to: "/admin/users", label: "User Management", icon: ShieldCheck },
      { to: "/admin/audit", label: "Audit Log", icon: ClipboardList },
      { to: "/admin/company", label: "Company & Billing", icon: Building2 },
      { to: "/admin/tracking", label: "Tracking Pixels", icon: Radar },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  useApplyTheme();
  useApplyBrand();
  useSyncStallsFromCloud();
  useSyncAdminBookings();
  useSyncSiteContent();
  useAutoPushSiteContent();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const nav2 = useNavigate();
  const [authState, setAuthState] = useState<
    "loading" | "in" | "out" | "forbidden"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    const checkAccess = async (
      session: { user?: { email?: string | null } } | null,
    ) => {
      if (!session) {
        if (!cancelled) setAuthState("out");
        return;
      }
      const access = await getMyRoles();
      const allowed =
        access.roles.includes("admin") || access.roles.includes("super_admin");
      if (!cancelled) setAuthState(allowed ? "in" : "forbidden");
    };
    supabase.auth.getSession().then(({ data }) => checkAccess(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void checkAccess(session);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authState === "out") nav2("/admin/login");
  }, [authState, nav2]);
  if (!hydrated || authState === "loading")
    return <div className="min-h-screen" style={{ background: "#faf7f1" }} />;
  if (authState === "out") return <Navigate to="/admin/login" replace />;
  if (authState === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
        <div className="card-lux w-full max-w-md p-8 text-center">
          <ShieldCheck className="mx-auto mb-4 text-red-500" size={34} />
          <h1 className="font-display text-2xl font-medium">Access denied</h1>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Your account is signed in, but it is not authorized to access the
            Admin Console.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => {
                void supabase.auth.signOut();
                nav2("/admin/login");
              }}
              className="btn-gold rounded-full px-5 py-3 text-sm font-semibold"
            >
              Sign out
            </button>
            <NavLink
              to="/"
              className="btn-outline-gold rounded-full px-5 py-3 text-sm font-semibold"
            >
              Public site
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-[var(--line)] bg-[var(--card-bg)] transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--line)] px-5">
          <Logo className="h-9" />
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="h-[calc(100vh-4rem)] space-y-5 overflow-y-auto p-4 pb-20">
          {nav.map((g) => (
            <div key={g.group}>
              <div className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                {g.group}
              </div>
              {g.items.map((i) => (
                <NavLink
                  key={i.label}
                  to={i.to}
                  end={"end" in i ? (i as { end?: boolean }).end : undefined}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                      isActive
                        ? "bg-[var(--gold)] text-[#17130c]"
                        : "text-[var(--ink-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--ink)]"
                    }`
                  }
                >
                  <i.icon size={16} /> {i.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <span className="hidden text-sm text-[var(--ink-soft)] sm:block">
              TCV Bazaar Admin — everything on the public site updates instantly
              from here.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              className="btn-outline-gold rounded-full px-4 py-2 text-xs font-semibold"
            >
              View Website
            </NavLink>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                nav2("/admin/login");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:border-red-400 hover:text-red-500"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
