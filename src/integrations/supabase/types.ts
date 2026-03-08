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
      booking_custom_fields: {
        Row: {
          booking_id: string
          field_id: string
          field_value: string
          id: string
        }
        Insert: {
          booking_id: string
          field_id: string
          field_value?: string
          id?: string
        }
        Update: {
          booking_id?: string
          field_id?: string
          field_value?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_custom_fields_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_custom_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "category_checkout_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string
          amount: number
          booking_date: string
          booking_time: string
          city_id: string | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          provider_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          service_id: string
          serviceman_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address: string
          amount?: number
          booking_date: string
          booking_time: string
          city_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          service_id: string
          serviceman_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          amount?: number
          booking_date?: string
          booking_time?: string
          city_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          service_id?: string
          serviceman_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_serviceman_id_fkey"
            columns: ["serviceman_id"]
            isOneToOne: false
            referencedRelation: "servicemen"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_item_addons: {
        Row: {
          addon_id: string
          cart_item_id: string
          id: string
        }
        Insert: {
          addon_id: string
          cart_item_id: string
          id?: string
        }
        Update: {
          addon_id?: string
          cart_item_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_item_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "service_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_item_addons_cart_item_id_fkey"
            columns: ["cart_item_id"]
            isOneToOne: false
            referencedRelation: "cart_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      category_checkout_fields: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          options: Json | null
          placeholder: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number
          field_label: string
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          placeholder?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          placeholder?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_checkout_fields_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount: number | null
          min_order_amount: number
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_order_amount?: number
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line: string
          city_id: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          pincode: string | null
          user_id: string
        }
        Insert: {
          address_line: string
          city_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          pincode?: string | null
          user_id: string
        }
        Update: {
          address_line?: string
          city_id?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          pincode?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          permissions: string[] | null
          phone: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          id?: string
          name: string
          permissions?: string[] | null
          phone?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          permissions?: string[] | null
          phone?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          base_price: number
          created_at: string
          id: string
          is_active: boolean
          linked_field_name: string | null
          max_units: number | null
          min_units: number | null
          rule_type: string
          service_id: string
          unit_label: string
          unit_price: number
        }
        Insert: {
          base_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          linked_field_name?: string | null
          max_units?: number | null
          min_units?: number | null
          rule_type?: string
          service_id: string
          unit_label?: string
          unit_price?: number
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          linked_field_name?: string | null
          max_units?: number | null
          min_units?: number | null
          rule_type?: string
          service_id?: string
          unit_label?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotional_banners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      provider_availability: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          is_available: boolean
          max_bookings_per_slot: number
          note: string | null
          provider_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string
          id?: string
          is_available?: boolean
          max_bookings_per_slot?: number
          note?: string | null
          provider_id: string
          start_time?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          is_available?: boolean
          max_bookings_per_slot?: number
          note?: string | null
          provider_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_availability_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          city_id: string | null
          company_name: string
          created_at: string
          email: string
          id: string
          owner_name: string
          phone: string | null
          rating: number | null
          status: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city_id?: string | null
          company_name: string
          created_at?: string
          email: string
          id?: string
          owner_name: string
          phone?: string | null
          rating?: number | null
          status?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city_id?: string | null
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          owner_name?: string
          phone?: string | null
          rating?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          provider_id: string
          rating: number
          serviceman_id: string | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          provider_id: string
          rating: number
          serviceman_id?: string | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          provider_id?: string
          rating?: number
          serviceman_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_serviceman_id_fkey"
            columns: ["serviceman_id"]
            isOneToOne: false
            referencedRelation: "servicemen"
            referencedColumns: ["id"]
          },
        ]
      }
      service_addons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          service_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          service_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_addons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          category_type: string
          commission_rate: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
        }
        Insert: {
          category_type?: string
          commission_rate?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
        }
        Update: {
          category_type?: string
          commission_rate?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      service_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_variants: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          id: string
          is_active: boolean
          name: string
          price: number
          service_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          service_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_variants_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      servicemen: {
        Row: {
          completed_jobs: number | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          provider_id: string
          rating: number | null
          skills: string[] | null
          status: string
          user_id: string
        }
        Insert: {
          completed_jobs?: number | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          provider_id: string
          rating?: number | null
          skills?: string[] | null
          status?: string
          user_id: string
        }
        Update: {
          completed_jobs?: number | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          provider_id?: string
          rating?: number | null
          skills?: string[] | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicemen_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string
          city_id: string | null
          created_at: string
          description: string | null
          duration: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          provider_id: string
          rating: number | null
          review_count: number | null
          subcategory_id: string | null
        }
        Insert: {
          category_id: string
          city_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          provider_id: string
          rating?: number | null
          review_count?: number | null
          subcategory_id?: string | null
        }
        Update: {
          category_id?: string
          city_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          provider_id?: string
          rating?: number | null
          review_count?: number | null
          subcategory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "service_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "employee" | "customer" | "provider" | "serviceman"
      booking_status:
        | "pending"
        | "accepted"
        | "assigned"
        | "on_the_way"
        | "started"
        | "completed"
        | "cancelled"
      payment_status: "pending" | "paid" | "refunded"
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
      app_role: ["admin", "employee", "customer", "provider", "serviceman"],
      booking_status: [
        "pending",
        "accepted",
        "assigned",
        "on_the_way",
        "started",
        "completed",
        "cancelled",
      ],
      payment_status: ["pending", "paid", "refunded"],
    },
  },
} as const
