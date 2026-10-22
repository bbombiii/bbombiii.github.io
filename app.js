import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.SALA_CONFIG || {};
const app = document.getElementById('app');
let sb = null, session = null, tab = 'hoy';
let cache = { tasks: [], notes: [], topics: [], lessons: [], resources: [], results: [] };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const h = html => { app.innerHTML = html; };
const today = () => new Date().toISOString().slice(0,10);

function shell(content) {
  const tabs = [['hoy','🏠','Hoy'],['tareas','✅','Tareas'],['apuntes','📝','Apuntes'],['estudios','📚','Estudios'],['idiomas','🗾','Idiomas']];
  return `<main>${content}</main><nav class="tabbar">` +
    tabs.map(([id,ic,label]) => `<button class="${tab===id?'on':''}" data-tab="${id}"><span class="ic">${ic}</span>${label}</button>`).join('') + `</nav>`;
}

function bindNav() {
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
}

async function loadAll() {
  const [t,n,tp,l,r,res] = await Promise.all([
    sb.from('tasks').select('*').order('created_at',{ascending:false}),
    sb.from('notes').select('*').order('updated_at',{ascending:false}),
    sb.from('topics').select('*').order('ord'),
    sb.from('lessons').select('*').order('day'),
    sb.from('resources').select('*').order('ord'),
    sb.from('quiz_results').select('*'),
  ]);
  cache = { tasks:t.data||[], notes:n.data||[], topics:tp.data||[], lessons:l.data||[], resources:r.data||[], results:res.data||[] };
}

/* ---------- Vistas ---------- */

function vHoy() {
  const pend = cache.tasks.filter(t=>!t.done).slice(0,4);
  const nextLesson = cache.lessons.find(l => !cache.results.some(r => r.lesson_id===l.id));
  const exam = {nombre:'Exámenes Ilerna (MP04, MP07, MP14)', fecha:'2027-01-21'};
  const dias = Math.ceil((new Date(exam.fecha)-new Date())/86400000);
  return `<header class="top"><div class="grow"><h1>Hola, Samuel 👋</h1><div class="sub">${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</div></div></header>
  ${nextLesson ? `<div class="card clickable" data-go="idiomas"><div class="row"><span class="ic" style="font-size:24px">🗾</span><div class="grow"><b>Toca estudiar: ${esc(nextLesson.title)}</b><div class="mut small">Sesión de hoy de idiomas, unos 10 min</div></div>›</div></div>` : `<div class="card"><b>Idiomas al día 🎉</b><div class="mut small">Has completado todas las sesiones. Helena añadirá más.</div></div>`}
  <h2>Tareas pendientes</h2>
  ${pend.length ? pend.map(t=>`<div class="card task"><div class="grow txt">${esc(t.title)}</div><span class="pill">${esc(t.area)}</span></div>`).join('') : '<div class="card mut">Nada pendiente. Disfruta 😎</div>'}
  <div class="row mt"><button class="ghost" data-go="tareas">Ver todas →</button></div>
  <h2>Estudios</h2>
  <div class="card"><div class="row"><span style="font-size:22px">🎓</span><div class="grow"><b>${exam.nombre}</b><div class="mut small">21 enero 2027, sede Madrid · quedan ${dias} días</div></div></div></div>`;
}

function vTareas() {
  const areas = ['personal','trabajo','estudios'];
  return `<header class="top"><div class="grow"><h1>Tareas</h1><div class="sub">Tuyas, sin líos. Lo del trabajo en equipo va en la otra Sala.</div></div></header>
  <div class="card">
    <input id="nt-title" placeholder="Nueva tarea...">
    <div class="row"><select id="nt-area" class="grow" style="margin:0">${areas.map(a=>`<option value="${a}">${a}</option>`).join('')}</select>
    <button class="primary" id="nt-add">Añadir</button></div>
  </div>
  ${areas.map(a=>{
    const list = cache.tasks.filter(t=>t.area===a);
    if(!list.length) return '';
    return `<h2>${a[0].toUpperCase()+a.slice(1)}</h2>` + list.map(t=>`
      <div class="card task"><button class="chk ${t.done?'done':''}" data-task="${t.id}">✓</button>
      <div class="grow txt ${t.done?'done':''}">${esc(t.title)}</div>
      <button class="ghost" data-del-task="${t.id}">🗑</button></div>`).join('');
  }).join('') || '<div class="card mut">Sin tareas todavía. Añade la primera arriba.</div>'}`;
}

function vApuntes() {
  return `<header class="top"><div class="grow"><h1>Apuntes</h1><div class="sub">Helena los lee para hacerte resúmenes, buscarte contenidos y recomendarte vídeos.</div></div></header>
  <button class="primary big-btn" id="note-new"><span class="ic">＋</span><b>Apunte nuevo</b></button>
  <div class="mt"></div>
  ${cache.notes.map(n=>`<div class="card clickable" data-note="${n.id}"><b>${esc(n.title)||'Sin título'}</b>
    <div class="mut small">${(esc(n.body)||'').slice(0,90)}${(n.body||'').length>90?'…':''}</div>
    <div class="mut small mt">${new Date(n.updated_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}${n.tags?' · '+esc(n.tags):''}</div></div>`).join('') || '<div class="card mut mt">Todavía no hay apuntes. El primero cuesta, luego fluye ✍️</div>'}`;
}

function vApunte(n) {
  return `<header class="top"><div class="grow"><h1>Apunte</h1></div><button class="ghost" data-back>← Volver</button></header>
  <div class="card">
    <label>Título</label><input id="ed-title" value="${esc(n.title||'')}">
    <label>Etiquetas (smr, japonés, inglés, trabajo...)</label><input id="ed-tags" value="${esc(n.tags||'')}">
    <label>Contenido</label><textarea id="ed-body">${esc(n.body||'')}</textarea>
    <div class="row"><button class="primary grow" id="ed-save">Guardar</button>
    ${n.id ? `<button class="ghost" id="ed-del">🗑</button>` : ''}</div>
  </div>`;
}

function vEstudios() {
  const mods = [...new Set(cache.topics.map(t=>t.module))];
  return `<header class="top"><div class="grow"><h1>Estudios</h1><div class="sub">SMR en Ilerna. Marca lo que vayas dominando.</div></div></header>
  <div class="card"><div class="row"><span style="font-size:22px">🎓</span><div class="grow"><b>Exámenes: jueves 21 enero 2027</b><div class="mut small">MP04 17:00 · MP07 18:15 · MP14 19:30 · sede Madrid</div></div></div></div>
  ${mods.map(m=>{
    const ts = cache.topics.filter(t=>t.module===m);
    const done = ts.filter(t=>t.done).length;
    return `<h2>${esc(m)} <span class="pill ${done===ts.length?'ok':''}">${done}/${ts.length}</span></h2>` +
      ts.map(t=>`<div class="card task"><button class="chk ${t.done?'done':''}" data-topic="${t.id}">✓</button>
      <div class="grow txt ${t.done?'done':''}">${esc(t.title)}</div>
      ${t.url?`<a href="${esc(t.url)}" target="_blank" rel="noopener">▶︎</a>`:''}</div>`).join('');
  }).join('')}
  <h2>Recursos</h2>
  ${cache.resources.filter(r=>r.section==='estudios').map(r=>`<a class="video-link" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}<br><span>${esc(r.note||'')}</span></a>`).join('') || '<div class="card mut">Helena añadirá recursos aquí.</div>'}`;
}

function vIdiomas() {
  const lessons = cache.lessons;
  return `<header class="top"><div class="grow"><h1>Idiomas</h1><div class="sub">Japonés e inglés, en sesiones cortas cada día. Plan completo en Recursos.</div></div></header>
  ${lessons.map(l=>{
    const res = cache.results.find(r=>r.lesson_id===l.id);
    return `<div class="card clickable" data-lesson="${l.id}"><div class="row"><span style="font-size:22px">${l.lang==='ja'?'🗾':'🇬🇧'}</span>
    <div class="grow"><b>${esc(l.title)}</b><div class="mut small">${l.lang==='ja'?'Japonés':'Inglés'} · sesión ${l.day}</div></div>
    ${res?`<span class="pill ok">${res.score}/${res.total}</span>`:'<span class="pill">pendiente</span>'}</div></div>`;
  }).join('') || '<div class="card mut">Helena está preparando las sesiones.</div>'}
  <h2>Recursos</h2>
  ${cache.resources.filter(r=>r.section==='idiomas').map(r=>`<a class="video-link" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}<br><span>${esc(r.note||'')}</span></a>`).join('')}`;
}

function vLesson(l) {
  const res = cache.results.find(r=>r.lesson_id===l.id);
  const quiz = l.quiz || [];
  return `<header class="top"><div class="grow"><h1>${esc(l.title)}</h1><div class="sub">${l.lang==='ja'?'Japonés':'Inglés'} · sesión ${l.day}</div></div><button class="ghost" data-back>← Volver</button></header>
  <div class="card">${l.body||''}</div>
  ${l.video_url?`<a class="video-link" href="${esc(l.video_url)}" target="_blank" rel="noopener">📺 Vídeo de la sesión<br><span>YouTube</span></a>`:''}
  ${quiz.length?`<h2>Mini-test</h2><div id="quiz">${quiz.map((q,i)=>`
    <div class="card" data-q="${i}"><b>${esc(q.q)}</b><div class="mt">
    ${q.opts.map((o,j)=>`<button class="quiz-opt" data-opt="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    <button class="primary" id="quiz-send" style="width:100%">Corregir</button></div>
    <div id="quiz-out"></div>`:''}
  ${res?`<div class="card mt"><b>Ya la completaste: ${res.score}/${res.total} 🎉</b></div>`:''}`;
}

/* ---------- Lógica ---------- */

async function render() {
  if (tab==='lesson') return; // se gestiona con estado propio
  let content = '';
  if (tab==='hoy') content = vHoy();
  else if (tab==='tareas') content = vTareas();
  else if (tab==='apuntes') content = vApuntes();
  else if (tab==='estudios') content = vEstudios();
  else if (tab==='idiomas') content = vIdiomas();
  h(shell(content)); bindNav(); bindActions();
}

function bindActions() {
  app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { tab=b.dataset.go; render(); });
  app.querySelectorAll('[data-task]').forEach(b => b.onclick = async () => {
    const t = cache.tasks.find(x=>x.id===b.dataset.task);
    await sb.from('tasks').update({done:!t.done}).eq('id',t.id); t.done=!t.done; render();
  });
  app.querySelectorAll('[data-del-task]').forEach(b => b.onclick = async () => {
    await sb.from('tasks').delete().eq('id',b.dataset.delTask);
    cache.tasks = cache.tasks.filter(x=>x.id!==b.dataset.delTask); render();
  });
  app.querySelectorAll('[data-topic]').forEach(b => b.onclick = async () => {
    const t = cache.topics.find(x=>x.id===b.dataset.topic);
    await sb.from('topics').update({done:!t.done}).eq('id',t.id); t.done=!t.done; render();
  });
  const addBtn = document.getElementById('nt-add');
  if (addBtn) addBtn.onclick = async () => {
    const title = document.getElementById('nt-title').value.trim();
    if (!title) return;
    const area = document.getElementById('nt-area').value;
    const { data } = await sb.from('tasks').insert({title,area}).select().single();
    if (data) cache.tasks.unshift(data); render();
  };
  const newNote = document.getElementById('note-new');
  if (newNote) newNote.onclick = () => openNote(null);
  app.querySelectorAll('[data-note]').forEach(b => b.onclick = () => openNote(cache.notes.find(x=>x.id===b.dataset.note)));
  app.querySelectorAll('[data-lesson]').forEach(b => b.onclick = () => openLesson(cache.lessons.find(x=>x.id===b.dataset.lesson)));
}

function openNote(n) {
  const isNew = !n;
  n = n || {id:null,title:'',body:'',tags:''};
  h(shell(vApunte(n))); bindNav();
  app.querySelector('[data-back]').onclick = render;
  document.getElementById('ed-save').onclick = async () => {
    const row = { title: document.getElementById('ed-title').value.trim(),
                  tags: document.getElementById('ed-tags').value.trim(),
                  body: document.getElementById('ed-body').value,
                  updated_at: new Date().toISOString() };
    if (isNew) { const {data} = await sb.from('notes').insert(row).select().single(); if(data) cache.notes.unshift(data); }
    else { await sb.from('notes').update(row).eq('id',n.id); Object.assign(n,row);
           cache.notes.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)); }
    tab='apuntes'; render();
  };
  const del = document.getElementById('ed-del');
  if (del) del.onclick = async () => {
    if (!confirm('¿Borrar este apunte?')) return;
    await sb.from('notes').delete().eq('id',n.id);
    cache.notes = cache.notes.filter(x=>x.id!==n.id); tab='apuntes'; render();
  };
}

function openLesson(l) {
  h(shell(vLesson(l))); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='idiomas'; render(); };
  const send = document.getElementById('quiz-send');
  if (!send) return;
  send.onclick = async () => {
    const quiz = l.quiz||[]; let score = 0;
    quiz.forEach((q,i)=>{
      const card = app.querySelector(`[data-q="${i}"]`);
      const sel = card.querySelector('.quiz-opt.picked');
      card.querySelectorAll('.quiz-opt').forEach((b,j)=>{
        if (j===q.a) b.classList.add('right');
        else if (b.classList.contains('picked')) b.classList.add('wrong');
        b.disabled = true;
      });
      if (sel && +sel.dataset.opt===q.a) score++;
    });
    send.disabled = true;
    await sb.from('quiz_results').insert({lesson_id:l.id, score, total:quiz.length});
    cache.results.push({lesson_id:l.id, score, total:quiz.length});
    document.getElementById('quiz-out').innerHTML =
      `<div class="card center mt"><b>${score}/${quiz.length}</b><div class="mut small">${score===quiz.length?'¡Perfecto! 🎉':'Repasa los fallos arriba y mañana seguimos 💪'}</div></div>`;
  };
  app.querySelectorAll('.quiz-opt').forEach(b => b.onclick = () => {
    b.parentElement.querySelectorAll('.quiz-opt').forEach(x=>x.classList.remove('picked'));
    b.classList.add('picked'); b.style.outline='2px solid var(--acc)';
    b.parentElement.querySelectorAll('.quiz-opt:not(.picked)').forEach(x=>x.style.outline='');
  });
}

function renderLogin(msg) {
  h(`<main><div style="height:12vh"></div>
  <h1 class="center">Mi Sala 🏠</h1>
  <div class="sub center">Tus tareas, apuntes, estudios e idiomas. Solo para ti.</div>
  <div class="card mt">
    <label>Email</label><input id="li-email" type="email" autocomplete="email" placeholder="tu@gmail.com">
    <label>Contraseña</label><input id="li-pass" type="password" autocomplete="current-password">
    <button class="primary" id="li-in" style="width:100%">Entrar</button>
    <div class="center mt"><button class="ghost" id="li-up">Crear cuenta nueva</button></div>
    ${msg?`<div class="notice mt">${esc(msg)}</div>`:''}
  </div>
  <div class="mut small center mt">Hecho por Helena para Samuel 💜</div></main>`);
  const doIn = async () => {
    const email = document.getElementById('li-email').value.trim();
    const password = document.getElementById('li-pass').value;
    const { error } = await sb.auth.signInWithPassword({email,password});
    if (error) renderLogin('No cuadra: ' + error.message);
  };
  document.getElementById('li-in').onclick = doIn;
  document.getElementById('li-pass').onkeydown = e => { if(e.key==='Enter') doIn(); };
  document.getElementById('li-up').onclick = async () => {
    const email = document.getElementById('li-email').value.trim();
    const password = document.getElementById('li-pass').value;
    if (!email || !password) return renderLogin('Pon email y contraseña para crear tu cuenta.');
    if (!CFG.ALLOWED_EMAILS.includes(email)) return renderLogin('Esta Sala es solo para Samuel.');
    const { error } = await sb.auth.signUp({email,password});
    if (error) renderLogin('No se pudo crear: ' + error.message);
  };
}

async function boot() {
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
    h(`<main><div style="height:14vh"></div><h1 class="center">Mi Sala 🏠</h1>
    <div class="notice mt">Helena está terminando el motor de la app. Vuelve en un ratito.</div></main>`);
    return;
  }
  sb = createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  sb.auth.onAuthStateChange(async (_e, s) => {
    session = s;
    if (session) { await loadAll(); tab='hoy'; render(); }
    else renderLogin();
  });
  const { data } = await sb.auth.getSession();
  if (!data.session) renderLogin();
}

boot();
