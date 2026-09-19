import {defineMiddleware} from 'astro:middleware';
import {env} from 'cloudflare:workers';
import {bootstrap} from './lib/db';
import {failure,identity} from './lib/auth';
export const onRequest=defineMiddleware(async(context,next)=>{
 const pathname=context.url.pathname;
 if(pathname==='/admin'||pathname.startsWith('/admin/')){
  try{await bootstrap(env.DB,env.INITIAL_ADMIN_EMAIL);await identity(context.request,env);}catch(error){return failure(error);}
 }
 const response=await next();
 response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('X-Frame-Options','DENY');response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 response.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com; frame-src https://challenges.cloudflare.com; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
 if(context.url.protocol==='https:')response.headers.set('Strict-Transport-Security','max-age=31536000');
 if(pathname.startsWith('/admin')||pathname.startsWith('/api/admin')){response.headers.set('Cache-Control','no-store');response.headers.set('X-Robots-Tag','noindex, nofollow');}
 return response;
});
