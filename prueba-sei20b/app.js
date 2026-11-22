import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const CFG = window.SALA_CONFIG || {};
const THEME_OP = CFG.THEME === 'onepiece';
if (THEME_OP) document.body.classList.add('theme-onepiece');
const app = document.getElementById('app');
let sb = null, session = null, tab = 'hoy';
let cache = { tasks: [], notes: [], topics: [], lessons: [], resources: [], results: [], testAttempts: [], pers: [], testStates: [], hidden: [], hiddenCals: [] };
let persSigned = {};

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
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  settings:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'
};
const HAT = (w,cls) => `<svg class="${cls}" width="${w}" height="${Math.round(w*0.69)}" viewBox="0 0 64 44"><ellipse cx="32" cy="32" rx="30" ry="9" fill="#e6c15c" stroke="#a8812f" stroke-width="2"/><path d="M13 30 Q13 6 32 6 Q51 6 51 30 Q32 22 13 30 Z" fill="#e6c15c" stroke="#a8812f" stroke-width="2"/><path d="M14 27 Q32 19 50 27 L50 31 Q32 23 14 31 Z" fill="#d64545"/></svg>`;
const LOGPOSE = s => `<svg width="${s}" height="${s}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#0f1420" stroke="#e6c15c" stroke-width="2.5"/><circle cx="32" cy="32" r="20" fill="none" stroke="#2b3350" stroke-width="1.5"/><circle cx="32" cy="32" r="14" fill="none" stroke="#2b3350" stroke-width="1"/><path d="M32 32 L44 18 L34 34 Z" fill="#d64545"/><path d="M32 32 L20 46 L30 30 Z" fill="#7c87f8"/><circle cx="32" cy="32" r="3" fill="#e6c15c"/><text x="32" y="13" text-anchor="middle" fill="#e6c15c" font-size="8" font-weight="700">N</text></svg>`;
const ROSETA = s => `<svg class="roseta" width="${s}" height="${s}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="none" stroke="#e6c15c" stroke-width="3"/><path d="M32 12 L37 32 L32 52 L27 32 Z" fill="#e6c15c"/><path d="M12 32 L32 27 L52 32 L32 37 Z" fill="#e6c15c" opacity=".7"/></svg>`;
const ic = (n, s=20, sw=1.8) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[n]||''}</svg>`;

const TABS = [['hoy','home','Hoy'],['agenda','calendar','Agenda'],['tareas','squareCheck','Tareas'],['apuntes','note','Apuntes'],['estudios','cap','Estudios'],['tests','target','Tests'],['idiomas','globe','Idiomas']];
const AREA_DOT = {personal:'area-personal',trabajo:'area-trabajo',estudios:'area-estudios'};

function shell(content) {
  return `<main>${content}</main><nav class="tabbar">` +
    TABS.map(([id,icn,label],i) => `<button class="${tab===id?'on':''}" data-tab="${id}"><span class="ic-wrap">${ic(icn)}${THEME_OP&&(id==='hoy'||id==='idiomas')?HAT(15,'hat-mini'):''}</span>${label}</button>`).join('') + `</nav>`;
}
function bindNav() {
  app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
}
const header = (title, sub, extra='') =>
  `<header class="top rise"><div class="grow"><h1 class="small-h">${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div>${extra}</header>`;

async function loadAll() {
  const [t,n,tp,l,r,res,ta,ks,tqs,hh,hc,tsm] = await Promise.all([
    sb.from('tasks').select('*').order('created_at',{ascending:false}),
    sb.from('notes').select('*').order('updated_at',{ascending:false}),
    sb.from('topics').select('*').order('ord'),
    sb.from('lessons').select('*').order('day'),
    sb.from('resources').select('*').order('ord'),
    sb.from('quiz_results').select('*'),
    sb.from('test_attempts').select('*').order('created_at',{ascending:false}),
    sb.from('kana_stats').select('*'),
    sb.from('test_question_state').select('*'),
    sb.from('agenda_hidden').select('*'),
    sb.from('agenda_cal_hidden').select('*'),
    sb.from('test_summaries').select('*').order('created_at',{ascending:false}),
  ]);
  const { data: persRows } = await sb.from('personalizacion').select('*').order('created_at',{ascending:false});
  cache = { tasks:t.data||[], notes:n.data||[], topics:tp.data||[], lessons:l.data||[], resources:r.data||[], results:res.data||[], testAttempts:ta.data||[], pers:persRows||[], testStates:tqs.data||[], hidden:hh.data||[], hiddenCals:(typeof hc!=='undefined'?hc.data:null)||[], testSummaries:(typeof tsm!=='undefined'?tsm.data:null)||[] };
  try { const cq = await sb.from('test_questions').select('*',{count:'exact',head:true}); cache.testTotalQ = cq.count||0; } catch(e) { cache.testTotalQ = 0; }
  kanaStats = {};
  (ks.data||[]).forEach(row => { kanaStats[row.kana] = { ok:row.ok, fail:row.fail, last_fail:row.last_fail, streak:row.streak||0, due:row.due||null }; });
  persSigned = {};
  const imgs = cache.pers.filter(r=>r.tipo==='imagen' && r.imagen_path).map(r=>r.imagen_path);
  if (imgs.length) {
    const { data: urls } = await sb.storage.from('personalizacion').createSignedUrls(imgs, 3600);
    (urls||[]).forEach(u => { if (u && u.path && u.signedUrl) persSigned[u.path] = u.signedUrl; });
  }
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


/* ---------- Agenda (Google Calendar via RPC proxy en Postgres) ---------- */
const GCAL_CID = '767769165702-btgifgeq5iirc8gct7mm5r9mmpm978u1.apps.googleusercontent.com';
const GCAL_SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly';
const oauthUrl = () => {
  const st = crypto.randomUUID();
  localStorage.setItem('salaCalState', st);
  return 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + GCAL_CID +
    '&redirect_uri=' + encodeURIComponent(location.origin + '/oauth-callback.html') +
    '&response_type=code&scope=' + encodeURIComponent(GCAL_SCOPES) +
    '&access_type=offline&prompt=consent&state=' + encodeURIComponent(st);
};
let cal = { connected: null, calendars: [], sel: JSON.parse(localStorage.getItem('salaCalSel') || 'null'), weekOff: 0, events: [], busy: false, detail: null, form: null };

async function calApi(action, payload = {}) {
  const { data, error } = await sb.rpc('calendar_api', { action, payload });
  if (error) return { error: error.message };
  if (data && data.error) return data;
  return (data && data.data !== undefined) ? data.data : data;
}
function calStart(off = 0) { const d = new Date(); d.setDate(d.getDate() + off * 7); d.setHours(0,0,0,0); return d; }
const calDayKey = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const DOW = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
const evStart = ev => ev.start.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start.date + 'T00:00:00');

async function agendaLoad(withCalendars) {
  if (cal.busy) return; cal.busy = true;
  if (withCalendars || cal.connected === null) {
    const r = await calApi('list_calendars');
    if (r.error === 'calendar_no_conectado') { cal.connected = false; cal.busy = false; render(); return; }
    if (r.error) { cal.connected = 'error'; cal.errMsg = r.error; cal.busy = false; render(); return; }
    cal.connected = true;
    cal.calendars = (r.items || []).map(c => ({ id: c.id, name: c.summary, color: c.backgroundColor || '#7aa2ff', primary: !!c.primary }));
    const serverHidden = new Set(cache.hiddenCals.map(r => r.calendar_id));
    if (serverHidden.size) {
      cal.sel = cal.calendars.map(c => c.id).filter(id => !serverHidden.has(id));
    } else if (!cal.sel) cal.sel = cal.calendars.map(c => c.id);
    localStorage.setItem('salaCalSel', JSON.stringify(cal.sel));
  }
  const m = calStart(cal.weekOff), e = new Date(m); e.setDate(e.getDate() + 7);
  const selCals = cal.calendars.filter(c => cal.sel.includes(c.id));
  const res = await Promise.all(selCals.map(async c => {
    const r = await calApi('list_events', { calendarId: c.id, timeMin: m.toISOString(), timeMax: e.toISOString() });
    return (r.items || []).map(ev => ({ ...ev, _cal: c }));
  }));
  cal.events = res.flat().sort((a,b) => (a.start.dateTime || a.start.date) > (b.start.dateTime || b.start.date) ? 1 : -1);
  cal.busy = false; render();
  if (cal.weekOff === 0) requestAnimationFrame(() => { const t = document.querySelector('.ag-today'); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
}

const hiddenSet = () => new Set(cache.hidden.map(r => r.event_key));

function vAgenda() {
  if (cal.connected === null) { agendaLoad(true); return header('Agenda', 'Tu Google Calendar') + `<div class="card rise"><div class="sub">Cargando…</div></div>`; }
  if (cal.connected === 'error') return header('Agenda', 'Tu Google Calendar') +
    `<div class="card rise"><h3>Error</h3><div class="sub">${esc(cal.errMsg || 'desconocido')}</div>
     <button class="btn block" id="ag-retry" style="margin-top:12px">Reintentar</button></div>`;
  if (cal.connected === false) return header('Agenda', 'Tu Google Calendar') +
    `<div class="card rise"><h3>Conecta tu calendario</h3>
     <div class="sub">Ve y gestiona los eventos de tus calendarios de Google sin salir de la Sala. Solo tú ves esto.</div>
     <button class="btn primary block" id="ag-connect" style="margin-top:14px">Conectar Google Calendar</button></div>`;

  const m = calStart(cal.weekOff);
  const days = Array.from({length: 7}, (_, i) => { const d = new Date(m); d.setDate(d.getDate() + i); return d; });
  const range = days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) + ' - ' + days[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const chips = cal.calendars.map(c =>
    `<button class="chip ag-chip ${cal.sel.includes(c.id) ? 'on' : ''}" data-calchip="${esc(c.id)}">
       <span class="ag-dot" style="background:${esc(c.color)}"></span>${esc(c.name)}</button>`).join('');
  let out = header('Agenda', range,
    `<button class="icon-btn" id="ag-new" title="Nuevo evento">${ic('plus')}</button>`);
  out += `<div class="ag-weeknav rise">
      <button class="icon-btn" id="ag-prev"${cal.weekOff === 0 ? ' disabled style="opacity:.35"' : ''}>${ic('back')}</button>
      <button class="btn ghost" id="ag-today">Hoy</button>
      <button class="icon-btn" id="ag-next" style="transform:scaleX(-1)">${ic('back')}</button>
      <button class="btn ghost" id="ag-disc" style="margin-left:auto">Desconectar</button>
    </div>`;
  out += `<div class="chips ag-chips rise">${chips}</div>`;
  const hkeys = hiddenSet();
  if (cache.hidden.length) out += `<button class="btn ghost block rise" id="ag-hidden-toggle" style="margin-bottom:8px">${cal.showHidden ? 'Volver a ocultarlos' : `Ver eventos ocultos en la Sala (${cache.hidden.length})`}</button>`;
  const todayK = calDayKey(new Date());
  for (const d of days) {
    const k = calDayKey(d);
    const evs = cal.events.filter(ev => calDayKey(evStart(ev)) === k && (cal.showHidden || !hkeys.has(ev._cal.id + '|' + ev.id)));
    if (!evs.length && k !== todayK) continue;
    out += `<div class="ag-day rise ${k === todayK ? 'ag-today' : ''}">
      <div class="ag-dayhead">${DOW[(d.getDay()+6)%7]} <span>${d.getDate()}</span>${k === todayK ? ' <span class="ag-hoypill">hoy</span>' : ''}</div>
      ${evs.length ? evs.map(ev => {
        const time = ev.start.dateTime
          ? new Date(ev.start.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) +
            ' - ' + new Date(ev.end.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})
          : 'Todo el día';
        return `<button class="ag-ev ${hkeys.has(ev._cal.id + '|' + ev.id) ? 'ag-ev-off' : ''}" data-ev="${esc(ev._cal.id)}|${esc(ev.id)}">
          <span class="ag-dot" style="background:${esc(ev._cal.color)}"></span>
          <span class="ag-ev-main"><b>${esc(ev.summary || '(sin título)')}</b><small>${time} · ${esc(ev._cal.name)}</small></span>
          ${ic('chev', 16)}</button>`;
      }).join('') : '<div class="sub" style="padding:2px 4px 8px">Sin eventos</div>'}
    </div>`;
  }
  if (cal.detail) out += vAgendaDetail();
  if (cal.form) out += vAgendaForm();
  out += `<div class="ag-privacy"><a href="/privacy.html">Privacidad</a></div>`;
  return out;
}

function vAgendaDetail() {
  const ev = cal.detail;
  const when = ev.start.dateTime
    ? evStart(ev).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}) + ', ' +
      new Date(ev.start.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) + ' - ' +
      new Date(ev.end.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})
    : evStart(ev).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}) + ' (todo el día)';
  return `<div class="ag-overlay" id="ag-overlay"><div class="card ag-panel rise">
    <h3>${esc(ev.summary || '(sin título)')}</h3>
    <div class="sub">${when}</div>
    <div class="sub" style="margin-top:4px"><span class="ag-dot" style="background:${esc(ev._cal.color)}"></span> ${esc(ev._cal.name)}</div>
    ${ev.location ? `<div class="sub" style="margin-top:4px">${esc(ev.location)}</div>` : ''}
    ${ev.description ? `<div class="ag-desc">${esc(ev.description)}</div>` : ''}
    <div class="ag-actions">
      <button class="btn" id="ag-edit">Editar</button>
      ${hiddenSet().has(ev._cal.id + '|' + ev.id)
        ? `<button class="btn" id="ag-unhide">Mostrar de nuevo</button>`
        : `<button class="btn ghost" id="ag-hide">Ocultar en la Sala</button>`}
      <button class="btn ghost" id="ag-close">Cerrar</button>
    </div>
    <div class="mut small" style="margin-top:8px">Ocultar solo afecta a la Sala; tu Google Calendar no cambia.</div></div></div>`;
}

function vAgendaForm() {
  const f = cal.form;
  const opts = cal.calendars.map(c => `<option value="${esc(c.id)}" ${c.id===f.calendarId?'selected':''}>${esc(c.name)}</option>`).join('');
  return `<div class="ag-overlay" id="ag-overlay"><div class="card ag-panel rise">
    <h3>${f.id ? 'Editar evento' : 'Nuevo evento'}</h3>
    <input class="inp" id="agf-title" placeholder="Título" value="${esc(f.summary || '')}">
    <select class="inp" id="agf-cal">${opts}</select>
    <input class="inp" id="agf-date" type="date" value="${esc(f.date)}">
    <label class="ag-allday"><input type="checkbox" id="agf-allday" ${f.allDay ? 'checked' : ''}> Todo el día</label>
    <div class="ag-times ${f.allDay ? 'ag-hidden' : ''}" id="agf-times">
      <input class="inp" id="agf-start" type="time" value="${esc(f.start || '09:00')}">
      <input class="inp" id="agf-end" type="time" value="${esc(f.end || '10:00')}">
    </div>
    <textarea class="inp" id="agf-desc" placeholder="Descripción (opcional)">${esc(f.description || '')}</textarea>
    <div class="ag-actions">
      <button class="btn primary" id="ag-save">${f.id ? 'Guardar cambios' : 'Crear evento'}</button>
      <button class="btn ghost" id="ag-close">Cancelar</button>
    </div></div></div>`;
}

function bindAgenda() {
  const retry = document.getElementById('ag-retry');
  if (retry) retry.onclick = () => { cal.connected = null; render(); };
  const conn = document.getElementById('ag-connect');
  if (conn) conn.onclick = () => { location.href = oauthUrl(); };
  app.querySelectorAll('[data-calchip]').forEach(b => b.onclick = async () => {
    const id = b.dataset.calchip;
    const hiding = cal.sel.includes(id);
    cal.sel = hiding ? cal.sel.filter(x => x !== id) : [...cal.sel, id];
    if (!cal.sel.length) cal.sel = [id];
    localStorage.setItem('salaCalSel', JSON.stringify(cal.sel));
    const cname = (cal.calendars.find(c => c.id === id) || {}).name || '';
    if (hiding) {
      await sb.from('agenda_cal_hidden').upsert({ calendar_id: id, name: cname }, { onConflict: 'calendar_id' });
      if (!cache.hiddenCals.some(r => r.calendar_id === id)) cache.hiddenCals.push({ calendar_id: id, name: cname });
    } else {
      await sb.from('agenda_cal_hidden').delete().eq('calendar_id', id);
      cache.hiddenCals = cache.hiddenCals.filter(r => r.calendar_id !== id);
    }
    agendaLoad(false);
  });
  const prev = document.getElementById('ag-prev'), next = document.getElementById('ag-next'), today = document.getElementById('ag-today');
  if (prev) prev.onclick = () => { cal.weekOff = Math.max(0, cal.weekOff - 1); agendaLoad(false); };
  if (next) next.onclick = () => { cal.weekOff++; agendaLoad(false); };
  if (today) today.onclick = () => { cal.weekOff = 0; agendaLoad(false); };
  const disc = document.getElementById('ag-disc');
  if (disc) disc.onclick = async () => {
    if (!confirm('¿Desconectar Google Calendar? Se borrará el token guardado y la Sala dejará de acceder a tu calendario. Tus eventos no se tocan.')) return;
    const r = await calApi('disconnect');
    if (r && r.error) { alert('Error: ' + r.error); return; }
    cal.connected = false; cal.calendars = []; cal.sel = null; cal.events = []; cal.weekOff = 0;
    localStorage.removeItem('salaCalSel');
    render();
  };
  const nw = document.getElementById('ag-new');
  if (nw) nw.onclick = () => {
    cal.detail = null;
    cal.form = { id: null, summary: '', calendarId: (cal.calendars.find(c=>c.primary)||cal.calendars[0]||{}).id,
      date: calDayKey(new Date()), start: '09:00', end: '10:00', allDay: false, description: '' };
    render();
  };
  app.querySelectorAll('[data-ev]').forEach(b => b.onclick = () => {
    const [cid, eid] = b.dataset.ev.split('|');
    cal.detail = cal.events.find(ev => ev.id === eid && ev._cal.id === cid) || null;
    cal.form = null; render();
  });
  const close = document.getElementById('ag-close');
  if (close) close.onclick = () => { cal.detail = null; cal.form = null; render(); };
  const ov = document.getElementById('ag-overlay');
  if (ov) ov.onclick = e => { if (e.target === ov) { cal.detail = null; cal.form = null; render(); } };
  const hide = document.getElementById('ag-hide');
  if (hide) hide.onclick = async () => {
    const ev = cal.detail;
    const key = ev._cal.id + '|' + ev.id;
    hide.disabled = true;
    const { error } = await sb.from('agenda_hidden').insert({ event_key: key, title: ev.summary || '' });
    if (error) { hide.disabled = false; alert('Error: ' + error.message); return; }
    cache.hidden.push({ event_key: key, title: ev.summary || '' });
    cal.detail = null; render();
  };
  const unhide = document.getElementById('ag-unhide');
  if (unhide) unhide.onclick = async () => {
    const ev = cal.detail;
    const key = ev._cal.id + '|' + ev.id;
    unhide.disabled = true;
    const { error } = await sb.from('agenda_hidden').delete().eq('event_key', key);
    if (error) { unhide.disabled = false; alert('Error: ' + error.message); return; }
    cache.hidden = cache.hidden.filter(r => r.event_key !== key);
    cal.detail = null; render();
  };
  const ht = document.getElementById('ag-hidden-toggle');
  if (ht) ht.onclick = () => { cal.showHidden = !cal.showHidden; render(); };
  const allday = document.getElementById('agf-allday');
  if (allday) allday.onchange = () => document.getElementById('agf-times').classList.toggle('ag-hidden', allday.checked);
  const edit = document.getElementById('ag-edit');
  if (edit) edit.onclick = () => {
    const ev = cal.detail;
    cal.form = { id: ev.id, calendarId: ev._cal.id, summary: ev.summary || '',
      date: calDayKey(evStart(ev)),
      start: ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',hour12:false}) : '09:00',
      end: ev.end.dateTime ? new Date(ev.end.dateTime).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit',hour12:false}) : '10:00',
      allDay: !ev.start.dateTime, description: ev.description || '' };
    cal.detail = null; render();
  };
  const save = document.getElementById('ag-save');
  if (save) save.onclick = async () => {
    const summary = document.getElementById('agf-title').value.trim();
    if (!summary) { document.getElementById('agf-title').focus(); return; }
    const calendarId = document.getElementById('agf-cal').value;
    const date = document.getElementById('agf-date').value;
    const ad = document.getElementById('agf-allday').checked;
    const description = document.getElementById('agf-desc').value.trim();
    const event = { summary };
    if (description) event.description = description;
    if (ad) {
      const endD = new Date(date + 'T00:00:00'); endD.setDate(endD.getDate() + 1);
      event.start = { date }; event.end = { date: calDayKey(endD) };
    } else {
      event.start = { dateTime: date + 'T' + document.getElementById('agf-start').value + ':00', timeZone: 'Europe/Madrid' };
      event.end = { dateTime: date + 'T' + document.getElementById('agf-end').value + ':00', timeZone: 'Europe/Madrid' };
    }
    save.disabled = true; save.textContent = 'Guardando…';
    const f = cal.form;
    const r = f.id
      ? await calApi('update_event', { calendarId, eventId: f.id, event })
      : await calApi('create_event', { calendarId, event });
    if (r && r.error) { save.disabled = false; save.textContent = f.id ? 'Guardar cambios' : 'Crear evento'; alert('Error: ' + r.error); return; }
    cal.form = null; agendaLoad(false);
  };
}

/* ---------- Kana (práctica de hiragana con registro de fallos) ---------- */
const KANA_GROUPS = [
  {id:'v', name:'Vocales', items:[['あ','a'],['い','i'],['う','u'],['え','e'],['お','o']]},
  {id:'k', name:'か K', items:[['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko']]},
  {id:'s', name:'さ S', items:[['さ','sa'],['し','shi'],['す','su'],['せ','se'],['そ','so']]},
  {id:'t', name:'た T', items:[['た','ta'],['ち','chi'],['つ','tsu'],['て','te'],['と','to']]},
  {id:'n', name:'な N', items:[['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no']]},
  {id:'h', name:'は H', items:[['は','ha'],['ひ','hi'],['ふ','fu'],['へ','he'],['ほ','ho']]},
  {id:'m', name:'ま M', items:[['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo']]},
  {id:'y', name:'や Y', items:[['や','ya'],['ゆ','yu'],['よ','yo']]},
  {id:'r', name:'ら R', items:[['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro']]},
  {id:'w', name:'わ W', items:[['わ','wa'],['を','wo'],['ん','n']]},
  {id:'d', name:'Dakuten がざだばぱ', items:[['が','ga'],['ぎ','gi'],['ぐ','gu'],['げ','ge'],['ご','go'],['ざ','za'],['じ','ji'],['ず','zu'],['ぜ','ze'],['ぞ','zo'],['だ','da'],['で','de'],['ど','do'],['ば','ba'],['び','bi'],['ぶ','bu'],['べ','be'],['ぼ','bo'],['ぱ','pa'],['ぴ','pi'],['ぷ','pu'],['ぺ','pe'],['ぽ','po']]},
  {id:'c', name:'Combos きゃしゃちゃ', items:[['きゃ','kya'],['きゅ','kyu'],['きょ','kyo'],['しゃ','sha'],['しゅ','shu'],['しょ','sho'],['ちゃ','cha'],['ちゅ','chu'],['ちょ','cho'],['にゃ','nya'],['にゅ','nyu'],['にょ','nyo'],['ひゃ','hya'],['ひゅ','hyu'],['ひょ','hyo'],['みゃ','mya'],['みゅ','myu'],['みょ','myo'],['りゃ','rya'],['りゅ','ryu'],['りょ','ryo'],['ぎゃ','gya'],['ぎゅ','gyu'],['ぎょ','gyo'],['じゃ','ja'],['じゅ','ju'],['じょ','jo'],['びゃ','bya'],['びゅ','byu'],['びょ','byo'],['ぴゃ','pya'],['ぴゅ','pyu'],['ぴょ','pyo']]}
];
const KATA_GROUPS = [
  {id:'v', name:'Vocales', items:[['ア','a'],['イ','i'],['ウ','u'],['エ','e'],['オ','o']]},
  {id:'k', name:'カ K', items:[['カ','ka'],['キ','ki'],['ク','ku'],['ケ','ke'],['コ','ko']]},
  {id:'s', name:'サ S', items:[['サ','sa'],['シ','shi'],['ス','su'],['セ','se'],['ソ','so']]},
  {id:'t', name:'タ T', items:[['タ','ta'],['チ','chi'],['ツ','tsu'],['テ','te'],['ト','to']]},
  {id:'n', name:'ナ N', items:[['ナ','na'],['ニ','ni'],['ヌ','nu'],['ネ','ne'],['ノ','no']]},
  {id:'h', name:'ハ H', items:[['ハ','ha'],['ヒ','hi'],['フ','fu'],['ヘ','he'],['ホ','ho']]},
  {id:'m', name:'マ M', items:[['マ','ma'],['ミ','mi'],['ム','mu'],['メ','me'],['モ','mo']]},
  {id:'y', name:'ヤ Y', items:[['ヤ','ya'],['ユ','yu'],['ヨ','yo']]},
  {id:'r', name:'ラ R', items:[['ラ','ra'],['リ','ri'],['ル','ru'],['レ','re'],['ロ','ro']]},
  {id:'w', name:'ワ W', items:[['ワ','wa'],['ヲ','wo'],['ン','n']]}
];
const KANA_READ = {}; [...KANA_GROUPS, ...KATA_GROUPS].forEach(g => g.items.forEach(([k,r]) => KANA_READ[k] = r));
const kanaGroups = () => (kz && kz.script === 'kata') ? KATA_GROUPS : KANA_GROUPS;
const KANA_ALIAS = { si:'shi', ti:'chi', tu:'tsu', hu:'fu', zi:'ji', di:'ji', du:'zu', o:'wo' };
let kanaStats = {};
let kz = null;
const kzShuffle = a => { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

/* ---------- V1.2.0: repaso espaciado + voz ---------- */
const dayStr = (dt=new Date()) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
const SRS_DAYS = [1, 3, 7, 16, 35];
const srsNext = streak => { const d = new Date(); d.setDate(d.getDate() + SRS_DAYS[Math.min(Math.max(streak,1), SRS_DAYS.length) - 1]); return dayStr(d); };
const srsFailDue = () => { const d = new Date(); d.setDate(d.getDate() + 1); return dayStr(d); };
const isDue = s => !!(s && s.due && s.due <= dayStr());
function speakText(txt, lang) {
  try {
    const u = new SpeechSynthesisUtterance(txt); u.lang = lang; u.rate = 0.85;
    const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(lang.slice(0,2)));
    if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
    return true;
  } catch(e) { return false; }
}
const voiceFor = pre => { try { return speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(pre)) || null; } catch(e) { return null; } };
if (typeof speechSynthesis !== 'undefined') { try { speechSynthesis.getVoices(); } catch(e) {} }

function kanaHit(k, okAns) {
  const cur = kanaStats[k] || { ok:0, fail:0, last_fail:null, streak:0, due:null };
  const streak = okAns ? (cur.streak||0)+1 : 0;
  const row = { kana:k, ok:cur.ok+(okAns?1:0), fail:cur.fail+(okAns?0:1),
    last_fail: okAns ? cur.last_fail : new Date().toISOString(),
    streak, due: okAns ? srsNext(streak) : srsFailDue(),
    updated_at:new Date().toISOString() };
  kanaStats[k] = { ok:row.ok, fail:row.fail, last_fail:row.last_fail, streak:row.streak, due:row.due };
  sb.from('kana_stats').upsert(row).then(()=>{});
}

function openKana() {
  let sel = null, mode = 'read', script = 'hira';
  try {
    sel = JSON.parse(localStorage.getItem('salaKanaSel')||'null');
    mode = localStorage.getItem('salaKanaMode') || 'read';
    script = localStorage.getItem('salaKanaScript') || 'hira';
  } catch(e) {}
  kz = { phase:'setup', sel: (sel && sel.length ? sel : KANA_GROUPS.filter(g=>g.id!=='d'&&g.id!=='c').map(g=>g.id)),
         script, mode, strokes:[], showGuide:true,
         deck:[], pos:0, total:0, cleared:0, firstTryOk:0, wrongs:[], fb:null, exp:0 };
  renderKana();
}
function renderKana() {
  h(shell(vKana())); bindNav(); bindKana();
  app.querySelector('[data-back]').onclick = () => { tab='idiomas'; render(); };
}

function vKana() {
  const head = `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">Práctica de kana</h1><div class="sub">${kz.script==='kata'?'Katakana':'Hiragana'} · ${kz.mode==='trace'?'traza sobre la guía con orden y dirección':kz.mode==='listen'?'escucha y elige el kana que oyes':'escribe la lectura en romaji'}</div></div></header>`;
  if (kz.phase === 'setup') {
    const total = kanaGroups().filter(g => kz.sel.includes(g.id)).reduce((n,g) => n + g.items.length, 0);
    const dueKana = Object.entries(kanaStats).filter(([k,st]) => isDue(st) && KANA_READ[k]);
    const fails = Object.entries(kanaStats).filter(([k,s]) => s.fail > 0)
      .sort((a,b) => b[1].fail - a[1].fail || new Date(b[1].last_fail||0) - new Date(a[1].last_fail||0)).slice(0,8);
    return head + `
    <div class="card rise"><b>Elige qué practicar</b>
      <div class="chips" style="margin-top:12px">
        <div class="chip ${kz.mode==='read'?'on':''}" data-kmode="read">Leer</div>
        <div class="chip ${kz.mode==='trace'?'on':''}" data-kmode="trace">Trazar</div>
        <div class="chip ${kz.mode==='listen'?'on':''}" data-kmode="listen">Dictado</div>
      </div>
      <div class="chips">
        <div class="chip ${kz.script==='hira'?'on':''}" data-kscript="hira">Hiragana あ</div>
        <div class="chip ${kz.script==='kata'?'on':''}" data-kscript="kata">Katakana ア</div>
      </div>
      <div class="chips" style="flex-wrap:wrap">${kanaGroups().map(g => `<div class="chip ${kz.sel.includes(g.id)?'on':''}" data-kg="${g.id}">${esc(g.name)}</div>`).join('')}</div>
      <button class="btn primary block" id="kz-start" style="margin-top:16px" ${total?'':'disabled'}>${kz.mode==='trace'?'Empezar a trazar':kz.mode==='listen'?'Empezar el dictado':'Empezar'} · ${total} kana</button>
      ${kz.mode==='listen' ? `<div class="mut small" style="margin-top:6px">Oirás cada kana con la voz del dispositivo y eliges cuál era. Usa la voz japonesa de tu navegador o sistema.</div>` : ''}
      ${kz.noVoice && kz.mode==='listen' ? `<div class="notice" style="margin-top:8px">Este navegador no tiene una voz japonesa instalada; sin ella el dictado no puede sonar. En el móvil suele venir con el sistema.</div>` : ''}
      ${dueKana.length ? `<button class="btn block" id="kz-review" style="margin-top:8px">${ic('sparkle',16,1.8)} Repasar hoy · ${dueKana.length} kana tocan</button>` : ''}
    </div>
    ${fails.length ? `<div class="sec rise"><h2>Dónde fallas</h2></div>
    <div class="card rise">${fails.map(([k,s]) => `<div class="kz-failrow"><span class="kz-k">${k}</span><span class="grow mut">${esc(KANA_READ[k]||'')}</span><span class="pill no">${s.fail}✗</span></div>`).join('')}</div>` : ''}`;
  }
  if (kz.phase === 'quiz') {
    const item = kz.deck[kz.pos];
    return head + `
    <div class="card rise">
      <div class="mut small">${kz.cleared}/${kz.total} · a la primera ${kz.firstTryOk}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${kz.total?Math.round(kz.cleared/kz.total*100):0}%"></i></div>
      <div class="kz-big">${item[0]}</div>
      ${kz.fb
        ? `<div class="kz-fb ${kz.fb.ok?'ok':'no'}">${kz.fb.ok?'✓ Correcto':'✗ Era <b>'+esc(item[1])+'</b>'}</div>
           <button class="btn primary block" id="kz-next">Siguiente</button>`
        : `<input class="inp kz-inp" id="kz-ans" placeholder="romaji…" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
           <button class="btn primary block" id="kz-check" style="margin-top:12px">Comprobar</button>`}
    </div>`;
  }
  if (kz.phase === 'listen') {
    const q = kz.deck[kz.pos];
    return head + `
    <div class="card rise" style="text-align:center">
      <div class="mut small">${kz.cleared}/${kz.total} · a la primera ${kz.firstTryOk}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${kz.total?Math.round(kz.cleared/kz.total*100):0}%"></i></div>
      <div style="margin:18px 0 6px"><button class="btn primary" id="kz-replay">${ic('play',16,2)} Escuchar de nuevo</button></div>
      <div class="mut small">¿Qué kana has oído?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">${q.opts.map(o => `<button class="btn" style="font-size:34px;padding:12px 0" data-kopt="${o}" ${kz.fb?'disabled':''}>${o}</button>`).join('')}</div>
      ${kz.fb ? `<div class="kz-fb ${kz.fb.ok?'ok':'no'}">${kz.fb.ok?'✓ Correcto':'✗ Era <b>'+q[0]+'</b> ('+esc(q[1])+')'}</div>
      <button class="btn primary block" id="kz-next">Siguiente</button>` : ''}
    </div>`;
  }
  if (kz.phase === 'trace') {
    const item = kz.deck[kz.pos];
    return head + `
    <div class="card rise" style="text-align:center">
      <div class="mut small">${kz.pos+1}/${kz.deck.length} · ${esc(item[1])}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${Math.round(kz.pos/kz.deck.length*100)}%"></i></div>
      <canvas id="kz-canvas" class="kz-canvas" width="640" height="640"></canvas>
      <div class="row" style="margin-top:12px">
        <button class="btn grow" id="kz-clear">Borrar</button>
        <button class="btn grow" id="kz-guide">${kz.showGuide===false?'Mostrar guía':'Ocultar guía'}</button>
      </div>
      <div class="row" style="margin-top:10px">
        <button class="btn ghost grow" id="kz-prev" ${kz.pos===0?'disabled':''}>Anterior</button>
        <button class="btn primary grow" id="kz-next-t">${kz.pos+1<kz.deck.length?'Siguiente':'Terminar'}</button>
      </div>
      <div id="kz-msg" class="mut small" style="margin-top:12px;min-height:18px">Traza en orden: la guía comprueba inicio, dirección y orden de cada trazo (no la forma).</div>
      <div class="mut small" style="font-size:10px;opacity:.6;margin-top:4px">Orden de trazos: datos KanjiVG (CC BY-SA 3.0)</div>
    </div>`;
  }
  const uniq = [];
  kz.wrongs.forEach(it => { if (!uniq.some(u => u[0]===it[0])) uniq.push(it); });
  return head + `
  <div class="card rise" style="text-align:center">
    <div class="kz-score">${kz.firstTryOk}/${kz.total}</div>
    <div class="mut">aciertos a la primera</div>
  </div>
  ${uniq.length ? `<div class="sec rise"><h2>Fallados en esta ronda</h2></div>
  <div class="card rise">${uniq.map(([k,r]) => `<div class="kz-failrow"><span class="kz-k">${k}</span><span class="grow mut">${esc(r)}</span></div>`).join('')}</div>
  <button class="btn primary block" id="kz-retry" style="margin-top:12px">Repetir fallados (${uniq.length})</button>`
  : `<div class="card rise" style="text-align:center"><b>Sin fallos. Muy bien.</b></div>`}
  <button class="btn ghost block" id="kz-again" style="margin-top:10px">Elegir kana</button>`;
}

function bindKana() {
  app.querySelectorAll('[data-kmode]').forEach(c => c.onclick = () => { kz.mode = c.dataset.kmode; kz.noVoice = false; localStorage.setItem('salaKanaMode', kz.mode); renderKana(); });
  app.querySelectorAll('[data-kscript]').forEach(c => c.onclick = () => { kz.script = c.dataset.kscript; localStorage.setItem('salaKanaScript', kz.script); renderKana(); });
  app.querySelectorAll('[data-kg]').forEach(c => c.onclick = () => {
    const id = c.dataset.kg;
    kz.sel = kz.sel.includes(id) ? kz.sel.filter(x => x!==id) : [...kz.sel, id];
    localStorage.setItem('salaKanaSel', JSON.stringify(kz.sel));
    renderKana();
  });
  const start = document.getElementById('kz-start');
  if (start) start.onclick = () => {
    const items = kanaGroups().filter(g => kz.sel.includes(g.id)).flatMap(g => g.items);
    if (!items.length) return;
    if (kz.mode === 'trace') {
      kz.deck = items.map(it => [...it]);
      kz.pos = 0; kz.strokes = []; kz.showGuide = true; kz.exp = 0;
      kz.phase = 'trace'; renderKana(); return;
    }
    if (kz.mode === 'listen') {
      if (!voiceFor('ja')) { kz.noVoice = true; renderKana(); return; }
      const pool = items.map(it => it[0]);
      kz.deck = kzShuffle(items.map(it => [...it]));
      kz.deck.forEach(it => { it.opts = kzShuffle([it[0], ...kzShuffle(pool.filter(x => x !== it[0])).slice(0,3)]); });
      kz.pos = 0; kz.total = kz.deck.length; kz.cleared = 0; kz.firstTryOk = 0; kz.wrongs = []; kz.fb = null;
      kz.phase = 'listen'; renderKana(); return;
    }
    kz.deck = kzShuffle(items.map(it => [...it]));
    kz.pos = 0; kz.total = kz.deck.length; kz.cleared = 0; kz.firstTryOk = 0; kz.wrongs = []; kz.fb = null;
    kz.phase = 'quiz'; renderKana();
  };
  const rev = document.getElementById('kz-review');
  if (rev) rev.onclick = () => {
    const due = Object.keys(kanaStats).filter(k => isDue(kanaStats[k]) && KANA_READ[k]);
    if (!due.length) return;
    kz.deck = kzShuffle(due.map(k => [k, KANA_READ[k]]));
    kz.pos = 0; kz.total = kz.deck.length; kz.cleared = 0; kz.firstTryOk = 0; kz.wrongs = []; kz.fb = null;
    kz.phase = 'quiz'; renderKana();
  };
  const replay = document.getElementById('kz-replay');
  if (replay) {
    speakText(kz.deck[kz.pos][0], 'ja-JP');
    replay.onclick = () => speakText(kz.deck[kz.pos][0], 'ja-JP');
    app.querySelectorAll('[data-kopt]').forEach(b => b.onclick = () => {
      if (kz.fb) return;
      const q = kz.deck[kz.pos];
      const ok = b.dataset.kopt === q[0];
      if (!q._t) { q._t = true; if (ok) kz.firstTryOk++; else kz.wrongs.push(q); }
      kanaHit(q[0], ok);
      if (ok) kz.cleared++; else kz.deck.push(q);
      kz.fb = { ok, sel: b.dataset.kopt }; renderKana();
    });
  }
  const check = document.getElementById('kz-check');
  const ans = document.getElementById('kz-ans');
  if (ans) { ans.focus(); ans.onkeydown = e => { if (e.key==='Enter' && check) check.click(); }; }
  if (check) check.onclick = () => {
    const item = kz.deck[kz.pos];
    const a = (ans.value||'').trim().toLowerCase();
    if (!a) { ans.focus(); return; }
    const ok = a === item[1] || KANA_ALIAS[a] === item[1];
    if (!item._t) { item._t = true; if (ok) kz.firstTryOk++; else kz.wrongs.push(item); }
    kanaHit(item[0], ok);
    if (ok) kz.cleared++; else kz.deck.push(item);
    kz.fb = { ok }; renderKana();
  };
  const next = document.getElementById('kz-next');
  if (next) { next.focus(); next.onkeydown = e => { if (e.key==='Enter') next.click(); }; next.onclick = () => {
    kz.pos++; kz.fb = null;
    kz.phase = kz.pos >= kz.deck.length ? 'results' : (kz.mode === 'listen' ? 'listen' : 'quiz');
    renderKana();
  }; }
  const retry = document.getElementById('kz-retry');
  if (retry) retry.onclick = () => {
    const uniq = [];
    kz.wrongs.forEach(it => { if (!uniq.some(u => u[0]===it[0])) uniq.push(it); });
    kz.deck = kzShuffle(uniq.map(it => [it[0], it[1]]));
    kz.pos = 0; kz.total = kz.deck.length; kz.cleared = 0; kz.firstTryOk = 0; kz.wrongs = []; kz.fb = null;
    kz.phase = 'quiz'; renderKana();
  };
  const again = document.getElementById('kz-again');
  if (again) again.onclick = () => { kz.phase = 'setup'; renderKana(); };
  const canvas = document.getElementById('kz-canvas');
  if (canvas) {
    const item = kz.deck[kz.pos];
    const ctx = canvas.getContext('2d');
    const redraw = () => {
      ctx.clearRect(0, 0, 640, 640);
      if (kz.showGuide !== false) {
        if (!drawKanaOrder(ctx, item[0])) {
          ctx.font = '400px "Hiragino Sans","Noto Sans JP","Yu Gothic",sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255,255,255,.12)';
          ctx.fillText(item[0], 320, 350);
        }
      }
      const lay0 = kanaOrderLayout(item[0]);
      if (lay0 && kz.exp > 0) {
        for (let i = 0; i < Math.min(kz.exp, lay0.length); i++) {
          const sp = kanaPath(lay0[i].d);
          const p1 = sp.getPointAtLength(sp.getTotalLength());
          const x = lay0[i].ox + p1.x*lay0[i].sc, y = lay0[i].oy + p1.y*lay0[i].sc;
          ctx.beginPath(); ctx.arc(x, y, 13, 0, 7);
          ctx.fillStyle = 'rgba(46,204,113,.95)'; ctx.fill();
          ctx.strokeStyle = '#0b0f1a'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(x-6, y); ctx.lineTo(x-1.5, y+5); ctx.lineTo(x+7, y-5); ctx.stroke();
        }
      }
      ctx.lineWidth = 24; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(240,240,246,.92)';
      (kz.strokes || []).forEach(st => { if (!st.length) return; ctx.beginPath(); st.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke(); });
    };
    const posOf = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * 640 / r.width, (e.clientY - r.top) * 640 / r.height]; };
    let drawing = false;
    canvas.addEventListener('pointerdown', e => { e.preventDefault(); drawing = true; kz.strokes = kz.strokes || []; kz.strokes.push([posOf(e)]); try { canvas.setPointerCapture(e.pointerId); } catch(_) {} redraw(); });
    canvas.addEventListener('pointermove', e => { if (!drawing) return; e.preventDefault(); kz.strokes[kz.strokes.length-1].push(posOf(e)); redraw(); });
    canvas.addEventListener('pointerup', () => {
      drawing = false;
      const lay = kanaOrderLayout(item[0]);
      if (!lay || kz.exp >= lay.length) return;
      const st = kz.strokes[kz.strokes.length-1];
      if (!st || st.length < 2) { if (st) kz.strokes.pop(); redraw(); return; }
      const e = lay[kz.exp];
      const sp = kanaPath(e.d);
      const p0 = sp.getPointAtLength(0), p1 = sp.getPointAtLength(sp.getTotalLength());
      const x0 = e.ox + p0.x*e.sc, y0 = e.oy + p0.y*e.sc;
      const x1 = e.ox + p1.x*e.sc, y1 = e.oy + p1.y*e.sc;
      const s0 = st[0], s1 = st[st.length-1];
      const T = 78;
      const ok = Math.hypot(s0[0]-x0, s0[1]-y0) < T && Math.hypot(s1[0]-x1, s1[1]-y1) < T;
      const msg = document.getElementById('kz-msg');
      if (ok) {
        kz.exp++;
        if (msg) msg.innerHTML = kz.exp >= lay.length
          ? '🎉 <b>Kana completo</b>: todos los trazos en orden y dirección'
          : `✓ Trazo ${kz.exp} bien. Ahora el ${kz.exp+1}.`;
        if (kz.exp >= lay.length) kanaHit(item[0], true);
      } else {
        kz.strokes.pop();
        if (msg) msg.innerHTML = `✗ Ese no era el trazo ${kz.exp+1}: mira el número y la flecha de la guía.`;
      }
      redraw();
    });
    ['pointercancel','pointerleave'].forEach(ev => canvas.addEventListener(ev, () => { drawing = false; }));
    redraw();
    const clr = document.getElementById('kz-clear');
    if (clr) clr.onclick = () => { kz.strokes = []; kz.exp = 0; const m = document.getElementById('kz-msg'); if (m) m.innerHTML = 'Traza en orden: la guía comprueba inicio, dirección y orden de cada trazo (no la forma).'; redraw(); };
    const gd = document.getElementById('kz-guide');
    if (gd) gd.onclick = () => { kz.showGuide = !(kz.showGuide !== false); gd.textContent = kz.showGuide === false ? 'Mostrar guía' : 'Ocultar guía'; redraw(); };
    const pv = document.getElementById('kz-prev');
    if (pv) pv.onclick = () => { if (kz.pos > 0) { kz.pos--; kz.strokes = []; kz.exp = 0; renderKana(); } };
    const nt = document.getElementById('kz-next-t');
    if (nt) nt.onclick = () => { if (kz.pos + 1 < kz.deck.length) { kz.pos++; kz.strokes = []; kz.exp = 0; renderKana(); } else { kz.phase = 'setup'; renderKana(); } };
  }
}

const kanaPathCache = new Map();
function kanaPath(d) {
  let p = kanaPathCache.get(d);
  if (!p) {
    p = document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d', d);
    kanaPathCache.set(d, p);
  }
  return p;
}
function kanaOrderLayout(str) {
  const KS = window.KANA_STROKES; if (!KS) return null;
  const chars = [...str];
  if (!chars.every(ch => KS[ch])) return null;
  const layouts = chars.length === 1
    ? [{ ox: 55, oy: 55, sc: 530/109 }]
    : [{ ox: 40, oy: 40, sc: 340/109 }, { ox: 330, oy: 330, sc: 250/109 }];
  const out = [];
  chars.forEach((ch, ci) => KS[ch].forEach(d => out.push({ d, ox: layouts[ci].ox, oy: layouts[ci].oy, sc: layouts[ci].sc })));
  return out;
}
function drawKanaOrder(ctx, str) {
  const entries = kanaOrderLayout(str);
  if (!entries) return false;
  let n = 0;
  {
    entries.forEach(({ d, ox, oy, sc }) => {
      const L = { ox, oy, sc };
      n++;
      const sp = kanaPath(d);
      const len = sp.getTotalLength();
      const path = new Path2D(d);
      ctx.save(); ctx.translate(L.ox, L.oy); ctx.scale(L.sc, L.sc);
      ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,.10)';
      ctx.stroke(path);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = 'rgba(139,148,255,.5)';
      ctx.stroke(path);
      ctx.restore();
      const p0 = sp.getPointAtLength(0);
      const x0 = L.ox + p0.x*L.sc, y0 = L.oy + p0.y*L.sc;
      ctx.beginPath(); ctx.arc(x0, y0, 14, 0, 7);
      ctx.fillStyle = 'rgba(139,148,255,.95)'; ctx.fill();
      ctx.fillStyle = '#0b0f1a'; ctx.font = 'bold 17px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(n), x0, y0+1);
      const p1 = sp.getPointAtLength(len), p9 = sp.getPointAtLength(Math.max(0, len-2));
      const x1 = L.ox + p1.x*L.sc, y1 = L.oy + p1.y*L.sc;
      const ang = Math.atan2(p1.y-p9.y, p1.x-p9.x);
      ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-18,-9); ctx.lineTo(-18,9); ctx.closePath();
      ctx.fillStyle = 'rgba(139,148,255,.95)'; ctx.fill(); ctx.restore();
    });
  }
  return true;
}

function vHoy() {
  const pend = cache.tasks.filter(t=>!t.done).slice(0,3);
  const nextLesson = cache.lessons.find(l => !cache.results.some(r => r.lesson_id===l.id));
  const ex = examInfo();
  const lp = langProgress();
  const notas = cache.notes.slice(0,2);
  /* PRUEBA B (cambio 6): preguntas al dia para llegar al examen. */
  const totalQ = cache.testTotalQ || 0;
  const dominadasQ = cache.testStates.filter(x => x.last_correct).length;
  const porDia = (ex.dias !== null && ex.dias > 0 && totalQ > dominadasQ) ? Math.ceil((totalQ - dominadasQ) / ex.dias) : null;
  const fechaStr = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});

  return `
  <header class="top rise" style="animation-delay:.02s">
    <div class="grow"><div class="date-cap">${fechaStr}</div><h1>Hola, Samuel 👋</h1></div>
    <button class="icon-btn" id="btn-cuenta" title="Cuenta">${ic('settings',18)}</button>
    <button class="icon-btn ${THEME_OP?'hat-host':''}" id="btn-out" title="Cerrar sesión">${ic('logout',18)}${THEME_OP?HAT(24,'hat-mini'):''}</button>
  </header>
  ${THEME_OP?'<div class="ship-space" aria-hidden="true"></div>':''}

  ${nextLesson ? `
  <div class="hero rise" style="animation-delay:.06s" data-go="idiomas">
    <span class="glyph">${nextLesson.lang==='ja'?'あ':'Aa'}</span>
    ${THEME_OP?`<span class="logpose">${LOGPOSE(54)}</span>`:`<div class="go">${ic('chev',16,2.2)}</div>`}
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
      <div class="lab">${THEME_OP?LOGPOSE(15)+' Log Pose · Exámenes':ic('calendar',14)+' Exámenes Ilerna'}</div>
      <div class="big">${ex.dias} <small>días</small></div>
      ${porDia ? `<div class="lab" style="margin-top:2px">~${porDia} preg./día para llegar</div>` : ''}
      <div class="bar"><i class="warn" style="width:${Math.max(4,Math.min(100,100-ex.dias/2))}%"></i></div>
    </div>
    <div class="tile">
      <div class="lab">${THEME_OP?`<span class="hat-host">${ic('globe',14)}${HAT(13,'hat-tile')}</span>`:ic('globe',14)} Sesiones idiomas</div>
      <div class="big">${lp.hechas}<small>/${lp.total}</small></div>
      <div class="bar"><i style="width:${lp.total?Math.round(lp.hechas/lp.total*100):0}%"></i></div>
    </div>
  </div>

  <div class="sec rise" style="animation-delay:.18s"><h2>${THEME_OP?ROSETA(16):''} Tareas pendientes</h2><button class="link" data-go="tareas">Ver todas</button></div>
  <div class="rise" style="animation-delay:.22s">
  ${pend.length ? pend.map(t=>`
    <div class="card task clickable"><button class="chk" data-task="${t.id}">${ic('check',14,3)}</button>
      <span class="area-dot ${AREA_DOT[t.area]||'area-personal'}"></span>
      <div class="grow txt">${esc(t.title)}</div></div>`).join('')
    : `<div class="empty">${ic('sparkle',26)}<div>Nada pendiente. Disfruta del día.</div></div>`}
  </div>

  <div class="sec rise" style="animation-delay:.26s"><h2>${THEME_OP?ROSETA(16):''} Apuntes recientes</h2><button class="link" data-go="apuntes">Todos</button></div>
  <div class="rise" style="animation-delay:.3s">
  ${notas.length ? notas.map(n=>`
    <div class="card note-card clickable" data-note="${n.id}"><b>${esc(n.title)||'Sin título'}</b>
      <div class="prev">${(esc(n.body)||'').slice(0,110)}</div>
      <div class="foot">${new Date(n.updated_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}${n.tags?` · <span class="tag">${esc(n.tags)}</span>`:''}</div></div>`).join('')
    : `<div class="empty">${ic('note',26)}<div>Sin apuntes todavía. Empieza uno desde Apuntes.</div></div>`}
  </div>
  <div class="ag-privacy rise" style="animation-delay:.34s"><div style="font-weight:700;letter-spacing:.06em;color:#b9bfcc;margin-bottom:4px">PRUEBA B · 集中 SHŪCHŪ (NOMBRE PROPUESTO) · DATOS FICTICIOS · NO AFECTA A TU SALA</div><a href="/privacy.html">Privacidad</a></div>`;
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

const nextFor = lang => {
  const ls = cache.lessons.filter(l => l.lang === lang).sort((a, b) => a.day - b.day);
  const undone = ls.find(l => !cache.results.some(r => r.lesson_id === l.id));
  if (!undone) return null;
  const idx = ls.indexOf(undone);
  const prev = idx > 0 ? ls[idx - 1] : null;
  let repaso = false;
  if (prev) {
    const best = Math.max(-1, ...cache.results.filter(r => r.lesson_id === prev.id).map(r => r.score));
    repaso = best >= 0 && best < (prev.quiz || []).length;
  }
  return { lesson: undone, repaso };
};
const nextCard = lang => {
  const nx = nextFor(lang);
  const badge = lang === 'ja' ? 'あ' : 'EN';
  const name = lang === 'ja' ? 'Japonés' : 'Inglés';
  if (!nx) return `<div class="card rise" style="animation-delay:.06s"><div class="lesson-row">
    <span class="lang-badge ${lang}">${badge}</span>
    <div class="grow"><b>${name}: tanda completada</b>
    <div class="meta">Has terminado todas las sesiones de esta tanda. Helena prepara la siguiente y aparecerá aquí cuando esté lista.</div></div></div></div>`;
  return `<div class="card clickable rise" style="animation-delay:.06s" data-lesson="${nx.lesson.id}"><div class="lesson-row">
    <span class="lang-badge ${lang}">${badge}</span>
    <div class="grow"><b>Siguiente: ${esc(nx.lesson.title)}</b>
    <div class="meta">${nx.repaso ? 'La sesión anterior te salió floja: repásala si quieres antes' : name + ' · sesión ' + nx.lesson.day}</div></div>
    ${ic('chev',16)}</div></div>`;
};

function vIdiomas() {
  const lp = langProgress();
  return `${header('Idiomas','Japonés e inglés en sesiones cortas. Plan completo en Recursos.')}
  <div class="card rise" style="animation-delay:.05s">
    <div class="row"><span class="link-ic">${ic('target',20)}</span>
    <div class="grow"><b>Progreso del plan</b><div class="mut small">${lp.hechas} de ${lp.total} sesiones completadas</div></div></div>
    <div class="bar"><i style="width:${lp.total?Math.round(lp.hechas/lp.total*100):0}%"></i></div>
  </div>
  <div class="sec rise" style="animation-delay:.06s"><h2>Continúa por aquí</h2></div>
  ${['ja','en'].map(nextCard).join('')}
  <div class="card clickable rise" style="animation-delay:.07s" data-kana><div class="lesson-row">
    <span class="lang-badge ja">あ</span>
    <div class="grow"><b>Práctica de kana</b><div class="meta">Hiragana · lectura en romaji, con registro de fallos</div></div>
    ${ic('chev',16)}</div></div>
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
  ${(l.body||'').includes('class="jp"') ? `<button class="btn block rise" style="animation-delay:.09s;margin-top:10px" id="les-listen">${ic('play',16,2)} Escuchar la lectura en voz alta</button><div id="les-listen-note" class="mut small" style="margin-top:6px"></div>` : ''}
  ${quiz.length?`<div class="sec rise" style="animation-delay:.1s"><h2>Mini-test</h2><span class="count">${quiz.length} preguntas</span></div><div id="quiz">${quiz.map((q,i)=>`
    <div class="card rise" style="animation-delay:${.12+i*.04}s" data-q="${i}"><b>${esc(q.q)}</b><div class="mt">
    ${q.opts.map((o,j)=>`<button class="quiz-opt" data-opt="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    <button class="btn primary block" id="quiz-send">Corregir</button></div>
    <div id="quiz-out"></div>`:''}
  ${res?`<div class="card mt rise"><div class="row"><span class="link-ic" style="color:var(--ok)">${ic('check',20)}</span><div class="grow"><b>Ya la completaste: ${res.score}/${res.total}</b></div></div></div>`:''}`;
}

/* ---------- Tests SMR ---------- */
const BANKS = [
  ...[1,2,3,4,5,6].map(i => ({bank:`SOR RA${i}`, subject:'SOR'})),
  ...[1,2,3,4,5,6,7,8].map(i => ({bank:`Servicios RA${i}`, subject:'Servicios', comp:i===7})),
  ...[1,2,3,4,5].map(i => ({bank:`IPE II RA${i}`, subject:'IPE II'})),
];
const bankBadge = s => s==='Servicios' ? 'SRV' : s==='IPE II' ? 'IPE' : 'SOR';
const bankStats = bank => {
  const l = cache.testAttempts.filter(a => a.bank===bank);
  if (!l.length) return null;
  const fulls = l.filter(a => a.kind === 'full');
  return { n:l.length, best: fulls.length ? Math.max(...fulls.map(a=>Math.round(100*a.score/a.total))) : null, last:l[0] };
};
const stateByQid = () => { const m = {}; cache.testStates.forEach(s => { m[s.question_id] = s; }); return m; };
const bankProgress = bank => {
  const rows = cache.testStates.filter(s => s.bank === bank);
  if (!rows.length) return null;
  return { vistas: rows.length, dominadas: rows.filter(s => s.last_correct).length };
};
const bankCardMeta = (bank, st) => {
  const parts = [];
  if (st) parts.push(`${st.n} intento${st.n===1?'':'s'}${st.best!=null ? ` · mejor nota ${st.best}%` : ''}`);
  const pr = bankProgress(bank);
  if (pr) parts.push(`${pr.vistas} vistas · ${pr.dominadas} dominadas`);
  return parts.length ? parts.join(' · ') : 'Sin intentos todavía';
};

function vTests() {
  const subs = [...new Set(BANKS.map(b=>b.subject))];
  const dueTests = cache.testStates.filter(isDue);
  const errTests = cache.testStates.filter(x => x.fail > 0).sort((a,b) => (b.fail-a.fail) || String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  const savedRun = loadSavedRun();
  return `${header('Tests','Bancos SMR de tus PDF: un test de 100 por tema')}
  ${savedRun ? `<div class="card rise" style="animation-delay:.03s"><div class="lesson-row">
    <span class="lang-badge ja">▶</span>
    <div class="grow"><b>Test a medias: ${esc(savedRun.bank.bank)}</b>
    <div class="meta">Pregunta ${(savedRun.i||0)+1} de ${savedRun.list.length}${savedRun.sim ? ' · simulacro en curso' : ''} · se retoma donde lo dejaste</div></div></div>
    <div class="row" style="margin-top:10px">
      <button class="btn primary grow" id="ts-resume">Continuar</button>
      <button class="btn ghost grow" id="ts-discard">Descartar</button>
    </div></div>` : ''}
  ${dueTests.length ? `<div class="card clickable rise" style="animation-delay:.04s" id="ts-review"><div class="lesson-row">
    <span class="lang-badge en">🔁</span>
    <div class="grow"><b>Repasar hoy · ${dueTests.length} pregunta${dueTests.length===1?'':'s'}</b>
    <div class="meta">Repaso espaciado: tocan según cuándo las fallaste o las viste por última vez</div></div>
    ${ic('chev',16)}</div></div>` : ''}
  ${errTests.length ? `<div class="card clickable rise" style="animation-delay:.045s" id="ts-errors"><div class="lesson-row">
    <span class="lang-badge ja">✗</span>
    <div class="grow"><b>Repaso de errores · ${errTests.length} pregunta${errTests.length===1?'':'s'}</b>
    <div class="meta">Test con las que has fallado alguna vez, de todos los temas · primero las que más fallas</div></div>
    ${ic('chev',16)}</div></div>` : ''}
  ${subs.map((s,si) => `<div class="mod-head rise" style="animation-delay:${.05+si*.06}s"><h2>${esc(s)}</h2><span class="count">${BANKS.filter(b=>b.subject===s).length} temas</span></div>` +
    BANKS.filter(b=>b.subject===s).map((b,i) => {
      const st = bankStats(b.bank);
      return `<div class="card clickable rise" style="animation-delay:${.08+si*.06+i*.03}s" data-bank="${esc(b.bank)}"><div class="lesson-row">
      <span class="lang-badge ${b.subject==='SOR'?'en':'ja'}">${bankBadge(b.subject)}</span>
      <div class="grow"><b>${esc(b.bank)}</b>${b.comp?' <span class="pill warn">Complementario</span>':''}
      <div class="meta">${bankCardMeta(b.bank, st)}</div></div>
      ${ic('chev',16)}</div></div>`;
    }).join('')).join('')}
  <div class="mut small center mt">Las preguntas y respuestas vienen de tus PDF de estudio (bancos por RA), tal cual.</div>`;
}

function vTestBank(b) {
  const ats = cache.testAttempts.filter(a=>a.bank===b.bank);
  const st = bankStats(b.bank);
  const pr = bankProgress(b.bank);
  const failedEver = cache.testStates.filter(s => s.bank === b.bank && s.fail > 0 && !s.last_correct).length;
  return `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
  <div class="grow"><h1 class="small-h">${esc(b.bank)}</h1>
  <div class="sub">${esc(b.subject)} · 100 preguntas${b.comp?' · banco complementario':''}</div></div></header>
  ${THEME_OP?'<div class="ship-space" aria-hidden="true"></div>':''}
  <div class="tiles rise" style="animation-delay:.05s">
    <div class="tile"><div class="lab">${ic('target',14)} Intentos</div><div class="big">${st?st.n:0}</div></div>
    <div class="tile"><div class="lab">${ic('check',14)} Mejor nota</div><div class="big">${st && st.best!=null ? st.best+'<small>%</small>':'—'}</div></div>
  </div>
  <div class="mut small rise" style="animation-delay:.055s;margin:2px 2px 0">La mejor nota solo cuenta los tests completos de 100 preguntas; los cortos y los repasos guardan su historial pero no compiten por esa marca.</div>
  ${pr ? `<div class="card rise" style="animation-delay:.06s">
    <div class="row" style="justify-content:space-between"><b>Progreso del banco</b><span class="mut small">${pr.dominadas} dominadas · ${pr.vistas} vistas</span></div>
    <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100, pr.dominadas)}%"></i></div>
  </div>` : ''}
  ${THEME_OP && st && st.best!=null ? `<div class="wanted rise" style="animation-delay:.07s">
    ${HAT(44,'w-hat')}
    <div style="height:22px"></div>
    <div class="w-title">WANTED</div>
    <div class="w-sub">MEJOR MARCA</div>
    <div class="w-score">${st.best}%</div>
    <div class="w-label">${esc(b.bank)} · tu mejor marca hasta ahora</div>
  </div>` : ''}
  <div class="card rise" style="animation-delay:.08s">
    <b>Preparar test</b>
    <div class="mut small" style="margin:4px 0 10px">Elige la longitud y el modo de corrección. Las preguntas salen en orden aleatorio.</div>
    <div class="chips">${[10,25,50,100].map(n => `<div class="chip ${n===25?'on':''}" data-tcount="${n}">${n===100?'Todas':n}</div>`).join('')}</div>
    <div class="chips" style="margin-top:8px">
      <div class="chip on" data-tcorr="end">Corregir al final</div>
      <div class="chip" data-tcorr="now">Corregir al momento</div>
    </div>
    <div class="mut small" style="margin:2px 0 8px">Al final puedes moverte entre preguntas, cambiar respuestas y dejar alguna en blanco. Al momento es práctica rápida con explicación tras cada una.</div>
    <div class="chips" style="margin-top:8px">
      <div class="chip on" data-ttimer="no">Sin límite</div>
      <div class="chip" data-ttimer="sim">Simulacro ⏱</div>
    </div>
    <div class="mut small" style="margin:2px 0 8px">El simulacro es como el examen: 45 segundos por pregunta en total, corrección al final y, si se acaba el tiempo, se corrige solo. Las que queden en blanco cuentan como falladas.</div>
    <button class="btn primary block" id="bt-start" style="margin-top:6px">${ic('play',17,2)} Empezar test</button>
  </div>
  ${failedEver>0 ? `<button class="btn block rise" style="animation-delay:.11s" id="bt-failed">${ic('sparkle',17,1.8)} Repasar las que te cuestan (${failedEver})</button>` : ''}
  ${(() => { const sums = (cache.testSummaries||[]).filter(x => x.bank === b.bank && x.estado === 'lista');
    return sums.length ? `<div class="sec rise" style="animation-delay:.13s"><h2>Resúmenes del tema</h2><span class="count">${sums.length}</span></div>` +
    sums.slice(0,5).map((sm,i) => `<div class="card clickable rise" style="animation-delay:${.14+i*.04}s" data-sum="${sm.id}"><div class="lesson-row">
      <span class="link-ic">${ic('note',18)}</span>
      <div class="grow"><b>Resumen del ${new Date(sm.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}</b><div class="meta">Tema completo, con énfasis en lo que fallaste</div></div>
      ${ic('chev',16)}</div></div>`).join('') : ''; })()}
  <div class="sec rise" style="animation-delay:.14s"><h2>Historial</h2><span class="count">${ats.length}</span></div>
  ${ats.length ? ats.slice(0,10).map((a,i)=>{
      const pct = Math.round(100*a.score/a.total);
      return `<div class="card hist-row rise" style="animation-delay:${.16+i*.04}s"><div class="grow"><b>${a.score}/${a.total}</b><span class="mut small"> · ${new Date(a.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'})} ${new Date(a.created_at).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span></div><span class="pill ${pct>=80?'ok':pct>=50?'acc':'warn'}">${pct}%</span></div>`;
    }).join('') : '<div class="empty">Aún no hay intentos. El primero empieza arriba.</div>'}`;
}

let trun = null;

/* V1.2.0: el intento activo sobrevive a recargas y a irse a background */
const runKey = () => 'salaTestRun:' + (session && session.user && session.user.id ? session.user.id : 'anon');
function saveRun() {
  try {
    if (!trun) return;
    localStorage.setItem(runKey(), JSON.stringify({ v:1, ts: Date.now(), bank: trun.bank,
      list: trun.list, i: trun.i, answers: trun.answers || [], resp: trun.resp || {},
      corr: trun.corr, sim: trun.sim || null, full: !!trun.full, review: !!trun.review }));
  } catch(e) {}
}
function loadSavedRun() {
  try {
    const r = JSON.parse(localStorage.getItem(runKey()) || 'null');
    if (!r || r.v !== 1 || !r.list || !r.list.length) return null;
    return r;
  } catch(e) { return null; }
}
function clearSavedRun() { try { localStorage.removeItem(runKey()); } catch(e) {} }
function restoreRun(r) {
  trun = { bank: r.bank, list: r.list, i: r.i || 0, answers: r.answers || [], resp: r.resp || {},
           locked: false, corr: r.corr || 'now', sim: r.sim || null, full: !!r.full, review: !!r.review };
  if (trun.sim && trun.sim.deadline && Date.now() > trun.sim.deadline) { finishRun(); return; }
  renderRun();
}

async function startTestRun(b, opts = {}) {
  const prev = loadSavedRun();
  if (prev && prev.bank && prev.bank.bank && (prev.i > 0 || (prev.answers||[]).length || Object.keys(prev.resp||{}).length)) {
    if (!confirm(`Tienes un test a medias (${prev.bank.bank}, pregunta ${(prev.i||0)+1} de ${prev.list.length}). ¿Descartarlo y empezar este?`)) return;
    clearSavedRun();
  }
  h(shell(`<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button><div class="grow"><h1 class="small-h">${esc(b.bank)}</h1><div class="sub">Cargando preguntas...</div></div></header>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => openBank(b);
  const { data } = await sb.from('test_questions').select('*').eq('bank', b.bank).order('ord');
  let list = data || [];
  if (!list.length) return openBank(b);
  if (opts.mode === 'failed') {
    const m = stateByQid();
    list = list.filter(q => { const s = m[q.id]; return s && s.fail > 0 && !s.last_correct; });
    if (!list.length) return openBank(b);
  }
  if (opts.mode === 'lastFailed') {
    const last = (cache.testAttempts.find(a=>a.bank===b.bank));
    if (!last) return openBank(b);
    const { data:ans } = await sb.from('test_answers').select('question_id').eq('attempt_id', last.id).eq('correct', false);
    const ids = new Set((ans||[]).map(x=>x.question_id));
    list = list.filter(q=>ids.has(q.id));
    if (!list.length) return openBank(b);
  }
  const coversAll = !opts.mode && (!opts.count || opts.count >= list.length) && list.length === 100;
  list = kzShuffle([...list]);
  if (opts.count && list.length > opts.count) list = list.slice(0, opts.count);
  finishingRun = false;
  trun = { bank:b, list, i:0, answers:[], locked:false, corr: opts.corr || 'now', resp: {},
           full: coversAll, review: opts.mode === 'failed' || opts.mode === 'lastFailed' };
  if (opts.sim) trun.sim = { total: list.length * 45, deadline: 0 };
  saveRun();
  renderRun();
}

function renderRun() {
  if (trun.corr === 'end') return renderRunEnd();
  const q = trun.list[trun.i];
  const n = trun.list.length;
  const num = trun.i + 1;
  h(shell(`
  <header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">${esc(trun.bank.bank)}</h1>
    <div class="sub">Pregunta ${num} de ${n}</div></div>
    <button class="btn ghost" id="run-end">Terminar y corregir</button></header>
  <div class="bar rise" style="animation-delay:.02s;margin:6px 0 16px"><i style="width:${Math.round(100*(num-1)/n)}%"></i></div>
  <div class="card rise" style="animation-delay:.04s">
    <div class="qnum">${esc(trun.bank.bank)} · ${q.qid ? `<span class="mut small">${esc(q.qid)}</span>` : ''}</div>
    <div class="qtext">${esc(q.question)}</div>
    <div class="mt" id="opts">
      ${q.options.map((o,j)=>`<button class="quiz-opt opt" data-opt="${j}"><span class="opt-letter">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('')}
    </div>
    <div id="expl"></div>
  </div>
  <button class="btn ghost block" id="run-save-exit" style="margin-top:10px">Guardar y salir</button>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => openBank(trun.bank);
  document.getElementById('run-end').onclick = () => {
    if (!trun.answers.length) return openBank(trun.bank);
    if (confirm(`¿Corregir ya con las ${trun.answers.length} respondidas?`)) finishRun();
  };
  document.getElementById('run-save-exit').onclick = () => {
    if (trun.sim && !confirm('El reloj del simulacro sigue corriendo aunque salgas: si llega a cero, se corregirá solo con lo que lleves respondido. ¿Guardar y salir?')) return;
    saveRun(); openBank(trun.bank);
  };
  app.querySelectorAll('#opts .quiz-opt').forEach(btn => btn.onclick = () => {
    if (trun.locked) return;
    trun.locked = true;
    const chosen = +btn.dataset.opt;
    const ok = chosen === q.correct;
    trun.answers.push({ question_id:q.id, chosen, correct:ok });
    saveRun();
    app.querySelectorAll('#opts .quiz-opt').forEach((b,j)=>{
      b.disabled = true;
      if (j===q.correct) b.classList.add('right');
      else if (b===btn) b.classList.add('wrong');
    });
    document.getElementById('expl').innerHTML =
      `<div class="expl-box ${ok?'ok':'bad'}"><b>${ok?'¡Correcta!':'No es esa.'}</b> ${esc(q.explanation||'')}</div>
       <button class="btn primary block" id="run-next">${trun.i+1<trun.list.length?'Siguiente':'Ver resultado'}</button>`;
    document.getElementById('run-next').onclick = () => {
      trun.i++; trun.locked = false;
      saveRun();
      if (trun.i < trun.list.length) renderRun(); else finishRun();
    };
    const main = app.querySelector('main');
    if (main) main.scrollTop = main.scrollHeight;
  });
}

function renderRunEnd() {
  const q = trun.list[trun.i];
  const n = trun.list.length;
  const num = trun.i + 1;
  const answered = Object.keys(trun.resp).length;
  h(shell(`
  <header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">${esc(trun.bank.bank)}</h1>
    <div class="sub">Pregunta ${num} de ${n} · ${answered} respondida${answered===1?'':'s'}</div></div>
    <button class="btn ghost" id="run-end">Corregir</button></header>
  <div class="bar rise" style="animation-delay:.02s;margin:6px 0 16px"><i style="width:${Math.round(100*answered/n)}%"></i></div>
  ${trun.sim ? `<div class="card rise" style="animation-delay:.03s;padding:10px 14px;margin-bottom:12px"><div class="row" style="justify-content:space-between"><span class="mut small">⏱ Tiempo restante</span><b id="sim-clock" style="font-size:18px"></b></div></div>` : ''}
  <div class="card rise" style="animation-delay:.04s">
    <div class="qnum">${esc(trun.bank.bank)}${q.qid ? ` · <span class="mut small">${esc(q.qid)}</span>` : ''}</div>
    <div class="qtext">${esc(q.question)}</div>
    <div class="mt" id="opts">
      ${q.options.map((o,j)=>`<button class="quiz-opt opt ${trun.resp[q.id]===j?'picked':''}" data-opt="${j}"><span class="opt-letter">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('')}
    </div>
    <div class="row" style="margin-top:14px">
      <button class="btn ghost grow" id="run-prev" ${trun.i===0?'disabled':''}>Anterior</button>
      <button class="btn grow" id="run-next2">${trun.i+1<n?'Siguiente':'Corregir'}</button>
    </div>
    <div class="mut small" style="margin-top:10px">Toca una opción para marcarla; tócala de nuevo para dejarla en blanco.</div>
  </div>
  <button class="btn ghost block" id="run-save-exit2" style="margin-top:10px">Guardar y salir</button>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => openBank(trun.bank);
  const se2 = document.getElementById('run-save-exit2');
  if (se2) se2.onclick = () => {
    if (trun.sim && !confirm('El reloj del simulacro sigue corriendo aunque salgas: si llega a cero, se corregirá solo con lo que lleves respondido. ¿Guardar y salir?')) return;
    saveRun(); openBank(trun.bank);
  };
  document.getElementById('run-end').onclick = () => {
    const blank = n - Object.keys(trun.resp).length;
    if (!Object.keys(trun.resp).length) return openBank(trun.bank);
    if (blank > 0 && !confirm(`Quedan ${blank} sin responder. Cuentan como falladas. ¿Corregir ya?`)) return;
    finishRun();
  };
  app.querySelectorAll('#opts .quiz-opt').forEach(btn => btn.onclick = () => {
    const chosen = +btn.dataset.opt;
    if (trun.resp[q.id] === chosen) delete trun.resp[q.id]; else trun.resp[q.id] = chosen;
    saveRun();
    app.querySelectorAll('#opts .quiz-opt').forEach((b,j) => b.classList.toggle('picked', trun.resp[q.id] === j));
  });
  const pv = document.getElementById('run-prev');
  if (pv) pv.onclick = () => { if (trun.i > 0) { trun.i--; saveRun(); renderRunEnd(); } };
  document.getElementById('run-next2').onclick = () => {
    if (trun.i + 1 < n) { trun.i++; saveRun(); renderRunEnd(); }
    else document.getElementById('run-end').click();
  };
  if (trun.sim) {
    if (!trun.sim.deadline) trun.sim.deadline = Date.now() + trun.sim.total * 1000;
    clearInterval(runTimer);
    const tick = () => {
      const el = document.getElementById('sim-clock');
      if (!el) { clearInterval(runTimer); runTimer = null; return; }
      const left = Math.max(0, Math.round((trun.sim.deadline - Date.now()) / 1000));
      el.textContent = `${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
      if (left < 60) el.style.color = 'var(--warn, #e0a030)';
      if (left <= 0) { clearInterval(runTimer); runTimer = null; finishRun(); }
    };
    tick();
    runTimer = setInterval(tick, 1000);
  }
}

let runTimer = null;
let finishingRun = false;
async function finishRun() {
  if (!trun || finishingRun) return;
  finishingRun = true;
  clearInterval(runTimer); runTimer = null;
  if (trun) clearInterval(trun.timerId);
  clearSavedRun();
  if (trun.corr === 'end') {
    trun.answers = trun.list.map(q => ({ question_id: q.id,
      chosen: (trun.resp[q.id] !== undefined ? trun.resp[q.id] : null),
      correct: trun.resp[q.id] === q.correct }));
  }
  const total = trun.answers.length;
  const score = trun.answers.filter(a=>a.correct).length;
  h(shell(`<header class="top rise"><div class="grow"><h1 class="small-h">${esc(trun.bank.bank)}</h1><div class="sub">Guardando resultado...</div></div></header>`)); bindNav();
  let att = null;
  const kind = (trun.bank.bank === 'Repaso de hoy' || trun.review) ? 'review' : (trun.full ? 'full' : 'custom');
  const { data:attData } = await sb.from('test_attempts').insert({ bank:trun.bank.bank, total, score, kind }).select().single();
  att = attData;
  if (att) {
    const rows = trun.answers.map(a=>({ attempt_id:att.id, question_id:a.question_id, chosen:a.chosen, correct:a.correct }));
    if (rows.length) await sb.from('test_answers').insert(rows);
    cache.testAttempts.unshift(att);
    const m = stateByQid();
    const srows = trun.answers.map(a => {
      const cur = m[a.question_id] || {};
      const streak = a.correct ? (cur.streak||0) + 1 : 0;
      return { question_id: a.question_id, bank: trun.bank.bank,
        seen: (cur.seen||0) + 1, ok: (cur.ok||0) + (a.correct ? 1 : 0), fail: (cur.fail||0) + (a.correct ? 0 : 1),
        last_correct: a.correct, streak, due: a.correct ? srsNext(streak) : srsFailDue(),
        updated_at: new Date().toISOString() };
    });
    if (srows.length) {
      await sb.from('test_question_state').upsert(srows, { onConflict: 'question_id' });
      srows.forEach(r => {
        const i = cache.testStates.findIndex(s => s.question_id === r.question_id);
        if (i >= 0) cache.testStates[i] = r; else cache.testStates.push(r);
      });
    }
  }
  if (att) {
    const { data: srow } = await sb.from('test_summaries').insert({ attempt_id: att.id, bank: trun.bank.bank, estado: 'pendiente' }).select().single();
    if (srow) cache.testSummaries.unshift(srow);
  }
  await renderResult(score, total, att);
}

async function renderResult(score, total, att) {
  const saved = !!att;
  const pct = total ? Math.round(100*score/total) : 0;
  const byId = Object.fromEntries(trun.list.map(q=>[q.id,q]));
  const fails = trun.answers.filter(a=>!a.correct);
  const blanks = trun.answers.filter(a => a.chosen === null || a.chosen === undefined).length;
  h(shell(`
  <header class="top rise"><div class="grow"><h1 class="small-h">${esc(trun.bank.bank)}</h1>
  <div class="sub">Resultado del test</div></div></header>
  <div class="card center rise" style="animation-delay:.04s">
    <div style="font-size:38px;font-weight:800">${score}/${total}</div>
    <div class="mt"><span class="pill ${pct>=80?'ok':pct>=50?'acc':'warn'}">${pct}%</span></div>
    <div class="mut small mt">${score} correcta${score===1?'':'s'} · ${fails.length - blanks} fallada${(fails.length-blanks)===1?'':'s'}${blanks ? ' · ' + blanks + ' en blanco' : ''}</div>
    <div class="mut small mt">${saved ? 'Guardado en tu historial' : 'No se pudo guardar en el historial'}</div>
  </div>
  ${att ? `<div class="sec rise" style="animation-delay:.06s"><h2>Resumen del tema</h2></div>
  <div class="card rise" id="resumen-box" style="animation-delay:.07s"><div class="mut small">Helena preparará un resumen del tema completo, con más detalle y ejemplos en lo que has fallado o dejado en blanco, y unas preguntas nuevas de comprobación. Puede tardar hasta unos 30-40 minutos; te avisará cuando esté listo y quedará guardado en la ficha del banco.</div></div>` : ''}
  ${fails.length ? `<div class="sec rise" style="animation-delay:.08s"><h2>Falladas${blanks ? ' y en blanco' : ''} (${fails.length})</h2></div>` +
    fails.map((a,i)=>{ const q = byId[a.question_id]; if(!q) return ''; return `
    <div class="card fail-q rise" style="animation-delay:${.1+i*.03}s">
      <div class="qtext small-q">${esc(q.question)}</div>
      <div class="fail-line bad">${(a.chosen===null||a.chosen===undefined) ? 'Tu respuesta: en blanco' : 'Tu respuesta: ' + esc(q.options[a.chosen])}</div>
      <div class="fail-line good">Correcta: ${esc(q.options[q.correct])}</div>
      ${q.explanation?`<div class="mut small mt">${esc(q.explanation)}</div>`:''}
    </div>`;}).join('') : `<div class="card center rise" style="animation-delay:.08s"><b>¡Pleno!</b><div class="mut small mt">Ningún fallo en este test 🎉</div></div>`}
  ${(() => { const m = {}; cache.testStates.forEach(st => { const x = m[st.bank] = m[st.bank] || { f:0 }; if (st.fail > 0 && !st.last_correct) x.f++; });
    const weak = Object.entries(m).filter(([,x]) => x.f > 0).sort((a,b) => b[1].f - a[1].f).slice(0,3);
    return weak.length ? `<div class="sec rise" style="animation-delay:.12s"><h2>Temas que peor llevas</h2></div>
    <div class="card rise" style="animation-delay:.14s">${weak.map(([b,x]) => `<div class="kz-failrow"><span class="grow">${esc(b)}</span><span class="pill no">${x.f} por dominar</span></div>`).join('')}</div>` : ''; })()}
  <div class="row mt">
    ${fails.length ? `<button class="btn grow" id="res-failed">Repetir ${blanks ? 'falladas y en blanco' : 'falladas'}</button>` : ''}
    <button class="btn primary grow" id="res-back">Volver</button>
  </div>`)); bindNav();
  document.getElementById('res-back').onclick = () => openBank(trun.bank);
  const rf = document.getElementById('res-failed');
  if (rf) rf.onclick = () => startTestRun(trun.bank, { mode: 'lastFailed', corr: 'now' });
  if (att) {
    const { data:sums } = await sb.from('test_summaries').select('*').eq('attempt_id', att.id).order('created_at', { ascending:false }).limit(1);
    const sm = sums && sums[0];
    const box = document.getElementById('resumen-box');
    if (box && sm && sm.estado === 'lista') box.innerHTML = `<div class="lesson-body">${sm.body}</div>`;
  }
}

async function startReviewRun() {
  const ids = cache.testStates.filter(isDue).map(st => st.question_id);
  if (!ids.length) { tab='tests'; render(); return; }
  h(shell(`<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button><div class="grow"><h1 class="small-h">Repasar hoy</h1><div class="sub">Cargando preguntas...</div></div></header>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='tests'; render(); };
  const { data } = await sb.from('test_questions').select('*').in('id', ids);
  if (!data || !data.length) { tab='tests'; render(); return; }
  finishingRun = false;
  trun = { bank:{ bank:'Repaso de hoy', subject:'Repaso' }, list: kzShuffle(data), i:0, answers:[], locked:false, corr:'now', resp:{} };
  saveRun();
  renderRun();
}

/* PRUEBA B (cambio 4): repaso de errores global, sin barajar. */
async function startErrorReview() {
  const ids = cache.testStates.filter(x => x.fail > 0)
    .sort((a,b) => (b.fail-a.fail) || String(b.updated_at||'').localeCompare(String(a.updated_at||'')))
    .map(st => st.question_id);
  if (!ids.length) { tab='tests'; render(); return; }
  h(shell(`<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button><div class="grow"><h1 class="small-h">Repaso de errores</h1><div class="sub">Cargando preguntas...</div></div></header>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='tests'; render(); };
  const all = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await sb.from('test_questions').select('*').in('id', ids.slice(i, i + 200));
    if (data) all.push(...data);
  }
  if (!all.length) { tab='tests'; render(); return; }
  finishingRun = false;
  const orden = new Map(ids.map((id, i) => [id, i]));
  all.sort((a, b) => (orden.get(a.id) ?? 99999) - (orden.get(b.id) ?? 99999));
  trun = { bank:{ bank:'Repaso de errores', subject:'Repaso' }, list: all, i:0, answers:[], locked:false, corr:'now', resp:{}, review:true };
  saveRun();
  renderRun();
}

function openBank(b) {
  h(shell(vTestBank(b))); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='tests'; render(); };
  let prepCount = 25, prepCorr = 'end', prepSim = false;
  app.querySelectorAll('[data-tcount]').forEach(c => c.onclick = () => {
    prepCount = +c.dataset.tcount;
    app.querySelectorAll('[data-tcount]').forEach(x => x.classList.toggle('on', x === c));
  });
  app.querySelectorAll('[data-tcorr]').forEach(c => c.onclick = () => {
    prepCorr = c.dataset.tcorr;
    app.querySelectorAll('[data-tcorr]').forEach(x => x.classList.toggle('on', x === c));
  });
  app.querySelectorAll('[data-ttimer]').forEach(c => c.onclick = () => {
    prepSim = c.dataset.ttimer === 'sim';
    app.querySelectorAll('[data-ttimer]').forEach(x => x.classList.toggle('on', x === c));
  });
  document.getElementById('bt-start').onclick = () => startTestRun(b, { count: prepCount, corr: prepCorr, sim: prepSim });
  const bf = document.getElementById('bt-failed');
  if (bf) bf.onclick = () => startTestRun(b, { mode: 'failed', corr: 'now' });
  app.querySelectorAll('[data-sum]').forEach(x => x.onclick = () => openSummary(+x.dataset.sum, b));
}

function openSummary(id, b) {
  const sm = (cache.testSummaries||[]).find(x => x.id === id);
  if (!sm) return;
  h(shell(`<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
    <div class="grow"><h1 class="small-h">Resumen del tema</h1>
    <div class="sub">${esc(sm.bank)} · ${new Date(sm.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}</div></div></header>
  <div class="card lesson-body rise" style="animation-delay:.05s">${sm.body}</div>`)); bindNav();
  app.querySelector('[data-back]').onclick = () => { if (b) openBank(b); else { tab='tests'; render(); } };
}

/* ---------- Cuenta / Personalización ---------- */
const PERS_ESTADO = { pendiente:['Pendiente','warn'], en_proceso:['En proceso','acc'], aplicada:['Aplicada','ok'], descartada:['Descartada',''] };

function vCuenta() {
  const email = session?.user?.email || '';
  return `<header class="top rise"><button class="icon-btn" data-back>${ic('back',18)}</button>
  <div class="grow"><h1 class="small-h">Cuenta</h1><div class="sub">${esc(email)}</div></div></header>

  <div class="sec rise" style="animation-delay:.04s"><h2>Personalización</h2></div>
  <div class="card rise" style="animation-delay:.06s">
    <div class="mut small" style="margin-bottom:10px">Pide cómo quieres tu Sala: escribe una petición o sube una imagen de referencia. Helena la revisa periódicamente, te propone el cambio y, solo si lo apruebas, lo aplica. Nada cambia sin tu OK.</div>
    <textarea id="pers-text" placeholder="Ej.: quiero un fondo con los barcos de mi anime favorito, tonos oscuros..." style="min-height:90px"></textarea>
    <div style="display:flex;gap:8px">
      <button class="btn primary grow" id="pers-send">${ic('check',16,2.2)} Enviar petición</button>
      <button class="btn" id="pers-img-btn">${ic('plus',16,2)} Imagen</button>
      <input type="file" id="pers-file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden">
    </div>
    <div id="pers-upmsg" class="mut small" style="margin-top:6px"></div>
  </div>

  ${cache.pers.length ? cache.pers.map((p,i) => {
    const [lab, cls] = PERS_ESTADO[p.estado] || [p.estado, ''];
    const cuando = new Date(p.created_at).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
    return `<div class="card rise" style="animation-delay:${.08+i*.04}s">
      <div class="row" style="align-items:flex-start">
        ${p.tipo==='imagen' && persSigned[p.imagen_path]
          ? `<img src="${persSigned[p.imagen_path]}" alt="referencia" style="width:56px;height:56px;object-fit:cover;border-radius:12px;flex:none">`
          : `<span class="link-ic" style="width:40px;height:40px">${ic(p.tipo==='imagen'?'sparkle':'note',17)}</span>`}
        <div class="grow">
          <b style="font-size:14px">${p.tipo==='imagen' ? 'Imagen de referencia' : esc(p.texto||'')}</b>
          <div class="mut small">${cuando}${p.activa?' · referencia activa':''}${p.nota?' · '+esc(p.nota):''}</div>
        </div>
        <span class="pill ${cls}">${lab}</span>
      </div>
      <div class="row" style="margin-top:10px;gap:8px">
        ${p.activa ? '' : `<button class="btn ghost" data-pers-activa="${p.id}">Usar esta referencia</button>`}
        <button class="btn danger-ghost" data-pers-del="${p.id}" style="margin-left:auto">${ic('trash',15)}</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Aún no has pedido ninguna personalización.</div>'}

  <div class="sec rise" style="animation-delay:.1s"><h2>Info</h2></div>
  <div class="card rise" style="animation-delay:.12s">
    <div class="row"><b class="grow" style="font-size:14px">Mi Sala</b><span class="pill acc">V1.0.1</span></div>
    <div class="mut small" style="margin-top:6px">Tus peticiones e imágenes son privadas: las ves tú y Helena, tu asistente, y solo se usan para personalizar tu Sala.</div>
  </div>`;
}

function openCuenta() {
  h(shell(vCuenta())); bindNav();
  app.querySelector('[data-back]').onclick = () => { tab='hoy'; render(); };
  document.getElementById('pers-send').onclick = async () => {
    const ta = document.getElementById('pers-text');
    const texto = ta.value.trim();
    if (!texto) return;
    const msg = document.getElementById('pers-upmsg');
    const { data, error } = await sb.from('personalizacion').insert({ tipo:'prompt', texto }).select().single();
    if (error || !data) { msg.textContent = 'No se pudo guardar la petición. Inténtalo de nuevo.'; return; }
    cache.pers.unshift(data); ta.value=''; msg.textContent=''; openCuenta();
  };
  const fileInp = document.getElementById('pers-file');
  document.getElementById('pers-img-btn').onclick = () => fileInp.click();
  fileInp.onchange = async () => {
    const f = fileInp.files && fileInp.files[0];
    if (!f) return;
    const msg = document.getElementById('pers-upmsg');
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(f.type)) { msg.textContent = 'Solo se admiten imágenes PNG, JPG, WebP o GIF.'; fileInp.value=''; return; }
    if (f.size > 5*1024*1024) { msg.textContent = 'La imagen pesa más de 5 MB. Prueba con una más ligera.'; fileInp.value=''; return; }
    msg.textContent = 'Subiendo imagen...';
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-60);
    const path = session.user.id + '/' + Date.now() + '-' + safe;
    const { error: upErr } = await sb.storage.from('personalizacion').upload(path, f, { cacheControl:'3600', upsert:false });
    if (upErr) { msg.textContent = 'No se pudo subir la imagen.'; fileInp.value=''; return; }
    const { data, error: insErr } = await sb.from('personalizacion').insert({ tipo:'imagen', imagen_path:path, texto:f.name }).select().single();
    if (insErr || !data) {
      const { error: rmErr } = await sb.storage.from('personalizacion').remove([path]);
      msg.textContent = rmErr
        ? 'No se pudo registrar la imagen y tampoco limpiar el archivo subido. Avisa a Helena para revisarlo.'
        : 'No se pudo registrar la imagen. Inténtalo de nuevo.';
      fileInp.value=''; return;
    }
    cache.pers.unshift(data);
    const { data: su } = await sb.storage.from('personalizacion').createSignedUrl(path, 3600);
    if (su && su.signedUrl) persSigned[path] = su.signedUrl;
    msg.textContent = ''; fileInp.value='';
    openCuenta();
  };
  app.querySelectorAll('[data-pers-activa]').forEach(b => b.onclick = async () => {
    const id = b.dataset.persActiva;
    const { error: e1 } = await sb.from('personalizacion').update({ activa:false, updated_at:new Date().toISOString() }).eq('activa', true);
    const { error: e2 } = await sb.from('personalizacion').update({ activa:true, updated_at:new Date().toISOString() }).eq('id', id);
    if (e1 || e2) { alert('No se pudo marcar la referencia. Inténtalo de nuevo.'); return; }
    cache.pers.forEach(p => p.activa = (p.id===id));
    openCuenta();
  });
  app.querySelectorAll('[data-pers-del]').forEach(b => b.onclick = async () => {
    if (!confirm('¿Borrar esta petición?')) return;
    const id = b.dataset.persDel;
    const p = cache.pers.find(x=>x.id===id);
    if (p && p.imagen_path) {
      const { error: rmErr } = await sb.storage.from('personalizacion').remove([p.imagen_path]);
      if (rmErr) { alert('No se pudo borrar la imagen del almacenamiento; la petición sigue ahí para reintentar.'); return; }
    }
    const { error: delErr } = await sb.from('personalizacion').delete().eq('id', id);
    if (delErr) { alert('No se pudo borrar la petición. Inténtalo de nuevo.'); return; }
    cache.pers = cache.pers.filter(x=>x.id!==id);
    delete persSigned[p && p.imagen_path];
    openCuenta();
  });
}

/* ---------- Lógica ---------- */

async function render() {
  if (tab==='lesson') return;
  let content = '';
  if (tab==='hoy') content = vHoy();
  else if (tab==='agenda') content = vAgenda();
  else if (tab==='tareas') content = vTareas();
  else if (tab==='apuntes') content = vApuntes();
  else if (tab==='estudios') content = vEstudios();
  else if (tab==='tests') content = vTests();
  else if (tab==='idiomas') content = vIdiomas();
  else if (tab==='cuenta') return openCuenta();
  h(shell(content)); bindNav(); bindActions(); bindAgenda();
  app.querySelector('main').scrollTop = 0;
}

function bindActions() {
  app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { tab=b.dataset.go; render(); });
  const out = document.getElementById('btn-out');
  if (out) out.onclick = async () => { await sb.auth.signOut(); };
  const cta = document.getElementById('btn-cuenta');
  if (cta) cta.onclick = () => { tab='cuenta'; render(); };
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
  app.querySelectorAll('[data-kana]').forEach(b => b.onclick = openKana);
  app.querySelectorAll('[data-bank]').forEach(b => b.onclick = () => openBank(BANKS.find(x=>x.bank===b.dataset.bank)));
  const tsr = document.getElementById('ts-review');
  if (tsr) tsr.onclick = () => startReviewRun();
  const tse = document.getElementById('ts-errors');
  if (tse) tse.onclick = () => startErrorReview();
  const tsResume = document.getElementById('ts-resume');
  if (tsResume) tsResume.onclick = () => { const r = loadSavedRun(); if (r) restoreRun(r); };
  const tsDiscard = document.getElementById('ts-discard');
  if (tsDiscard) tsDiscard.onclick = () => { if (confirm('¿Descartar el test a medias? Se perderán las respuestas no corregidas.')) { clearSavedRun(); render(); } };
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
  const listen = document.getElementById('les-listen');
  if (listen) listen.onclick = () => {
    const lang = l.lang === 'ja' ? 'ja-JP' : 'en-US';
    const note = document.getElementById('les-listen-note');
    if (!voiceFor(lang.slice(0,2))) {
      if (note) note.textContent = 'Este navegador no tiene voz ' + (l.lang==='ja'?'japonesa':'inglesa') + ' instalada; sin ella no puede sonar. Suele venir con el sistema del móvil.';
      return;
    }
    const parts = [...app.querySelectorAll('.lesson-body .jp')].map(x => x.textContent.trim()).filter(Boolean);
    if (!parts.length) return;
    listen.disabled = true;
    speakText(parts.join('. '), lang);
    setTimeout(() => { listen.disabled = false; }, 2500);
  };
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
    const nx = nextFor(l.lang);
    document.getElementById('quiz-out').innerHTML =
      `<div class="card center mt"><div style="font-size:30px;font-weight:800">${score}/${quiz.length}</div><div class="mut small">${score===quiz.length?'¡Perfecto! 🎉':'Repasa los fallos arriba y mañana seguimos 💪'}</div></div>` +
      (nx ? `<button class="btn primary block" id="quiz-next" style="margin-top:10px">Siguiente sesión: ${esc(nx.lesson.title)}</button>`
          : `<div class="card center mt"><div class="mut small">Tanda completada. Helena prepara la siguiente tanda y aparecerá aquí cuando esté lista.</div></div>`);
    const qn = document.getElementById('quiz-next');
    if (qn) qn.onclick = () => openLesson(nx.lesson);
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
    if (session) { await loadAll(); const sr = loadSavedRun(); if (sr) { if (!trun) restoreRun(sr); } else { tab='hoy'; render(); } }
    else renderLogin();
  });
  const { data } = await sb.auth.getSession();
  if (!data.session) renderLogin();
}

boot();
