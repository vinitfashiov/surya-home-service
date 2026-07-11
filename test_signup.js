import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zgzwnbvpfebdphnajsua.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenduYnZwZmViZHBobmFqc3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjY1MDUsImV4cCI6MjA5MjgwMjUwNX0.jk0RIbcSF-Pi0m5wvwcyZTlwY4RitAt5UQu4JI2xr5I";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const email = `test_prov_${Date.now()}@example.com`;
  const password = "password123";
  const fullName = "Test Provider Name";
  
  console.log("Signing up user:", email);
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { 
        full_name: fullName,
        role: 'provider'
      }
    }
  });

  if (signUpError) {
    console.error("Sign up failed:", signUpError);
    return;
  }

  const user = data?.user;
  console.log("Sign up succeeded. User ID:", user?.id);
  console.log("Session present:", !!data?.session);

  // Fetch cities
  console.log("Fetching cities...");
  const { data: cities, error: cityError } = await supabase.from('cities').select('id, name');
  if (cityError) {
    console.error("Cities fetch failed:", cityError);
    return;
  }
  console.log("Cities available:", cities);
  if (cities.length === 0) {
    console.error("No cities in database.");
    return;
  }
  const cityId = cities[0].id;

  // Attempt to insert provider record
  console.log("Inserting provider record using cityId:", cityId);
  const { error: providerError } = await supabase.from('providers').insert({
    user_id: user.id,
    company_name: "Test Company Ltd",
    owner_name: fullName,
    email: email,
    phone: "1234567890",
    address: "123 Test Street",
    city_id: cityId,
    status: 'pending',
  });

  if (providerError) {
    console.error("Provider insert failed:", providerError);
  } else {
    console.log("Provider insert succeeded!");
  }
}

run();
