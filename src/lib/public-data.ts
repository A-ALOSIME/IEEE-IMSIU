import {env} from 'cloudflare:workers';
import {readState} from './db';
import type {Row,State} from './domain';

export async function publicState():Promise<State>{return (await readState(env.DB)).state;}
export const published=(rows:Row[]=[])=>(rows.filter(row=>row.status==='published'));
export const activeAnnouncement=(state:State)=>(state.announcements||[]).find(row=>row.status==='enabled');
const image=(value:unknown,fallback:string)=>{const source=String(value||fallback);return source.startsWith('/')?source:'/admin/assets/'+source;};
export const eventImage=(row:Row)=>image(row.image,'community.webp');
export const articleImage=(row:Row)=>image(row.image,'data-detail.webp');
