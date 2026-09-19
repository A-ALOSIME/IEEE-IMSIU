import {kinds,type Row,type State,type Kind} from './domain';
export async function readState(db:D1Database):Promise<{state:State;version:number}>{
 const results=await db.batch([db.prepare('SELECT kind,payload FROM records ORDER BY rowid'),db.prepare('SELECT MAX(version) AS version FROM revisions')]);
 const state:State=Object.fromEntries(kinds.map(kind=>[kind,[]]));
 for(const row of results[0].results as {kind:Kind;payload:string}[])state[row.kind].push(JSON.parse(row.payload));
 return {state,version:Number((results[1].results[0] as {version:number}).version)};
}
export type Change={kind:Kind;id:string;value:Row|null};
export async function commit(db:D1Database,version:number,actor:string,changes:Change[]){
 // ponytail: one revision serializes this low-volume club; use per-record revisions if contention grows.
 const statements=[db.prepare('INSERT INTO revisions(version,actor) VALUES(?,?)').bind(version+1,actor),...changes.map(c=>c.value?db.prepare('INSERT INTO records(kind,id,payload) VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload,updated_at=CURRENT_TIMESTAMP').bind(c.kind,c.id,JSON.stringify(c.value)):db.prepare('DELETE FROM records WHERE kind=? AND id=?').bind(c.kind,c.id))];
 await db.batch(statements);return version+1;
}
export async function bootstrap(db:D1Database,email:string){if(!email)return;await db.prepare("INSERT INTO records(kind,id,payload) SELECT 'team','initial-admin',? WHERE NOT EXISTS(SELECT 1 FROM records WHERE kind='team')").bind(JSON.stringify({id:'initial-admin',name:'مسؤول النظام',email:email.toLowerCase(),role:'super',status:'enabled'})).run();}
