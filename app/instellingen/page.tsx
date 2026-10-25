import type {Metadata} from 'next';
import Settings from './settings';
export const metadata:Metadata={title:'Instellingen & Alerts — WeerWacht',description:'Beheer je weerlocaties, meldingen, regen- en winddrempels en weergave.'};
export default function Page(){return <Settings/>;}
