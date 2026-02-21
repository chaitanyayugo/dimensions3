// script.js
// Defer-friendly, resilient UI enhancements. Requires GSAP + ScrollTrigger (deferred in HTML).
(function(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Helper - safe query
  const $ = (sel, ctx=document) => ctx.querySelector(sel);

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const loaderInner = loader ? loader.querySelector('.loader-inner') : null;
  const LOADER_TIMEOUT = 3500;
  let loaderTimeout = null;

  function dismissLoader(immediate=false){
    if(!loader) return;
    if(immediate){
      loader.style.display='none';
      loader.setAttribute('aria-hidden','true');
      return;
    }
    loader.style.transition='opacity .6s ease';
    loader.style.opacity='0';
    setTimeout(()=>{ loader.style.display='none'; loader.setAttribute('aria-hidden','true'); }, 650);
  }

  // Start loader animation and fallback timeout
  if(loaderInner){
    loaderInner.style.width='0%';
    requestAnimationFrame(()=> loaderInner.style.width='72%');
    loaderTimeout = setTimeout(()=> {
      if(loaderInner) loaderInner.style.width='100%';
      setTimeout(()=> dismissLoader(true), 250);
    }, LOADER_TIMEOUT);
  }

  /* ---------- Progress bar (rAF) ---------- */
  const progressBar = $('#progress-bar');
  function updateProgress(){
    if(!progressBar) return;
    const doc = document.documentElement;
    const scrollTop = (window.scrollY || doc.scrollTop || document.body.scrollTop);
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max>0 ? (scrollTop / max) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, {passive:true});
  window.addEventListener('resize', updateProgress);

  /* ---------- Dust generator (light) ---------- */
  function createDust(){
    if(prefersReduced) return;
    const container = document.getElementById('dust-container');
    if(!container) return;
    const count = Math.min(28, Math.round(window.innerWidth / 55));
    for(let i=0;i<count;i++){
      const d = document.createElement('div');
      d.className='dust';
      const size = Math.random()*3 + 1;
      d.style.width = size + 'px';
      d.style.height = size + 'px';
      d.style.left = Math.random()*100 + '%';
      d.style.top = Math.random()*100 + '%';
      container.appendChild(d);
      // If GSAP available, use it; otherwise use CSS transition as gentle fallback
      if(window.gsap){
        gsap.fromTo(d, {y:0, opacity:0.12}, {
          y: - (window.innerHeight + 120 + Math.random()*120),
          opacity: 0,
          duration: 6 + Math.random()*6,
          delay: Math.random()*4,
          repeat: -1,
          ease: 'linear',
          repeatRefresh: true
        });
      } else {
        // simple CSS fade (no heavy animation)
        d.style.opacity = '0.12';
      }
    }
  }

  /* ---------- Configurator ---------- */
  function setupConfigurator(){
    const swatches = Array.from(document.querySelectorAll('.swatch'));
    const sofa = $('#animated-sofa');
    if(!swatches.length || !sofa) return;

    function apply(color){
      if(color === 'royal-gold'){
        gsap && gsap.to(sofa, {filter: "sepia(.55) saturate(1.45) brightness(.95)", duration: .7});
      } else if(color === 'deep-velvet'){
        gsap && gsap.to(sofa, {filter: "hue-rotate(280deg) saturate(1.2) brightness(.78)", duration: .7});
      } else {
        gsap && gsap.to(sofa, {filter: "none", duration: .5});
      }
    }

    // initial active
    let initial = swatches.find(s => s.classList.contains('active')) || swatches[0];
    swatches.forEach(s => s.setAttribute('aria-pressed','false'));
    if(initial){ initial.classList.add('active'); initial.setAttribute('aria-pressed','true'); apply(initial.getAttribute('data-color')); }

    swatches.forEach(s => {
      s.addEventListener('click', ()=> {
        swatches.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed','false'); });
        s.classList.add('active'); s.setAttribute('aria-pressed','true');
        apply(s.getAttribute('data-color'));
      }, {passive:true});
      s.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault(); s.click();
        }
      });
    });
  }

  /* ---------- GSAP animations: sofa timeline + reveals ---------- */
  function setupAnimations(){
    if(!window.gsap || !window.ScrollTrigger) { // gracefully degrade
      // reveal elements by removing hidden transform
      document.querySelectorAll('.reveal').forEach(el => { el.style.opacity = '1'; el.style.transform='none'; });
      if(loaderTimeout) clearTimeout(loaderTimeout);
      dismissLoader(true);
      updateProgress();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // reveals
    document.querySelectorAll('.reveal').forEach(el => {
      gsap.fromTo(el, {y:24, opacity:0}, {
        y:0, opacity:1, duration:.8, ease:'power2.out',
        scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' }
      });
    });

    // main sofa timeline
    const sofa = document.getElementById('animated-sofa');
    if(sofa){
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.scroll-container', start:'top top', end:'bottom bottom', scrub:1.2 } });
      tl.to(sofa, {rotationY: 180, scale: 1.18, x: '22%', ease:'power1.out'})
        .to(sofa, {rotationY: 360, scale: .96, x: '-22%', ease:'power1.out'})
        .to(sofa, {rotationY: 540, scale: 1.04, x: '0%', ease:'power2.out'});
    }

    // CTA hover (light)
    document.querySelectorAll('.cta-button').forEach(btn => {
      if(prefersReduced) return;
      let t = null;
      btn.addEventListener('mousemove', (e)=>{
        const r = btn.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) - 0.5;
        const y = ((e.clientY - r.top) / r.height) - 0.5;
        if(t) t.kill();
        t = gsap.to(btn, {duration:.28, rotateY: x*16, rotateX: -y*12, scale:1.04, boxShadow: `${-x*14}px ${-y*14}px 26px rgba(212,175,55,0.18)`});
      }, {passive:true});
      btn.addEventListener('mouseleave', ()=>{ if(t) t.kill(); gsap.to(btn, {duration:.6, rotateY:0, rotateX:0, scale:1, boxShadow:'none', ease:'power2.out'}); });
    });
  }

  /* ---------- INIT on load ---------- */
  function init(){
    createDust();
    setupConfigurator();
    setupAnimations();
    setupHovers();
    // finish loader
    if(loaderInner) {
      clearTimeout(loaderTimeout);
      gsap && gsap.to(loaderInner, { width:'100%', duration:.45, onComplete: ()=> dismissLoader() });
    } else {
      dismissLoader(true);
    }
    updateProgress();
  }

  // small helper to ensure hover handlers are set; extracted to reduce bundle size
  function setupHovers(){
    document.querySelectorAll('.cta-button').forEach(b => {
      b.style.transformOrigin = 'center';
      b.style.willChange = 'transform';
    });
  }

  // Wait until DOM is interactive; then wait for deferred scripts to execute (load event)
  if(document.readyState === 'complete'){
    // on static hosts sometimes 'load' already fired, so schedule microtask
    setTimeout(init, 60);
  } else {
    window.addEventListener('load', init, {once:true});
  }
})();
