import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";

const supabaseClient = createClientComponentClient<Database>();

export default supabaseClient; 