import {HttpError} from './auth';
export async function storeFile(env:Env,file:File,scope:'public'|'private',owner:string){
 if(file.size===0||file.size>5*1024*1024)throw new HttpError(422,'حجم الملف يجب أن يكون بين 1 بايت و5 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());const signature=Array.from(bytes.slice(0,12));let mime='';
 if(signature.slice(0,8).join(',')==='137,80,78,71,13,10,26,10')mime='image/png';
 else if(signature[0]===255&&signature[1]===216&&signature[2]===255)mime='image/jpeg';
 else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')mime='image/webp';
 else if(new TextDecoder().decode(bytes.slice(0,5))==='%PDF-')mime='application/pdf';
 if(!mime||mime!==file.type||scope==='public'&&mime==='application/pdf')throw new HttpError(422,'ارفع PNG أو JPG أو WEBP للصور، أو PDF للمرفقات الخاصة.');
 const id=crypto.randomUUID(),key=scope+'/'+id;
 await env.FILES.put(key,bytes,{httpMetadata:{contentType:mime},customMetadata:{scope}});
 try{await env.DB.prepare('INSERT INTO uploads(id,key,scope,mime,size,owner) VALUES(?,?,?,?,?,?)').bind(id,key,scope,mime,file.size,owner).run();}catch(error){await env.FILES.delete(key);throw error;}
 return '/media/'+id;
}
