import { createClient } from "@supabase/supabase-js";

// Cole aqui as duas informações que você copiou no Supabase:
// Project Settings > API Keys
const SUPABASE_URL = "https://sjhdfiaiapqsdpnoeevw.supabase.co";
const SUPABASE_KEY = "sb_publishable_RXOFUAJ3Sx5qb30KQkg-pQ_hSmisMPx";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
