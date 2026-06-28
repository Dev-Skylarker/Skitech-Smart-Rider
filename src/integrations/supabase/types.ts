export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          display_name: string | null
          phone: string | null
          vehicle_type: string | null
          plate_number: string | null
          route: string | null
          city: string | null
          bio: string | null
          photo_url: string | null
          qr_slug: string
          status: 'draft' | 'pending_payment' | 'active' | 'suspended'
          trust_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          display_name?: string | null
          phone?: string | null
          vehicle_type?: string | null
          plate_number?: string | null
          route?: string | null
          city?: string | null
          bio?: string | null
          photo_url?: string | null
          qr_slug?: string
          status?: 'draft' | 'pending_payment' | 'active' | 'suspended'
          trust_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          display_name?: string | null
          phone?: string | null
          vehicle_type?: string | null
          plate_number?: string | null
          route?: string | null
          city?: string | null
          bio?: string | null
          photo_url?: string | null
          qr_slug?: string
          status?: 'draft' | 'pending_payment' | 'active' | 'suspended'
          trust_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'user'
          created_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          id: string
          profile_id: string
          method_type: 'mpesa' | 'send_money' | 'till' | 'paybill' | 'bank' | 'pochi_la_biashara' | 'other'
          label: string | null
          account_name: string | null
          account_number: string | null
          paybill_number: string | null
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          method_type: 'mpesa' | 'send_money' | 'till' | 'paybill' | 'bank' | 'pochi_la_biashara' | 'other'
          label?: string | null
          account_name?: string | null
          account_number?: string | null
          paybill_number?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          method_type?: 'mpesa' | 'send_money' | 'till' | 'paybill' | 'bank' | 'pochi_la_biashara' | 'other'
          label?: string | null
          account_name?: string | null
          account_number?: string | null
          paybill_number?: string | null
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payment_methods_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      profile_orders: {
        Row: {
          id: string
          profile_id: string
          amount_kes: number
          status: 'pending' | 'paid' | 'failed'
          payment_ref: string | null
          created_at: string
          paid_at: string | null
          confirmed_by: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          amount_kes?: number
          status?: 'pending' | 'paid' | 'failed'
          payment_ref?: string | null
          created_at?: string
          paid_at?: string | null
          confirmed_by?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          amount_kes?: number
          status?: 'pending' | 'paid' | 'failed'
          payment_ref?: string | null
          created_at?: string
          paid_at?: string | null
          confirmed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profile_orders_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      shop_items: {
        Row: {
          id: string
          name: string
          description: string | null
          price_kes: number
          cover_image: string | null
          gallery_images: string[]
          in_stock: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_kes: number
          cover_image?: string | null
          gallery_images?: string[]
          in_stock?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price_kes?: number
          cover_image?: string | null
          gallery_images?: string[]
          in_stock?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          shop_item_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_item_id: string
          quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shop_item_id?: string
          quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cart_items_shop_item_id_fkey'
            columns: ['shop_item_id']
            isOneToOne: false
            referencedRelation: 'shop_items'
            referencedColumns: ['id']
          }
        ]
      }
      shop_orders: {
        Row: {
          id: string
          user_id: string
          items_snapshot: Json
          total_kes: number
          status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          tracking_note: string | null
          created_at: string
          paid_at: string | null
          shipped_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          items_snapshot: Json
          total_kes: number
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          tracking_note?: string | null
          created_at?: string
          paid_at?: string | null
          shipped_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          items_snapshot?: Json
          total_kes?: number
          status?: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
          tracking_note?: string | null
          created_at?: string
          paid_at?: string | null
          shipped_at?: string | null
        }
        Relationships: []
      }
      rider_reports: {
        Row: {
          id: string
          rider_profile_id: string
          reporter_name: string
          reporter_email: string
          remarks: string | null
          emailjs_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          rider_profile_id: string
          reporter_name?: string
          reporter_email?: string
          remarks?: string | null
          emailjs_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          rider_profile_id?: string
          reporter_name?: string
          reporter_email?: string
          remarks?: string | null
          emailjs_sent?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rider_reports_rider_profile_id_fkey'
            columns: ['rider_profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      merch_orders: {
        Row: {
          id: string
          profile_id: string
          amount_kes: number
          status: string
          created_at: string
          paid_at: string | null
          printed_at: string | null
          shipped_at: string | null
          tracking_note: string | null
          confirmed_by: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          amount_kes?: number
          status?: string
          created_at?: string
          paid_at?: string | null
          printed_at?: string | null
          shipped_at?: string | null
          tracking_note?: string | null
          confirmed_by?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          amount_kes?: number
          status?: string
          created_at?: string
          paid_at?: string | null
          printed_at?: string | null
          shipped_at?: string | null
          tracking_note?: string | null
          confirmed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'merch_orders_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { _role: 'admin' | 'user'; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: 'admin' | 'user'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'user'],
    },
  },
} as const
