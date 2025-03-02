export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          status: string
          user_id: string
          lead_group_id: string | null
          email_template_id: string | null
          scheduled_for: string | null
          completed_at: string | null
          email_account_id: string | null
          openai_assistant_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          status?: string
          user_id: string
          lead_group_id?: string | null
          email_template_id?: string | null
          scheduled_for?: string | null
          completed_at?: string | null
          email_account_id?: string | null
          openai_assistant_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          status?: string
          user_id?: string
          lead_group_id?: string | null
          email_template_id?: string | null
          scheduled_for?: string | null
          completed_at?: string | null
          email_account_id?: string | null
          openai_assistant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_email_account_id_fkey"
            columns: ["email_account_id"]
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_email_template_id_fkey"
            columns: ["email_template_id"]
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_lead_group_id_fkey"
            columns: ["lead_group_id"]
            referencedRelation: "lead_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      email_accounts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          email: string
          name: string
          provider: string
          status: string
          smtp_host: string | null
          smtp_port: number | null
          smtp_username: string | null
          smtp_password: string | null
          smtp_security: string | null
          imap_host: string | null
          imap_port: number | null
          imap_username: string | null
          imap_password: string | null
          imap_security: string | null
          provider_logo: string | null
          provider_type: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          email: string
          name: string
          provider: string
          status?: string
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          smtp_password?: string | null
          smtp_security?: string | null
          imap_host?: string | null
          imap_port?: number | null
          imap_username?: string | null
          imap_password?: string | null
          imap_security?: string | null
          provider_logo?: string | null
          provider_type?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          email?: string
          name?: string
          provider?: string
          status?: string
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          smtp_password?: string | null
          smtp_security?: string | null
          imap_host?: string | null
          imap_port?: number | null
          imap_username?: string | null
          imap_password?: string | null
          imap_security?: string | null
          provider_logo?: string | null
          provider_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_groups: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          user_id: string
          lead_count: number
          column_mappings: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          user_id: string
          lead_count?: number
          column_mappings?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          user_id?: string
          lead_count?: number
          column_mappings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_groups_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string | null
          last_name: string | null
          email: string
          company: string | null
          position: string | null
          phone: string | null
          group_id: string
          user_id: string
          status: string
          custom_fields: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          email: string
          company?: string | null
          position?: string | null
          phone?: string | null
          group_id: string
          user_id: string
          status?: string
          custom_fields?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          company?: string | null
          position?: string | null
          phone?: string | null
          group_id?: string
          user_id?: string
          status?: string
          custom_fields?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_group_id_fkey"
            columns: ["group_id"]
            referencedRelation: "lead_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          first_name: string | null
          last_name: string | null
          company: string | null
          stripe_customer_id: string | null
          openai_api_key: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          company?: string | null
          stripe_customer_id?: string | null
          openai_api_key?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          company?: string | null
          stripe_customer_id?: string | null
          openai_api_key?: string | null
        }
        Relationships: []
      }
    }
    // other tables...
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
