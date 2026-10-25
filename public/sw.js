/* No authenticated HTML or API response is cached by this service worker. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let data;try{data=event.data.json();}catch{return;}
 if(!data||typeof data.title!=='string'||typeof data.key!=='string'||data.expires&&data.expires<Date.now())return;
 const cache=await caches.open('ww-push-seen-v1'),key=new Request(self.location.origin+'/__push_seen/'+encodeURIComponent(data.key));if(await cache.match(key))return;
 await self.registration.showNotification(data.title.slice(0,120),{body:String(data.body||'').slice(0,500),icon:'/icon.png?v=2',badge:'/icon.png?v=2',tag:data.key,renotify:false,data:{url:typeof data.url==='string'&&data.url.startsWith('/')&&!data.url.startsWith('//')?data.url:'/instellingen'}});
 await cache.put(key,new Response(String(Date.now())));const keys=await cache.keys();for(const old of keys.slice(0,Math.max(0,keys.length-150)))await cache.delete(old);
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const target=new URL(event.notification.data?.url||'/',self.location.origin);if(target.origin!==self.location.origin)return;const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients)if(new URL(client.url).origin===target.origin){await client.navigate(target.href);return client.focus();}return self.clients.openWindow(target.href);})());});
