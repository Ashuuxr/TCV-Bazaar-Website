export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          text: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          text: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          text?: string
        }
        Relationships: []
      }
      banks: {
        Row: {
          account_number: string
          bank_name: string
          branch: string | null
          created_at: string
          enabled: boolean
          holder: string
          id: string
          ifsc: string
          instructions: string | null
          is_default: boolean
          qr_url: string | null
          updated_at: string
          upi: string | null
        }
        Insert: {
          account_number: string
          bank_name: string
          branch?: string | null
          created_at?: string
          enabled?: boolean
          holder: string
          id?: string
          ifsc: string
          instructions?: string | null
          is_default?: boolean
          qr_url?: string | null
          updated_at?: string
          upi?: string | null
        }
        Update: {
          account_number?: string
          bank_name?: string
          branch?: string | null
          created_at?: string
          enabled?: boolean
          holder?: string
          id?: string
          ifsc?: string
          instructions?: string | null
          is_default?: boolean
          qr_url?: string | null
          updated_at?: string
          upi?: string | null
        }
        Relationships: []
      }
      booking_files: {
        Row: {
          booking_id: string
          bucket: string
          created_at: string
          id: string
          kind: string
          path: string
        }
        Insert: {
          booking_id: string
          bucket: string
          created_at?: string
          id?: string
          kind: string
          path: string
        }
        Update: {
          booking_id?: string
          bucket?: string
          created_at?: string
          id?: string
          kind?: string
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_files_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_paid: number
          balance: number
          business: Json
          business_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          customer_id: string | null
          event_id: string | null
          gst_amount: number
          gst_rate: number
          gstin: string | null
          id: string
          invoice_number: string
          method: string | null
          owner_name: string | null
          package_id: string | null
          pay_status: Database["public"]["Enums"]["payment_status"]
          pay_type: Database["public"]["Enums"]["pay_type"]
          proof_url: string | null
          remarks: string | null
          stall_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal: number
          total: number
          txn_id: string | null
          updated_at: string
          utr: string | null
        }
        Insert: {
          amount_paid?: number
          balance?: number
          business?: Json
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          event_id?: string | null
          gst_amount?: number
          gst_rate?: number
          gstin?: string | null
          id?: string
          invoice_number?: string
          method?: string | null
          owner_name?: string | null
          package_id?: string | null
          pay_status?: Database["public"]["Enums"]["payment_status"]
          pay_type?: Database["public"]["Enums"]["pay_type"]
          proof_url?: string | null
          remarks?: string | null
          stall_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          total?: number
          txn_id?: string | null
          updated_at?: string
          utr?: string | null
        }
        Update: {
          amount_paid?: number
          balance?: number
          business?: Json
          business_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string | null
          event_id?: string | null
          gst_amount?: number
          gst_rate?: number
          gstin?: string | null
          id?: string
          invoice_number?: string
          method?: string | null
          owner_name?: string | null
          package_id?: string | null
          pay_status?: Database["public"]["Enums"]["payment_status"]
          pay_type?: Database["public"]["Enums"]["pay_type"]
          proof_url?: string | null
          remarks?: string | null
          stall_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal?: number
          total?: number
          txn_id?: string | null
          updated_at?: string
          utr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_stall_id_fkey"
            columns: ["stall_id"]
            isOneToOne: false
            referencedRelation: "stalls"
            referencedColumns: ["id"]
          },
        ]
      }
      brochure_versions: {
        Row: {
          brochure_id: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          replaced_by: string | null
          title: string | null
        }
        Insert: {
          brochure_id: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          replaced_by?: string | null
          title?: string | null
        }
        Update: {
          brochure_id?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          replaced_by?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brochure_versions_brochure_id_fkey"
            columns: ["brochure_id"]
            isOneToOne: false
            referencedRelation: "brochures"
            referencedColumns: ["id"]
          },
        ]
      }
      brochures: {
        Row: {
          created_at: string
          description: string | null
          event_id: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_active: boolean
          is_archived: boolean
          sort_order: number
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          is_active?: boolean
          is_archived?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_active?: boolean
          is_archived?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brochures_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profile: {
        Row: {
          address_line1: string
          address_line2: string
          business_name: string
          cin: string
          city: string
          country: string
          email: string
          gstin: string
          id: string
          legal_name: string
          logo_url: string
          mobile: string
          pan: string
          pincode: string
          signature_url: string
          stamp_url: string
          state: string
          state_code: string
          updated_at: string
          updated_by: string | null
          website: string
        }
        Insert: {
          address_line1?: string
          address_line2?: string
          business_name?: string
          cin?: string
          city?: string
          country?: string
          email?: string
          gstin?: string
          id?: string
          legal_name?: string
          logo_url?: string
          mobile?: string
          pan?: string
          pincode?: string
          signature_url?: string
          stamp_url?: string
          state?: string
          state_code?: string
          updated_at?: string
          updated_by?: string | null
          website?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string
          business_name?: string
          cin?: string
          city?: string
          country?: string
          email?: string
          gstin?: string
          id?: string
          legal_name?: string
          logo_url?: string
          mobile?: string
          pan?: string
          pincode?: string
          signature_url?: string
          stamp_url?: string
          state?: string
          state_code?: string
          updated_at?: string
          updated_by?: string | null
          website?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          city: string | null
          created_at: string
          dates_label: string | null
          edition: string | null
          end_at: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          start_at: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          dates_label?: string | null
          edition?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          start_at?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          dates_label?: string | null
          edition?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          start_at?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      gst_settings: {
        Row: {
          auto_calculate: boolean
          default_rate: number
          gst_enabled: boolean
          home_state_code: string
          id: string
          tax_mode: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_calculate?: boolean
          default_rate?: number
          gst_enabled?: boolean
          home_state_code?: string
          id?: string
          tax_mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_calculate?: boolean
          default_rate?: number
          gst_enabled?: boolean
          home_state_code?: string
          id?: string
          tax_mode?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      invoice_counters: {
        Row: {
          fy: string
          next_seq: number
        }
        Insert: {
          fy: string
          next_seq?: number
        }
        Update: {
          fy?: string
          next_seq?: number
        }
        Relationships: []
      }
      invoice_settings: {
        Row: {
          format: string
          id: string
          prefix: string
          reset_yearly: boolean
          seq_padding: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          format?: string
          id?: string
          prefix?: string
          reset_yearly?: boolean
          seq_padding?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          format?: string
          id?: string
          prefix?: string
          reset_yearly?: boolean
          seq_padding?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          enabled: boolean
          event_id: string | null
          features: string[]
          id: string
          name: string
          popular: boolean
          price: number
          size: string | null
          sort_order: number
          tag: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          event_id?: string | null
          features?: string[]
          id: string
          name: string
          popular?: boolean
          price: number
          size?: string | null
          sort_order?: number
          tag?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          event_id?: string | null
          features?: string[]
          id?: string
          name?: string
          popular?: boolean
          price?: number
          size?: string | null
          sort_order?: number
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gstin: string | null
          id: string
          is_owner: boolean
          owner_name: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gstin?: string | null
          id: string
          is_owner?: boolean
          owner_name?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gstin?: string | null
          id?: string
          is_owner?: boolean
          owner_name?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content_versions: {
        Row: {
          author_email: string | null
          author_id: string | null
          changed_modules: string[]
          content_id: string
          created_at: string
          data: Json
          id: string
          reason: string | null
          restored_from_version_id: string | null
          source: string
        }
        Insert: {
          author_email?: string | null
          author_id?: string | null
          changed_modules?: string[]
          content_id: string
          created_at?: string
          data: Json
          id?: string
          reason?: string | null
          restored_from_version_id?: string | null
          source?: string
        }
        Update: {
          author_email?: string | null
          author_id?: string | null
          changed_modules?: string[]
          content_id?: string
          created_at?: string
          data?: Json
          id?: string
          reason?: string | null
          restored_from_version_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_content_versions_restored_from_version_id_fkey"
            columns: ["restored_from_version_id"]
            isOneToOne: false
            referencedRelation: "site_content_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      stalls: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          customer_name: string | null
          event_id: string
          h: number
          held_by: string | null
          held_until: string | null
          id: string
          label: string
          notes: string | null
          pkg_id: string | null
          price_override: number | null
          sort_order: number
          status: Database["public"]["Enums"]["stall_status"]
          updated_at: string
          w: number
          x: number
          y: number
          zone: string | null
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          customer_name?: string | null
          event_id: string
          h?: number
          held_by?: string | null
          held_until?: string | null
          id: string
          label: string
          notes?: string | null
          pkg_id?: string | null
          price_override?: number | null
          sort_order?: number
          status?: Database["public"]["Enums"]["stall_status"]
          updated_at?: string
          w?: number
          x?: number
          y?: number
          zone?: string | null
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          customer_name?: string | null
          event_id?: string
          h?: number
          held_by?: string | null
          held_until?: string | null
          id?: string
          label?: string
          notes?: string | null
          pkg_id?: string | null
          price_override?: number | null
          sort_order?: number
          status?: Database["public"]["Enums"]["stall_status"]
          updated_at?: string
          w?: number
          x?: number
          y?: number
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stalls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stalls_pkg_id_fkey"
            columns: ["pkg_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_integrations: {
        Row: {
          config: Json
          created_at: string
          custom_code: string | null
          enabled: boolean
          id: string
          load_on_admin: boolean
          provider: Database["public"]["Enums"]["tracking_provider"]
          tracking_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          custom_code?: string | null
          enabled?: boolean
          id?: string
          load_on_admin?: boolean
          provider: Database["public"]["Enums"]["tracking_provider"]
          tracking_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          custom_code?: string | null
          enabled?: boolean
          id?: string
          load_on_admin?: boolean
          provider?: Database["public"]["Enums"]["tracking_provider"]
          tracking_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          from_role: Database["public"]["Enums"]["app_role"] | null
          id: string
          metadata: Json
          target_email: string | null
          target_id: string | null
          to_role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          from_role?: Database["public"]["Enums"]["app_role"] | null
          id?: string
          metadata?: Json
          target_email?: string | null
          target_id?: string | null
          to_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          from_role?: Database["public"]["Enums"]["app_role"] | null
          id?: string
          metadata?: Json
          target_email?: string | null
          target_id?: string | null
          to_role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_active_super_admins: { Args: never; Returns: number }
      current_fy: { Args: never; Returns: string }
      delete_stall_safe: { Args: { _stall_id: string }; Returns: undefined }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_billing_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_last_super_admin: { Args: { _user_id: string }; Returns: boolean }
      issue_invoice_number: { Args: never; Returns: string }
      log_user_audit: {
        Args: {
          _action: string
          _from_role?: Database["public"]["Enums"]["app_role"]
          _metadata?: Json
          _target_email: string
          _target_id: string
          _to_role?: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      preview_next_invoice_number: { Args: never; Returns: string }
      reset_invoice_series: { Args: { _fy?: string }; Returns: undefined }
      restore_site_content_version: {
        Args: { _reason?: string; _version_id: string }
        Returns: undefined
      }
      save_site_content: {
        Args: { _data: Json; _reason?: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "customer"
        | "super_admin"
        | "manager"
        | "editor"
        | "finance"
      booking_status: "pending" | "approved" | "rejected" | "cancelled"
      pay_type: "full" | "advance"
      payment_status: "pending" | "partial" | "paid" | "refunded"
      stall_status:
        | "available"
        | "held"
        | "reserved"
        | "pending"
        | "booked"
        | "sold"
        | "blocked"
      tracking_provider:
        | "meta_pixel"
        | "ga4"
        | "gtm"
        | "google_ads"
        | "clarity"
        | "tiktok"
        | "linkedin"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "customer",
        "super_admin",
        "manager",
        "editor",
        "finance",
      ],
      booking_status: ["pending", "approved", "rejected", "cancelled"],
      pay_type: ["full", "advance"],
      payment_status: ["pending", "partial", "paid", "refunded"],
      stall_status: [
        "available",
        "held",
        "reserved",
        "pending",
        "booked",
        "sold",
        "blocked",
      ],
      tracking_provider: [
        "meta_pixel",
        "ga4",
        "gtm",
        "google_ads",
        "clarity",
        "tiktok",
        "linkedin",
        "custom",
      ],
    },
  },
} as const
