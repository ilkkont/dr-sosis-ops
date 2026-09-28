/**
 * Bu dosya `supabase/migrations/*.sql` şemasıyla elle senkronize tutulmuştur.
 * Gerçek bir Supabase projesi bağlandıktan sonra şu komutla yeniden üretip
 * (ve diff'ini gözden geçirip) bu dosyanın yerine koymak güvenlidir:
 *
 *   npx supabase gen types typescript --project-id <PROJECT_REF> > src/types/database.ts
 *
 * Not (decimal güvenliği): PostgREST `numeric` kolonlarını JSON number olarak
 * döndürür. Büyük ölçekli hesaplamalar (satış tüketimi, bakiye) her zaman
 * Postgres fonksiyonlarında (bkz. fn_* RPC'leri) yapılır; istemci bu
 * sayılarla yalnızca görüntüleme ve formdan-önce-önizleme amaçlı işlem yapar
 * (bkz. src/lib/decimal.ts).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: Database["public"]["Enums"]["app_role"];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      caravans: {
        Row: {
          id: string;
          name: string;
          plate: string | null;
          status: Database["public"]["Enums"]["caravan_status"];
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plate?: string | null;
          status?: Database["public"]["Enums"]["caravan_status"];
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["caravans"]["Insert"]>;
        Relationships: [];
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          category: Database["public"]["Enums"]["inventory_category"];
          unit_type: Database["public"]["Enums"]["unit_type"];
          display_input_unit: Database["public"]["Enums"]["display_input_unit"];
          portion_kg_factor: number | null;
          critical_level: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: Database["public"]["Enums"]["inventory_category"];
          unit_type: Database["public"]["Enums"]["unit_type"];
          display_input_unit: Database["public"]["Enums"]["display_input_unit"];
          portion_kg_factor?: number | null;
          critical_level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>;
        Relationships: [];
      };
      menu_products: {
        Row: {
          id: string;
          name: string;
          category: Database["public"]["Enums"]["menu_category"];
          linked_drink_item_id: string | null;
          unit_price: number | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: Database["public"]["Enums"]["menu_category"];
          linked_drink_item_id?: string | null;
          unit_price?: number | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["menu_products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "menu_products_linked_drink_item_id_fkey";
            columns: ["linked_drink_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_versions: {
        Row: {
          id: string;
          menu_product_id: string;
          version_no: number;
          valid_from: string;
          valid_to: string | null;
          is_active: boolean;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          menu_product_id: string;
          version_no: number;
          valid_from?: string;
          valid_to?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipe_versions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipe_versions_menu_product_id_fkey";
            columns: ["menu_product_id"];
            isOneToOne: false;
            referencedRelation: "menu_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_items: {
        Row: {
          id: string;
          recipe_version_id: string;
          inventory_item_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_version_id: string;
          inventory_item_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipe_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipe_items_recipe_version_id_fkey";
            columns: ["recipe_version_id"];
            isOneToOne: false;
            referencedRelation: "recipe_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_items_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          event_date: string;
          name: string;
          location: string | null;
          caravan_id: string;
          start_time: string;
          end_time: string;
          expected_attendance: number | null;
          responsible_person: string | null;
          note: string | null;
          status: Database["public"]["Enums"]["event_status"];
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_date: string;
          name: string;
          location?: string | null;
          caravan_id: string;
          start_time: string;
          end_time: string;
          expected_attendance?: number | null;
          responsible_person?: string | null;
          note?: string | null;
          status?: Database["public"]["Enums"]["event_status"];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "events_caravan_id_fkey";
            columns: ["caravan_id"];
            isOneToOne: false;
            referencedRelation: "caravans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_transfers: {
        Row: {
          id: string;
          from_caravan_id: string;
          to_caravan_id: string;
          from_event_id: string | null;
          to_event_id: string | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_caravan_id: string;
          to_caravan_id: string;
          from_event_id?: string | null;
          to_event_id?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_transfers"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_caravan_id_fkey";
            columns: ["from_caravan_id"];
            isOneToOne: false;
            referencedRelation: "caravans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_transfers_to_caravan_id_fkey";
            columns: ["to_caravan_id"];
            isOneToOne: false;
            referencedRelation: "caravans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_transfers_from_event_id_fkey";
            columns: ["from_event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_transfers_to_event_id_fkey";
            columns: ["to_event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_movements: {
        Row: {
          id: string;
          caravan_id: string;
          event_id: string;
          inventory_item_id: string;
          movement_type: Database["public"]["Enums"]["movement_type"];
          quantity_base: number;
          source_type: Database["public"]["Enums"]["movement_source_type"] | null;
          source_id: string | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          caravan_id: string;
          event_id: string;
          inventory_item_id: string;
          movement_type: Database["public"]["Enums"]["movement_type"];
          quantity_base: number;
          source_type?: Database["public"]["Enums"]["movement_source_type"] | null;
          source_id?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "stock_movements_caravan_id_fkey";
            columns: ["caravan_id"];
            isOneToOne: false;
            referencedRelation: "caravans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      depot_movements: {
        Row: {
          id: string;
          inventory_item_id: string;
          movement_type: Database["public"]["Enums"]["depot_movement_type"];
          quantity_base: number;
          source_type: Database["public"]["Enums"]["movement_source_type"] | null;
          source_id: string | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          movement_type: Database["public"]["Enums"]["depot_movement_type"];
          quantity_base: number;
          source_type?: Database["public"]["Enums"]["movement_source_type"] | null;
          source_id?: string | null;
          description?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["depot_movements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "depot_movements_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_counts: {
        Row: {
          id: string;
          event_id: string;
          caravan_id: string;
          status: Database["public"]["Enums"]["stock_count_status"];
          counted_by: string | null;
          counted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          caravan_id: string;
          status?: Database["public"]["Enums"]["stock_count_status"];
          counted_by?: string | null;
          counted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_counts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "stock_counts_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_counts_caravan_id_fkey";
            columns: ["caravan_id"];
            isOneToOne: false;
            referencedRelation: "caravans";
            referencedColumns: ["id"];
          },
        ];
      };
      stock_count_lines: {
        Row: {
          id: string;
          stock_count_id: string;
          inventory_item_id: string;
          theoretical_qty: number;
          physical_qty: number;
          variance_qty: number;
          variance_pct: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          stock_count_id: string;
          inventory_item_id: string;
          theoretical_qty: number;
          physical_qty: number;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["stock_count_lines"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "stock_count_lines_stock_count_id_fkey";
            columns: ["stock_count_id"];
            isOneToOne: false;
            referencedRelation: "stock_counts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_count_lines_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_batches: {
        Row: {
          id: string;
          event_id: string;
          caravan_id: string;
          status: Database["public"]["Enums"]["sales_batch_status"];
          idempotency_key: string;
          supersedes_batch_id: string | null;
          finalized_by: string | null;
          finalized_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          caravan_id: string;
          status?: Database["public"]["Enums"]["sales_batch_status"];
          idempotency_key: string;
          supersedes_batch_id?: string | null;
          finalized_by?: string | null;
          finalized_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales_batches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sales_batches_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_batches_caravan_id_fkey";
            columns: ["caravan_id"];
            isOneToOne: false;
            referencedRelation: "caravans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_batches_supersedes_batch_id_fkey";
            columns: ["supersedes_batch_id"];
            isOneToOne: false;
            referencedRelation: "sales_batches";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_lines: {
        Row: {
          id: string;
          sales_batch_id: string;
          menu_product_id: string;
          recipe_version_id: string | null;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sales_batch_id: string;
          menu_product_id: string;
          recipe_version_id?: string | null;
          quantity: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sales_lines"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "sales_lines_sales_batch_id_fkey";
            columns: ["sales_batch_id"];
            isOneToOne: false;
            referencedRelation: "sales_batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_lines_menu_product_id_fkey";
            columns: ["menu_product_id"];
            isOneToOne: false;
            referencedRelation: "menu_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_lines_recipe_version_id_fkey";
            columns: ["recipe_version_id"];
            isOneToOne: false;
            referencedRelation: "recipe_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      waste_records: {
        Row: {
          id: string;
          event_id: string;
          caravan_id: string;
          inventory_item_id: string;
          waste_type: Database["public"]["Enums"]["waste_type"];
          quantity_base: number;
          reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          caravan_id: string;
          inventory_item_id: string;
          waste_type: Database["public"]["Enums"]["waste_type"];
          quantity_base: number;
          reason?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["waste_records"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "waste_records_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waste_records_caravan_id_fkey";
            columns: ["caravan_id"];
            isOneToOne: false;
            referencedRelation: "caravans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waste_records_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      v_stock_balances: {
        Row: {
          event_id: string;
          caravan_id: string;
          inventory_item_id: string;
          balance: number;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_caravan_id_fkey";
            columns: ["caravan_id"];
            isOneToOne: false;
            referencedRelation: "caravans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
      v_depot_balances: {
        Row: {
          inventory_item_id: string;
          balance: number;
        };
        Relationships: [
          {
            foreignKeyName: "depot_movements_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      fn_theoretical_balance: {
        Args: {
          p_event_id: string;
          p_caravan_id: string;
          p_inventory_item_id: string;
        };
        Returns: number;
      };
      fn_load_initial_stock: {
        Args: {
          p_event_id: string;
          p_lines?: Json;
          p_copy_from_stock_count_id?: string | null;
        };
        Returns: Json;
      };
      fn_add_stock_entry: {
        Args: { p_event_id: string; p_lines: Json; p_description?: string | null };
        Returns: Json;
      };
      fn_return_to_depot: {
        Args: { p_event_id: string; p_lines: Json; p_description?: string | null };
        Returns: Json;
      };
      fn_transfer_stock: {
        Args: {
          p_from_caravan_id: string;
          p_to_caravan_id: string;
          p_from_event_id: string;
          p_to_event_id: string;
          p_lines: Json;
          p_description?: string | null;
        };
        Returns: Json;
      };
      fn_record_waste: {
        Args: {
          p_event_id: string;
          p_inventory_item_id: string;
          p_waste_type: Database["public"]["Enums"]["waste_type"];
          p_quantity_base: number;
          p_reason?: string | null;
        };
        Returns: Json;
      };
      fn_finalize_stock_count: {
        Args: { p_stock_count_id: string; p_lines: Json };
        Returns: Json;
      };
      fn_finalize_sales_batch: {
        Args: { p_batch_id: string; p_override_negative?: boolean };
        Returns: Json;
      };
      fn_correct_sales_batch: {
        Args: {
          p_old_batch_id: string;
          p_new_lines: Json;
          p_idempotency_key: string;
          p_override_negative?: boolean;
        };
        Returns: Json;
      };
      fn_create_recipe_version: {
        Args: { p_menu_product_id: string; p_items: Json; p_notes?: string | null };
        Returns: Json;
      };
      fn_close_event: {
        Args: { p_event_id: string };
        Returns: Json;
      };
      fn_delete_event_permanently: {
        Args: { p_event_id: string };
        Returns: Json;
      };
      fn_depot_stock_entry: {
        Args: { p_lines: Json; p_description?: string | null };
        Returns: Json;
      };
      fn_send_depot_to_event: {
        Args: { p_event_id: string; p_lines: Json };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "admin";
      caravan_status: "active" | "inactive" | "maintenance";
      inventory_category:
        | "bread"
        | "sausage"
        | "cheese"
        | "sauce"
        | "topping"
        | "drink"
        | "packaging"
        | "produce"
        | "other";
      unit_type: "count" | "weight" | "portion";
      display_input_unit: "unit" | "gram" | "kg" | "portion";
      menu_category: "hotdog" | "hotdog_potato" | "side" | "drink";
      event_status: "preparation" | "open" | "closed" | "cancelled";
      movement_type:
        | "initial_load"
        | "additional_entry"
        | "return_to_depot"
        | "transfer_out"
        | "transfer_in"
        | "recipe_consumption"
        | "waste"
        | "complimentary"
        | "staff_meal"
        | "defective"
        | "count_adjustment"
        | "sale_reversal_adjustment";
      movement_source_type:
        | "sales_batch"
        | "stock_count"
        | "waste_record"
        | "stock_transfer"
        | "manual"
        | "depot";
      depot_movement_type: "purchase_in" | "transfer_out_to_event" | "transfer_in_from_event";
      stock_count_status: "draft" | "finalized";
      sales_batch_status: "draft" | "finalized" | "corrected";
      waste_type: "fire" | "complimentary" | "staff_meal" | "defective";
    };
  };
};
