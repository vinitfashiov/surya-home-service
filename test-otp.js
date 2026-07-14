const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zgzwnbvpfebdphnajsua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenduYnZwZmViZHBobmFqc3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjY1MDUsImV4cCI6MjA5MjgwMjUwNX0.jk0RIbcSF-Pi0m5wvwcyZTlwY4RitAt5UQu4JI2xr5I";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  console.log("Invoking send-otp...");
  const res = await supabase.functions.invoke('send-otp', {
    body: { phone: "8544437580" }
  });
  console.log("Result:", res);
}

test();
