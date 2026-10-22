-- Contenido inicial de la Sala Personal
insert into topics (module,title,url,ord) values
 ('MP07','Leer el libro de MP07 (PDF de 218 páginas en el campus)','https://account.ilerna.com',1),
 ('MP07','Ver las videotutorías de MP07 (grabaciones Zoom ~1h)','https://account.ilerna.com',2),
 ('MP04','Explorar el contenido de MP04 en el campus','https://account.ilerna.com',1),
 ('MP04','Ver las videotutorías de MP04','https://account.ilerna.com',2),
 ('MP14','Explorar el contenido de MP14 en el campus (PAC2 del CV ya entregada ✔)','https://account.ilerna.com',1),
 ('MP14','Preparar el examen de MP14','https://account.ilerna.com',2);

insert into lessons (lang,day,title,body,quiz,video_url) values
 ('ja',1,'Hiragana 1: vocales y fila K',
  '<p class="jp">あ a · い i · う u · え e · お o<br>か ka · き ki · く ku · け ke · こ ko</p><p class="mt">Trucos: あ parece una "a" con lazo. い son dos palitos. う es una "u" inclinada. え es una "e" con cola. お es una "o" con gancho. か = un gato que araña (ka). き parece una llave (key, ki). く es un pico de pájaro (ku). こ son dos rayas, como una boca (ko).</p><p class="mt">Ya puedes leer palabras: あい (ai, amor), いえ (ie, casa), うえ (ue, arriba), かお (kao, cara), こえ (koe, voz).</p>',
  '[{"q":"¿Qué sonido es あ?","opts":["a","i","o"],"a":0},{"q":"¿Qué sonido es き?","opts":["ka","ki","ku"],"a":1},{"q":"¿Qué significa こえ (koe)?","opts":["casa","voz","amor"],"a":1}]',
  'https://www.youtube.com/watch?v=wKjCl_Tx_uQ'),
 ('en',1,'Inglés 1: presentarte sin trabarte',
  '<p>Tres frases para soltar de memoria:</p><p class="mt"><b>Hi, I''m Samuel.</b> (Hola, soy Samuel)<br><b>I''m from Madrid, Spain.</b> (Soy de Madrid)<br><b>I work in digital marketing.</b> (Trabajo en marketing digital)</p><p class="mt">Truco: no traduzcas en tu cabeza. Di la frase entera de golpe 5 veces en voz alta.</p>',
  '[{"q":"¿Cómo se dice ''Soy de Madrid''?","opts":["I''m from Madrid","I live Madrid","I am Madrid"],"a":0},{"q":"¿Qué significa ''I work in digital marketing''?","opts":["Trabajo en marketing digital","Estudio marketing","Quiero trabajar en marketing"],"a":0},{"q":"Completa: ''___ Samuel.'' (presentándote)","opts":["I''m","I is","I are"],"a":0}]',
  null);

insert into resources (section,title,url,note,ord) values
 ('idiomas','Vídeo: cómo aprender hiragana y katakana (método, en español)','https://www.youtube.com/watch?v=wKjCl_Tx_uQ','El que te pasé el 20 oct. Empieza por aquí.',1),
 ('idiomas','Vídeo 2: hiragana explicado','https://www.youtube.com/watch?v=0H6JZ2g8hIE','Refuerzo de la sesión 1.',2),
 ('idiomas','Plan completo de idiomas (Google Doc)','https://docs.google.com/document/d/1ihqGVvmCFMdgmPOf6mMeTfIqT89KIHIW40LC62czgrA','Nivel, objetivos a 3 y 6 meses y rutina de ~25 min al día.',3),
 ('idiomas','ConversationExchange','https://www.conversationexchange.com/','Llamadas gratis con gente que aprende español (tú les das español, ellos inglés/japonés).',4),
 ('estudios','Campus Ilerna','https://account.ilerna.com','Libros, videotutorías y entregas.','1');
