import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: services, error: svcError } = await supabase.from('services').select('*').limit(10);
  console.log("Services length:", services?.length);
  if (services && services.length > 0) {
      console.log("First service:", Object.keys(services[0]).reduce((acc, k) => ({...acc, [k]: services[0][k]}), {}));
  }
  
  const { data: cities, error: cityError } = await supabase.from('cities').select('*').limit(10);
  console.log("Cities length:", cities?.length);
  if (cities && cities.length > 0) {
      console.log("First city:", cities[0]);
  }
}

run();
