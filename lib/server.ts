import { getChatGPTUser } from '@/app/chatgpt-auth';
export const OWNER_EMAIL = 'smenu@telenet.be';
export async function identity() {
  const user = await getChatGPTUser();
  return user ? { ...user, isAdmin: user.email.toLowerCase() === OWNER_EMAIL } : null;
}
export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin;
}
const inFlight=new Map<string,Promise<any>>();
const cache = new Map<string, {at:number; value:unknown}>();
export async function source<T>(url: string, ttl: number, parse: (response: Response) => Promise<T>): Promise<{data:T; fetchedAt:string;stale?:boolean}> {
  const old = cache.get(url);
  if (old && Date.now()-old.at < ttl) return old.value as any;
  if(inFlight.has(url))return inFlight.get(url)!;
  const work = (async () => {
    const response = await fetch(url, {signal:AbortSignal.timeout(12000),headers:{Accept:'*/*', 'User-Agent':'Weerwacht/1.0 (personal non-commercial weather app)'}});
    if (!response.ok) { console.error('Weather source HTTP error', new URL(url).hostname, response.status); throw new Error('Upstream '+response.status); }
    const value = {data:await parse(response), fetchedAt:new Date().toISOString()};
    if(cache.size>100) cache.delete(cache.keys().next().value!);
    cache.set(url,{at:Date.now(),value}); return value;
  })();
  inFlight.set(url,work);
  try{return await work;}catch(e:any){console.error('Weather source failure',new URL(url).hostname,e?.name);if(old&&Date.now()-old.at<86400000)return {...old.value as any,stale:true};throw e;}finally{inFlight.delete(url);}
}
