import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {bootstrap,commit,readState,type Change} from '../../../lib/db';
import {canRead,canWrite,kinds,validateRecord,validateState,type Row} from '../../../lib/domain';
import {failure,HttpError,identity,jsonBody,respond,sameOrigin,localMode} from '../../../lib/auth';
export const GET:APIRoute=async({request})=>{try{await bootstrap(env.DB,env.INITIAL_ADMIN_EMAIL);const user=await identity(request,env),{state,version}=await readState(env.DB);const visible=Object.fromEntries(kinds.map(kind=>[kind,canRead(user.role,kind)?state[kind]:[]]));return respond({state:visible,version,user,development:localMode(request,env)});}catch(error){return failure(error);}};
const patch=z.object({version:z.number().int().min(0),changes:z.array(z.object({kind:z.enum(kinds),id:z.string().min(1).max(100),value:z.record(z.string(),z.unknown()).nullable()})).min(1).max(200)});
export const PATCH:APIRoute=async({request})=>{try{sameOrigin(request);const user=await identity(request,env),input=patch.parse(await jsonBody(request)),{state,version}=await readState(env.DB);if(input.version!==version)throw new HttpError(409,'تغيرت البيانات. حدّث الصفحة قبل الحفظ.');const changes:Change[]=[];
 for(const c of input.changes){if(!canWrite(user.role,c.kind))throw new HttpError(403,'لا تملك صلاحية تعديل هذا القسم.');const old=state[c.kind].find(x=>x.id===c.id);let value:Row|null=null;
  if(c.value){try{value=validateRecord(c.kind,c.value);}catch(error){if(error instanceof z.ZodError)throw error;throw new HttpError(422,error instanceof Error?error.message:'البيانات غير صالحة.');}if(value.id!==c.id)throw new HttpError(422,'معرّف السجل غير صالح.');if(['applications','registrations'].includes(c.kind)&&!old)throw new HttpError(422,'الطلبات تُنشأ من النماذج العامة.');if(user.role!=='super'&&value.featured!==old?.featured&&value.featured!==false&&value.featured!==undefined)throw new HttpError(403,'تثبيت المحتوى للمسؤول فقط.');if(user.role!=='super'&&old?.featured&&!value.featured)value.featured=old.featured;state[c.kind]=state[c.kind].filter(x=>x.id!==c.id).concat(value);
  }else{if(['team','committees','applications','registrations','members','dispatches','clubLeadership'].includes(c.kind))throw new HttpError(422,'غيّر حالة السجل بدل حذفه.');state[c.kind]=state[c.kind].filter(x=>x.id!==c.id);}
  changes.push({kind:c.kind,id:c.id,value});
 }
 try{validateState(state);}catch(error){throw new HttpError(422,error instanceof Error?error.message:'البيانات غير صالحة.');}
 const newVersion=await commit(env.DB,version,user.email,changes);return respond({version:newVersion,records:changes});
 }catch(error){if(error instanceof z.ZodError)return respond({error:'راجع الحقول المطلوبة وأنواع البيانات.',fields:error.issues.map(x=>x.path.join('.'))},422);return failure(error);}};
