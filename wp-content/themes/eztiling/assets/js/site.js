const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
function updateHeader(){ if(header) header.classList.toggle('is-scrolled', window.scrollY > 24); }
updateHeader(); window.addEventListener('scroll', updateHeader, {passive:true});
if(menuToggle && nav){ menuToggle.addEventListener('click',()=>{ const open=menuToggle.getAttribute('aria-expanded')==='true'; menuToggle.setAttribute('aria-expanded',String(!open)); nav.classList.toggle('is-open',!open); document.body.classList.toggle('menu-open',!open); }); nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menuToggle.setAttribute('aria-expanded','false');nav.classList.remove('is-open');document.body.classList.remove('menu-open');})); }
if('IntersectionObserver' in window){ const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.10,rootMargin:'0px 0px -30px'}); document.querySelectorAll('.reveal').forEach(el=>observer.observe(el)); } else { document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible')); }

/* Project filter: toggles cards, rebalances the editorial grid and moves the pill indicator. */
const filterBar=document.querySelector('[data-filter-bar]');
const filterButtons=document.querySelectorAll('[data-project-filter]');
const projectCards=Array.from(document.querySelectorAll('[data-project-category]'));
const filterIndicator=document.querySelector('[data-filter-indicator]');
const filterStatus=document.querySelector('[data-filter-status]');
function moveIndicator(){const active=filterBar&&filterBar.querySelector('.is-active');if(!active||!filterIndicator)return;filterIndicator.style.setProperty('--ind-x',active.offsetLeft+'px');filterIndicator.style.setProperty('--ind-w',active.offsetWidth+'px');}
function layoutCards(){projectCards.filter(card=>!card.hidden).forEach((card,i)=>{card.dataset.size=[0,3].includes(i%4)?'wide':'narrow';card.toggleAttribute('data-offset',i%2===1);const index=card.querySelector('.project-tile-index');if(index)index.textContent=String(i+1).padStart(2,'0');});}
function setStatus(count){if(filterStatus)filterStatus.textContent=count===1?'Showing 1 project':`Showing ${count} projects`;}
filterButtons.forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.projectFilter;
  filterButtons.forEach(item=>{const on=item===button;item.classList.toggle('is-active',on);item.setAttribute('aria-pressed',String(on));});
  let shown=0;
  projectCards.forEach(card=>{const cats=(card.dataset.projectCategory||'').split(' ');card.hidden=filter!=='all'&&!cats.includes(filter);card.removeAttribute('data-filtering');});
  layoutCards();
  projectCards.filter(card=>!card.hidden).forEach(card=>{void card.offsetWidth;card.style.setProperty('--fi',shown++);card.classList.add('is-visible');card.setAttribute('data-filtering','');});
  setStatus(shown);moveIndicator();
  button.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
}));
if(filterBar){setStatus(projectCards.length);moveIndicator();window.addEventListener('resize',moveIndicator);if(document.fonts)document.fonts.ready.then(moveIndicator);const requestedFilter=new URLSearchParams(window.location.search).get('filter');const requestedButton=Array.from(filterButtons).find(button=>button.dataset.projectFilter===requestedFilter);if(requestedButton)requestedButton.click();}

/* Lightbox: full-screen gallery with previous/next, keyboard and swipe. */
const dialog=document.querySelector('[data-gallery-dialog]');
const dialogImage=document.querySelector('[data-gallery-dialog-image]');
if(dialog&&dialogImage){
  const shots=Array.from(document.querySelectorAll('[data-gallery-open]'));
  const caption=dialog.querySelector('[data-gallery-caption]');
  const count=dialog.querySelector('[data-gallery-count]');
  const prev=dialog.querySelector('[data-gallery-prev]');
  const next=dialog.querySelector('[data-gallery-next]');
  let current=0;
  const pad=n=>String(n).padStart(2,'0');
  function show(index,animate){
    current=(index+shots.length)%shots.length;
    const shot=shots[current];
    const apply=()=>{dialogImage.src=shot.dataset.galleryImage;dialogImage.alt=shot.dataset.galleryAlt||'Expanded project photograph';if(caption)caption.textContent=shot.dataset.galleryAlt||'';if(count)count.textContent=`${pad(current+1)} / ${pad(shots.length)}`;dialogImage.classList.remove('is-swapping');};
    if(animate){dialogImage.classList.add('is-swapping');window.setTimeout(apply,220);}else apply();
  }
  if(prev)prev.hidden=next.hidden=shots.length<2;
  shots.forEach((shot,i)=>shot.addEventListener('click',()=>{show(i,false);if(typeof dialog.showModal==='function')dialog.showModal();}));
  const closeDialog=()=>{if(dialog.open)dialog.close();};
  const close=dialog.querySelector('[data-gallery-close]');
  if(close)close.addEventListener('click',closeDialog);
  if(prev)prev.addEventListener('click',()=>show(current-1,true));
  if(next)next.addEventListener('click',()=>show(current+1,true));
  dialog.addEventListener('click',event=>{if(event.target===dialog||event.target.classList.contains('lightbox-figure'))closeDialog();});
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft')show(current-1,true);if(event.key==='ArrowRight')show(current+1,true);});
  let touchX=null;
  dialog.addEventListener('touchstart',event=>{touchX=event.touches[0].clientX;},{passive:true});
  dialog.addEventListener('touchend',event=>{if(touchX===null)return;const dx=event.changedTouches[0].clientX-touchX;if(Math.abs(dx)>50)show(current+(dx<0?1:-1),true);touchX=null;});
}
