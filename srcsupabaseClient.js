// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// 1. Load the environment variables
// Note: The way you access environment variables (process.env.VARIABLE_NAME) 
// can vary slightly based on your specific framework (Next.js, Vite, etc.).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key environment variables!')
}

// 2. Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)