import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import {Resend} from 'resend';
import {boundedBody,failure,HttpError,respond} from '../../../lib/auth';
import type {RuntimeEnv} from '../../../lib/runtime-env';

type ResendEvent={type:string;data:{email_id?:string}};

export const POST:APIRoute=async({request})=>{try{
 const runtimeEnv:RuntimeEnv=env;
 if(!runtimeEnv.RESEND_WEBHOOK_SECRET)throw new HttpError(503,'لم يضبط سر webhook.');
 const eventId=request.headers.get('svix-id')||'';
 if(!eventId)throw new HttpError(400,'ترويسة الحدث مفقودة.');
 if(await env.DB.prepare('SELECT key FROM rate_limits WHERE key=?').bind('webhook:'+eventId).first())return respond({received:true});
 const payload=new TextDecoder().decode(await boundedBody(request,262144));
 const resend=new Resend(runtimeEnv.RESEND_API_KEY||'unused');
 const event=resend.webhooks.verify({payload,headers:{id:eventId,timestamp:request.headers.get('svix-timestamp')||'',signature:request.headers.get('svix-signature')||''},webhookSecret:runtimeEnv.RESEND_WEBHOOK_SECRET}) as ResendEvent;
 const mapped=event.type==='email.delivered'?'Delivered':event.type==='email.bounced'||event.type==='email.failed'?'Failed':event.type==='email.sent'?'Sent':'';
 const statements=[];
 if(mapped&&event.data.email_id){
  const rows=await env.DB.prepare("SELECT id,payload FROM records WHERE kind='dispatches' AND payload LIKE ?").bind('%'+event.data.email_id+'%').all<{id:string;payload:string}>();
  for(const row of rows.results){const dispatch=JSON.parse(row.payload);const recipient=dispatch.recipients.find((x:{providerId?:string})=>x.providerId===event.data.email_id);if(recipient){recipient.status=mapped;statements.push(env.DB.prepare("UPDATE records SET payload=?,updated_at=CURRENT_TIMESTAMP WHERE kind='dispatches' AND id=?").bind(JSON.stringify(dispatch),row.id));}}
 }
 statements.push(env.DB.prepare('INSERT INTO rate_limits(key,hits,expires) VALUES(?,1,?)').bind('webhook:'+eventId,Math.floor(Date.now()/1000)+2592000));
 try{await env.DB.batch(statements);}catch(error){if(/UNIQUE constraint/.test(error instanceof Error?error.message:''))return respond({received:true});throw error;}
 return respond({received:true});
}catch(error){return failure(error);}};
