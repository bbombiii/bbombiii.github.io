/* PRUEBA SEI 2.0 — MODO DEMO AISLADO.
   Garantías de aislamiento (esta carpeta /prueba-sei20b/ únicamente):
   1) DATOS FICTICIOS: toda petición a Supabase (REST, Auth, Storage, RPC) se
      intercepta aquí y se responde con datos de demostración en memoria.
      Ninguna petición sale hacia la base de datos real, ni de lectura ni de
      escritura.
   2) ALMACENAMIENTO PROPIO: todo localStorage de esta prueba lleva el prefijo
      'pz2b:', así que no lee ni escribe ninguna clave de la Sala real (ni
      sesiones, ni tests a medias, ni preferencias).
   3) SESIÓN SIMULADA: no pide la contraseña real; cualquier email/contraseña
      entra, y "Cerrar sesión" solo borra la sesión ficticia.
   Los cambios hechos dentro de la demo viven solo en memoria: al recargar,
   la demo vuelve a su estado inicial. La Sala real queda intacta. */
(function () {
  'use strict';
  if (!location.pathname.startsWith('/prueba-sei20b')) return;

  var PREF = 'pz2b:';

  /* ---------- 1) localStorage con prefijo ---------- */
  var _get = Storage.prototype.getItem;
  var _set = Storage.prototype.setItem;
  var _rm = Storage.prototype.removeItem;
  var _clear = Storage.prototype.clear;
  Storage.prototype.getItem = function (k) { return _get.call(this, PREF + k); };
  Storage.prototype.setItem = function (k, v) { return _set.call(this, PREF + k, String(v)); };
  Storage.prototype.removeItem = function (k) { return _rm.call(this, PREF + k); };
  Storage.prototype.clear = function () {
    var doomed = [];
    for (var i = 0; i < this.length; i++) {
      var k = this.key(i);
      if (k && k.indexOf(PREF) === 0) doomed.push(k);
    }
    doomed.forEach(function (k) { _rm.call(this, k); }, this);
  };

  /* ---------- 2) sesión simulada (sin contraseña real) ---------- */
  var nowSec = Math.floor(Date.now() / 1000);
  var DEMO_USER = {
    id: 'demo-user-0000-0000-0000-000000000000',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo@sala-prueba.local',
    email_confirmed_at: new Date().toISOString(),
    user_metadata: {},
    app_metadata: {},
    created_at: new Date().toISOString()
  };
  function demoSession() {
    return {
      access_token: 'demo-token-no-valido-fuera-de-la-prueba',
      refresh_token: 'demo-refresh',
      token_type: 'bearer',
      expires_in: 315360000,
      expires_at: nowSec + 315360000,
      user: DEMO_USER
    };
  }
  localStorage.setItem('sb-xwrrvumvbwvmtegrynmu-auth-token', JSON.stringify(demoSession()));

  /* ---------- 3) datos ficticios ---------- */
  function isoDaysAgo(n, h) { var d = new Date(); d.setDate(d.getDate() - n); d.setHours(h || 10, 0, 0, 0); return d.toISOString(); }
  function isoDaysAhead(n, h) { return isoDaysAgo(-n, h); }
  function dayStrAhead(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function atTime(daysAhead, h, m) { var d = new Date(); d.setDate(d.getDate() + daysAhead); d.setHours(h, m || 0, 0, 0); return d.toISOString(); }

  var DB = {};
  DB.tasks = [
    { id: 'demo-t1', title: 'Tarea de ejemplo pendiente', area: 'estudio', done: false, created_at: isoDaysAgo(1, 9) },
    { id: 'demo-t2', title: 'Otra tarea de demostración', area: 'personal', done: false, created_at: isoDaysAgo(2, 9) },
    { id: 'demo-t3', title: 'Tarea ya completada (demo)', area: 'estudio', done: true, created_at: isoDaysAgo(3, 9) }
  ];
  DB.notes = [
    { id: 'demo-n1', title: 'Nota de ejemplo', body: 'Contenido ficticio para la prueba SEI 2.0.', tags: 'demo', updated_at: isoDaysAgo(1, 11) }
  ];
  DB.topics = [
    { id: 'demo-m1', module: 'SOR', title: 'Tema de ejemplo 1', url: null, done: false, ord: 1 },
    { id: 'demo-m2', module: 'SOR', title: 'Tema de ejemplo 2', url: null, done: true, ord: 2 }
  ];
  DB.lessons = [
    { id: 'demo-l-en-1', lang: 'en', day: 1, title: 'Sesión de demostración 1', body: 'Contenido ficticio de la lección para la prueba.', quiz: [{ q: 'Pregunta de ejemplo 1', opts: ['Respuesta correcta', 'Otra opción'], a: 0 }, { q: 'Pregunta de ejemplo 2', opts: ['Otra opción', 'Respuesta correcta'], a: 1 }], video_url: null },
    { id: 'demo-l-en-2', lang: 'en', day: 2, title: 'Sesión de demostración 2', body: 'Contenido ficticio de la lección para la prueba.', quiz: [{ q: 'Pregunta de ejemplo', opts: ['Respuesta correcta', 'Otra opción'], a: 0 }], video_url: null },
    { id: 'demo-l-en-3', lang: 'en', day: 3, title: 'Sesión de demostración 3', body: 'Contenido ficticio de la lección para la prueba.', quiz: [{ q: 'Pregunta de ejemplo', opts: ['Respuesta correcta', 'Otra opción'], a: 0 }], video_url: null },
    { id: 'demo-l-ja-1', lang: 'ja', day: 1, title: 'Sesión de demostración 1 (ja)', body: 'Contenido ficticio de la lección para la prueba.', quiz: [{ q: 'Pregunta de ejemplo', opts: ['Respuesta correcta', 'Otra opción'], a: 0 }], video_url: null },
    { id: 'demo-l-ja-2', lang: 'ja', day: 2, title: 'Sesión de demostración 2 (ja)', body: 'Contenido ficticio de la lección para la prueba.', quiz: [{ q: 'Pregunta de ejemplo', opts: ['Respuesta correcta', 'Otra opción'], a: 0 }], video_url: null }
  ];
  DB.quiz_results = [
    { id: 'demo-qr1', lesson_id: 'demo-l-en-1', score: 2, total: 2, created_at: isoDaysAgo(1, 18) },
    { id: 'demo-qr2', lesson_id: 'demo-l-ja-1', score: 1, total: 1, created_at: isoDaysAgo(2, 18) }
  ];
  DB.resources = [];
  DB.kana_stats = [];
  DB.agenda_hidden = [];
  DB.agenda_cal_hidden = [];
  DB.personalizacion = [
    { id: 'demo-p1', user_id: DEMO_USER.id, tipo: 'prompt', texto: 'Ejemplo de petición de personalización (demo)', imagen_path: null, activa: false, estado: 'aplicada', nota: null, created_at: isoDaysAgo(5, 12) }
  ];

  // Bancos de preguntas ficticios
  var qidCounter = 0;
  DB.test_questions = [];
  ['SOR RA1|SOR|60', 'SOR RA2|SOR|40', 'Servicios RA1|Servicios|50'].forEach(function (spec) {
    var parts = spec.split('|'), bank = parts[0], subject = parts[1], n = parseInt(parts[2], 10);
    for (var i = 1; i <= n; i++) {
      qidCounter++;
      DB.test_questions.push({
        id: qidCounter, bank: bank, subject: subject, ord: i,
        qid: 'DEMO-' + bank.replace(/\s/g, '') + '-' + i,
        question: 'Pregunta de demostración ' + i + ' del banco ' + bank + '. Enunciado ficticio para probar la versión de prueba.',
        options: ['Opción A de ejemplo', 'Opción B de ejemplo', 'Opción C de ejemplo', 'Opción D de ejemplo'],
        correct: i % 4,
        explanation: 'Explicación ficticia: es una pregunta de demostración, no forma parte de ningún temario.',
        complementary: false
      });
    }
  });

  DB.test_attempts = [
    { id: 1, bank: 'SOR RA1', total: 100, score: 72, kind: 'full', created_at: isoDaysAgo(1, 19) },
    { id: 2, bank: 'SOR RA1', total: 25, score: 20, kind: 'custom', created_at: isoDaysAgo(2, 19) },
    { id: 3, bank: 'Servicios RA1', total: 100, score: 65, kind: 'full', created_at: isoDaysAgo(3, 12) }
  ];
  DB.test_answers = [];
  DB.test_summaries = [
    { id: 1, attempt_id: 1, bank: 'SOR RA1', estado: 'lista', body: '<p>Resumen de demostración: este texto es ficticio y sirve para ver cómo se muestra un resumen listo en la prueba.</p>', created_at: isoDaysAgo(1, 20) }
  ];

  // Estado por pregunta: mezcla de dominadas y falladas (para racha, repaso y errores)
  DB.test_question_state = [];
  var failsDemo = [4, 3, 3, 2, 2, 2, 1, 1];
  for (var q = 1; q <= 45; q++) {
    if (q <= 30) {
      DB.test_question_state.push({ question_id: q, bank: 'SOR RA1', ok: 3, fail: 0, last_correct: true, streak: 2, due: dayStrAhead(5), updated_at: isoDaysAgo(1, 19) });
    } else if (q <= 38) {
      DB.test_question_state.push({ question_id: q, bank: 'SOR RA1', ok: 1, fail: failsDemo[q - 31], last_correct: false, streak: 0, due: dayStrAhead(0), updated_at: isoDaysAgo(1, 19) });
    } else {
      DB.test_question_state.push({ question_id: q, bank: 'SOR RA1', ok: 2, fail: 0, last_correct: true, streak: 1, due: dayStrAhead(1), updated_at: isoDaysAgo(2, 19) });
    }
  }

  // Calendario ficticio (la agenda real pasa por una RPC; aquí se simula)
  var DEMO_CAL = { id: 'demo-cal', summary: 'Calendario de ejemplo', backgroundColor: '#7aa2ff', primary: true };
  function demoEvents() {
    return [
      { id: 'demo-ev1', summary: 'Clase de ejemplo (demo)', start: { dateTime: atTime(0, 18, 0) }, end: { dateTime: atTime(0, 19, 0) } },
      { id: 'demo-ev2', summary: 'Entrega de práctica (demo)', start: { dateTime: atTime(1, 10, 0) }, end: { dateTime: atTime(1, 11, 0) } }
    ];
  }

  /* ---------- 4) motor de consultas ficticio (mini-PostgREST) ---------- */
  function coerce(v) {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null') return null;
    return v;
  }
  function match(row, col, expr) {
    var dot = expr.indexOf('.');
    var op = expr.slice(0, dot), raw = expr.slice(dot + 1);
    var val = row[col];
    if (op === 'is') return (raw === 'null') ? (val === null || val === undefined) : (val === coerce(raw));
    if (op === 'in') {
      var list = raw.replace(/^\(|\)$/g, '').split(',').map(coerce);
      return list.some(function (x) { return String(x) === String(val); });
    }
    var want = coerce(raw);
    var a = (val === null || val === undefined) ? '' : String(val);
    var b = (want === null || want === undefined) ? '' : String(want);
    var an = Number(a), bn = Number(b), bothNum = (a !== '' && b !== '' && !isNaN(an) && !isNaN(bn));
    switch (op) {
      case 'eq': return a === b;
      case 'neq': return a !== b;
      case 'gt': return bothNum ? an > bn : a > b;
      case 'gte': return bothNum ? an >= bn : a >= b;
      case 'lt': return bothNum ? an < bn : a < b;
      case 'lte': return bothNum ? an <= bn : a <= b;
      default: return true;
    }
  }
  function queryTable(table, u) {
    var rows = (DB[table] || []).slice();
    u.searchParams.forEach(function (v, k) {
      if (['select', 'order', 'limit', 'offset'].indexOf(k) !== -1) return;
      rows = rows.filter(function (r) { return match(r, k, v); });
    });
    var order = u.searchParams.get('order');
    if (order) {
      order.split(',').forEach(function (spec) {
        var p = spec.split('.'), col = p[0], dir = p[1] === 'desc' ? -1 : 1;
        rows.sort(function (x, y) { return String(x[col] || '') < String(y[col] || '') ? -1 * dir : String(x[col] || '') > String(y[col] || '') ? 1 * dir : 0; });
      });
    }
    var offset = parseInt(u.searchParams.get('offset') || '0', 10);
    var limit = u.searchParams.get('limit');
    var total = rows.length;
    rows = rows.slice(offset, limit ? offset + parseInt(limit, 10) : undefined);
    return { rows: rows, total: total, offset: offset };
  }

  var idSeq = 9000;
  function jsonResp(obj, status, extraHeaders) {
    var h = { 'Content-Type': 'application/json' };
    if (extraHeaders) Object.keys(extraHeaders).forEach(function (k) { h[k] = extraHeaders[k]; });
    return new Response(obj === null ? null : JSON.stringify(obj), { status: status || 200, headers: h });
  }
  function headerVal(input, init, name) {
    var h = (init && init.headers) || (input && input.headers) || {};
    if (h && typeof h.get === 'function') return h.get(name) || '';
    var out = '';
    Object.keys(h).forEach(function (k) { if (k.toLowerCase() === name.toLowerCase()) out = h[k]; });
    return out;
  }
  function wantsObject(input, init) {
    return headerVal(input, init, 'accept').indexOf('vnd.pgrst.object+json') !== -1;
  }

  function handleRest(table, u, method, input, init) {
    if (method === 'GET' || method === 'HEAD') {
      var res = queryTable(table, u);
      if (method === 'HEAD') {
        return new Response(null, { status: 200, headers: { 'Content-Range': '*/' + res.total, 'Content-Type': 'application/json' } });
      }
      var headers = { 'Content-Range': res.offset + '-' + Math.max(res.offset + res.rows.length - 1, 0) + '/' + res.total };
      if (wantsObject(input, init)) return jsonResp(res.rows[0] || null, res.rows.length === 1 ? 200 : 406, headers);
      return jsonResp(res.rows, 200, headers);
    }
    // Escrituras: se aceptan SOLO en memoria ficticia; jamás salen de este navegador.
    var tableRows = DB[table] || (DB[table] = []);
    if (method === 'POST') {
      return (init && init.body ? Promise.resolve(typeof init.body === 'string' ? init.body : new Response(init.body).text()) : Promise.resolve('[]')).then(function (txt) {
        var body;
        try { body = JSON.parse(txt || '[]'); } catch (e) { body = []; }
        var arr = Array.isArray(body) ? body : [body];
        var inserted = arr.map(function (row) {
          var r = Object.assign({}, row);
          if (!r.id) r.id = (table === 'tasks' || table === 'notes' || table === 'topics' || table === 'lessons' || table === 'personalizacion') ? 'demo-' + (++idSeq) : (++idSeq);
          if (!r.created_at) r.created_at = new Date().toISOString();
          tableRows.push(r);
          return r;
        });
        if (wantsObject(input, init)) return jsonResp(inserted[0] || {}, 201);
        return jsonResp(inserted, 201);
      });
    }
    if (method === 'PATCH') {
      var p = (init && init.body) || '{}';
      return Promise.resolve(typeof p === 'string' ? p : new Response(p).text()).then(function (txt) {
        var body; try { body = JSON.parse(txt); } catch (e) { body = {}; }
        tableRows.forEach(function (r) {
          var ok = true;
          u.searchParams.forEach(function (v, k) { if (['select', 'order', 'limit', 'offset'].indexOf(k) === -1 && !match(r, k, v)) ok = false; });
          if (ok) Object.assign(r, body);
        });
        return new Response(null, { status: 204 });
      });
    }
    if (method === 'DELETE') {
      var kept = tableRows.filter(function (r) {
        var ok = true;
        u.searchParams.forEach(function (v, k) { if (['select', 'order', 'limit', 'offset'].indexOf(k) === -1 && !match(r, k, v)) ok = false; });
        return !ok;
      });
      DB[table] = kept;
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return jsonResp({ message: 'demo' }, 405);
  }

  function handleRpc(fnName, init) {
    var empty = Promise.resolve('{}');
    var txt = (init && init.body) ? (typeof init.body === 'string' ? Promise.resolve(init.body) : new Response(init.body).text()) : empty;
    return txt.then(function (t) {
      var body; try { body = JSON.parse(t); } catch (e) { body = {}; }
      var action = body.action, payload = body.payload || {};
      if (fnName !== 'calendar_api') return jsonResp({ data: null });
      switch (action) {
        case 'list_calendars': return jsonResp({ items: [DEMO_CAL] });
        case 'list_events': return jsonResp({ items: demoEvents() });
        case 'create_event': return jsonResp(Object.assign({ id: 'demo-ev-' + (++idSeq) }, payload.event || {}));
        case 'update_event': return jsonResp(Object.assign({ id: payload.eventId || ('demo-ev-' + (++idSeq)) }, payload.event || {}));
        case 'delete_event': return jsonResp({ ok: true });
        case 'disconnect': return jsonResp({ ok: true });
        default: return jsonResp({ error: 'calendar_no_conectado' });
      }
    });
  }

  /* ---------- 5) interceptación total de red hacia Supabase ---------- */
  var REAL_HOST = 'https://xwrrvumvbwvmtegrynmu.supabase.co/';
  var _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf(REAL_HOST) !== 0) return _fetch(input, init);
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var u;
    try { u = new URL(url); } catch (e) { return Promise.resolve(jsonResp({ message: 'demo: url inválida' }, 400)); }
    var path = u.pathname;
    if (path.indexOf('/auth/v1/') === 0) {
      if (path.indexOf('/auth/v1/token') === 0) return Promise.resolve(jsonResp(demoSession(), 200));
      if (path.indexOf('/auth/v1/user') === 0) return Promise.resolve(jsonResp(DEMO_USER, 200));
      if (path.indexOf('/auth/v1/logout') === 0) return Promise.resolve(new Response(null, { status: 204 }));
      return Promise.resolve(jsonResp({}, 200));
    }
    if (path.indexOf('/rest/v1/rpc/') === 0) {
      return handleRpc(path.slice('/rest/v1/rpc/'.length), init);
    }
    if (path.indexOf('/rest/v1/') === 0) {
      var table = path.slice('/rest/v1/'.length).split('/')[0];
      return handleRest(table, u, method, input, init);
    }
    if (path.indexOf('/storage/v1/') === 0) {
      return Promise.resolve(jsonResp({ statusCode: '404', error: 'not_found', message: 'La demo no usa archivos reales.' }, 404));
    }
    return Promise.resolve(jsonResp({ message: 'demo: endpoint no usado por la app' }, 404));
  };
})();
