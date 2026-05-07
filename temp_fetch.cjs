const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zgzwnbvpfebdphnajsua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenduYnZwZmViZHBobmFqc3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjY1MDUsImV4cCI6MjA5MjgwMjUwNX0.jk0RIbcSF-Pi0m5wvwcyZTlwY4RitAt5UQu4JI2xr5I";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fetchAllData() {
    try {
        console.log("Fetching services...");
        const { data: services, error: svcError } = await supabase.from('services').select('*');
        if (svcError) throw svcError;

        console.log("Fetching variants...");
        const { data: variants, error: varError } = await supabase.from('service_variants').select('*');
        if (varError) throw varError;

        console.log("Fetching addons...");
        const { data: addons, error: addError } = await supabase.from('service_addons').select('*');
        if (addError) throw addError;

        const data = {
            services: services.map(s => ({ id: s.id, name: s.name, price: s.price })),
            variants: variants.map(v => ({ id: v.id, service_id: v.service_id, name: v.name, price: v.price })),
            addons: addons.map(a => ({ id: a.id, service_id: a.service_id, name: a.name, price: a.price }))
        };

        console.log(JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err.message);
    }
}

fetchAllData();
