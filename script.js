(() => {
  'use strict';

  /* ===== CONFIG: set before launch ===== */
  const CONFIG = {
    // Formspree / Web3Forms / Getform etc. endpoint that accepts JSON POST. Example: "https://formspree.io/f/xxxxxxx"
    formEndpoint: '',
    whatsappNumber: '919672354021',
    waGreeting: 'Hello Divine Interiors, I would like to discuss an interior design project. Please share more details.'
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;

  $('#year').textContent = new Date().getFullYear();

  /* loader: short, never blocks */
  const loader = $('#loader');
  const hideLoader = () => loader && loader.classList.add('done');
  window.addEventListener('load', () => setTimeout(hideLoader, 250));
  setTimeout(hideLoader, 1500);

  /* header / nav */
  const header = $('.site-header'), nav = $('#nav'), burger = $('#burger');
  const onScroll = () => {
    header.classList.toggle('solid', scrollY > 40);
    const h = document.documentElement;
    $('#progressBar').style.transform = `scaleX(${scrollY / Math.max(1, h.scrollHeight - innerHeight)})`;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const setMenu = open => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* active link */
  const links = $$('.nav ul a');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['home', 'about', 'services', 'portfolio', 'testimonials', 'contact'].forEach(id => { const el = document.getElementById(id); el && spy.observe(el); });

  /* service card arrows preselect the form */
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    const sel = $('#f-service'); const v = a.dataset.service;
    [...sel.options].forEach(o => { if (o.textContent.trim() === v) sel.value = o.value || o.textContent; });
  }));

  /* GSAP animations */
  const startGsap = () => {
    if (!window.gsap || !window.ScrollTrigger || reduce) return;
    document.documentElement.classList.add('js-gsap');
    gsap.registerPlugin(ScrollTrigger);

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .25 });
    tl.to('.hero__line', { scaleX: 1, duration: 1.4, ease: 'power2.inOut' }, 0)
      .fromTo('.hero__media', { opacity: .6 }, { opacity: 1, duration: 1.6 }, 0)
      .fromTo('[data-hero-line]', { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, stagger: .14 }, .2)
      .fromTo('[data-hero]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .1 }, .55);

    gsap.utils.toArray('[data-reveal]').forEach(el =>
      gsap.fromTo(el, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));

    ScrollTrigger.batch('[data-card]', { start: 'top 90%', once: true,
      onEnter: b => gsap.fromTo(b, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .12, ease: 'power3.out' }) });

    gsap.utils.toArray('[data-step]').forEach((el, i) =>
      gsap.fromTo(el, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .8, delay: i * .08, scrollTrigger: { trigger: '.steps', start: 'top 80%', once: true } }));
    ScrollTrigger.create({ trigger: '.steps', start: 'top 75%', end: 'bottom 60%', scrub: true,
      onUpdate: s => $('.steps').style.setProperty('--p', s.progress) });

    if (!lowPower) {
      gsap.utils.toArray('[data-parallax]').forEach(el => {
        const m = $('img, .media', el) ? el : el;
        gsap.fromTo($('img', el) || el, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, scrub: true } });
        gsap.fromTo(el, { '--x': 0 }, { '--x': 1, scrollTrigger: { trigger: el, scrub: true } });
      });
      gsap.to('.hero__media', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  };
  /* scripts are deferred and ordered, so gsap is ready by now; fall back to visible content otherwise */
  startGsap();

  /* gallery filter */
  const tiles = $$('.tile');
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.toggle('is-on', x === c));
    const f = c.dataset.filter;
    tiles.forEach(t => t.classList.toggle('hide', f !== 'all' && t.dataset.cat !== f));
    window.ScrollTrigger && ScrollTrigger.refresh();
  }));

  /* viewer */
  const viewer = $('#viewer'), stage = $('#vStage'), cap = $('#vCap');
  let idx = 0, lastFocus = null;
  const visible = () => tiles.filter(t => !t.classList.contains('hide'));
  const show = i => {
    const list = visible(); if (!list.length) return;
    idx = (i + list.length) % list.length;
    const t = list[idx], m = $('.media', t).cloneNode(true);
    const img = $('img', m); if (img) { img.loading = 'eager'; img.alt = img.alt || t.dataset.title; }
    m.setAttribute('role', 'img'); m.setAttribute('aria-label', t.dataset.title);
    stage.replaceChildren(m);
    cap.textContent = `${t.dataset.cat} · Design inspiration (reference image) · ${idx + 1}/${list.length}`;
  };
  tiles.forEach(t => t.addEventListener('click', () => {
    lastFocus = t; show(visible().indexOf(t));
    viewer.showModal ? viewer.showModal() : viewer.setAttribute('open', '');
  }));
  const close = () => { viewer.close ? viewer.close() : viewer.removeAttribute('open'); lastFocus && lastFocus.focus(); };
  $('#viewerX').addEventListener('click', close);
  $('#vPrev').addEventListener('click', () => show(idx - 1));
  $('#vNext').addEventListener('click', () => show(idx + 1));
  viewer.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  viewer.addEventListener('click', e => { if (e.target === viewer) close(); });

  /* form */
  const form = $('#form'), status = $('#status'), btn = $('#submitBtn');
  const rules = {
    name: v => v.trim().length >= 2 || 'Please enter your name.',
    phone: v => /^[6-9]\d{9}$/.test(v.replace(/[\s-]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '')) || 'Enter a valid 10-digit Indian mobile number.',
    property_type: v => !!v || 'Please choose a property type.',
    service: v => !!v || 'Please choose a service.',
    location: v => v.trim().length >= 2 || 'Please enter the project location.'
  };
  const validate = () => {
    let ok = true, first = null;
    Object.entries(rules).forEach(([n, fn]) => {
      const el = form.elements[n], f = el.closest('.field'), r = fn(el.value);
      const bad = r !== true; f.classList.toggle('bad', bad);
      $('.err', f).textContent = bad ? r : '';
      el.setAttribute('aria-invalid', bad);
      if (bad) { ok = false; first = first || el; }
    });
    first && first.focus();
    return ok;
  };
  const waText = d => encodeURIComponent(
    `${CONFIG.waGreeting}\n\nName: ${d.name}\nPhone: ${d.phone}\nProperty: ${d.property_type}\nService: ${d.service}\nBudget: ${d.budget || 'To discuss'}\nLocation: ${d.location}\nDetails: ${d.details || '-'}`);
  const setStatus = (html, cls) => { status.className = 'status field--full ' + cls; status.innerHTML = html; };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.elements._gotcha.value) return;
    if (!validate()) { setStatus('Please correct the highlighted fields.', 'fail'); return; }
    const d = Object.fromEntries(new FormData(form)); delete d._gotcha;
    const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${waText(d)}`;

    if (!CONFIG.formEndpoint) {
      setStatus(`Online form delivery isn’t switched on yet, so your enquiry has <b>not</b> been sent. <a href="${wa}" target="_blank" rel="noopener">Send it on WhatsApp instead</a> or call <a href="tel:+919672354021">+91 96723 54021</a>.`, 'fail');
      return;
    }
    btn.disabled = true; btn.textContent = 'Sending…'; setStatus('', '');
    try {
      const res = await fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      setStatus('Thank you. Your enquiry has been received and the studio will get back to you.', 'ok');
    } catch (err) {
      setStatus(`We couldn’t send your enquiry just now. Please <a href="${wa}" target="_blank" rel="noopener">message us on WhatsApp</a> or call <a href="tel:+919672354021">+91 96723 54021</a>.`, 'fail');
    } finally { btn.disabled = false; btn.textContent = 'Request a Consultation'; }
  });
})();
