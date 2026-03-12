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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      addons: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          name_bn: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          name_bn?: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          name_bn?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          addon_id: string | null
          amount: number
          bkash_phone: string | null
          bkash_transaction_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_method: string
          shop_id: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          addon_id?: string | null
          amount: number
          bkash_phone?: string | null
          bkash_transaction_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          shop_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          addon_id?: string | null
          amount?: number
          bkash_phone?: string | null
          bkash_transaction_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string
          shop_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_records_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "shop_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_addons: {
        Row: {
          activated_at: string | null
          addon_id: string
          created_at: string
          expires_at: string | null
          id: string
          shop_id: string
          status: Database["public"]["Enums"]["addon_status"]
        }
        Insert: {
          activated_at?: string | null
          addon_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          shop_id: string
          status?: Database["public"]["Enums"]["addon_status"]
        }
        Update: {
          activated_at?: string | null
          addon_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          shop_id?: string
          status?: Database["public"]["Enums"]["addon_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shop_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_addons_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_customers: {
        Row: {
          address: string
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          photo: string | null
          shop_id: string
        }
        Insert: {
          address?: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string
          photo?: string | null
          shop_id: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          photo?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_customers_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          advance_paid: number
          assigned_to: string | null
          created_at: string
          customer_id: string
          delivery_date: string | null
          due_amount: number
          id: string
          measurements: Json
          product_id: string
          quantity: number
          shop_id: string
          special_notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          unit_price: number
        }
        Insert: {
          advance_paid?: number
          assigned_to?: string | null
          created_at?: string
          customer_id: string
          delivery_date?: string | null
          due_amount?: number
          id?: string
          measurements?: Json
          product_id: string
          quantity?: number
          shop_id: string
          special_notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          unit_price?: number
        }
        Update: {
          advance_paid?: number
          assigned_to?: string | null
          created_at?: string
          customer_id?: string
          delivery_date?: string | null
          due_amount?: number
          id?: string
          measurements?: Json
          product_id?: string
          quantity?: number
          shop_id?: string
          special_notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "shop_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "shop_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_products: {
        Row: {
          base_price: number
          category: string
          created_at: string
          id: string
          image: string | null
          measurement_fields: Json
          name: string
          name_bn: string
          shop_id: string
        }
        Insert: {
          base_price?: number
          category?: string
          created_at?: string
          id?: string
          image?: string | null
          measurement_fields?: Json
          name: string
          name_bn?: string
          shop_id: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          id?: string
          image?: string | null
          measurement_fields?: Json
          name?: string
          name_bn?: string
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_roles: {
        Row: {
          created_at: string
          id: string
          name: string
          name_bn: string
          permissions: Json
          shop_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          name_bn?: string
          permissions?: Json
          shop_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          name_bn?: string
          permissions?: Json
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_roles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_settings: {
        Row: {
          created_at: string
          currency: string
          default_advance_percent: number
          enable_print_auto_open: boolean
          enable_sms: boolean
          id: string
          invoice_prefix: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          default_advance_percent?: number
          enable_print_auto_open?: boolean
          enable_sms?: boolean
          id?: string
          invoice_prefix?: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          default_advance_percent?: number
          enable_print_auto_open?: boolean
          enable_sms?: boolean
          id?: string
          invoice_prefix?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_settings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: true
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
          role: string
          role_id: string | null
          salary_amount: number
          shop_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string
          role?: string
          role_id?: string | null
          salary_amount?: number
          shop_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          role?: string
          role_id?: string | null
          salary_amount?: number
          shop_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_staff_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "shop_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_staff_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          orders_used_this_month: number
          plan_id: string
          shop_id: string
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          orders_used_this_month?: number
          plan_id: string
          shop_id: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          orders_used_this_month?: number
          plan_id?: string
          shop_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "shop_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_subscriptions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          name_bn: string | null
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          name_bn?: string | null
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          name_bn?: string | null
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      staff_salary_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          month: string
          notes: string | null
          payment_date: string
          shop_id: string
          staff_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          month: string
          notes?: string | null
          payment_date?: string
          shop_id: string
          staff_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          month?: string
          notes?: string | null
          payment_date?: string
          shop_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_salary_payments_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_salary_payments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "shop_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          is_active: boolean
          max_orders_per_month: number | null
          name: string
          name_bn: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          max_orders_per_month?: number | null
          name: string
          name_bn: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          max_orders_per_month?: number | null
          name?: string
          name_bn?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_staff_permissions: { Args: { _user_id: string }; Returns: Json }
      get_staff_shop_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_shop_staff: {
        Args: { _shop_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      addon_status: "pending_payment" | "active" | "expired"
      app_role: "super_admin" | "shop_admin"
      order_status:
        | "pending"
        | "in_production"
        | "ready"
        | "delivered"
        | "cancelled"
      payment_status: "pending" | "verified" | "rejected"
      subscription_status:
        | "active"
        | "expired"
        | "cancelled"
        | "pending_payment"
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
      addon_status: ["pending_payment", "active", "expired"],
      app_role: ["super_admin", "shop_admin"],
      order_status: [
        "pending",
        "in_production",
        "ready",
        "delivered",
        "cancelled",
      ],
      payment_status: ["pending", "verified", "rejected"],
      subscription_status: [
        "active",
        "expired",
        "cancelled",
        "pending_payment",
      ],
    },
  },
} as const
