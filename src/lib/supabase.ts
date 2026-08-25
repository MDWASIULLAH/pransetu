import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jdgypmmixkzamzcqdewk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZ3lwbW1peGt6YW16Y3FkZXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMjc5NTQsImV4cCI6MjEwMjkwMzk1NH0.M_BS1bOQZ_PxblmX7zY5RJeyU6FB8kmISymHvfMityI";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
