import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rvjpctnopeesjnjutfvj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2anBjdG5vcGVlc2puanV0ZnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzMzE5MTEsImV4cCI6MjA3MzkwNzkxMX0.jdDcJQErAQxlSrZfru2mbm3QGmAbl9rgh1tMFJmyBZw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
