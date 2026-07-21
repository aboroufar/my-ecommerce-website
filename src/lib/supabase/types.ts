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
      addresses: {
        Row: {
          city: string
          client_id: string
          country: string
          created_at: string
          id: string
          is_billing: boolean
          is_default: boolean
          line1: string
          line2: string | null
          postal_code: string
          region: string | null
        }
        Insert: {
          city: string
          client_id: string
          country: string
          created_at?: string
          id?: string
          is_billing?: boolean
          is_default?: boolean
          line1: string
          line2?: string | null
          postal_code: string
          region?: string | null
        }
        Update: {
          city?: string
          client_id?: string
          country?: string
          created_at?: string
          id?: string
          is_billing?: boolean
          is_default?: boolean
          line1?: string
          line2?: string | null
          postal_code?: string
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_bio: string
          author_facebook_url: string
          author_linkedin_url: string
          author_name: string
          author_photo_url: string
          author_twitter_url: string
          body_html: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_bio?: string
          author_facebook_url?: string
          author_linkedin_url?: string
          author_name?: string
          author_photo_url?: string
          author_twitter_url?: string
          body_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_bio?: string
          author_facebook_url?: string
          author_linkedin_url?: string
          author_name?: string
          author_photo_url?: string
          author_twitter_url?: string
          body_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          link_url: string | null
          logo_url: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          link_url?: string | null
          logo_url: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          link_url?: string | null
          logo_url?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          id: string
          product_id: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          cart_id: string
          id?: string
          product_id: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          cart_id?: string
          id?: string
          product_id?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          session_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          session_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_only: boolean
          featured_in_grid: boolean
          hero_eyebrow: string | null
          hero_headline: string | null
          hero_image_url: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          display_only?: boolean
          featured_in_grid?: boolean
          hero_eyebrow?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          display_only?: boolean
          featured_in_grid?: boolean
          hero_eyebrow?: string | null
          hero_headline?: string | null
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          date_of_birth: string | null
          display_id: string
          email: string
          gender: string | null
          id: string
          name: string | null
          phone: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          display_id?: string
          email: string
          gender?: string | null
          id: string
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          display_id?: string
          email?: string
          gender?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      client_segments: {
        Row: {
          condition_type: string
          conditions: Json
          created_at: string
          id: string
          name: string
          query_text: string | null
        }
        Insert: {
          condition_type?: string
          conditions?: Json
          created_at?: string
          id?: string
          name: string
          query_text?: string | null
        }
        Update: {
          condition_type?: string
          conditions?: Json
          created_at?: string
          id?: string
          name?: string
          query_text?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          config: Json
          created_at: string
          discount_type: string
          expires_at: string | null
          id: string
          starts_at: string
          stripe_coupon_id: string | null
          stripe_promotion_code_id: string | null
          type: string
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          config?: Json
          created_at?: string
          discount_type: string
          expires_at?: string | null
          id?: string
          starts_at?: string
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          type: string
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          config?: Json
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          id?: string
          starts_at?: string
          stripe_coupon_id?: string | null
          stripe_promotion_code_id?: string | null
          type?: string
          value?: number
        }
        Relationships: []
      }
      discount_tags: {
        Row: {
          discount_id: string
          tag_id: string
        }
        Insert: {
          discount_id: string
          tag_id: string
        }
        Update: {
          discount_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_tags_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      help_categories: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      help_topics: {
        Row: {
          body_html: string
          category_id: string
          created_at: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          body_html?: string
          category_id: string
          created_at?: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          body_html?: string
          category_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "help_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_slides: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          headline: string
          id: string
          image_url: string
          link_url: string
          sort_order: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string
          headline: string
          id?: string
          image_url: string
          link_url?: string
          sort_order?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          headline?: string
          id?: string
          image_url?: string
          link_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "hero_slides_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_sections: {
        Row: {
          enabled: boolean
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          enabled?: boolean
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          enabled?: boolean
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      menu_columns: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          column_id: string
          created_at: string
          href: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          column_id: string
          created_at?: string
          href: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          column_id?: string
          created_at?: string
          href?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "menu_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
          variant_id: string | null
          variant_label: string | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          carrier: string | null
          client_id: string | null
          created_at: string
          currency: string
          discount_cents: number
          discount_code: string | null
          id: string
          label_url: string | null
          pending_rates: Json | null
          shipping_address: Json | null
          shipping_cents: number
          shippo_transaction_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          total_cents: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          discount_cents?: number
          discount_code?: string | null
          id?: string
          label_url?: string | null
          pending_rates?: Json | null
          shipping_address?: Json | null
          shipping_cents?: number
          shippo_transaction_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_cents: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string
          discount_cents?: number
          discount_code?: string | null
          id?: string
          label_url?: string | null
          pending_rates?: Json | null
          shipping_address?: Json | null
          shipping_cents?: number
          shippo_transaction_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_cents?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      package_profiles: {
        Row: {
          created_at: string
          empty_weight_grams: number | null
          height_cm: number | null
          id: string
          length_cm: number | null
          name: string
          package_type: string
          width_cm: number | null
        }
        Insert: {
          created_at?: string
          empty_weight_grams?: number | null
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          name: string
          package_type?: string
          width_cm?: number | null
        }
        Update: {
          created_at?: string
          empty_weight_grams?: number | null
          height_cm?: number | null
          id?: string
          length_cm?: number | null
          name?: string
          package_type?: string
          width_cm?: number | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          compare_at_price_cents: number | null
          created_at: string
          currency: string
          description: string | null
          dimensions_text: string | null
          gender: string | null
          id: string
          is_popular: boolean
          name: string
          package_profile_id: string | null
          price_cents: number
          sku: string | null
          slug: string
          status: string
          stock_qty: number
          updated_at: string
          weight_text: string | null
        }
        Insert: {
          brand_id?: string | null
          compare_at_price_cents?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          dimensions_text?: string | null
          gender?: string | null
          id?: string
          is_popular?: boolean
          name: string
          package_profile_id?: string | null
          price_cents: number
          sku?: string | null
          slug: string
          status?: string
          stock_qty?: number
          updated_at?: string
          weight_text?: string | null
        }
        Update: {
          brand_id?: string | null
          compare_at_price_cents?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          dimensions_text?: string | null
          gender?: string | null
          id?: string
          is_popular?: boolean
          name?: string
          package_profile_id?: string | null
          price_cents?: number
          sku?: string | null
          slug?: string
          status?: string
          stock_qty?: number
          updated_at?: string
          weight_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_package_profile_id_fkey"
            columns: ["package_profile_id"]
            isOneToOne: false
            referencedRelation: "package_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_types: {
        Row: {
          created_at: string
          id: string
          name: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_option_types_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          id: string
          label: string
          option_type_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          option_type_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          option_type_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_type_id_fkey"
            columns: ["option_type_id"]
            isOneToOne: false
            referencedRelation: "product_option_types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          dimensions_text: string | null
          id: string
          price_cents: number
          product_id: string
          sku: string | null
          stock_qty: number
          weight_text: string | null
        }
        Insert: {
          created_at?: string
          dimensions_text?: string | null
          id?: string
          price_cents: number
          product_id: string
          sku?: string | null
          stock_qty?: number
          weight_text?: string | null
        }
        Update: {
          created_at?: string
          dimensions_text?: string | null
          id?: string
          price_cents?: number
          product_id?: string
          sku?: string | null
          stock_qty?: number
          weight_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_options: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_options_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_options_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          product_id: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          status: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          status?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          reviewer_email?: string
          reviewer_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_highlights: {
        Row: {
          created_at: string
          icon: string
          id: string
          label: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          label: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          label?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_highlights_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          blog_author_bio: string
          blog_author_facebook_url: string
          blog_author_linkedin_url: string
          blog_author_name: string
          blog_author_photo_url: string
          blog_author_twitter_url: string
          categories_menu_label: string
          free_shipping_threshold_cents: number
          header_address: string
          header_email: string
          header_phone: string
          help_page_enabled: boolean
          id: boolean
          reviews_enabled: boolean
          ship_from_city: string | null
          ship_from_country: string | null
          ship_from_email: string | null
          ship_from_line1: string | null
          ship_from_line2: string | null
          ship_from_name: string | null
          ship_from_phone: string | null
          ship_from_postal_code: string | null
          ship_from_region: string | null
          shipping_flat_rate_cents: number
          site_logo_url: string
          site_name: string
          social_facebook_url: string
          social_instagram_url: string
          social_linkedin_url: string
          social_twitter_url: string
          updated_at: string
        }
        Insert: {
          blog_author_bio?: string
          blog_author_facebook_url?: string
          blog_author_linkedin_url?: string
          blog_author_name?: string
          blog_author_photo_url?: string
          blog_author_twitter_url?: string
          categories_menu_label?: string
          free_shipping_threshold_cents?: number
          header_address?: string
          header_email?: string
          header_phone?: string
          help_page_enabled?: boolean
          id?: boolean
          reviews_enabled?: boolean
          ship_from_city?: string | null
          ship_from_country?: string | null
          ship_from_email?: string | null
          ship_from_line1?: string | null
          ship_from_line2?: string | null
          ship_from_name?: string | null
          ship_from_phone?: string | null
          ship_from_postal_code?: string | null
          ship_from_region?: string | null
          shipping_flat_rate_cents?: number
          site_logo_url?: string
          site_name?: string
          social_facebook_url?: string
          social_instagram_url?: string
          social_linkedin_url?: string
          social_twitter_url?: string
          updated_at?: string
        }
        Update: {
          blog_author_bio?: string
          blog_author_facebook_url?: string
          blog_author_linkedin_url?: string
          blog_author_name?: string
          blog_author_photo_url?: string
          blog_author_twitter_url?: string
          categories_menu_label?: string
          free_shipping_threshold_cents?: number
          header_address?: string
          header_email?: string
          header_phone?: string
          help_page_enabled?: boolean
          id?: boolean
          reviews_enabled?: boolean
          ship_from_city?: string | null
          ship_from_country?: string | null
          ship_from_email?: string | null
          ship_from_line1?: string | null
          ship_from_line2?: string | null
          ship_from_name?: string | null
          ship_from_phone?: string | null
          ship_from_postal_code?: string | null
          ship_from_region?: string | null
          shipping_flat_rate_cents?: number
          site_logo_url?: string
          site_name?: string
          social_facebook_url?: string
          social_instagram_url?: string
          social_linkedin_url?: string
          social_twitter_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          client_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_stock: {
        Args: { item_product_id: string; item_quantity: number }
        Returns: boolean
      }
      decrement_variant_stock: {
        Args: { item_variant_id: string; item_quantity: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

// products.status / orders.status are plain-text columns (CHECK constraints,
// not real Postgres enums), so `supabase gen types` outputs `string` for
// them. This literal union is hand-added for stricter typing at call sites.
export type ProductStatus = "draft" | "active" | "archived"
export type ProductGender = "women" | "men" | "unisex"
export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "cancelled"
  | "refunded"
