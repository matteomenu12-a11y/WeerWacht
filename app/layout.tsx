import type {Metadata} from 'next';
import './globals.css';
import '../styles/glass.css';
import ExperienceSettings from './experience-settings';
export const metadata:Metadata={title:'Weerwacht — Het weer. Helder.',description:'Actueel weer, een verwachting voor 10 dagen en officiële Belgische weerwaarschuwingen. Gratis, zonder advertenties.',metadataBase:new URL('https://weerwacht-live.matteomenu.chatgpt.site'),icons:{icon:'/favicon.svg?v=3',apple:'/icon.png?v=3'},manifest:'/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'Weerwacht'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="nl"><body><ExperienceSettings/>{children}</body></html>;}
