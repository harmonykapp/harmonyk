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
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string | null
          description: string | null
          financial_document_id: string
          id: number
          incurred_at: string | null
          org_id: string
          subcategory: string | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          financial_document_id: string
          id?: number
          incurred_at?: string | null
          org_id: string
          subcategory?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          financial_document_id?: string
          id?: number
          incurred_at?: string | null
          org_id?: string
          subcategory?: string | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_expenses_financial_document_id_fkey"
            columns: ["financial_document_id"]
            isOneToOne: false
            referencedRelation: "financial_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_pack_runs: {
        Row: {
          created_at: string
          id: string
          metrics: Json | null
          org_id: string
          period_end: string | null
          period_start: string | null
          status: Database["public"]["Enums"]["accounts_pack_status"]
          type: Database["public"]["Enums"]["accounts_pack_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json | null
          org_id: string
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["accounts_pack_status"]
          type: Database["public"]["Enums"]["accounts_pack_type"]
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json | null
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          status?: Database["public"]["Enums"]["accounts_pack_status"]
          type?: Database["public"]["Enums"]["accounts_pack_type"]
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          actor_type: Database["public"]["Enums"]["docsafe_actor_type"] | null
          context: Json | null
          created_at: string
          document_id: string | null
          envelope_id: string | null
          event_type: string | null
          id: string
          idempotency_key: string | null
          org_id: string
          schema_version: string | null
          share_link_id: string | null
          type: string
          unified_item_id: string | null
          user_id: string | null
          version_id: string | null
        }
        Insert: {
          actor_type?: Database["public"]["Enums"]["docsafe_actor_type"] | null
          context?: Json | null
          created_at?: string
          document_id?: string | null
          envelope_id?: string | null
          event_type?: string | null
          id?: string
          idempotency_key?: string | null
          org_id: string
          schema_version?: string | null
          share_link_id?: string | null
          type: string
          unified_item_id?: string | null
          user_id?: string | null
          version_id?: string | null
        }
        Update: {
          actor_type?: Database["public"]["Enums"]["docsafe_actor_type"] | null
          context?: Json | null
          created_at?: string
          document_id?: string | null
          envelope_id?: string | null
          event_type?: string | null
          id?: string
          idempotency_key?: string | null
          org_id?: string
          schema_version?: string | null
          share_link_id?: string | null
          type?: string
          unified_item_id?: string | null
          user_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_envelope_id_fkey"
            columns: ["envelope_id"]
            isOneToOne: false
            referencedRelation: "envelope"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "share_link"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_unified_item_id_fkey"
            columns: ["unified_item_id"]
            isOneToOne: false
            referencedRelation: "unified_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "version"
            referencedColumns: ["id"]
          },
        ]
      }
      app_user: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      clause: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          jurisdiction: string | null
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          jurisdiction?: string | null
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          jurisdiction?: string | null
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clause_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      clauses: {
        Row: {
          body_md: string
          clause_type: string
          created_at: string | null
          id: string
          jurisdiction: string
          tags: string[] | null
          title: string
        }
        Insert: {
          body_md: string
          clause_type: string
          created_at?: string | null
          id?: string
          jurisdiction: string
          tags?: string[] | null
          title: string
        }
        Update: {
          body_md?: string
          clause_type?: string
          created_at?: string | null
          id?: string
          jurisdiction?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      connector_accounts: {
        Row: {
          created_at: string
          id: string
          owner_id: string | null
          provider: string
          status: string
          token_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          owner_id?: string | null
          provider: string
          status?: string
          token_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          owner_id?: string | null
          provider?: string
          status?: string
          token_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      connector_files: {
        Row: {
          account_id: string
          created_at: string
          external_id: string
          id: string
          meta_json: Json | null
          mime: string | null
          modified_at: string | null
          provider: string
          size: number | null
          title: string | null
          url: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          external_id: string
          id?: string
          meta_json?: Json | null
          mime?: string | null
          modified_at?: string | null
          provider: string
          size?: number | null
          title?: string | null
          url?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          external_id?: string
          id?: string
          meta_json?: Json | null
          mime?: string | null
          modified_at?: string | null
          provider?: string
          size?: number | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connector_files_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connector_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_jobs: {
        Row: {
          account_id: string
          attempts: number
          created_at: string
          finished_at: string | null
          id: string
          kind: string
          last_error: string | null
          meta_json: Json | null
          started_at: string | null
          status: string
        }
        Insert: {
          account_id: string
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          kind: string
          last_error?: string | null
          meta_json?: Json | null
          started_at?: string | null
          status: string
        }
        Update: {
          account_id?: string
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          kind?: string
          last_error?: string | null
          meta_json?: Json | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_jobs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connector_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_clauses: {
        Row: {
          alt_group: string | null
          body: string
          category: string
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          alt_group?: string | null
          body: string
          category: string
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          alt_group?: string | null
          body?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_metadata: {
        Row: {
          canonical_type: string
          category: Database["public"]["Enums"]["contract_category"]
          clauses: Json
          created_at: string
          doc_id: string
          id: string
          org_id: string
          primary_template_id: string | null
          renewal_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          canonical_type: string
          category: Database["public"]["Enums"]["contract_category"]
          clauses?: Json
          created_at?: string
          doc_id: string
          id?: string
          org_id: string
          primary_template_id?: string | null
          renewal_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          canonical_type?: string
          category?: Database["public"]["Enums"]["contract_category"]
          clauses?: Json
          created_at?: string
          doc_id?: string
          id?: string
          org_id?: string
          primary_template_id?: string | null
          renewal_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      contract_template_clauses: {
        Row: {
          alt_group: string | null
          clause_id: string
          order_idx: number
          required: boolean
          template_id: string
        }
        Insert: {
          alt_group?: string | null
          clause_id: string
          order_idx?: number
          required?: boolean
          template_id: string
        }
        Update: {
          alt_group?: string | null
          clause_id?: string
          order_idx?: number
          required?: boolean
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_template_clauses_clause_id_fkey"
            columns: ["clause_id"]
            isOneToOne: false
            referencedRelation: "contract_clauses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_template_clauses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          alt_group: string | null
          canonical_type: string
          category: Database["public"]["Enums"]["contract_category"]
          created_at: string
          id: string
          is_canonical: boolean
          jurisdiction: string | null
          name: string
          risk: Database["public"]["Enums"]["risk_level"] | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          alt_group?: string | null
          canonical_type: string
          category: Database["public"]["Enums"]["contract_category"]
          created_at?: string
          id?: string
          is_canonical?: boolean
          jurisdiction?: string | null
          name: string
          risk?: Database["public"]["Enums"]["risk_level"] | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          alt_group?: string | null
          canonical_type?: string
          category?: Database["public"]["Enums"]["contract_category"]
          created_at?: string
          id?: string
          is_canonical?: boolean
          jurisdiction?: string | null
          name?: string
          risk?: Database["public"]["Enums"]["risk_level"] | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      deck_sections: {
        Row: {
          created_at: string
          default_prompt: string | null
          id: string
          is_required: boolean
          order_idx: number
          section_key: string
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          default_prompt?: string | null
          id?: string
          is_required?: boolean
          order_idx: number
          section_key: string
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          default_prompt?: string | null
          id?: string
          is_required?: boolean
          order_idx?: number
          section_key?: string
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "deck_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      deck_templates: {
        Row: {
          created_at: string
          deck_type: Database["public"]["Enums"]["deck_type"]
          default_outline: Json
          description: string | null
          id: string
          is_canonical: boolean
          name: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deck_type: Database["public"]["Enums"]["deck_type"]
          default_outline?: Json
          description?: string | null
          id?: string
          is_canonical?: boolean
          name: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deck_type?: Database["public"]["Enums"]["deck_type"]
          default_outline?: Json
          description?: string | null
          id?: string
          is_canonical?: boolean
          name?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      docsafe_event_outbox: {
        Row: {
          actor_id: string | null
          actor_type: Database["public"]["Enums"]["docsafe_actor_type"]
          attempt_count: number
          created_at: string
          envelope_id: string | null
          event_type: string
          harmonyk_document_id: string | null
          harmonyk_share_id: string | null
          harmonyk_version_id: string | null
          id: string
          idempotency_key: string
          ip: string | null
          last_error: string | null
          next_attempt_at: string
          occurred_at: string
          org_id: string | null
          payload: Json
          schema_version: string
          sent_at: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type?: Database["public"]["Enums"]["docsafe_actor_type"]
          attempt_count?: number
          created_at?: string
          envelope_id?: string | null
          event_type: string
          harmonyk_document_id?: string | null
          harmonyk_share_id?: string | null
          harmonyk_version_id?: string | null
          id?: string
          idempotency_key: string
          ip?: string | null
          last_error?: string | null
          next_attempt_at?: string
          occurred_at?: string
          org_id?: string | null
          payload?: Json
          schema_version?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: Database["public"]["Enums"]["docsafe_actor_type"]
          attempt_count?: number
          created_at?: string
          envelope_id?: string | null
          event_type?: string
          harmonyk_document_id?: string | null
          harmonyk_share_id?: string | null
          harmonyk_version_id?: string | null
          id?: string
          idempotency_key?: string
          ip?: string | null
          last_error?: string | null
          next_attempt_at?: string
          occurred_at?: string
          org_id?: string | null
          payload?: Json
          schema_version?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      docsafe_object_links: {
        Row: {
          created_at: string
          docsafe_object_id: string | null
          harmonyk_document_id: string
          org_id: string | null
          storage_backend: Database["public"]["Enums"]["docsafe_storage_backend"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          docsafe_object_id?: string | null
          harmonyk_document_id: string
          org_id?: string | null
          storage_backend?: Database["public"]["Enums"]["docsafe_storage_backend"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          docsafe_object_id?: string | null
          harmonyk_document_id?: string
          org_id?: string | null
          storage_backend?: Database["public"]["Enums"]["docsafe_storage_backend"]
          updated_at?: string
        }
        Relationships: []
      }
      docsafe_share_links: {
        Row: {
          created_at: string
          docsafe_share_id: string | null
          download_count: number
          harmonyk_document_id: string | null
          harmonyk_share_id: string
          harmonyk_version_id: string | null
          last_viewed_at: string | null
          share_backend: Database["public"]["Enums"]["docsafe_share_backend"]
          share_policy: Json
          share_url: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          docsafe_share_id?: string | null
          download_count?: number
          harmonyk_document_id?: string | null
          harmonyk_share_id: string
          harmonyk_version_id?: string | null
          last_viewed_at?: string | null
          share_backend?: Database["public"]["Enums"]["docsafe_share_backend"]
          share_policy?: Json
          share_url?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          docsafe_share_id?: string | null
          download_count?: number
          harmonyk_document_id?: string | null
          harmonyk_share_id?: string
          harmonyk_version_id?: string | null
          last_viewed_at?: string | null
          share_backend?: Database["public"]["Enums"]["docsafe_share_backend"]
          share_policy?: Json
          share_url?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      docsafe_version_links: {
        Row: {
          anchored_at: string | null
          byte_size: number | null
          canonicalization_version: string | null
          content_hash_sha256: string | null
          created_at: string
          docsafe_object_id: string | null
          docsafe_version_id: string | null
          harmonyk_document_id: string | null
          harmonyk_version_id: string
          proof_receipt_id: string | null
          proof_request_id: string | null
          proof_root_id: string | null
          proof_status: Database["public"]["Enums"]["docsafe_proof_status"]
          updated_at: string
        }
        Insert: {
          anchored_at?: string | null
          byte_size?: number | null
          canonicalization_version?: string | null
          content_hash_sha256?: string | null
          created_at?: string
          docsafe_object_id?: string | null
          docsafe_version_id?: string | null
          harmonyk_document_id?: string | null
          harmonyk_version_id: string
          proof_receipt_id?: string | null
          proof_request_id?: string | null
          proof_root_id?: string | null
          proof_status?: Database["public"]["Enums"]["docsafe_proof_status"]
          updated_at?: string
        }
        Update: {
          anchored_at?: string | null
          byte_size?: number | null
          canonicalization_version?: string | null
          content_hash_sha256?: string | null
          created_at?: string
          docsafe_object_id?: string | null
          docsafe_version_id?: string | null
          harmonyk_document_id?: string | null
          harmonyk_version_id?: string
          proof_receipt_id?: string | null
          proof_request_id?: string | null
          proof_root_id?: string | null
          proof_status?: Database["public"]["Enums"]["docsafe_proof_status"]
          updated_at?: string
        }
        Relationships: []
      }
      document: {
        Row: {
          created_at: string
          current_version_id: string | null
          deleted_at: string | null
          id: string
          kind: string
          org_id: string
          owner_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_version_id?: string | null
          deleted_at?: string | null
          id?: string
          kind?: string
          org_id: string
          owner_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_version_id?: string | null
          deleted_at?: string | null
          id?: string
          kind?: string
          org_id?: string
          owner_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          classification: string | null
          created_at: string
          external_object_id: string | null
          id: string
          legal_hold: boolean
          owner_id: string
          retention_policy_id: string | null
          status: string
          storage_backend: Database["public"]["Enums"]["docsafe_storage_backend"]
          title: string
        }
        Insert: {
          classification?: string | null
          created_at?: string
          external_object_id?: string | null
          id?: string
          legal_hold?: boolean
          owner_id: string
          retention_policy_id?: string | null
          status: string
          storage_backend?: Database["public"]["Enums"]["docsafe_storage_backend"]
          title: string
        }
        Update: {
          classification?: string | null
          created_at?: string
          external_object_id?: string | null
          id?: string
          legal_hold?: boolean
          owner_id?: string
          retention_policy_id?: string | null
          status?: string
          storage_backend?: Database["public"]["Enums"]["docsafe_storage_backend"]
          title?: string
        }
        Relationships: []
      }
      envelope: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          document_id: string
          id: string
          org_id: string
          provider: string
          provider_envelope_id: string
          sent_at: string | null
          status: string
          updated_at: string
          version_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          document_id: string
          id?: string
          org_id: string
          provider?: string
          provider_envelope_id: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          version_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          document_id?: string
          id?: string
          org_id?: string
          provider?: string
          provider_envelope_id?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "envelope_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envelope_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "envelope_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "version"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actor: string | null
          created_at: string
          doc_id: string | null
          event_type: string
          id: number
          ip: unknown
          meta: Json | null
          meta_json: Json | null
          referrer: string | null
          share_id: string | null
          type: string | null
          user_agent: string | null
        }
        Insert: {
          actor?: string | null
          created_at?: string
          doc_id?: string | null
          event_type: string
          id?: number
          ip?: unknown
          meta?: Json | null
          meta_json?: Json | null
          referrer?: string | null
          share_id?: string | null
          type?: string | null
          user_agent?: string | null
        }
        Update: {
          actor?: string | null
          created_at?: string
          doc_id?: string | null
          event_type?: string
          id?: number
          ip?: unknown
          meta?: Json | null
          meta_json?: Json | null
          referrer?: string | null
          share_id?: string | null
          type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_documents: {
        Row: {
          connector_job_id: string | null
          created_at: string
          currency: string | null
          doc_type: Database["public"]["Enums"]["financial_doc_type"] | null
          due_at: string | null
          file_name: string | null
          id: string
          issued_at: string | null
          mime_type: string | null
          org_id: string
          period_end: string | null
          period_start: string | null
          provider: string | null
          raw_metadata: Json
          raw_text: string | null
          report_type:
            | Database["public"]["Enums"]["accounts_report_type"]
            | null
          source: string | null
          source_kind: string | null
          source_message_id: string | null
          source_thread_id: string | null
          total_amount: number | null
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          connector_job_id?: string | null
          created_at?: string
          currency?: string | null
          doc_type?: Database["public"]["Enums"]["financial_doc_type"] | null
          due_at?: string | null
          file_name?: string | null
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          org_id: string
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          raw_metadata?: Json
          raw_text?: string | null
          report_type?:
            | Database["public"]["Enums"]["accounts_report_type"]
            | null
          source?: string | null
          source_kind?: string | null
          source_message_id?: string | null
          source_thread_id?: string | null
          total_amount?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          connector_job_id?: string | null
          created_at?: string
          currency?: string | null
          doc_type?: Database["public"]["Enums"]["financial_doc_type"] | null
          due_at?: string | null
          file_name?: string | null
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          raw_metadata?: Json
          raw_text?: string | null
          report_type?:
            | Database["public"]["Enums"]["accounts_report_type"]
            | null
          source?: string | null
          source_kind?: string | null
          source_message_id?: string | null
          source_thread_id?: string | null
          total_amount?: number | null
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string | null
          expires_at: string | null
          id: string
          last_error: string | null
          provider: string
          refresh_token: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: string | null
          id?: string
          last_error?: string | null
          provider: string
          refresh_token?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          expires_at?: string | null
          id?: string
          last_error?: string | null
          provider?: string
          refresh_token?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          next_run_at: string | null
          org_id: string | null
          payload: Json
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          next_run_at?: string | null
          org_id?: string | null
          payload?: Json
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          next_run_at?: string | null
          org_id?: string | null
          payload?: Json
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      member: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      metering_events: {
        Row: {
          amount: number
          created_at: string
          event_type: string
          id: string
          metadata: Json
          org_id: string
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          org_id: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          org_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mono_org_profile: {
        Row: {
          created_at: string
          default_jurisdiction: string
          default_locale: string
          default_risk_profile: Database["public"]["Enums"]["mono_risk_profile"]
          default_tone: Database["public"]["Enums"]["mono_tone"]
          id: string
          name: string | null
          notes: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_jurisdiction?: string
          default_locale?: string
          default_risk_profile?: Database["public"]["Enums"]["mono_risk_profile"]
          default_tone?: Database["public"]["Enums"]["mono_tone"]
          id?: string
          name?: string | null
          notes?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_jurisdiction?: string
          default_locale?: string
          default_risk_profile?: Database["public"]["Enums"]["mono_risk_profile"]
          default_tone?: Database["public"]["Enums"]["mono_tone"]
          id?: string
          name?: string | null
          notes?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mono_template_usage: {
        Row: {
          builder_type: string
          clause_key: string | null
          created_at: string
          id: string
          last_used_at: string
          org_id: string | null
          template_key: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          builder_type: string
          clause_key?: string | null
          created_at?: string
          id?: string
          last_used_at?: string
          org_id?: string | null
          template_key: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          builder_type?: string
          clause_key?: string | null
          created_at?: string
          id?: string
          last_used_at?: string
          org_id?: string | null
          template_key?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      mono_training_docs: {
        Row: {
          created_at: string
          id: string
          org_id: string
          training_set_id: string
          updated_at: string
          vault_document_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          training_set_id: string
          updated_at?: string
          vault_document_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          training_set_id?: string
          updated_at?: string
          vault_document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mono_training_docs_training_set_id_fkey"
            columns: ["training_set_id"]
            isOneToOne: false
            referencedRelation: "mono_training_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      mono_training_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          org_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["mono_training_job_status"]
          training_set_id: string | null
          updated_at: string
          vault_document_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          org_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["mono_training_job_status"]
          training_set_id?: string | null
          updated_at?: string
          vault_document_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          org_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["mono_training_job_status"]
          training_set_id?: string | null
          updated_at?: string
          vault_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mono_training_jobs_training_set_id_fkey"
            columns: ["training_set_id"]
            isOneToOne: false
            referencedRelation: "mono_training_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      mono_training_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mono_user_profile: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          org_id: string | null
          preferred_jurisdiction: string | null
          preferred_locale: string | null
          preferred_risk_profile:
            | Database["public"]["Enums"]["mono_risk_profile"]
            | null
          preferred_tone: Database["public"]["Enums"]["mono_tone"] | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          preferred_jurisdiction?: string | null
          preferred_locale?: string | null
          preferred_risk_profile?:
            | Database["public"]["Enums"]["mono_risk_profile"]
            | null
          preferred_tone?: Database["public"]["Enums"]["mono_tone"] | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          preferred_jurisdiction?: string | null
          preferred_locale?: string | null
          preferred_risk_profile?:
            | Database["public"]["Enums"]["mono_risk_profile"]
            | null
          preferred_tone?: Database["public"]["Enums"]["mono_tone"] | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      org: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      playbook_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          metrics: Json | null
          org_id: string | null
          playbook_id: string
          started_at: string
          stats_json: Json
          status: Database["public"]["Enums"]["playbook_run_status"]
          trigger_event: Json | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          metrics?: Json | null
          org_id?: string | null
          playbook_id: string
          started_at?: string
          stats_json?: Json
          status?: Database["public"]["Enums"]["playbook_run_status"]
          trigger_event?: Json | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          metrics?: Json | null
          org_id?: string | null
          playbook_id?: string
          started_at?: string
          stats_json?: Json
          status?: Database["public"]["Enums"]["playbook_run_status"]
          trigger_event?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_runs_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_steps: {
        Row: {
          completed_at: string | null
          id: string
          input_json: Json
          output_json: Json
          run_id: string
          started_at: string | null
          status: string
          step_idx: number
          type: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          input_json?: Json
          output_json?: Json
          run_id: string
          started_at?: string | null
          status?: string
          step_idx: number
          type: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          input_json?: Json
          output_json?: Json
          run_id?: string
          started_at?: string | null
          status?: string
          step_idx?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_steps_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "playbook_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string
          definition_json: Json | null
          id: string
          last_run_at: string | null
          name: string
          org_id: string | null
          owner_id: string | null
          scope_json: Json
          status: Database["public"]["Enums"]["playbook_status"]
          trigger: string | null
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          definition_json?: Json | null
          id?: string
          last_run_at?: string | null
          name: string
          org_id?: string | null
          owner_id?: string | null
          scope_json?: Json
          status?: Database["public"]["Enums"]["playbook_status"]
          trigger?: string | null
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          definition_json?: Json | null
          id?: string
          last_run_at?: string | null
          name?: string
          org_id?: string | null
          owner_id?: string | null
          scope_json?: Json
          status?: Database["public"]["Enums"]["playbook_status"]
          trigger?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      share_link: {
        Row: {
          created_at: string
          created_by: string
          document_id: string
          expires_at: string | null
          id: string
          label: string | null
          max_views: number | null
          org_id: string
          require_email: boolean
          revoked_at: string | null
          token: string
          updated_at: string
          version_id: string | null
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          document_id: string
          expires_at?: string | null
          id?: string
          label?: string | null
          max_views?: number | null
          org_id: string
          require_email?: boolean
          revoked_at?: string | null
          token: string
          updated_at?: string
          version_id?: string | null
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          document_id?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          max_views?: number | null
          org_id?: string
          require_email?: boolean
          revoked_at?: string | null
          token?: string
          updated_at?: string
          version_id?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "share_link_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_link_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_link_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "version"
            referencedColumns: ["id"]
          },
        ]
      }
      shares: {
        Row: {
          access: string
          created_at: string
          created_by: string
          doc_id: string
          expires_at: string | null
          external_share_id: string | null
          id: string
          passcode_hash: string | null
          passcode_required: boolean | null
          passcode_sha256: string | null
          share_backend: Database["public"]["Enums"]["docsafe_share_backend"]
          share_policy: Json
          version_id: string | null
        }
        Insert: {
          access?: string
          created_at?: string
          created_by: string
          doc_id: string
          expires_at?: string | null
          external_share_id?: string | null
          id?: string
          passcode_hash?: string | null
          passcode_required?: boolean | null
          passcode_sha256?: string | null
          share_backend?: Database["public"]["Enums"]["docsafe_share_backend"]
          share_policy?: Json
          version_id?: string | null
        }
        Update: {
          access?: string
          created_at?: string
          created_by?: string
          doc_id?: string
          expires_at?: string | null
          external_share_id?: string | null
          id?: string
          passcode_hash?: string | null
          passcode_required?: boolean | null
          passcode_sha256?: string | null
          share_backend?: Database["public"]["Enums"]["docsafe_share_backend"]
          share_policy?: Json
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shares_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      source_account: {
        Row: {
          created_at: string
          external_account_id: string
          id: string
          last_synced_at: string | null
          org_id: string
          provider: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          external_account_id: string
          id?: string
          last_synced_at?: string | null
          org_id: string
          provider: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          external_account_id?: string
          id?: string
          last_synced_at?: string | null
          org_id?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "source_account_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      task_events: {
        Row: {
          actor: string | null
          created_at: string
          event_type: string
          id: number
          meta_json: Json
          task_id: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          event_type: string
          id?: number
          meta_json?: Json
          task_id: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          event_type?: string
          id?: number
          meta_json?: Json
          task_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          activity_id: string | null
          created_at: string
          doc_id: string | null
          due_at: string | null
          id: string
          org_id: string
          source: string
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          doc_id?: string | null
          due_at?: string | null
          id?: string
          org_id: string
          source: string
          status: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          doc_id?: string | null
          due_at?: string | null
          id?: string
          org_id?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activity_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      template: {
        Row: {
          category: string
          created_at: string
          default_prompt: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          default_prompt?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_prompt?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      template_favorites: {
        Row: {
          created_at: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_favorites_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          body_md: string
          created_at: string | null
          created_by: string | null
          doc_type: string
          id: string
          jurisdiction: string
          tags: string[] | null
          title: string
        }
        Insert: {
          body_md: string
          created_at?: string | null
          created_by?: string | null
          doc_type: string
          id?: string
          jurisdiction: string
          tags?: string[] | null
          title: string
        }
        Update: {
          body_md?: string
          created_at?: string | null
          created_by?: string | null
          doc_type?: string
          id?: string
          jurisdiction?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      unified_item: {
        Row: {
          created_at: string
          document_id: string | null
          external_item_id: string | null
          id: string
          kind: string
          last_indexed_at: string | null
          mime_type: string | null
          org_id: string
          source: string
          source_account_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          external_item_id?: string | null
          id?: string
          kind: string
          last_indexed_at?: string | null
          mime_type?: string | null
          org_id: string
          source: string
          source_account_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          external_item_id?: string | null
          id?: string
          kind?: string
          last_indexed_at?: string | null
          mime_type?: string | null
          org_id?: string
          source?: string
          source_account_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_item_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_item_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_item_source_account_id_fkey"
            columns: ["source_account_id"]
            isOneToOne: false
            referencedRelation: "source_account"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_embeddings: {
        Row: {
          chunk_id: string
          content: string
          created_at: string
          document_id: string
          embedding: string
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_id: string
          content: string
          created_at?: string
          document_id: string
          embedding: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_id?: string
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      version: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          document_id: string
          id: string
          number: number
          org_id: string
          storage_path: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          document_id: string
          id?: string
          number: number
          org_id: string
          storage_path?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          document_id?: string
          id?: string
          number?: number
          org_id?: string
          storage_path?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "version_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "version_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      versions: {
        Row: {
          byte_size: number | null
          canonicalization_version: string | null
          checksum: string | null
          content_hash_sha256: string | null
          content_md: string | null
          content_url: string
          created_at: string
          doc_id: string
          id: string
          number: number
          proof_receipt_id: string | null
          proof_root_id: string | null
          proof_status: Database["public"]["Enums"]["docsafe_proof_status"]
        }
        Insert: {
          byte_size?: number | null
          canonicalization_version?: string | null
          checksum?: string | null
          content_hash_sha256?: string | null
          content_md?: string | null
          content_url: string
          created_at?: string
          doc_id: string
          id?: string
          number: number
          proof_receipt_id?: string | null
          proof_root_id?: string | null
          proof_status?: Database["public"]["Enums"]["docsafe_proof_status"]
        }
        Update: {
          byte_size?: number | null
          canonicalization_version?: string | null
          checksum?: string | null
          content_hash_sha256?: string | null
          content_md?: string | null
          content_url?: string
          created_at?: string
          doc_id?: string
          id?: string
          number?: number
          proof_receipt_id?: string | null
          proof_root_id?: string | null
          proof_status?: Database["public"]["Enums"]["docsafe_proof_status"]
        }
        Relationships: [
          {
            foreignKeyName: "versions_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      accounts_pack_status: "success" | "failure" | "partial"
      accounts_pack_type: "saas_monthly_expenses" | "investor_accounts_snapshot"
      accounts_report_type:
        | "monthly_expenses_pack"
        | "investor_accounts_snapshot"
      contract_category:
        | "operational_hr"
        | "corporate_finance"
        | "commercial_dealmaking"
      contract_status:
        | "draft"
        | "in_review"
        | "approved"
        | "signed"
        | "active"
        | "expired"
      deck_type: "fundraising" | "investor_update"
      docsafe_actor_type: "user" | "guest" | "service"
      docsafe_proof_status: "none" | "pending" | "anchored" | "failed"
      docsafe_share_backend: "harmonyk" | "docsafe"
      docsafe_storage_backend:
        | "harmonyk_standard"
        | "gdrive"
        | "docsafe_drive"
        | "external"
      financial_doc_type:
        | "invoice"
        | "receipt"
        | "subscription"
        | "bank_statement"
        | "card_statement"
        | "pnl_statement"
        | "balance_sheet"
        | "tax_document"
        | "payroll"
        | "other"
      mono_risk_profile: "conservative" | "balanced" | "aggressive"
      mono_tone: "formal" | "neutral" | "friendly" | "punchy" | "technical"
      mono_training_job_status: "pending" | "running" | "succeeded" | "failed"
      playbook_action: "log_activity" | "enqueue_task"
      playbook_run_status: "pending" | "success" | "failed" | "skipped"
      playbook_status: "active" | "inactive" | "archived"
      playbook_trigger: "activity_event" | "accounts_pack_run"
      risk_level: "low" | "medium" | "high"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      accounts_pack_status: ["success", "failure", "partial"],
      accounts_pack_type: [
        "saas_monthly_expenses",
        "investor_accounts_snapshot",
      ],
      accounts_report_type: [
        "monthly_expenses_pack",
        "investor_accounts_snapshot",
      ],
      contract_category: [
        "operational_hr",
        "corporate_finance",
        "commercial_dealmaking",
      ],
      contract_status: [
        "draft",
        "in_review",
        "approved",
        "signed",
        "active",
        "expired",
      ],
      deck_type: ["fundraising", "investor_update"],
      docsafe_actor_type: ["user", "guest", "service"],
      docsafe_proof_status: ["none", "pending", "anchored", "failed"],
      docsafe_share_backend: ["harmonyk", "docsafe"],
      docsafe_storage_backend: [
        "harmonyk_standard",
        "gdrive",
        "docsafe_drive",
        "external",
      ],
      financial_doc_type: [
        "invoice",
        "receipt",
        "subscription",
        "bank_statement",
        "card_statement",
        "pnl_statement",
        "balance_sheet",
        "tax_document",
        "payroll",
        "other",
      ],
      mono_risk_profile: ["conservative", "balanced", "aggressive"],
      mono_tone: ["formal", "neutral", "friendly", "punchy", "technical"],
      mono_training_job_status: ["pending", "running", "succeeded", "failed"],
      playbook_action: ["log_activity", "enqueue_task"],
      playbook_run_status: ["pending", "success", "failed", "skipped"],
      playbook_status: ["active", "inactive", "archived"],
      playbook_trigger: ["activity_event", "accounts_pack_run"],
      risk_level: ["low", "medium", "high"],
    },
  },
} as const
