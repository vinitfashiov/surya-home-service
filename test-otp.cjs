const SUPABASE_URL = "https://zgzwnbvpfebdphnajsua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenduYnZwZmViZHBobmFqc3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjY1MDUsImV4cCI6MjA5MjgwMjUwNX0.jk0RIbcSF-Pi0m5wvwcyZTlwY4RitAt5UQu4JI2xr5I";

async function test() {
  console.log("Fetching...");
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ phone: "8544437580" })
  });
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

test();
