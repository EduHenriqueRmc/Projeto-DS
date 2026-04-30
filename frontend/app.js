const API = 'http://localhost:5000/api';

/* ─────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────── */
const pageTitles = {
  dashboard:  'Dashboard',
  chat:       'AI Assistant',
  flashcards: 'Flashcards',
};

function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tab}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = pageTitles[tab] || tab;

  if (tab === 'dashboard') loadDashboard();
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
    closeSidebar();
  });
});

/* ─────────────────────────────────────────────────────
   MOBILE SIDEBAR
───────────────────────────────────────────────────── */
const sidebar  = document.querySelector('.sidebar');
const overlay  = document.getElementById('sidebarOverlay');
const hamburger = document.getElementById('hamburger');

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

hamburger?.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
});

overlay?.addEventListener('click', closeSidebar);

/* ─────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────── */
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 2800);
}

/* ─────────────────────────────────────────────────────
   CHAT
───────────────────────────────────────────────────── */
function appendMsg(text, role) {
  const win = document.getElementById('chatWindow');
  document.getElementById('chatEmpty')?.remove();

  const row = document.createElement('div');
  row.className = `msg-row ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${role}`;
  avatar.textContent = role === 'ai' ? 'AI' : 'Eu';

  const bubble = document.createElement('div');
  bubble.className = `msg ${role === 'thinking' ? 'thinking' : role}`;

  if (role === 'thinking') {
    bubble.innerHTML = `<span class="typing-dots"><span></span><span></span><span></span></span>`;
    avatar.textContent = 'AI';
    avatar.className = 'msg-avatar ai';
  } else {
    bubble.textContent = text;
  }

  // user: avatar after bubble; ai: avatar before
  if (role === 'user') {
    row.appendChild(bubble);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(bubble);
  }

  win.appendChild(row);
  win.scrollTop = win.scrollHeight;
  return row;
}

async function sendChat(messageOverride) {
  const input = document.getElementById('chatInput');
  const btn   = document.getElementById('chatBtn');
  const msg   = messageOverride || input.value.trim();
  if (!msg) return;

  appendMsg(msg, 'user');
  input.value = '';
  btn.disabled = true;

  addActivity('Pergunta ao AI Assistant', 'blue');

  const thinkingRow = appendMsg('', 'thinking');

  try {
    const res  = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });
    const data = await res.json();
    thinkingRow.remove();
    appendMsg(data.reply || ('Erro: ' + (data.error || 'resposta inválida')), 'ai');
  } catch {
    thinkingRow.remove();
    appendMsg('Não foi possível conectar ao servidor.', 'ai');
    showToast('Sem conexão com o servidor.', 'err');
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

document.getElementById('chatBtn')?.addEventListener('click', () => sendChat());
document.getElementById('chatInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) sendChat();
});

// Suggestion chips
document.querySelectorAll('.suggestion-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    switchTab('chat');
    sendChat(chip.dataset.q);
  });
});

// Clear chat
document.getElementById('clearChatBtn')?.addEventListener('click', () => {
  const win = document.getElementById('chatWindow');
  win.innerHTML = '';
  win.insertAdjacentHTML('beforeend', `
    <div class="chat-empty" id="chatEmpty">
      <div class="chat-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <strong>Como posso te ajudar?</strong>
      <span>Faça qualquer pergunta sobre seus estudos</span>
      <div class="suggestions">
        <button class="suggestion-chip" data-q="O que é uma derivada?">O que é uma derivada?</button>
        <button class="suggestion-chip" data-q="Explique a Lei de Newton">Lei de Newton</button>
        <button class="suggestion-chip" data-q="O que foi a Revolução Francesa?">Revolução Francesa</button>
      </div>
    </div>
  `);
  // re-bind chips
  win.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => sendChat(chip.dataset.q));
  });
});

/* ─────────────────────────────────────────────────────
   FLASHCARDS
───────────────────────────────────────────────────── */
async function generateFlashcards() {
  const title   = document.getElementById('fcTitle').value.trim();
  const content = document.getElementById('fcContent').value.trim();
  const btn     = document.getElementById('fcBtn');
  const grid    = document.getElementById('cardsGrid');

  if (!content) { showToast('Insira o conteúdo base.', 'err'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Gerando...';
  grid.innerHTML = '';

  try {
    const res  = await fetch(`${API}/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'Baralho', content }),
    });
    const data = await res.json();

    if (data.flashcards && Array.isArray(data.flashcards)) {
      document.getElementById('fcPlaceholder')?.remove();

      data.flashcards.forEach((card, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'fc-wrapper';
        wrapper.style.animationDelay = `${i * 60}ms`;

        const fc = document.createElement('div');
        fc.className = 'flashcard';
        fc.innerHTML = `
          <div class="card-face card-front">
            <span class="card-label">Pergunta</span>
            <div class="card-text">${card.pergunta}</div>
            <div class="card-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
              Clique para ver a resposta
            </div>
          </div>
          <div class="card-face card-back">
            <span class="card-label">Resposta</span>
            <div class="card-text">${card.resposta}</div>
            <div class="card-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
              Clique para ocultar
            </div>
          </div>
        `;

        fc.addEventListener('click', () => fc.classList.toggle('flipped'));
        wrapper.appendChild(fc);
        grid.appendChild(wrapper);
      });

      addActivity(`Baralho "${title || 'Baralho'}" criado`, 'purple');
      showToast(`${data.flashcards.length} flashcards gerados! 🎉`);
    } else {
      showToast('Erro ao gerar flashcards.', 'err');
    }
  } catch {
    showToast('Não foi possível conectar ao servidor.', 'err');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M12 3v1m0 16v1M3 12h1m16 0h1m-3.3-6.7-.7.7M6 6l-.7-.7M6 18l-.7.7M18 18l.7.7"/><circle cx="12" cy="12" r="4"/></svg>
      Gerar Flashcards
    `;
  }
}

document.getElementById('fcBtn')?.addEventListener('click', generateFlashcards);
document.getElementById('fcClearBtn')?.addEventListener('click', () => {
  document.getElementById('fcTitle').value   = '';
  document.getElementById('fcContent').value = '';
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = `
    <div class="fc-placeholder" id="fcPlaceholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
      <span>Seus flashcards aparecerão aqui</span>
    </div>
  `;
});

/* ─────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────── */
async function loadDashboard() {
  try {
    const res  = await fetch(`${API}/dashboard`);
    const data = await res.json();

    const sessoes   = data.sessoes   ?? 0;
    const decks     = data.flash_decks ?? 0;
    const retencao  = data.retencao  ?? 0;

    animateNumber('metSessoes',  sessoes);
    animateNumber('metDecks',    decks);
    document.getElementById('metRetencao').textContent = retencao + '%';

    // Progress bars (capped at 100%)
    setTimeout(() => {
      setBar('barSessoes',  Math.min(sessoes  * 10, 100));
      setBar('barDecks',    Math.min(decks    * 20, 100));
      setBar('barRetencao', Math.min(retencao,       100));
    }, 100);

  } catch {
    showToast('Erro ao carregar métricas.', 'err');
  }
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

function setBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct + '%';
}

/* ─────────────────────────────────────────────────────
   ACTIVITY LOG (in-memory)
───────────────────────────────────────────────────── */
const activityLog = [];

function addActivity(text, color = 'blue') {
  const now  = new Date();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  activityLog.unshift({ text, color, time });
  if (activityLog.length > 8) activityLog.pop();

  renderActivity();
}

function renderActivity() {
  const list = document.getElementById('activityList');
  if (!list) return;

  if (activityLog.length === 0) {
    list.innerHTML = `
      <div class="activity-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        Nenhuma atividade ainda
      </div>`;
    return;
  }

  list.innerHTML = activityLog.map(a => `
    <div class="activity-item">
      <div class="activity-dot ${a.color}"></div>
      <span class="activity-text">${a.text}</span>
      <span class="activity-time">${a.time}</span>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────── */
loadDashboard();
