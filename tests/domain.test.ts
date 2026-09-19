import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canWrite,validateRecord,validateState,sanitizeArticle} from '../src/lib/domain';
import {personFromAnswers} from '../src/lib/public';
test('role boundaries deny unknown roles and content access to personal data',()=>{assert.equal(canWrite('editor','members'),false);assert.equal(canWrite('hr','team'),false);assert.equal(canWrite('super','team'),true);assert.equal(canWrite('unknown','articles'),false);});
test('end time and hours are validated',()=>{assert.throws(()=>validateRecord('events',{id:'x',title:'Event',date:'2026-10-01',time:'17:00',end:'2026-10-01',endTime:'16:00',status:'draft',registration:'closed',mode:'review',fields:[]}));assert.throws(()=>validateRecord('hours',{id:'h',member:'m',activity:'test',hours:-1,date:'2026-10-01',period:'fall'}));});
test('published HTML strips active content',()=>{const html=sanitizeArticle('<p onclick="evil()">hello</p><script>alert(1)</script><img src="https://evil.test/track"><a href="javascript:evil()">link</a>');assert.ok(!html.includes('onclick'));assert.ok(!html.includes('<script'));assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('evil.test'));});
test('invalid member links and leadership cannot be persisted',()=>{assert.throws(()=>validateState({members:[],applications:[{id:'a',status:'accepted',memberId:'missing'}]}));});
test('public person fields use their labels and do not mistake a name for a major',()=>{assert.deepEqual(personFromAnswers([{id:'0',label:'الاسم',type:'text'},{id:'1',label:'البريد الإلكتروني',type:'email'},{id:'2',label:'رقم الجوال',type:'tel'}],{0:'ندى أحمد',1:'NADA@example.com',2:'0500000000'}),{name:'ندى أحمد',email:'nada@example.com',phone:'0500000000',studentId:'',major:''});});
