import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cuucmjfycczkpuyitczg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1dWNtamZ5Y2N6a3B1eWl0Y3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDMyMDAsImV4cCI6MjEwMDExOTIwMH0.9PHh73ryJqIQ6lshKrWfIV-0aQbQ42KBA-X2L8QlaYE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Re-export as supabaseClient for backward compatibility
export const supabaseClient = supabase;
