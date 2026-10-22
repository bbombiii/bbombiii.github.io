import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.SALA_CONFIG || {};
const app = document.getElementById('app');
let sb = null, session = null, tab = 'hoy';
let cache = { tasks: [], notes: [], topics: [], lessons: [], resources: [], results: [] };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const h = html => { app.innerHTML = html; };

/* ---------- Iconos SVG (trazo, estilo consistente) ---------- */
const IC = {
  home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  check:'<path d="M4 12.5 9.5 18 20 6.5"/>',
  squareCheck:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><path d="m8.5 12.2 2.6 2.6 5-5.4"/>',
  note:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M4 7h16"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"/><path d="M6.5 7 7.5 20a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5L17.5 7"/>',
  chev:'<path d="m9 5 7 7-7 7"/>',
  back:'<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="16" rx="4"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  play:'<path d="M7 4.5v15l12-7.5Z"/>',
  logout:'<path d="M9 21H6.5A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3H9"/><path d="m15 16 4-4-4-4"/><path d="M19 12H9"/>',
  cap:'<path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z"/><path d="M6.5 11.5V16c0 1.7 2.5 3 5.5 3s5.5-1.3 5.5-3v-4.5"/><path d="M21.5 9v5"/>',
  sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M18.4 5.6l-2.9 2.9M8.5 15.5l-2.9 2.9"/>',
  video:'<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10.5 5-3v9l-5-3"/>',
  link:'<path d="M10 14a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 10a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'
};
const ic = (n, s=20, sw=1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;

const TABS = [['hoy','home','Hoy'],['tareas','squareCheck','Tareas'],['apuntes','note','Apuntes'],['estudios','cap','Estudios'],['idiomas','globe','Idiomas']];
const AREA_DOT = {personal:'area-personal',trabajo:'area-trabajo',estudios:'area-estudios'};

function shell(content) {
  return `<main>${content}</main><nav class="tabbar">` +
    TABS.map(([id,icn,label],i) => `<button class="${tab===id?'on':''}" data-tab="${id}"><span class="ic-wrap">${ic(icn)}</span>${label}</button>`).join('') + `</nav>`;
}
function bindNav() {
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
}
const header = (title, sub, extra='') =>
  `<header class="top rise"><div class="grow"><h1 class="small-h">${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div>${extra}</header>`;

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

const examInfo = () => {
  const fecha = new Date('2027-01-21T17:00:00+01:00');
  const dias = Math.ceil((fecha - new Date())/86400000);
  return { fecha, dias };
};
const langProgress = () => {
  const total = cache.lessons.length;
  const hechas = cache.lessons.filter(l => cache.results.some(r => r.lesson_id===l.id)).length;
  return { total, hechas };
};

/* ---------- Vistas ---------- */

function vHoy() {
  const pend = cache.tasks.filter(t=>!t.done).slice(0,3);
  const nextLesson = cache.lessons.find(l => !cache.results.some(r => r.lesson_id===l.id));
  const ex = examInfo();
  const lp = langProgress();
  const notas = cache.notes.slice(0,2);
  const fechaStr = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});

  return `
  <header class="top rise" style="animation-delay:.02s">
    <div class="grow"><div class="date-cap">${fechaStr}</div><h1>Hola, Samuel 👋</h1></div>
    <button class="icon-btn" id="btn-out" title="Cerrar sesión">${ic('logout',18)}</button>
  </header>

  ${nextLesson ? `
  <div class="hero rise" style="animation-delay:.06s" data-go="idiomas">
    <span class="glyph">${nextLesson.lang==='ja'?'あ':'Aa'}</span>
    <div class="go">${ic('chev',16,2.2)}</div>
    <div class="kicker">Toca estudiar</div>
    <h3>${esc(nextLesson.title)}</h3>
    <div class="meta">${ic('clock',14)} Unos 10 min · ${nextLesson.lang==='ja'?'Japonés':'Inglés'}</div>
  </div>` : `
  <div class="hero done rise" style="animation-delay:.06s" data-go="idiomas">
    <span class="glyph">✓</span>
    <div class="kicker">Idiomas</div>
    <h3>Todo al día</h3>
    <div class="meta">Has completado todas las sesiones</div>
  </div>`}

  <div class="tiles rise" style="animation-delay:.12s; margin-top:12px">
    <div class="tile">
      <div class="lab">${ic('calendar',14)} Exámenes Ilerna</div>
      <div class="big">${ex.dias} <small>días</small></div>
      <div class="bar"><i class="warn" style="width:${Math.max(4,Math.min(100,100-ex.dias/2))}%"></i></div>
    </div>
    <div class="tile">
      <div class="lab">${ic('globe',14)} Sesiones idiomas</div>
      <div class="big">${lp.hechas}<small>/${lp.total}</small></div>
      <div class="bar"><i style="width:${lp.total?Math.round(lp.hechas/lp.total*100):0}%"></i></div>
    </div>
  </div>

  <div class="sec rise" style="animation-delay:.18s"><h2>Tareas pendientes</h2><button class="link" data-go="tareas">Ver todas</button></div>
  <div class="rise" style="animation-delay:.22s">
  ${pend.length ? pend.map(t=>`
    <div class="card task clickable"><button class="chk" data-task="${t.id}">${ic('check',14,3)}</button>
      <span class="area-dot ${AREA_DOT[t.area]||'area-personal'}"></span>
      <div class="grow txt">${esc(t.title)}</div></div>`).join('')
    : `<div class="empty">${ic('sparkle',26)}<div>Nada pendiente. Disfruta del día.</div></div>`}
  </div>

  <div class="sec rise" style="animation-delay:.26s"><h2>Apuntes recientes</h2><button class="link" data-go="apuntes">Todos</button></div>
  <div class="rise" style="animation-delay:.3s">
  ${notas.length ? notas.map(n=>`
    <div class="card note-card clickable" data-note="${n.id}"><b>${esc(n.title)||'Sin título'}</b>
      <div class="prev">${(esc(n.body)||'').slice(0,110)}</div>
      <div class="foot">${new Date(n.updated_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}${n.tags?` · <span class="tag">${esc(n.tags)}</span>`:''}</div></div>`).join('')
    : `<div class="empty">${ic('note',26)}<div>Sin apuntes todavía. Empieza uno desde Apuntes.</div></div>`}
  </div>`;
}

function vTareas() {
  const areas = ['personal','trabajo','estudios'];
  const nPend = cache.tasks.filter(t=>!t.done).length;
  return `${header('Tareas',`${nPend} pendiente${nPend===1?'':'s'} · lo del trabajo en equipo va en la otra Sala`)}
  <div class="add-box rise" style="animation-delay:.05s">
    <input id="nt-title" placeholder="Nueva tarea...">
    <div class="chips" id="nt-chips">${areas.map((a,i)=>`<div class="chip ${i===0?'on':''}" data-area="${a}">${a[0].toUpperCase()+a.slice(1)}</div>`).join('')}</div>
    <button class="btn primary block" id="nt-add">${ic('plus',17,2.2)} Añadir tarea</button>
  </div>
  ${areas.map((a,ai)=>{
    const list = cache.tasks.filter(t=>t.area===a);
    if(!list.length) return '';
    return `<div class="sec rise" style="animation-delay:${.1+ai*.05}s"><h2><span class="area-dot ${AREA_DOT[a]}"></span>${a[0].toUpperCase()+a.slice(1)}</h2><span class="count">${list.filter(t=>!t.done).length}</span></div>` +
      list.map((t,i)=>`
      <div class="card task rise" style="animation-delay:${.12+ai*.05+i*.03}s"><button class="chk ${t.done?'done':''}" data-task="${t.id}">${ic('check',14,3)}</button>
      <div class="grow txt ${t.done?'done':''}">${esc(t.title)}</div>
      <button class="icon-btn" data-del-task="${t.id}" title="Borrar">${ic('trash',16)}</button></div>`).join('');
  }).join('') || `<div class="empty rise" style="animation-delay:.1s">${ic('squareCheck',26)}<div>Sin tareas todavía. Añade la primera arriba.</div></div>`}`;
}

function vApuntes() {
  return `${header('Apuntes','Helena los lee para hacerte resúmenes y recomendarte contenido')}
  <button class="btn primary block rise" style="animation-delay:.05s" id="note-new">${ic('plus',17,2.2)} Apunte nuevo</button>
  <div class="mt"></div>
  ${cache.notes.map((n,i)=>`
    <div class="card note-card clickable rise" style="animation-delay:${.08+i*.04}s" data-note="${n.id}"><b>${esc(n.title)||'Sin título'}</b>
    <div class="prev">${(esc(n.body)||'').slice(0,140)}</div>
    <div class="foot">${new Date(n.updated_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}${n.tags?` · <span class="tag">${esc(n.tags)}</span>`:''}</div></div>`).join('')
    || `<div class="empty rise" style="animation-delay:.08s">${ic('note',26)}<div>Todavía no hay apuntes. El primero cuesta, luego fluye.</div></div>`}`;
}

function vApunte(n) {
  return `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button><div class="grow"><h1 class="small-h">${n.id?'Editar apunte':'Apunte nuevo'}</h1></div></header>
  <div class="card rise" style="animation-delay:.05s">
    <label>Título</label><input id="ed-title" value="${esc(n.title||'')}" placeholder="¿De qué va?">
    <label>Etiquetas</label><input id="ed-tags" value="${esc(n.tags||'')}" placeholder="smr, japonés, inglés, trabajo...">
    <label>Contenido</label><textarea id="ed-body" placeholder="Escribe aquí...">${esc(n.body||'')}</textarea>
    <div class="row mt"><button class="btn primary grow" id="ed-save">Guardar</button>
    ${n.id ? `<button class="icon-btn" id="ed-del" title="Borrar">${ic('trash',17)}</button>` : ''}</div>
  </div>`;
}

function vEstudios() {
  const mods = [...new Set(cache.topics.map(t=>t.module))];
  const ex = examInfo();
  return `${header('Estudios','SMR en Ilerna. Marca lo que vayas dominando.')}
  <div class="card rise" style="animation-delay:.05s">
    <div class="row"><span class="link-ic">${ic('cap',20)}</span>
    <div class="grow"><b>Exámenes finales</b><div class="mut small">Jueves 21 enero 2027 · sede Madrid</div></div>
    <span class="pill warn">${ex.dias} días</span></div>
    <div class="mut small mt">MP04 17:00 · MP07 18:15 · MP14 19:30</div>
  </div>
  ${mods.map((m,mi)=>{
    const ts = cache.topics.filter(t=>t.module===m);
    const done = ts.filter(t=>t.done).length;
    const pct = ts.length?Math.round(done/ts.length*100):0;
    return `<div class="mod-head rise" style="animation-delay:${.08+mi*.05}s"><h2>${esc(m)}</h2><span class="pill ${done===ts.length?'ok':'acc'}">${done}/${ts.length}</span></div>
    <div class="bar rise" style="animation-delay:${.09+mi*.05}s;margin:-4px 0 10px"><i class="${done===ts.length?'ok':''}" style="width:${pct}%"></i></div>` +
      ts.map((t,i)=>`<div class="card task rise" style="animation-delay:${.1+mi*.05+i*.03}s"><button class="chk ${t.done?'done':''}" data-topic="${t.id}">${ic('check',14,3)}</button>
      <div class="grow txt ${t.done?'done':''}">${esc(t.title)}</div>
      ${t.url?`<a class="icon-btn" href="${esc(t.url)}" target="_blank" rel="noopener" title="Abrir">${ic('link',16)}</a>`:''}</div>`).join('');
  }).join('')}
  <div class="sec rise" style="animation-delay:.2s"><h2>Recursos</h2></div>
  ${cache.resources.filter(r=>r.section==='estudios').map((r,i)=>`
    <a class="card link-row clickable rise" style="animation-delay:${.22+i*.04}s" href="${esc(r.url)}" target="_blank" rel="noopener">
    <span class="link-ic">${ic('link',18)}</span><span class="grow"><b>${esc(r.title)}</b><span>${esc(r.note||'')}</span></span>${ic('chev',16)}</a>`).join('')
    || '<div class="empty">Helena añadirá recursos aquí.</div>'}`;
}

function vIdiomas() {
  const lp = langProgress();
  return `${header('Idiomas','Japonés e inglés en sesiones cortas. Plan completo en Recursos.')}
  <div class="card rise" style="animation-delay:.05s">
    <div class="row"><span class="link-ic">${ic('target',20)}</span>
    <div class="grow"><b>Progreso del plan</b><div class="mut small">${lp.hechas} de ${lp.total} sesiones completadas</div></div></div>
    <div class="bar"><i style="width:${lp.total?Math.round(lp.hechas/lp.total*100):0}%"></i></div>
  </div>
  ${cache.lessons.map((l,i)=>{
    const res = cache.results.find(r=>r.lesson_id===l.id);
    return `<div class="card clickable rise" style="animation-delay:${.08+i*.04}s" data-lesson="${l.id}"><div class="lesson-row">
    <span class="lang-badge ${l.lang==='ja'?'ja':'en'}">${l.lang==='ja'?'あ':'EN'}</span>
    <div class="grow"><b>${esc(l.title)}</b><div class="meta">${l.lang==='ja'?'Japonés':'Inglés'} · sesión ${l.day}</div></div>
    ${res?`<span class="pill ok">${res.score}/${res.total}</span>`:'<span class="pill">pendiente</span>'}</div></div>`;
  }).join('') || '<div class="empty">Helena está preparando las sesiones.</div>'}
  <div class="sec rise" style="animation-delay:.2s"><h2>Recursos</h2></div>
  ${cache.resources.filter(r=>r.section==='idiomas').map((r,i)=>`
    <a class="card link-row clickable rise" style="animation-delay:${.22+i*.04}s" href="${esc(r.url)}" target="_blank" rel="noopener">
    <span class="link-ic">${ic(r.url.includes('youtube')?'video':'link',18)}</span><span class="grow"><b>${esc(r.title)}</b><span>${esc(r.note||'')}</span></span>${ic('chev',16)}</a>`).join('')}`;
}

function vLesson(l) {
  const res = cache.results.find(r=>r.lesson_id===l.id);
  const quiz = l.quiz || [];
  return `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">${esc(l.title)}</h1><div class="sub">${l.lang==='ja'?'Japonés':'Inglés'} · sesión ${l.day}</div></div></header>
  <div class="card lesson-body rise" style="animation-delay:.05s">${l.body||''}</div>
  ${l.video_url?`<a class="card link-row clickable rise" style="animation-delay:.08s" href="${esc(l.video_url)}" target="_blank" rel="noopener"><span class="link-ic">${ic('video',18)}</span><span class="grow"><b>Vídeo de la sesión</b><span>YouTube</span></span>${ic('chev',16)}</a>`:''}
  ${quiz.length?`<div class="sec rise" style="animation-delay:.1s"><h2>Mini-test</h2><span class="count">${quiz.length} preguntas</span></div><div id="quiz">${quiz.map((q,i)=>`
    <div class="card rise" style="animation-delay:${.12+i*.04}s" data-q="${i}"><b>${esc(q.q)}</b><div class="mt">
    ${q.opts.map((o,j)=>`<button class="quiz-opt" data-opt="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    <button class="btn primary block" id="quiz-send">Corregir</button></div>
    <div id="quiz-out"></div>`:''}
  ${res?`<div class="card mt rise"><div class="row"><span class="link-ic" style="color:var(--ok)">${ic('check',20)}</span><div class="grow"><b>Ya la completaste: ${res.score}/${res.total}</b></div></div></div>`:''}`;
}

/* ---------- Lógica ---------- */

async function render() {
  if (tab==='lesson') return;
  let content = '';
  if (tab==='hoy') content = vHoy();
  else if (tab==='tareas') content = vTareas();
  else if (tab==='apuntes') content = vApuntes();
  else if (tab==='estudios') content = vEstudios();
  else if (tab==='idiomas') content = vIdiomas();
  h(shell(content)); bindNav(); bindActions();
  window.scrollTo(0,0);
}

function bindActions() {
  app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { tab=b.dataset.go; render(); });
  const out = document.getElementById('btn-out');
  if (out) out.onclick = async () => { await sb.auth.signOut(); };
  app.querySelectorAll('[data-task]').forEach(b => b.onclick = async () => {
    const t = cache.tasks.find(x=>x.id===b.dataset.task);
    t.done=!t.done; render();
    await sb.from('tasks').update({done:t.done}).eq('id',t.id);
  });
  app.querySelectorAll('[data-del-task]').forEach(b => b.onclick = async () => {
    await sb.from('tasks').delete().eq('id',b.dataset.delTask);
    cache.tasks = cache.tasks.filter(x=>x.id!==b.dataset.delTask); render();
  });
  app.querySelectorAll('[data-topic]').forEach(b => b.onclick = async () => {
    const t = cache.topics.find(x=>x.id===b.dataset.topic);
    t.done=!t.done; render();
    await sb.from('topics').update({done:t.done}).eq('id',t.id);
  });
  app.querySelectorAll('#nt-chips .chip').forEach(c => c.onclick = () => {
    app.querySelectorAll('#nt-chips .chip').forEach(x=>x.classList.remove('on'));
    c.classList.add('on');
  });
  const addBtn = document.getElementById('nt-add');
  if (addBtn) addBtn.onclick = async () => {
    const title = document.getElementById('nt-title').value.trim();
    if (!title) return;
    const area = (app.querySelector('#nt-chips .chip.on')||{}).dataset?.area || 'personal';
    const { data } = await sb.from('tasks').insert({title,area}).select().single();
    if (data) cache.tasks.unshift(data); render();
  };
  const ntInput = document.getElementById('nt-title');
  if (ntInput) ntInput.onkeydown = e => { if(e.key==='Enter') addBtn.click(); };
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
      `<div class="card center mt"><div style="font-size:30px;font-weight:800">${score}/${quiz.length}</div><div class="mut small">${score===quiz.length?'¡Perfecto! 🎉':'Repasa los fallos arriba y mañana seguimos 💪'}</div></div>`;
  };
  app.querySelectorAll('.quiz-opt').forEach(b => b.onclick = () => {
    b.parentElement.querySelectorAll('.quiz-opt').forEach(x=>x.classList.remove('picked'));
    b.classList.add('picked');
  });
}

function renderLogin(msg) {
  h(`<main><div class="login-wrap">
  <div class="logo-mark">${ic('home',30,1.6)}</div>
  <h1>Mi Sala</h1>
  <div class="sub">Tus tareas, apuntes, estudios e idiomas.<br>Solo para ti.</div>
  <div class="login-card">
    <label>Email</label><input id="li-email" type="email" autocomplete="email" placeholder="tu@gmail.com">
    <label>Contraseña</label><input id="li-pass" type="password" autocomplete="current-password" placeholder="••••••••">
    <button class="btn primary block mt" id="li-in">Entrar</button>
    ${msg?`<div class="notice">${esc(msg)}</div>`:''}
  </div>
  <div class="footnote">Acceso privado · Hecho por Helena para Samuel</div></div></main>`);
  const doIn = async () => {
    const email = document.getElementById('li-email').value.trim();
    const password = document.getElementById('li-pass').value;
    const btn = document.getElementById('li-in');
    btn.disabled = true; btn.textContent = 'Entrando...';
    const { error } = await sb.auth.signInWithPassword({email,password});
    if (error) { btn.disabled = false; btn.textContent = 'Entrar'; renderLogin('No cuadra: revisa email y contraseña.'); }
  };
  document.getElementById('li-in').onclick = doIn;
  document.getElementById('li-pass').onkeydown = e => { if(e.key==='Enter') doIn(); };
  document.getElementById('li-email').onkeydown = e => { if(e.key==='Enter') document.getElementById('li-pass').focus(); };
}

async function boot() {
  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) {
    h(`<main><div class="login-wrap"><div class="logo-mark">${ic('home',30,1.6)}</div><h1>Mi Sala</h1>
    <div class="notice">Helena está terminando el motor de la app. Vuelve en un ratito.</div></div></main>`);
    return;
  }
  h(`<main><div class="login-wrap"><div class="logo-mark">${ic('home',30,1.6)}</div><h1>Mi Sala</h1><div class="sub center">Cargando...</div></div></main>`);
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
