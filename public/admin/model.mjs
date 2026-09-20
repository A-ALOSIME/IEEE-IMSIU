export const uid = () => globalThis.crypto.randomUUID();
export const roles = { super: 'Super Admin', hr: 'HR', editor: 'Content Editor' };
export const statuses = { new: 'بانتظار المراجعة', accepted: 'مقبول', waitlist: 'قائمة انتظار', rejected: 'غير مقبول', draft: 'مسودة', published: 'منشور', archived: 'مؤرشف', active: 'نشط', inactive: 'غير نشط', left: 'غادر', removed: 'أزيل', open: 'مفتوح', closed: 'مغلق', ended: 'انتهت', soon: 'قريبًا', full: 'مكتمل العدد', enabled: 'مفعّل', disabled: 'معطّل', Sent: 'Sent', Delivered: 'Delivered', Failed: 'Failed' };
export const templates = {
 quick: [{label:'الاسم',type:'text',required:true},{label:'البريد الإلكتروني',type:'email',required:true},{label:'رقم الجوال',type:'tel',required:true}],
 student: [{label:'الاسم',type:'text',required:true},{label:'البريد الإلكتروني',type:'email',required:true},{label:'رقم الجوال',type:'tel',required:true},{label:'الرقم الجامعي',type:'number',required:true},{label:'التخصص',type:'select',options:'علوم الحاسب، نظم المعلومات، تقنية المعلومات',required:true}],
 limited: [{label:'الاسم',type:'text',required:true},{label:'البريد الإلكتروني',type:'email',required:true},{label:'التخصص',type:'text',required:true},{label:'لماذا ترغب في المشاركة؟',type:'textarea',required:true},{label:'ملف أعمال',type:'file',required:false}],
 custom: []
};
export function seed(){return {events:[],applications:[],members:[],registrations:[],cycles:[],committees:[],hours:[],articles:[],announcements:[],team:[],dispatches:[],redirects:[],clubLeadership:{leader:'',leaderRole:'قائد',deputy:'',deputyRole:'نائب'}};}
export function canAccess(role, area) {
 if(role==='super') return true;
 if(!['hr','editor'].includes(role)) return false;
 return (role==='hr' ? ['overview','events','registrations','membership','applications','members','committees','hours','email'] : ['overview','articles']).includes(area);
}
export function setStatuses(records, ids, status) { records.filter(x=>ids.includes(x.id)).forEach(x=>x.status=status); }
export function convertToMember(db,id,values) {
 const a=db.applications.find(x=>x.id===id);
 if(!a || a.status!=='accepted') throw Error('يجب قبول الطلب قبل تحويله إلى عضو.');
 const existing=db.members.find(x=>x.id===a.memberId || x.email.toLowerCase()===a.email.toLowerCase());
 if(existing) {a.memberId=existing.id;return existing;}
 const m={...a,...values,id:uid(),status:'active',joinDate:new Date().toISOString().slice(0,10),period:values.period||'الفصل الأول 1448'};
 delete m.memberId;delete m.cv;delete m.cycle;
 db.members.push(m);a.memberId=m.id;return m;
}
export function addHours(db,ids,values) {
 const members=[...new Set(ids)];
 if(!members.length || members.some(id=>!db.members.some(x=>x.id===id))) throw Error('اختر أعضاء صالحين.');
 const n=Number(values.hours);
 if(!Number.isFinite(n)||n<=0||n>24||!values.activity?.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(values.date||'')) throw Error('أدخل نشاطًا وتاريخًا وساعات بين 0 و24.');
 const entries=members.map(member=>({...values,hours:n,member,id:uid()}));db.hours.push(...entries);return entries;
}
export function csv(keys,records,labels=keys) {
 const cell=v=>{let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 return '\ufeff'+[labels,...records.map(x=>keys.map(k=>x[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
}

export function validEventRange(v) {
 const start=new Date(`${v.date}T${v.time}`),end=new Date(`${v.end||v.date}T${v.endTime}`);
 return Number.isFinite(+start)&&Number.isFinite(+end)&&end>start;
}
export function acceptApplications(db,ids,values={}) {
 const records=[...new Set(ids)].map(id=>db.applications.find(x=>x.id===id));
 if(!records.length||records.some(x=>!x))throw Error('اختر طلبات صالحة.');
 if(values.committee&&!db.committees.some(x=>x.id===values.committee))throw Error('اختر لجنة صالحة.');
 if(records.some(x=>!x.name||!x.email))throw Error('أكمل الاسم والبريد قبل القبول.');
 return records.map(a=>{a.status='accepted';return convertToMember(db,a.id,{...values,role:values.role||'عضو'});});
}
export function assignLeadership(db,scope,v) {
 if(scope!=='club'&&!db.committees.some(x=>x.id===scope))throw Error('اللجنة غير موجودة.');
 if(v.leader&&v.leader===v.deputy)throw Error('اختر شخصين مختلفين للقائد والنائب.');
 for(const id of [v.leader,v.deputy].filter(Boolean))if(!db.members.some(x=>x.id===id&&x.status==='active'))throw Error('اختر عضوًا نشطًا.');
 if(!['قائد','قائدة'].includes(v.leaderRole)||!['نائب','نائبة'].includes(v.deputyRole))throw Error('اختر مسميات القيادة.');
 if(scope==='club'){db.clubLeadership={leader:v.leader,leaderRole:v.leaderRole,deputy:v.deputy,deputyRole:v.deputyRole};return;}
 db.members.filter(m=>m.committee===scope&&['قائد','قائدة','نائب','نائبة'].includes(m.role)).forEach(m=>m.role='عضو');
 for(const [key,roleKey] of [['leader','leaderRole'],['deputy','deputyRole']])if(v[key])Object.assign(db.members.find(m=>m.id===v[key]),{committee:scope,role:v[roleKey]});
}
export function overviewTasks(db,role) {
 return {applications:role==='editor'?0:db.applications.filter(x=>x.status==='new'||x.status==='accepted'&&!x.memberId).length,registrations:role==='editor'?0:db.registrations.filter(x=>x.status==='new').length,drafts:role==='hr'?0:db.articles.filter(x=>x.status==='draft').length,email:role==='editor'?0:db.dispatches.filter(x=>x.recipients.some(r=>r.status==='Failed'||r.status==='Sent')).length};
}
