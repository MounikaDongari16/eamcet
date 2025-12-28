const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

try {
    if (supabaseUrl && supabaseUrl !== 'your_supabase_url' && supabaseKey && supabaseKey !== 'your_supabase_service_role_key') {
        supabase = createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("Supabase credentials missing or placeholders detected. Database features will be disabled.");
    }
} catch (e) {
    console.warn("Failed to initialize Supabase client:", e.message);
}

module.exports = supabase;
