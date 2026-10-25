import {json} from '@/lib/server';
import {getBelgianAlerts} from '@/lib/belgian-alerts';
export async function GET(){try{return json(await getBelgianAlerts());}catch{return json({error:'De officiële waarschuwingsbron is niet bereikbaar. De huidige waarschuwingsstatus is onbekend.',items:null},503);}}
