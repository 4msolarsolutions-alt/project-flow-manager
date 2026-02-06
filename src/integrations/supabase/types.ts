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
      amc_reminders: {
        Row: {
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          notified: boolean | null
          notified_at: string | null
          project_id: string
          reminder_type: string | null
        }
        Insert: {
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          notified?: boolean | null
          notified_at?: string | null
          project_id: string
          reminder_type?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          notified?: boolean | null
          notified_at?: string | null
          project_id?: string
          reminder_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amc_reminders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          completion_percent: number | null
          created_at: string | null
          delay_reason: string | null
          engineer_id: string
          id: string
          issues: string | null
          next_day_plan: string | null
          project_id: string
          report_date: string
          updated_at: string | null
          work_done: string | null
        }
        Insert: {
          completion_percent?: number | null
          created_at?: string | null
          delay_reason?: string | null
          engineer_id: string
          id?: string
          issues?: string | null
          next_day_plan?: string | null
          project_id: string
          report_date?: string
          updated_at?: string | null
          work_done?: string | null
        }
        Update: {
          completion_percent?: number | null
          created_at?: string | null
          delay_reason?: string | null
          engineer_id?: string
          id?: string
          issues?: string | null
          next_day_plan?: string | null
          project_id?: string
          report_date?: string
          updated_at?: string | null
          work_done?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          lead_id: string | null
          notes: string | null
          project_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_by: string | null
          bill_image_url: string | null
          created_at: string | null
          days: number | null
          description: string | null
          expense_date: string | null
          expense_scope: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id: string
          lead_id: string | null
          persons: number | null
          project_id: string | null
          rate_per_day: number | null
          rejection_reason: string | null
          status: string | null
          submitted_by: string | null
          updated_at: string | null
          verification_status: string | null
          verified_amount: number | null
          work_type: string | null
        }
        Insert: {
          amount: number
          approved_by?: string | null
          bill_image_url?: string | null
          created_at?: string | null
          days?: number | null
          description?: string | null
          expense_date?: string | null
          expense_scope?: string | null
          expense_type: Database["public"]["Enums"]["expense_type"]
          id?: string
          lead_id?: string | null
          persons?: number | null
          project_id?: string | null
          rate_per_day?: number | null
          rejection_reason?: string | null
          status?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_amount?: number | null
          work_type?: string | null
        }
        Update: {
          amount?: number
          approved_by?: string | null
          bill_image_url?: string | null
          created_at?: string | null
          days?: number | null
          description?: string | null
          expense_date?: string | null
          expense_scope?: string | null
          expense_type?: Database["public"]["Enums"]["expense_type"]
          id?: string
          lead_id?: string | null
          persons?: number | null
          project_id?: string | null
          rate_per_day?: number | null
          rejection_reason?: string | null
          status?: string | null
          submitted_by?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_amount?: number | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string
          assigned_pm: string | null
          city: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string
          email: string | null
          id: string
          lead_source: string | null
          notes: string | null
          phone: string
          pincode: string | null
          project_type: Database["public"]["Enums"]["project_type"]
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string | null
        }
        Insert: {
          address: string
          assigned_pm?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name: string
          email?: string | null
          id?: string
          lead_source?: string | null
          notes?: string | null
          phone: string
          pincode?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
        }
        Update: {
          address?: string
          assigned_pm?: string | null
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string
          email?: string | null
          id?: string
          lead_source?: string | null
          notes?: string | null
          phone?: string
          pincode?: string | null
          project_type?: Database["public"]["Enums"]["project_type"]
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          quantity_in_stock: number | null
          reorder_level: number | null
          supplier_name: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          quantity_in_stock?: number | null
          reorder_level?: number | null
          supplier_name?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          quantity_in_stock?: number | null
          reorder_level?: number | null
          supplier_name?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          payment_method: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          project_id: string | null
          received_date: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          transaction_ref: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          project_id?: string | null
          received_date?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_ref?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          project_id?: string | null
          received_date?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_ref?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          base_salary: number | null
          created_at: string
          deductions: number
          expense_reimbursement: number
          generated_by: string | null
          hourly_rate: number
          id: string
          month: number
          notes: string | null
          paid_at: string | null
          status: string
          total_hours: number
          total_payable: number | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number | null
          created_at?: string
          deductions?: number
          expense_reimbursement?: number
          generated_by?: string | null
          hourly_rate?: number
          id?: string
          month: number
          notes?: string | null
          paid_at?: string | null
          status?: string
          total_hours?: number
          total_payable?: number | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          base_salary?: number | null
          created_at?: string
          deductions?: number
          expense_reimbursement?: number
          generated_by?: string | null
          hourly_rate?: number
          id?: string
          month?: number
          notes?: string | null
          paid_at?: string | null
          status?: string
          total_hours?: number
          total_payable?: number | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          last_name: string | null
          login_type: Database["public"]["Enums"]["login_type"]
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          login_type?: Database["public"]["Enums"]["login_type"]
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          login_type?: Database["public"]["Enums"]["login_type"]
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_materials: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          id: string
          material_id: string | null
          material_name: string | null
          ordered_at: string | null
          project_id: string
          quantity: number
          selected_vendor: string | null
          status: string | null
          total_price: number | null
          unit_price: number | null
          vendor_quotes: Json | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          material_id?: string | null
          material_name?: string | null
          ordered_at?: string | null
          project_id: string
          quantity: number
          selected_vendor?: string | null
          status?: string | null
          total_price?: number | null
          unit_price?: number | null
          vendor_quotes?: Json | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          material_id?: string | null
          material_name?: string | null
          ordered_at?: string | null
          project_id?: string
          quantity?: number
          selected_vendor?: string | null
          status?: string | null
          total_price?: number | null
          unit_price?: number | null
          vendor_quotes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          capacity_kw: number | null
          created_at: string | null
          expected_end_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          pm_id: string | null
          project_name: string
          project_type: Database["public"]["Enums"]["project_type"]
          start_date: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          capacity_kw?: number | null
          created_at?: string | null
          expected_end_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          pm_id?: string | null
          project_name: string
          project_type?: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          capacity_kw?: number | null
          created_at?: string | null
          expected_end_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          pm_id?: string | null
          project_name?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bom: Json | null
          created_at: string | null
          gst_amount: number | null
          id: string
          lead_id: string
          prepared_by: string | null
          quotation_number: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"] | null
          subtotal: number | null
          system_kw: number | null
          terms_conditions: string | null
          total_amount: number | null
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bom?: Json | null
          created_at?: string | null
          gst_amount?: number | null
          id?: string
          lead_id: string
          prepared_by?: string | null
          quotation_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          subtotal?: number | null
          system_kw?: number | null
          terms_conditions?: string | null
          total_amount?: number | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bom?: Json | null
          created_at?: string | null
          gst_amount?: number | null
          id?: string
          lead_id?: string
          prepared_by?: string | null
          quotation_number?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"] | null
          subtotal?: number | null
          system_kw?: number | null
          terms_conditions?: string | null
          total_amount?: number | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          ac_length: number | null
          breaker_location: string | null
          building_type: Database["public"]["Enums"]["building_type"] | null
          completed_at: string | null
          created_at: string | null
          customer_approval_breaker: boolean | null
          customer_approval_cable: boolean | null
          customer_approval_inverter: boolean | null
          customer_approval_panel: boolean | null
          customer_feedback: string | null
          dc_length: number | null
          earth_length: number | null
          earth_location: string | null
          eb_service_no: string | null
          engineer_id: string | null
          floors: number | null
          id: string
          inverter_location: string | null
          la_location: string | null
          la_point: boolean | null
          latitude: string | null
          lead_id: string
          longitude: string | null
          panel_loading: Database["public"]["Enums"]["panel_loading"] | null
          recommended_capacity: number | null
          roof_area: number | null
          roof_diagram_url: string | null
          roof_length: number | null
          roof_width: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          site_photos: Json | null
          status: string | null
          structure_height: number | null
          structure_material:
            | Database["public"]["Enums"]["structure_material"]
            | null
          supervisor_name: string | null
          supervisor_signature: string | null
          updated_at: string | null
        }
        Insert: {
          ac_length?: number | null
          breaker_location?: string | null
          building_type?: Database["public"]["Enums"]["building_type"] | null
          completed_at?: string | null
          created_at?: string | null
          customer_approval_breaker?: boolean | null
          customer_approval_cable?: boolean | null
          customer_approval_inverter?: boolean | null
          customer_approval_panel?: boolean | null
          customer_feedback?: string | null
          dc_length?: number | null
          earth_length?: number | null
          earth_location?: string | null
          eb_service_no?: string | null
          engineer_id?: string | null
          floors?: number | null
          id?: string
          inverter_location?: string | null
          la_location?: string | null
          la_point?: boolean | null
          latitude?: string | null
          lead_id: string
          longitude?: string | null
          panel_loading?: Database["public"]["Enums"]["panel_loading"] | null
          recommended_capacity?: number | null
          roof_area?: number | null
          roof_diagram_url?: string | null
          roof_length?: number | null
          roof_width?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          site_photos?: Json | null
          status?: string | null
          structure_height?: number | null
          structure_material?:
            | Database["public"]["Enums"]["structure_material"]
            | null
          supervisor_name?: string | null
          supervisor_signature?: string | null
          updated_at?: string | null
        }
        Update: {
          ac_length?: number | null
          breaker_location?: string | null
          building_type?: Database["public"]["Enums"]["building_type"] | null
          completed_at?: string | null
          created_at?: string | null
          customer_approval_breaker?: boolean | null
          customer_approval_cable?: boolean | null
          customer_approval_inverter?: boolean | null
          customer_approval_panel?: boolean | null
          customer_feedback?: string | null
          dc_length?: number | null
          earth_length?: number | null
          earth_location?: string | null
          eb_service_no?: string | null
          engineer_id?: string | null
          floors?: number | null
          id?: string
          inverter_location?: string | null
          la_location?: string | null
          la_point?: boolean | null
          latitude?: string | null
          lead_id?: string
          longitude?: string | null
          panel_loading?: Database["public"]["Enums"]["panel_loading"] | null
          recommended_capacity?: number | null
          roof_area?: number | null
          roof_diagram_url?: string | null
          roof_length?: number | null
          roof_width?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          site_photos?: Json | null
          status?: string | null
          structure_height?: number | null
          structure_material?:
            | Database["public"]["Enums"]["structure_material"]
            | null
          supervisor_name?: string | null
          supervisor_signature?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_visits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_role: Database["public"]["Enums"]["app_role"] | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
          work_type: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
          work_type?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_role?: Database["public"]["Enums"]["app_role"] | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_assigned_to_profiles"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          latitude_in: string | null
          latitude_out: string | null
          lead_id: string | null
          longitude_in: string | null
          longitude_out: string | null
          notes: string | null
          project_id: string | null
          time_in: string | null
          time_out: string | null
          total_hours: number | null
          updated_at: string
          user_id: string
          work_type: string | null
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          latitude_in?: string | null
          latitude_out?: string | null
          lead_id?: string | null
          longitude_in?: string | null
          longitude_out?: string | null
          notes?: string | null
          project_id?: string | null
          time_in?: string | null
          time_out?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id: string
          work_type?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          latitude_in?: string | null
          latitude_out?: string | null
          lead_id?: string | null
          longitude_in?: string | null
          longitude_out?: string | null
          notes?: string | null
          project_id?: string | null
          time_in?: string | null
          time_out?: string | null
          total_hours?: number | null
          updated_at?: string
          user_id?: string
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
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
      is_accounts: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_customer: { Args: { _user_id: string }; Returns: boolean }
      is_employee: { Args: { _user_id: string }; Returns: boolean }
      is_project_manager: { Args: { _user_id: string }; Returns: boolean }
      is_storekeeper: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "accounts"
        | "hr"
        | "project_manager"
        | "senior_engineer"
        | "site_supervisor"
        | "solar_engineer"
        | "junior_technician"
        | "storekeeper"
      building_type: "rcc_roof" | "sheet_roof"
      document_type:
        | "site_visit"
        | "bom1"
        | "quotation"
        | "work_order"
        | "bom2"
        | "panel_details"
        | "inverter_details"
        | "battery_details"
        | "material_list"
        | "eb_document"
        | "completion_report"
        | "gst_invoice"
        | "ceg_approval"
        | "other"
      expense_type: "food" | "travel" | "material" | "other"
      lead_status:
        | "new_call"
        | "site_visit_required"
        | "site_visit_assigned"
        | "site_visit_completed"
        | "quotation_prepared"
        | "quote_sent"
        | "customer_approved"
        | "payment_received"
        | "material_ordered"
        | "material_delivered"
        | "installation_started"
        | "completed"
        | "cancelled"
      login_type: "admin" | "employee" | "customer"
      panel_loading: "lift_available" | "staircase_carry" | "rope_handling"
      payment_status: "pending" | "partial" | "completed"
      payment_type: "advance" | "progress" | "final"
      project_type: "epc" | "service" | "oam"
      quote_status: "draft" | "sent" | "approved" | "rejected"
      structure_material: "ms" | "aluminium" | "gi"
      task_status: "pending" | "in_progress" | "completed" | "delayed"
      work_type: "lead" | "project"
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
        "accounts",
        "hr",
        "project_manager",
        "senior_engineer",
        "site_supervisor",
        "solar_engineer",
        "junior_technician",
        "storekeeper",
      ],
      building_type: ["rcc_roof", "sheet_roof"],
      document_type: [
        "site_visit",
        "bom1",
        "quotation",
        "work_order",
        "bom2",
        "panel_details",
        "inverter_details",
        "battery_details",
        "material_list",
        "eb_document",
        "completion_report",
        "gst_invoice",
        "ceg_approval",
        "other",
      ],
      expense_type: ["food", "travel", "material", "other"],
      lead_status: [
        "new_call",
        "site_visit_required",
        "site_visit_assigned",
        "site_visit_completed",
        "quotation_prepared",
        "quote_sent",
        "customer_approved",
        "payment_received",
        "material_ordered",
        "material_delivered",
        "installation_started",
        "completed",
        "cancelled",
      ],
      login_type: ["admin", "employee", "customer"],
      panel_loading: ["lift_available", "staircase_carry", "rope_handling"],
      payment_status: ["pending", "partial", "completed"],
      payment_type: ["advance", "progress", "final"],
      project_type: ["epc", "service", "oam"],
      quote_status: ["draft", "sent", "approved", "rejected"],
      structure_material: ["ms", "aluminium", "gi"],
      task_status: ["pending", "in_progress", "completed", "delayed"],
      work_type: ["lead", "project"],
    },
  },
} as const
