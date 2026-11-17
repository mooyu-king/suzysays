/* 共享交互；不获取或修改跨域游戏状态。 */
(() => {
  window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments);};
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];
  const track = name => {try {window.plausible?.(name);} catch { /* 统计失败不影响交互 */ }};
  const status = message => {const el=$('#site-status');if(el)el.textContent=message;};
  const open = dialog => {if(!dialog)return; if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');};
  const close = dialog => {if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open');};
  const gameStart=$('[data-game-start]'), viewport=$('#game-viewport'), gameMessage=$('#player-message');
  let gameFrame=null;
  function startGame(){
    if(!gameStart||gameFrame)return;
    let url;try{url=new URL(gameStart.dataset.src);if(url.protocol!=='https:'||url.hostname!=='s.anomalouscoffeemachine3.com')throw Error();}catch{gameMessage.textContent='The player address is unavailable. Please contact us.';return;}
    const frame=document.createElement('iframe');gameFrame=frame;
    frame.title='Suzy Says game';frame.allow='autoplay; fullscreen; gamepad';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
    frame.addEventListener('load',()=>{if(gameFrame===frame)gameMessage.textContent='Player frame opened. Click inside to use the keyboard. If it stays blank, try Reload; progress may be lost.';});
    frame.addEventListener('error',()=>{if(gameFrame===frame)gameMessage.textContent='The player could not load. Check your connection and try Reload.';});
    frame.src=url.href;viewport.replaceChildren(frame);viewport.classList.add('has-game');gameMessage.textContent='Loading the game. A blank frame may indicate a connection or browser issue; Reload is available below.';frame.focus();track('Game Start');
  }
  gameStart?.addEventListener('click',startGame);
  $('[data-game-reload]')?.addEventListener('click',()=>{if(!gameFrame){startGame();return;}if(!window.confirm('Reload the game? Unsaved progress may be lost.'))return;gameFrame.remove();gameFrame=null;startGame();});
  $('[data-game-fullscreen]')?.addEventListener('click',async()=>{try{const shell=$('#game-shell');if(document.fullscreenElement)await document.exitFullscreen();else if(shell.requestFullscreen)await shell.requestFullscreen();else throw Error();}catch{gameMessage.textContent='Full screen is unavailable in this browser. Use Focus to enlarge the game area.';}});
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>close(b.closest('dialog'))));
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close(d);}));
  $$('[data-help]').forEach(b=>b.addEventListener('click',()=>{open($('#help-dialog'));track('Controls Help');}));
  $$('[data-focus]').forEach(b=>b.addEventListener('click',()=>{const active=document.body.classList.toggle('is-focused');b.setAttribute('aria-pressed',String(active));b.title=active?'Exit focus mode':'Focus mode';b.setAttribute('aria-label',b.title);b.querySelector('span').textContent=active?'Exit focus':'Focus';status(active?'Focus mode enabled.':'Focus mode closed.');}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('is-focused'))$('[data-focus]').click();});
  $$('[data-answer]').forEach(b=>b.addEventListener('click',()=>{$$('[data-answer]').forEach(x=>{delete x.dataset.selected;x.setAttribute('aria-pressed','false');});b.dataset.selected='true';b.setAttribute('aria-pressed','true');$('.practice-feedback').textContent=b.dataset.answer==='wait'?'Exactly. No “Suzy says”, no action. Stay still and listen for the next line.':'Not this time. The instruction has no “Suzy says” prefix. Wait instead of jumping.';}));
  $$('[data-image]').forEach(b=>b.addEventListener('click',()=>{const im=$('#large-image');im.src=b.dataset.image;im.alt=$('img',b).alt;$('#image-caption').textContent=b.dataset.caption;open($('#image-dialog'));}));
  $$('[data-video]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.video;if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;const f=document.createElement('iframe');f.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;f.title=b.dataset.title;f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';const slot=b.closest('[data-video-slot]');slot.replaceChildren(f);f.focus();track('Video Open');}));
  const search=$('#command-search'),type=$('#command-type');
  function filter(){if(!search)return;let count=0;const q=search.value.trim().toLowerCase();$$('.command-card').forEach(c=>{const show=(type.value==='all'||c.dataset.type===type.value)&&c.textContent.toLowerCase().includes(q);c.hidden=!show;if(show)count++;});$('#command-count').textContent=`${count} ${count===1?'instruction':'instructions'}`;$('#command-empty').hidden=count!==0;}
  search?.addEventListener('input',filter);type?.addEventListener('change',filter);$('#clear-commands')?.addEventListener('click',()=>{search.value='';type.value='all';filter();search.focus();});
  const panels=$$('[data-panel]');
  function selectStage(id,scroll=false){if(!panels.some(p=>p.dataset.panel===id))return;panels.forEach(p=>p.hidden=p.dataset.panel!==id);$$('.stage-nav [data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stage===id)));if(scroll&&window.innerWidth<761)$('#stage-'+id).scrollIntoView?.({block:'start',behavior:'smooth'});}
  if(panels.length)selectStage('0');
  $$('[data-stage]').forEach(b=>b.addEventListener('click',()=>selectStage(b.dataset.stage,true)));
  const key='suzy-guide-reading-v1';let read=[];
  try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))read=[...new Set(value.filter(n=>Number.isInteger(n)&&n>=0&&n<panels.length))];}catch{read=[];}
  function updateReading(){const count=$('#reading-count');if(count)count.textContent=`${read.length} of ${panels.length} sections read`;$$('[data-read]').forEach(x=>x.checked=read.includes(Number(x.dataset.read)));}
  function saveReading(){try{localStorage.setItem(key,JSON.stringify(read));}catch{status('Reading marks work for this visit, but could not be saved on this device.');}updateReading();}
  $$('[data-read]').forEach(x=>x.addEventListener('change',()=>{const n=Number(x.dataset.read);read=x.checked?[...new Set([...read,n])]:read.filter(v=>v!==n);saveReading();}));
  $('#reset-reading')?.addEventListener('click',()=>{read=[];saveReading();status('Only your guide reading checklist was reset.');});updateReading();
  let installEvent=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('#native-install').hidden=false;track('PWA Install Available');});
  window.addEventListener('appinstalled',()=>{installEvent=null;$('#native-install').hidden=true;$('#install-message').textContent='The guide is installed. Find it with your other apps.';track('PWA Installed');});
  $$('[data-install]').forEach(b=>b.addEventListener('click',()=>{const installed=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone;$('#install-message').textContent=installed?'The guide is already running as an installed app.':/iPad|iPhone|iPod/.test(navigator.userAgent)?'On iPhone or iPad, use Safari’s Share menu, then Add to Home Screen.':'Use your browser menu to install this site or add it to your home screen. You can also bookmark this page.';open($('#install-dialog'));track('PWA Install Help');}));
  $('#native-install')?.addEventListener('click',async()=>{if(!installEvent)return;const e=installEvent;installEvent=null;$('#native-install').hidden=true;track('PWA Install Click');try{await e.prompt();const choice=await e.userChoice;$('#install-message').textContent=choice.outcome==='accepted'?'Installation accepted. Your browser will finish adding the app.':'Installation dismissed. You can still bookmark or copy the link.';track('PWA Install Result');}catch{$('#install-message').textContent='Use your browser menu to install or bookmark this page.';}});
  $('#copy-link')?.addEventListener('click',async()=>{const url=location.origin+'/';try{if(!navigator.clipboard)throw Error('unavailable');await navigator.clipboard.writeText(url);$('#copy-status').textContent='Site link copied.';$('#copy-fallback').hidden=true;track('PWA Link Copied');}catch{const label=$('#copy-fallback');label.hidden=false;const input=$('input',label);input.value=url;input.focus();input.select();$('#copy-status').textContent='Copy the selected address manually.';}});
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){navigator.serviceWorker.register('/sw.js').catch(()=>track('PWA Service Worker Error'));}
  if(window.matchMedia?.('(display-mode: standalone)').matches){track('PWA Page View');try{if(!sessionStorage.getItem('suzy-pwa-session')){track('PWA Session');sessionStorage.setItem('suzy-pwa-session','1');}}catch{}}
})();
