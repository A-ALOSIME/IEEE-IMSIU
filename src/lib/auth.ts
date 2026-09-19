import {createRemoteJWKSet,jwtVerify} from 'jose';
import {canRead,type Role,type Row} from './domain';
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export function localMode(request:Request,env:Env){return env.APP_ENV==='development'&&['127.0.0.1','localhost','[::1]'].includes(new URL(request.url).hostname);}
export async function identity(request:Request,env:Env):Promise<{email:string;role:Role;id:string}>{
 let email='';
 if(localMode(request,env))email=request.headers.get('X-Dev-Email')||env.INITIAL_ADMIN_EMAIL;
 else{
  if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD)throw new HttpError(503,'لم تكتمل إعدادات بوابة الدخول.');
  const assertion=request.headers.get('Cf-Access-Jwt-Assertion');if(!assertion)throw new HttpError(401,'سجّل الدخول عبر بوابة الإدارة.');
  const issuer=`https://${env.ACCESS_TEAM_DOMAIN}`;
  try{const {payload}=await jwtVerify(assertion,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')),{issuer,audience:env.ACCESS_AUD,algorithms:['RS256']});if(typeof payload.email==='string')email=payload.email;}catch{throw new HttpError(401,'انتهت جلسة الدخول.');}
 }
 const found=await env.DB.prepare("SELECT payload FROM records WHERE kind='team' AND lower(json_extract(payload,'$.email'))=?").bind(email.toLowerCase()).first<{payload:string}>();const user:Row|undefined=found?JSON.parse(found.payload):undefined;
 if(!user||user.status!=='enabled'||!['super','hr','editor'].includes(String(user.role)))throw new HttpError(403,'هذا البريد غير مخوّل لدخول الإدارة.');
 return {email:email.toLowerCase(),role:user.role as Role,id:user.id};
}
export function sameOrigin(request:Request){const url=new URL(request.url);if(request.headers.get('Origin')!==url.origin||request.headers.get('X-Requested-With')!=='IEEE-IMSIU')throw new HttpError(403,'طلب غير مصرح.');}
export function requireRead(role:string,kind:string){if(!canRead(role,kind))throw new HttpError(403,'القسم غير متاح لدورك.');}
export async function jsonBody(request:Request,max=250000){const body=await boundedBody(request,max);try{return JSON.parse(new TextDecoder().decode(body)) as unknown;}catch{throw new HttpError(400,'الطلب غير صالح.');}}
export async function boundedBody(request:Request,max:number):Promise<Uint8Array<ArrayBuffer>>{if(Number(request.headers.get('content-length'))>max)throw new HttpError(413,'حجم الطلب أكبر من المسموح.');const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let size=0;for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new HttpError(413,'حجم الطلب أكبر من المسموح.');}chunks.push(value);}const body=new Uint8Array(size);let offset=0;for(const part of chunks){body.set(part,offset);offset+=part.length;}return body;}
export function respond(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export function failure(error:unknown){if(error instanceof HttpError)return respond({error:error.message},error.status);if(error instanceof Error&&(/UNIQUE constraint|revisions.version/.test(error.message)))return respond({error:'تغيرت البيانات أو يوجد سجل مكرر. حدّث الصفحة وحاول مجددًا.'},409);console.error(JSON.stringify({event:'request_failed',type:error instanceof Error?error.name:'unknown'}));return respond({error:'تعذر إكمال العملية. حاول مجددًا.'},500);}
