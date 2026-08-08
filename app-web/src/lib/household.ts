import { supabase } from '@/lib/supabase'
export type ActiveHousehold={household_id:string;household_name:string;member_role:'owner'|'admin'|'member'}
export async function getActiveHousehold(){const {data,error}=await supabase.rpc('get_active_household');if(error)throw error;const value=data?.[0] as ActiveHousehold|undefined;if(!value)throw new Error('Não foi possível localizar seu espaço compartilhado.');return value}
