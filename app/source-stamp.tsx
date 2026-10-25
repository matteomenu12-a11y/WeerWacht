'use client';
import {createContext,useContext,type ReactNode} from 'react';
type Provenance={fetchedAt?:string;time?:number;stale?:boolean};
const Context=createContext<Provenance>({});
export function WeatherSourceProvider({value,children}:{value:Provenance;children:ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>;}
export function SourceStamp({kind='current'}:{kind?:'current'|'hourly'|'daily'}){const p=useContext(Context),format=(value:number)=>new Intl.DateTimeFormat('nl-BE',{timeZone:'Europe/Brussels',hour:'2-digit',minute:'2-digit'}).format(value);return <small className={'source-stamp '+(p.stale?'source-stale':'')}><a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer">Open-Meteo</a> · {p.stale?'verouderd · ':''}{kind==='current'&&p.time?`geldig om ${format(p.time*1000)} · `:'voorspelling · '}{p.fetchedAt?`bijgewerkt ${format(Date.parse(p.fetchedAt))}`:'nog geen bronantwoord'}</small>;}
