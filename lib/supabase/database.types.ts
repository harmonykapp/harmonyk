export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      connector_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          last_error_at: string | null
          last_error_message: string | null
          last_sync_at: string | null
          metadata: Json | null
          provider: string
          provider_account_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_error_at?: string | null
          last_error_message?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider: string
          provider_account_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          last_error_at?: string | null
          last_error_message?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          provider?: string
          provider_account_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      connector_files: {
        Row: {
          connector_account_id: string
          created_at: string
          external_id: string | null
          id: string
          last_sync_job_id: string | null
          meta_json: Json | null
          mime_type: string | null
          modified_at: string | null
          name: string | null
          path: string | null
          provider: string
          provider_file_id: string
          size_bytes: number | null
          sync_status: string
          updated_at: string
          vault_document_id: string | null
        }
        Insert: {
          connector_account_id: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_sync_job_id?: string | null
          meta_json?: Json | null
          mime_type?: string | null
          modified_at?: string | null
          name?: string | null
          path?: string | null
          provider: string
          provider_file_id: string
          size_bytes?: number | null
          sync_status?: string
          updated_at?: string
          vault_document_id?: string | null
        }
        Update: {
          connector_account_id?: string
          created_at?: string
          external_id?: string | null
          id?: string
          last_sync_job_id?: string | null
          meta_json?: Json | null
          mime_type?: string | null
          modified_at?: string | null
          name?: string | null
          path?: string | null
          provider?: string
          provider_file_id?: string
          size_bytes?: number | null
          sync_status?: string
          updated_at?: string
          vault_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connector_files_connector_account_id_fkey"
            columns: ["connector_account_id"]
            isOneToOne: false
            referencedRelation: "connector_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connector_files_last_sync_job_id_fkey"
            columns: ["last_sync_job_id"]
            isOneToOne: false
            referencedRelation: "connector_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_jobs: {
        Row: {
          attempts: number
          backoff_seconds: number
          connector_account_id: string
          created_at: string
          finished_at: string | null
          id: string
          job_type: string
          last_error_message: string | null
          max_attempts: number
          payload: Json | null
          scheduled_at: string
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          backoff_seconds?: number
          connector_account_id: string
          created_at?: string
          finished_at?: string | null
          id?: string
          job_type: string
          last_error_message?: string | null
          max_attempts?: number
          payload?: Json | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          backoff_seconds?: number
          connector_account_id?: string
          created_at?: string
          finished_at?: string | null
          id?: string
          job_type?: string
          last_error_message?: string | null
          max_attempts?: number
          payload?: Json | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_jobs_connector_account_id_fkey"
            columns: ["connector_account_id"]
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
      member: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      playbook_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          metrics: Json
          org_id: string | null
          playbook_id: string
          status: Database["public"]["Enums"]["playbook_run_status"]
          trigger_event: Json
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          metrics?: Json
          org_id?: string | null
          playbook_id: string
          status?: Database["public"]["Enums"]["playbook_run_status"]
          trigger_event: Json
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          metrics?: Json
          org_id?: string | null
          playbook_id?: string
          status?: Database["public"]["Enums"]["playbook_run_status"]
          trigger_event?: Json
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
      playbooks: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          id: string
          last_run_at: string | null
          name: string
          org_id: string | null
          status: Database["public"]["Enums"]["playbook_status"]
          trigger: Database["public"]["Enums"]["playbook_trigger"]
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          id?: string
          last_run_at?: string | null
          name: string
          org_id?: string | null
          status?: Database["public"]["Enums"]["playbook_status"]
          trigger: Database["public"]["Enums"]["playbook_trigger"]
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          id?: string
          last_run_at?: string | null
          name?: string
          org_id?: string | null
          status?: Database["public"]["Enums"]["playbook_status"]
          trigger?: Database["public"]["Enums"]["playbook_trigger"]
          updated_at?: string
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
        Relationships: []
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
        | "receipt"
        | "invoice"
        | "bank_statement"
        | "pl_export"
        | "tax_notice"
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
        "receipt",
        "invoice",
        "bank_statement",
        "pl_export",
        "tax_notice",
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

