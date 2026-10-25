import {identity,json} from '@/lib/server';
export async function POST(){const user=await identity();if(!user?.isAdmin)return json({error:'Geen toegang.'},403);return json({error:'Automatische achtergrondmeldingen zijn nog niet beschikbaar op deze hosting.'},501);}
