import { createClient } from '@supabase/supabase-js';
const VITE_SUPABASE_URL = "https://akxcyibzrmqvbojwbfqz.supabase.co";
const VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreGN5aWJ6cm1xdmJvandiZnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMTc3ODMsImV4cCI6MjEwNTc5Mzc4M30.AuCBQmbPyjlZ7Hjz10Isi7l8Rgf0Rx7VxF2NR6eIS14";

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function checkTable(tableName) {
  console.log(`Checking table: ${tableName}...`);
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error) {
    console.error(`  Error checking ${tableName}:`, error.message);
  } else {
    console.log(`  Success checking ${tableName}! Data length:`, data?.length);
  }
}

async function run() {
  await checkTable('services');
  await checkTable('cities');
  await checkTable('user_roles');
  await checkTable('profiles');
  await checkTable('providers');
  await checkTable('provider_employees');
  await checkTable('ad_campaigns');
  await checkTable('ad_analytics');
  await checkTable('bookings');
  await checkTable('servicemen');
}

run();
