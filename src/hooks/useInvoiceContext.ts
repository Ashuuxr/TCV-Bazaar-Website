import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  CompanyProfile,
  GstSettings,
  InvoiceSettings,
  InvoiceContext,
} from "@/lib/company.functions";

const EMPTY_COMPANY: CompanyProfile = {
  id: "main",
  legal_name: "",
  business_name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  state_code: "",
  pincode: "",
  country: "India",
  gstin: "",
  pan: "",
  cin: "",
  email: "",
  mobile: "",
  website: "",
  logo_url: "",
  signature_url: "",
  stamp_url: "",
  updated_at: "",
};
const EMPTY_GST: GstSettings = {
  id: "main",
  gst_enabled: true,
  default_rate: 18,
  tax_mode: "cgst_sgst",
  home_state_code: "",
  auto_calculate: true,
  updated_at: "",
};
const EMPTY_INVOICE: InvoiceSettings = {
  id: "main",
  prefix: "TCV",
  format: "{PREFIX}/{FY}/{SEQ}",
  seq_padding: 4,
  reset_yearly: true,
  updated_at: "",
};

/**
 * Load company + GST + invoice settings directly from Supabase (RLS allows anon SELECT).
 * Subscribes to realtime changes so admin edits reflect instantly.
 */
export function useInvoiceContext(): InvoiceContext {
  const [company, setCompany] = useState<CompanyProfile>(EMPTY_COMPANY);
  const [gst, setGst] = useState<GstSettings>(EMPTY_GST);
  const [invoice, setInvoice] = useState<InvoiceSettings>(EMPTY_INVOICE);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [c, g, i] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("company_profile")
          .select(
            "id, legal_name, business_name, address_line1, address_line2, city, state, state_code, pincode, country, website, logo_url, updated_at",
          )
          .eq("id", "main")
          .maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("gst_settings")
          .select("*")
          .eq("id", "main")
          .maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from("invoice_settings")
          .select("*")
          .eq("id", "main")
          .maybeSingle(),
      ]);
      if (cancelled) return;
      if (c.data)
        setCompany({ ...EMPTY_COMPANY, ...(c.data as CompanyProfile) });
      if (g.data) setGst({ ...EMPTY_GST, ...(g.data as GstSettings) });
      if (i.data)
        setInvoice({ ...EMPTY_INVOICE, ...(i.data as InvoiceSettings) });
    };
    load();
    const channel = supabase
      .channel("company-settings-live")

      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "company_profile" },
        load,
      )

      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "gst_settings" },
        load,
      )

      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "invoice_settings" },
        load,
      )
      .subscribe();
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return { company, gst, invoice, nextInvoicePreview: "" };
}
