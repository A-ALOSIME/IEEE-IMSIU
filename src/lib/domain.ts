import {z} from 'zod';
import sanitizeHtml from 'sanitize-html';
export type Role='super'|'hr'|'editor';
export type Row=Record<string,unknown>&{id:string};
export type State=Record<string,Row[]>;
export const kinds=['events','registrations','cycles','applications','members','committees','hours','articles','announcements','team','dispatches','redirects','clubLeadership'] as const;
export type Kind=typeof kinds[number];
export const committeeNames={activities:'لجنة الأنشطة',media:'لجنة الإعلام',content:'لجنة المحتوى والتطوير',hr:'لجنة الموارد البشرية'};
export function canWrite(role:string,kind:string){return role==='super'&&kind!=='dispatches'||role==='hr'&&['events','registrations','cycles','applications','members','committees','hours','clubLeadership'].includes(kind)||role==='editor'&&kind==='articles';}
export function canRead(role:string,kind:string){return role==='super'||role==='hr'&&['events','registrations','cycles','applications','members','committees','hours','clubLeadership','dispatches'].includes(kind)||role==='editor'&&kind==='articles';}
const id=z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const text=z.string().max(1000),long=z.string().max(30000),email=z.email().trim().toLowerCase().max(254);
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v+'T12:00:00Z')));
const clock=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const optional=text.optional(),status=z.enum(['new','accepted','waitlist','rejected']);
const committee=z.enum(['activities','media','content','hr']);
const image=z.string().max(250).refine(v=>!v||/^\/media\/[\w-]+$/.test(v)||/^\/?(?:admin\/)?assets\/[\w/.-]+$/.test(v)||/^[\w/.-]+\.(webp|png|jpg|jpeg)$/.test(v));
const attachment=z.string().max(250).refine(v=>!v||/^\/media\/[\w-]+$/.test(v));
const url=z.string().max(2000).refine(v=>!v||/^https?:\/\//.test(v)&&URL.canParse(v));
const formField=z.object({label:z.string().min(1).max(150),type:z.enum(['text','textarea','email','tel','number','select','radio','checkbox','checkboxes','file','date']),required:z.boolean(),options:optional,help:optional,placeholder:optional,condition:z.number().int().min(0).optional(),conditionValue:optional});
export const fields=z.array(formField).max(30);
const base={id};
const person={...base,name:z.string().trim().min(1).max(150),email,phone:z.string().max(30),studentId:optional,major:z.enum(['علوم الحاسب','نظم المعلومات','تقنية المعلومات','']).optional(),date:day.optional(),committee:committee.optional()};
const schemas={
 events:z.object({...base,title:z.string().trim().min(1).max(150),titleEn:optional,description:long.optional(),date:day,time:clock,end:day,endTime:clock,location:optional,image:image.optional(),alt:optional,status:z.enum(['draft','published','archived']),registration:z.enum(['soon','open','full','waitlist','closed','ended']),mode:z.enum(['none','direct','review']),capacity:z.number().int().positive().max(9999).nullable().optional(),waitlist:z.boolean().optional(),featured:z.boolean().optional(),opens:z.string().max(30).optional(),closes:z.string().max(30).optional(),fields}),
 cycles:z.object({...base,title:z.string().trim().min(1).max(150),description:long.optional(),start:day,end:day,status:z.enum(['open','closed']),fields}),
 registrations:z.object({...person,event:id,status,answer:long.optional(),answers:z.record(z.string(),z.union([text,z.array(text)])).optional(),cv:attachment.optional()}),
 applications:z.object({...person,cycle:id,status,about:long.optional(),experience:long.optional(),answers:z.record(z.string(),z.union([text,z.array(text)])).optional(),cv:attachment.optional(),memberId:id.nullable().optional()}),
 members:z.object({...person,status:z.enum(['active','inactive','left','removed']),role:z.enum(['عضو','قائد','قائدة','نائب','نائبة']),period:z.string().min(1).max(150),joinDate:day}),
 committees:z.object({...base,title:text,description:text}),
 hours:z.object({...base,member:id,activity:z.string().trim().min(1).max(1000),hours:z.number().positive().max(24),date:day,period:z.string().min(1).max(150)}),
 articles:z.object({...base,title:z.string().trim().min(1).max(180),titleEn:optional,excerpt:optional,body:long,bodyEn:long.optional(),image:image.optional(),alt:optional,author:text,category:text,tags:optional,slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150),status:z.enum(['draft','published','archived']),date:day,updated:day.optional(),seo:optional,meta:optional,featured:z.boolean().optional()}),
 announcements:z.object({...base,title:z.string().min(1).max(180),text:z.string().min(1).max(1000),button:optional,url:url.optional(),status:z.enum(['enabled','disabled'])}),
 team:z.object({...base,name:optional,email,role:z.enum(['super','hr','editor']),status:z.enum(['enabled','disabled'])}),
 redirects:z.object({...base,slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),url:z.url().refine(v=>{const url=new URL(v);return url.protocol==='https:'&&['ieeeimsiu.org','www.ieeeimsiu.org'].includes(url.hostname);}).max(2000),status:z.enum(['enabled','disabled'])}),
 clubLeadership:z.object({id:z.literal('club'),leader:id.or(z.literal('')),leaderRole:z.enum(['قائد','قائدة']),deputy:id.or(z.literal('')),deputyRole:z.enum(['نائب','نائبة'])})
};
export function sanitizeArticle(html:string){return sanitizeHtml(html,{allowedTags:['p','h2','h3','strong','b','em','i','u','ul','ol','li','a','br','blockquote','img'],allowedAttributes:{a:['href','rel'],img:['src','alt']},allowedSchemes:['http','https'],transformTags:{a:(_tag,attrs)=>({tagName:'a',attribs:{href:attrs.href||'',rel:'noopener noreferrer'}})},exclusiveFilter:frame=>frame.tag==='img'&&!/^\/(media\/[\w-]+|admin\/assets\/[\w/.-]+)$/.test(frame.attribs.src||'')});}
export function validateRecord(kind:string,input:unknown):Row{
 if(!(kind in schemas))throw Error('نوع السجل غير مسموح.');
 const row=schemas[kind as keyof typeof schemas].parse(input) as Row;
 if(kind==='events'){const start=Date.parse(`${row.date}T${row.time}:00+03:00`),end=Date.parse(`${row.end}T${row.endTime}:00+03:00`);if(end<=start)throw Error('وقت الانتهاء يجب أن يكون بعد البداية.');if(row.opens&&row.closes&&String(row.closes)<String(row.opens))throw Error('موعد الإغلاق يسبق الفتح.');}
 if(kind==='cycles'&&String(row.end)<String(row.start))throw Error('موعد النهاية يسبق البداية.');
 if(kind==='articles'){row.body=sanitizeArticle(String(row.body));if(row.bodyEn)row.bodyEn=sanitizeArticle(String(row.bodyEn));if(row.status==='published'&&!sanitizeHtml(String(row.body),{allowedTags:[],allowedAttributes:{}}).trim())throw Error('أضف محتوى المقال قبل النشر.');}
 if(kind==='committees'&&committeeNames[row.id as keyof typeof committeeNames]!==row.title)throw Error('اللجان الأربع ثابتة.');
 return row;
}
export function validateState(s:State){
 const find=(kind:string,id:unknown)=>(s[kind]||[]).find(x=>x.id===id);
 for(const m of s.members||[])if(!find('committees',m.committee))throw Error('اختر لجنة صالحة للعضو.');
 for(const a of s.applications||[]){if(!find('cycles',a.cycle))throw Error('دورة القبول غير موجودة.');if(a.status==='accepted'&&(!a.memberId||!find('members',a.memberId)||find('members',a.memberId)?.email!==a.email))throw Error('قبول الطلب يتطلب سجل العضو المرتبط.');}
 for(const r of s.registrations||[])if(!find('events',r.event))throw Error('الفعالية غير موجودة.');
 for(const h of s.hours||[])if(!find('members',h.member))throw Error('العضو غير موجود.');
 for(const e of s.events||[])if(e.capacity&&(s.registrations||[]).filter(r=>r.event===e.id&&r.status==='accepted').length>Number(e.capacity))throw Error('عدد المقبولين يتجاوز السعة.');
 for(const c of s.committees||[])for(const titles of [['قائد','قائدة'],['نائب','نائبة']])if((s.members||[]).filter(m=>m.committee===c.id&&titles.includes(String(m.role))).length>1)throw Error('للجنة قائد واحد ونائب واحد.');
 for(const c of s.clubLeadership||[]){if(c.leader&&c.leader===c.deputy)throw Error('اختر شخصين مختلفين للقيادة.');for(const id of [c.leader,c.deputy].filter(Boolean))if(find('members',id)?.status!=='active')throw Error('اختر عضوًا نشطًا للقيادة.');}
 if(s.team&&!s.team.some(x=>x.role==='super'&&x.status==='enabled'))throw Error('يجب إبقاء مسؤول نظام واحد على الأقل.');
}
