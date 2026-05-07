const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://zgzwnbvpfebdphnajsua.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenduYnZwZmViZHBobmFqc3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjY1MDUsImV4cCI6MjA5MjgwMjUwNX0.jk0RIbcSF-Pi0m5wvwcyZTlwY4RitAt5UQu4JI2xr5I";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function updatePricing() {
    console.log("Starting pricing updates...");

    const updates = [
        // 1. Bathroom Cleaning (WC / Toilet Cleaning)
        { table: 'service_variants', id: '77770000-0000-4000-8000-000000000001', data: { price: 349 } }, // Classic
        { table: 'service_variants', id: '77770000-0000-4000-8000-000000000002', data: { price: 449 } }, // Deep Cleaning
        { table: 'service_variants', id: '77770000-0000-4000-8000-000000000004', data: { price: 589 } }, // Move-in (Movie)
        
        // 2. Kitchen Cleaning
        { table: 'services', id: '66660000-0000-4000-8000-000000000006', data: { price: 699 } }, // Kitchen Accessories (Cabinet)
        { table: 'service_variants', id: '77770000-0000-4000-8000-000000000005', data: { price: 499 } }, // Chimney Only
        
        // 3. Home Cleaning
        { table: 'services', id: '66660000-0000-4000-8000-000000000009', data: { price: 2698 } }, // Home Cleaning Service
        
        // 4. Fridge Cleaning
        { table: 'services', id: '66660000-0000-4000-8000-000000000001', data: { price: 499 } }, // Fridge Cleaning
        
        // 5. Painting
        { table: 'services', id: '66660000-0000-4000-8000-00000000000a', data: { price: 1640 } }, // Furniture & Fixture (Cabinet)
    ];

    for (const update of updates) {
        console.log(`Updating ${update.table} ${update.id}...`);
        const { error } = await supabase.from(update.table).update(update.data).eq('id', update.id);
        if (error) console.error(`Error updating ${update.id}:`, error.message);
    }

    const newVariants = [
        // Bathroom
        { service_id: '66660000-0000-4000-8000-00000000000f', name: 'Wash Basin Cleaning', price: 149 },
        
        // Kitchen
        { service_id: '66660000-0000-4000-8000-000000000006', name: 'Kitchen Cabinet Cleaning', price: 699 },
        { service_id: '66660000-0000-4000-8000-000000000007', name: 'Deep Kitchen Cleaning', price: 1399 },
        
        // Home
        { service_id: '66660000-0000-4000-8000-000000000009', name: 'Two Bedroom Home Cleaning', price: 5000 },
        { service_id: '66660000-0000-4000-8000-000000000009', name: 'Three Bedroom Home Cleaning', price: 6500 },
        
        // Car Wash
        { service_id: '66660000-0000-4000-8000-000000000004', name: 'Premium Car Wash (SUV/Large)', price: 599 },
        { service_id: '66660000-0000-4000-8000-000000000004', name: 'Luxury Car Wash', price: 699 },
        
        // Fridge
        { service_id: '66660000-0000-4000-8000-000000000001', name: 'Double Door Fridge Cleaning', price: 649 },
        
        // Painting
        { service_id: '66660000-0000-4000-8000-00000000000a', name: 'Grill Painting', price: 1350 },
        { service_id: '66660000-0000-4000-8000-00000000000b', name: 'Store Room Painting', price: 2349 },
        { service_id: '66660000-0000-4000-8000-00000000000b', name: 'Balcony Painting', price: 3250 },
        { service_id: '66660000-0000-4000-8000-00000000000c', name: 'Kitchen Cabinet Painting', price: 3340 },
        { service_id: '66660000-0000-4000-8000-00000000000c', name: 'Kitchen Painting', price: 3340 },
        { service_id: '66660000-0000-4000-8000-00000000000d', name: '2 Bedroom 1 Bathroom Painting', price: 11000 },
        { service_id: '66660000-0000-4000-8000-00000000000d', name: '3 Bedroom 1 Bathroom Painting', price: 14000 },
        { service_id: '66660000-0000-4000-8000-00000000000b', name: 'Terrace Painting', price: 3149 },
    ];

    for (const variant of newVariants) {
        console.log(`Inserting variant ${variant.name}...`);
        const { error } = await supabase.from('service_variants').insert([variant]);
        if (error) console.error(`Error inserting variant ${variant.name}:`, error.message);
    }

    console.log("Updates completed!");
}

updatePricing();
