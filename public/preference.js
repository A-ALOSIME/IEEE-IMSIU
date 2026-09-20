try {
  const root=document.documentElement;
  const query=new URLSearchParams(location.search).get('lang');
  const language=query==='en'?'en':localStorage.getItem('language');
  root.dataset.theme=localStorage.getItem('theme')||'light';
  if(language){root.lang=language;root.dir=language==='en'?'ltr':'rtl';}
} catch {}
