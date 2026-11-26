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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          complement: string | null
          created_at: string
          id: string
          is_default: boolean
          neighborhood_id: string
          number: string
          state: string
          street: string
          tenant_id: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          neighborhood_id: string
          number: string
          state?: string
          street: string
          tenant_id?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          city?: string
          complement?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          neighborhood_id?: string
          number?: string
          state?: string
          street?: string
          tenant_id?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          category: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: number
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: number
          tenant_id?: string
          title: string
          type?: string
        }
        Update: {
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: number
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_config: {
        Row: {
          enabled: boolean
          id: string
          key: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          key: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_reasons: {
        Row: {
          cached_at: string
          description: string
          id: string
          merchant_id: string | null
          order_external_id: string | null
          reason_code: string
          tenant_id: string
        }
        Insert: {
          cached_at?: string
          description: string
          id?: string
          merchant_id?: string | null
          order_external_id?: string | null
          reason_code: string
          tenant_id?: string
        }
        Update: {
          cached_at?: string
          description?: string
          id?: string
          merchant_id?: string | null
          order_external_id?: string | null
          reason_code?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_reasons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_reasons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          cash_register_id: string
          created_at: string
          description: string | null
          drawer_opened: boolean
          id: string
          order_id: string | null
          payment_method: string
          tenant_id: string
          type: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          created_at?: string
          description?: string | null
          drawer_opened?: boolean
          id?: string
          order_id?: string | null
          payment_method: string
          tenant_id?: string
          type: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          created_at?: string
          description?: string | null
          drawer_opened?: boolean
          id?: string
          order_id?: string | null
          payment_method?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_kitchen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          closed_at: string | null
          closing_balance: number | null
          created_at: string
          expected_balance: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_balance: number
          status: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          expected_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          status?: string
          tenant_id?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closing_balance?: number | null
          created_at?: string
          expected_balance?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          status?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_registers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number
          icon: string
          id: string
          is_active: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      closed_dates: {
        Row: {
          created_at: string
          created_by: string | null
          date_end: string
          date_start: string
          id: string
          reason: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_end: string
          date_start: string
          id?: string
          reason?: string | null
          tenant_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_end?: string
          date_start?: string
          id?: string
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "closed_dates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "closed_dates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          contact_person: string | null
          created_at: string
          id: string
          is_active: boolean
          monthly_limit: number
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_limit?: number
          name: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_limit?: number
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_complement: string | null
          address_number: string | null
          address_street: string | null
          created_at: string
          id: string
          last_order_at: string | null
          name: string
          neighborhood: string | null
          phone: string
          tenant_id: string
          total_orders: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          address_complement?: string | null
          address_number?: string | null
          address_street?: string | null
          created_at?: string
          id?: string
          last_order_at?: string | null
          name: string
          neighborhood?: string | null
          phone: string
          tenant_id?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          address_complement?: string | null
          address_number?: string | null
          address_street?: string | null
          created_at?: string
          id?: string
          last_order_at?: string | null
          name?: string
          neighborhood?: string | null
          phone?: string
          tenant_id?: string
          total_orders?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          correlation_id: string | null
          created_at: string
          delivery_fee: number | null
          estimated_time: number | null
          id: string
          last_event_at: string | null
          merchant_id: string
          order_id: string | null
          pickup_code: string | null
          quote_id: string | null
          raw_payload: Json | null
          shipping_id: string | null
          status: string
          store_id: string | null
          tenant_id: string
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          delivery_fee?: number | null
          estimated_time?: number | null
          id?: string
          last_event_at?: string | null
          merchant_id: string
          order_id?: string | null
          pickup_code?: string | null
          quote_id?: string | null
          raw_payload?: Json | null
          shipping_id?: string | null
          status?: string
          store_id?: string | null
          tenant_id?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          delivery_fee?: number | null
          estimated_time?: number | null
          id?: string
          last_event_at?: string | null
          merchant_id?: string
          order_id?: string | null
          pickup_code?: string | null
          quote_id?: string | null
          raw_payload?: Json | null
          shipping_id?: string | null
          status?: string
          store_id?: string | null
          tenant_id?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_expenses: {
        Row: {
          amount: number
          cash_register_id: string | null
          created_at: string
          description: string | null
          id: string
          order_id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          cash_register_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id: string
          tenant_id?: string
        }
        Update: {
          amount?: number
          cash_register_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_expenses_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_expenses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_expenses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_kitchen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ifood_config: {
        Row: {
          access_token: string | null
          auto_confirm: boolean
          client_id: string | null
          client_secret: string | null
          created_at: string
          id: string
          last_polling_at: string | null
          merchant_id: string | null
          polling_enabled: boolean
          refresh_token: string | null
          store_id: string | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string
          user_code: string | null
          user_code_expires_at: string | null
          user_code_verifier: string | null
          verification_url: string | null
        }
        Insert: {
          access_token?: string | null
          auto_confirm?: boolean
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          last_polling_at?: string | null
          merchant_id?: string | null
          polling_enabled?: boolean
          refresh_token?: string | null
          store_id?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string
          user_code?: string | null
          user_code_expires_at?: string | null
          user_code_verifier?: string | null
          verification_url?: string | null
        }
        Update: {
          access_token?: string | null
          auto_confirm?: boolean
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          last_polling_at?: string | null
          merchant_id?: string | null
          polling_enabled?: boolean
          refresh_token?: string | null
          store_id?: string | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string
          user_code?: string | null
          user_code_expires_at?: string | null
          user_code_verifier?: string | null
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ifood_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ifood_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ifood_event_log: {
        Row: {
          error: string | null
          event_id: string
          event_type: string | null
          id: string
          order_external_id: string | null
          payload: Json | null
          processed_at: string
        }
        Insert: {
          error?: string | null
          event_id: string
          event_type?: string | null
          id?: string
          order_external_id?: string | null
          payload?: Json | null
          processed_at?: string
        }
        Update: {
          error?: string | null
          event_id?: string
          event_type?: string | null
          id?: string
          order_external_id?: string | null
          payload?: Json | null
          processed_at?: string
        }
        Relationships: []
      }
      ifood_polling_acks: {
        Row: {
          acked_at: string
          event_id: string
        }
        Insert: {
          acked_at?: string
          event_id: string
        }
        Update: {
          acked_at?: string
          event_id?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          min_stock: number
          name: string
          stock_quantity: number
          tenant_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          stock_quantity?: number
          tenant_id?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          stock_quantity?: number
          tenant_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          created_at: string
          delivery_fee: number
          id: string
          is_active: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          id?: string
          is_active?: boolean
          name: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighborhoods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      option_groups: {
        Row: {
          created_at: string
          display_order: number
          id: string
          max_select: number
          min_select: number
          name: string
          product_id: string
          required: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          max_select?: number
          min_select?: number
          name: string
          product_id: string
          required?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          max_select?: number
          min_select?: number
          name?: string
          product_id?: string
          required?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_groups_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          created_at: string
          display_order: number
          group_id: string
          id: string
          is_active: boolean
          name: string
          price_delta: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          group_id: string
          id?: string
          is_active?: boolean
          name: string
          price_delta?: number
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          group_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price_delta?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          cash_change: number | null
          company_id: string | null
          created_at: string
          delivery_fee: number
          delivery_type: string | null
          external_data: Json | null
          external_id: string | null
          guest_address_complement: string | null
          guest_address_number: string | null
          guest_address_street: string | null
          guest_name: string | null
          guest_neighborhood_name: string | null
          guest_phone: string | null
          id: string
          ifood_address_change_request: Json | null
          ifood_cancel_request: Json | null
          ifood_event_type: string | null
          ifood_pickup_code: string | null
          ifood_pickup_code_required: boolean
          items: Json
          neighborhood_id: string | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pix_bank_name: string | null
          pix_fraud_signals: string[] | null
          pix_gateway_id: string | null
          pix_human_verified: string | null
          pix_paid_at: string | null
          pix_receipt_url: string | null
          pix_transaction_id: string | null
          pix_validation_confidence: number | null
          pix_validation_status: string | null
          prep_finished_at: string | null
          prep_started_at: string | null
          source: string
          status: string
          subtotal: number
          tenant_id: string
          total: number
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          cash_change?: number | null
          company_id?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_type?: string | null
          external_data?: Json | null
          external_id?: string | null
          guest_address_complement?: string | null
          guest_address_number?: string | null
          guest_address_street?: string | null
          guest_name?: string | null
          guest_neighborhood_name?: string | null
          guest_phone?: string | null
          id?: string
          ifood_address_change_request?: Json | null
          ifood_cancel_request?: Json | null
          ifood_event_type?: string | null
          ifood_pickup_code?: string | null
          ifood_pickup_code_required?: boolean
          items: Json
          neighborhood_id?: string | null
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          pix_bank_name?: string | null
          pix_fraud_signals?: string[] | null
          pix_gateway_id?: string | null
          pix_human_verified?: string | null
          pix_paid_at?: string | null
          pix_receipt_url?: string | null
          pix_transaction_id?: string | null
          pix_validation_confidence?: number | null
          pix_validation_status?: string | null
          prep_finished_at?: string | null
          prep_started_at?: string | null
          source?: string
          status?: string
          subtotal: number
          tenant_id?: string
          total: number
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          cash_change?: number | null
          company_id?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_type?: string | null
          external_data?: Json | null
          external_id?: string | null
          guest_address_complement?: string | null
          guest_address_number?: string | null
          guest_address_street?: string | null
          guest_name?: string | null
          guest_neighborhood_name?: string | null
          guest_phone?: string | null
          id?: string
          ifood_address_change_request?: Json | null
          ifood_cancel_request?: Json | null
          ifood_event_type?: string | null
          ifood_pickup_code?: string | null
          ifood_pickup_code_required?: boolean
          items?: Json
          neighborhood_id?: string | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          pix_bank_name?: string | null
          pix_fraud_signals?: string[] | null
          pix_gateway_id?: string | null
          pix_human_verified?: string | null
          pix_paid_at?: string | null
          pix_receipt_url?: string | null
          pix_transaction_id?: string | null
          pix_validation_confidence?: number | null
          pix_validation_status?: string | null
          prep_finished_at?: string | null
          prep_started_at?: string | null
          source?: string
          status?: string
          subtotal?: number
          tenant_id?: string
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_consumption"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "orders_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      print_logs: {
        Row: {
          created_at: string
          id: string
          item_key: string | null
          order_number: string | null
          printer_type: string
          reference_id: string
          reference_type: string
          tab_number: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_key?: string | null
          order_number?: string | null
          printer_type?: string
          reference_id: string
          reference_type: string
          tab_number?: number | null
          tenant_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_key?: string | null
          order_number?: string | null
          printer_type?: string
          reference_id?: string
          reference_type?: string
          tab_number?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_config: {
        Row: {
          address: string | null
          connection_type: string
          created_at: string
          id: string
          is_active: boolean
          model: string
          name: string
          port: number | null
          print_kitchen_ticket: boolean
          print_receipt: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          connection_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string
          name?: string
          port?: number | null
          print_kitchen_ticket?: boolean
          print_receipt?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          connection_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          model?: string
          name?: string
          port?: number | null
          print_kitchen_ticket?: boolean
          print_receipt?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "printer_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "printer_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipes: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          product_id: string
          quantity: number
          tenant_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          product_id: string
          quantity?: number
          tenant_id?: string
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          product_id?: string
          quantity?: number
          tenant_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability: string
          availability_grande: string
          availability_media: string
          availability_pequena: string
          category_id: string | null
          combo_items: Json
          cost_price: number | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_combo: boolean
          is_featured: boolean
          name: string
          price_grande: number
          price_media: number
          price_multiplier: number | null
          price_pequena: number
          price_per_kg: number | null
          sale_end: string | null
          sale_start: string | null
          serves: number | null
          sold_by_weight: boolean
          stock_quantity: number | null
          tenant_id: string
          track_stock: boolean
          updated_at: string
        }
        Insert: {
          availability?: string
          availability_grande?: string
          availability_media?: string
          availability_pequena?: string
          category_id?: string | null
          combo_items?: Json
          cost_price?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_combo?: boolean
          is_featured?: boolean
          name: string
          price_grande?: number
          price_media?: number
          price_multiplier?: number | null
          price_pequena?: number
          price_per_kg?: number | null
          sale_end?: string | null
          sale_start?: string | null
          serves?: number | null
          sold_by_weight?: boolean
          stock_quantity?: number | null
          tenant_id?: string
          track_stock?: boolean
          updated_at?: string
        }
        Update: {
          availability?: string
          availability_grande?: string
          availability_media?: string
          availability_pequena?: string
          category_id?: string | null
          combo_items?: Json
          cost_price?: number | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_combo?: boolean
          is_featured?: boolean
          name?: string
          price_grande?: number
          price_media?: number
          price_multiplier?: number | null
          price_pequena?: number
          price_per_kg?: number | null
          sale_end?: string | null
          sale_start?: string | null
          serves?: number | null
          sold_by_weight?: boolean
          stock_quantity?: number | null
          tenant_id?: string
          track_stock?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurant_settings: {
        Row: {
          accent_color: string | null
          address_full: string | null
          address_street: string | null
          city: string | null
          created_at: string
          delivery_time: string | null
          footer_text: string | null
          hero_url: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          maps_url: string | null
          name: string
          phone: string | null
          pix_key: string | null
          primary_color: string | null
          slogan: string | null
          state: string | null
          tenant_id: string
          updated_at: string
          whatsapp: string | null
          working_hours: string | null
        }
        Insert: {
          accent_color?: string | null
          address_full?: string | null
          address_street?: string | null
          city?: string | null
          created_at?: string
          delivery_time?: string | null
          footer_text?: string | null
          hero_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          maps_url?: string | null
          name?: string
          phone?: string | null
          pix_key?: string | null
          primary_color?: string | null
          slogan?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp?: string | null
          working_hours?: string | null
        }
        Update: {
          accent_color?: string | null
          address_full?: string | null
          address_street?: string | null
          city?: string | null
          created_at?: string
          delivery_time?: string | null
          footer_text?: string | null
          hero_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          maps_url?: string | null
          name?: string
          phone?: string | null
          pix_key?: string | null
          primary_color?: string | null
          slogan?: string | null
          state?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scale_config: {
        Row: {
          baud_rate: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          port: string
          protocol: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          baud_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          port?: string
          protocol?: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          baud_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          port?: string
          protocol?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scale_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scale_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_events: {
        Row: {
          correlation_id: string | null
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          id: string
          merchant_id: string | null
          order_id: string | null
          payload: Json | null
          shipping_id: string | null
          store_id: string | null
          tenant_id: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          merchant_id?: string | null
          order_id?: string | null
          payload?: Json | null
          shipping_id?: string | null
          store_id?: string | null
          tenant_id?: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          merchant_id?: string | null
          order_id?: string | null
          payload?: Json | null
          shipping_id?: string | null
          store_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_stock: number
          previous_stock: number
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_stock?: number
          previous_stock?: number
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          tenant_id?: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_stock?: number
          previous_stock?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tabs: {
        Row: {
          closed_at: string | null
          code: string
          company_id: string | null
          created_at: string
          created_by: string | null
          customer_name: string | null
          id: string
          items: Json
          notes: string | null
          status: string
          subtotal: number
          tab_number: number | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          subtotal?: number
          tab_number?: number | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_name?: string | null
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          subtotal?: number
          tab_number?: number | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tabs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_consumption"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "tabs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tabs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          business_type: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_user_id: string | null
          plan: string
          primary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          business_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_user_id?: string | null
          plan?: string
          primary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_user_id?: string | null
          plan?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      waste_control: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          ingredient_id: string | null
          notes: string | null
          product_id: string | null
          quantity: number
          reason: string
          responsible: string | null
          tenant_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reason?: string
          responsible?: string | null
          tenant_id?: string
          unit?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reason?: string
          responsible?: string | null
          tenant_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_control_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_control_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_control_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "public_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waste_control_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      company_consumption: {
        Row: {
          cnpj: string | null
          company_id: string | null
          company_name: string | null
          month: string | null
          monthly_limit: number | null
          order_count: number | null
          total_consumed: number | null
        }
        Relationships: []
      }
      orders_kitchen: {
        Row: {
          created_at: string | null
          guest_name: string | null
          guest_neighborhood_name: string | null
          id: string | null
          items_display: Json | null
          notes: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          guest_name?: string | null
          guest_neighborhood_name?: string | null
          id?: string | null
          items_display?: never
          notes?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          guest_name?: string | null
          guest_neighborhood_name?: string | null
          id?: string | null
          items_display?: never
          notes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      public_tenants: {
        Row: {
          business_type: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          primary_color: string | null
          slug: string | null
        }
        Insert: {
          business_type?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          slug?: string | null
        }
        Update: {
          business_type?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      tabs_kitchen: {
        Row: {
          code: string | null
          created_at: string | null
          customer_name: string | null
          id: string | null
          items_display: Json | null
          notes: string | null
          status: string | null
          tab_number: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string | null
          items_display?: never
          notes?: string | null
          status?: string | null
          tab_number?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string | null
          items_display?: never
          notes?: string | null
          status?: string | null
          tab_number?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_guest_order: { Args: { _order_id: string }; Returns: boolean }
      check_product_stock: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: boolean
      }
      current_tenant_id: { Args: never; Returns: string }
      get_tab_by_number: { Args: { _tab_number: number }; Returns: Json }
      get_user_open_register: { Args: { _user_id: string }; Returns: string }
      has_any_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_tenant: { Args: { _tenant_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_cozinha: { Args: { _user_id: string }; Returns: boolean }
      is_estoque: { Args: { _user_id: string }; Returns: boolean }
      is_operator_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_pdv_user: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      save_pix_validation: {
        Args: {
          _bank_name: string
          _confidence: number
          _fraud_signals: string[]
          _order_id: string
          _status: string
          _transaction_id: string
        }
        Returns: boolean
      }
      update_pix_receipt: {
        Args: { _order_id: string; _receipt_url: string }
        Returns: boolean
      }
      validate_order_items: { Args: { items: Json }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "operator" | "cozinha" | "estoque" | "super_admin"
      payment_method: "pix" | "credit_card" | "debit_card" | "cash" | "voucher"
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
      app_role: ["admin", "operator", "cozinha", "estoque", "super_admin"],
      payment_method: ["pix", "credit_card", "debit_card", "cash", "voucher"],
    },
  },
} as const
