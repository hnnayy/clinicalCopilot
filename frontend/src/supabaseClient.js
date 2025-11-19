import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csfrqhopbmxwrihchqxq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZnJxaG9wYm14d3JpaGNocXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NjY4NDMsImV4cCI6MjA3OTE0Mjg0M30.hbLRr-Kv5dAIBbjSrJPhumlkUDJ9fkINozYA36BYuoY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);