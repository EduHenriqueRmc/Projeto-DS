const API = 'https://cintetize-ds.onrender.com/api';

/* ─────────────────────────────────────────────────────
   AUTH GUARD
   ⚙️ BACKEND: troque a verificação do token por uma
   chamada real ao servidor (ex: GET /api/auth/me)
   para validar o JWT antes de renderizar a página.
───────────────────────────────────────────────────── */

// Pega os dados do usuário logado salvos pelo login.js
const currentUser = JSON.parse(localStorage.getItem('cintetize_user'));
const userId = currentUser ? currentUser.id : null;

(function authGuard() {
  const token = localStorage.getItem('cintetize_token');

  // ⚙️ BACKEND: substitua esta verificação local por uma
  // chamada autenticada ao servidor antes de liberar o acesso.
  if (!token) {
    window.location.replace('login.html');
    return;
  }

  // Exibe nome do usuário logado no topbar (se disponível)
  try {
    const user = JSON.parse(localStorage.getItem('cintetize_user') || '{}');
    if (user.name) {
      const avatar = document.querySelector('.avatar');
      if (avatar) {
        avatar.setAttribute('title', user.name);
        avatar.setAttribute('aria-label', `Usuário: ${user.name}`);
      }
    }
  } catch { /* seguro ignorar */ }
})();

/* Logout — chame logout() de qualquer lugar para encerrar sessão */
function logout() {
  // ⚙️ BACKEND: faça POST /api/auth/logout para invalidar o token no servidor
  localStorage.removeItem('cintetize_token');
  localStorage.removeItem('cintetize_user');
  window.location.href = 'login.html';
}

/* ─────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────── */
const pageTitles = {
  dashboard:  'Dashboard',
  chat:       'AI Assistant',
  flashcards: 'Flashcards',
  planner:    'Cronograma',
  environments: 'Ambientes de Estudo',
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
    // Se for o AI, converte o Markdown para HTML. Se for o usuário, mantém texto puro.
    if (role === 'ai') {
      bubble.innerHTML = marked.parse(text);
    } else {
      bubble.textContent = text;
    }
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

  // 1. Trava de segurança: impede gerar se não estiver logado
  if (!userId) { 
    showToast('Você precisa fazer login para salvar flashcards.', 'err'); 
    return; 
  }

  if (!content) { showToast('Insira o conteúdo base.', 'err'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Gerando...';
  grid.innerHTML = '';

  try {
    // 2. Envia o user_id para a rota que atualizamos no backend
    const res  = await fetch(`${API}/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userId, // <-- Sincronizando com o banco!
        title: title || 'Baralho', 
        content 
      }),
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
      showToast(`${data.flashcards.length} flashcards gerados e salvos! 🎉`);
    } else {
      showToast(data.error || 'Erro ao gerar flashcards.', 'err');
    }
  } catch (error) {
    console.error(error);
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

/* ─────────────────────────────────────────────────────
   CRONOGRAMA SEMANAL
───────────────────────────────────────────────────── */
const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Estado global do cronograma (carrega vazio e preenche via fetch)
let plannerTasks = {
  'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [], 'Sáb': [], 'Dom': []
};

// Constrói as colunas vazias e busca os dados salvos do usuário logado
async function initPlanner() {
  const grid = document.getElementById('plannerGrid');
  if (!grid) return;

  grid.innerHTML = daysOfWeek.map(day => `
    <div class="planner-day" data-day="${day}">
      <div class="day-name">${day}</div>
      <div class="day-content" id="day-${day}"></div>
    </div>
  `).join('');
  
  // Busca os blocos reais salvos no banco de dados para este usuário específico
  if (userId) {
    try {
      const res = await fetch(`${API}/planner?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.planner) {
          plannerTasks = data.planner;
        }
      }
    } catch (err) {
      console.error("Erro ao buscar cronograma:", err);
    }
  }
  
  renderPlanner();
}

// Renderiza os blocos atuais baseados na variável plannerTasks
function renderPlanner() {
  daysOfWeek.forEach(day => {
    const container = document.getElementById(`day-${day}`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (plannerTasks[day] && plannerTasks[day].length > 0) {
      plannerTasks[day].forEach((t, index) => {
        container.innerHTML += `
          <div class="planner-task ${t.color}">
            <button class="task-delete-btn" data-day="${day}" data-index="${index}" title="Excluir Bloco">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <span class="task-time">${t.time}</span>
            <span class="task-title">${t.title}</span>
          </div>
        `;
      });
    } else {
      container.innerHTML = `<span style="color: var(--muted); font-size: 0.75rem; text-align: center; display: block; margin-top: 1rem;">Livre</span>`;
    }
  });
}

// Envia o estado atual do planner para salvar no banco de dados
async function syncPlanner() {
  if (!userId) return;
  try {
    await fetch(`${API}/planner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, planner: plannerTasks })
    });
  } catch (err) {
    console.error("Erro ao sincronizar cronograma:", err);
  }
}

// Função para excluir um bloco específico
function deletePlannerBlock(day, index) {
  plannerTasks[day].splice(index, 1);
  renderPlanner();
  syncPlanner(); // Sincroniza a remoção no db.json
  showToast('Bloco de estudo removido.', 'ok');
}

// Modal Logic
const plannerModal = document.getElementById('plannerModal');

function openPlannerModal() {
  document.getElementById('planTitle').value = '';
  document.getElementById('planTime').value = '';
  document.getElementById('planDay').value = 'Seg';
  document.getElementById('planColor').value = 'task-blue';
  
  plannerModal.classList.add('show');
  document.getElementById('planTitle').focus();
}

function closePlannerModal() {
  plannerModal.classList.remove('show');
}

function saveManualBlock() {
  const title = document.getElementById('planTitle').value.trim();
  const time = document.getElementById('planTime').value.trim();
  const day = document.getElementById('planDay').value;
  const color = document.getElementById('planColor').value;

  if (!title || !time) {
    showToast('Preencha o título e o horário.', 'err');
    return;
  }

  plannerTasks[day].push({ time, title, color });
  plannerTasks[day].sort((a, b) => a.time.localeCompare(b.time));

  renderPlanner();
  syncPlanner(); // Sincroniza a adição manual no db.json
  closePlannerModal();
  showToast('Bloco adicionado com sucesso!', 'ok');
}

// Chamada à Inteligência Artificial do Groq integrada ao usuário
async function generateAIPlanner() {
  if (!userId) {
    showToast('Usuário não autenticado.', 'err');
    return;
  }

  const btn = document.getElementById('aiPlannerBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Gerando...';

  try {
    const res = await fetch(`${API}/planner/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });

    const data = await res.json();

    if (res.ok && data.planner) {
      plannerTasks = data.planner;
      renderPlanner();
      addActivity('Cronograma otimizado pela IA', 'green');
      showToast('Sua semana foi planejada! 📅', 'ok');
    } else {
      showToast('Erro ao gerar cronograma.', 'err');
    }
  } catch (err) {
    console.error(err);
    showToast('Não foi possível conectar ao servidor.', 'err');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M12 3v1m0 16v1M3 12h1m16 0h1m-3.3-6.7-.7.7M6 6l-.7-.7M6 18l-.7.7M18 18l.7.7"/><circle cx="12" cy="12" r="4"/></svg> Gerar com IA`;
  }
}

// Listeners do Cronograma
document.getElementById('aiPlannerBtn')?.addEventListener('click', generateAIPlanner);
document.getElementById('addManualBtn')?.addEventListener('click', openPlannerModal);

document.getElementById('plannerGrid')?.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.task-delete-btn');
  if (deleteBtn) {
    const day = deleteBtn.dataset.day;
    const index = parseInt(deleteBtn.dataset.index, 10);
    deletePlannerBlock(day, index);
  }
});

// Listeners do Modal
document.getElementById('closeModalBtn')?.addEventListener('click', closePlannerModal);
document.getElementById('cancelModalBtn')?.addEventListener('click', closePlannerModal);
document.getElementById('saveBlockBtn')?.addEventListener('click', saveManualBlock);

plannerModal?.addEventListener('click', (e) => {
  if (e.target === plannerModal) closePlannerModal();
});

// Inicia o render carregando os dados do usuário
initPlanner();

/* ─────────────────────────────────────────────────────
   AMBIENTES DE ESTUDO
───────────────────────────────────────────────────── */
let environmentsList = [];

// Mapeamento exato de ícones wireframe conforme solicitado
const envIcons = {
  notion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="19" x2="15" y2="19"/></svg>`,
  drive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 22 22 22"/><path d="M12 2v20"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="4"/><polygon points="10 9 15 12 10 15"/></svg>`,
  custom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>` // Livro aberto
};

const envTypeLabels = {
  notion: 'Notion',
  drive: 'Google Drive',
  youtube: 'YouTube',
  custom: 'Link Personalizado'
};

let envEditIndex = -1;

// Busca os dados reais salvos no banco para este usuário
async function initEnvironments() {
  if (userId) {
    try {
      const res = await fetch(`${API}/environments?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.environments) {
          environmentsList = data.environments;
        }
      }
    } catch (err) {
      console.error("Erro ao buscar ambientes:", err);
    }
  }
  renderEnvironments();
}

function renderEnvironments() {
  const grid = document.getElementById('envGrid');
  if (!grid) return;

  if (environmentsList.length === 0) {
    grid.innerHTML = `
      <div class="fc-placeholder" style="grid-column: 1 / -1; width: 100%;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span>Nenhum ambiente de estudos fixado. Crie um ao lado!</span>
      </div>`;
    return;
  }

  grid.innerHTML = environmentsList.map((env, index) => {
    const finalUrl = env.url.startsWith('http') ? env.url : `https://${env.url}`;
    
    return `
      <div class="env-card">
        <div class="env-card-top">
          <div class="env-card-icon ${env.type}">
            ${envIcons[env.type] || envIcons.custom}
          </div>
          <div class="env-card-info">
            <div class="env-card-title">${env.title}</div>
            <div class="env-card-type">${envTypeLabels[env.type] || 'Outro'}</div>
          </div>
        </div>
        <div class="env-card-actions-wrapper">
          <div style="display: flex; gap: 0.25rem;">
            <button class="env-edit-btn" data-index="${index}" title="Editar Ambiente">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="env-delete-btn" data-index="${index}" title="Excluir Ambiente">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
          <a href="${finalUrl}" target="_blank" class="env-card-action">
            Acessar
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>
    `;
  }).join('');
}

// Sincroniza o estado do array local com o db.json no backend
async function syncEnvironments() {
  if (!userId) return;
  try {
    await fetch(`${API}/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, environments: environmentsList })
    });
  } catch (err) {
    console.error("Erro ao sincronizar ambientes:", err);
  }
}

function addEnvironmentLink() {
  const type  = document.getElementById('envType').value;
  const title = document.getElementById('envTitle').value.trim();
  const url   = document.getElementById('envUrl').value.trim();

  if (!title || !url) {
    showToast('Por favor, informe um título e uma URL válida.', 'err');
    return;
  }

  if (envEditIndex > -1) {
    environmentsList[envEditIndex] = { type, title, url };
    showToast('Ambiente atualizado com sucesso! ✏️', 'ok');
  } else {
    environmentsList.push({ type, title, url });
    addActivity(`Ambiente "${title}" integrado`, type === 'youtube' ? 'purple' : 'blue');
    showToast('Plataforma adicionada com sucesso! 🚀', 'ok');
  }

  resetEnvForm();
  renderEnvironments();
  syncEnvironments(); // Salva a alteração no banco
}

function startEditEnv(index) {
  envEditIndex = index;
  const env = environmentsList[index];

  document.getElementById('envType').value = env.type;
  document.getElementById('envTitle').value = env.title;
  document.getElementById('envUrl').value = env.url;

  const btn = document.getElementById('envAddBtn');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
    Salvar Alterações
  `;
  
  document.getElementById('envTitle').focus();
}

function resetEnvForm() {
  envEditIndex = -1;
  document.getElementById('envTitle').value = '';
  document.getElementById('envUrl').value = '';
  
  const btn = document.getElementById('envAddBtn');
  btn.textContent = 'Fixar Ambiente';
}

document.getElementById('envAddBtn')?.addEventListener('click', addEnvironmentLink);
document.getElementById('envClearBtn')?.addEventListener('click', resetEnvForm);

document.getElementById('envGrid')?.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.env-edit-btn');
  const deleteBtn = e.target.closest('.env-delete-btn');
  
  if (editBtn) {
    const index = parseInt(editBtn.dataset.index, 10);
    startEditEnv(index);
  } else if (deleteBtn) {
    const index = parseInt(deleteBtn.dataset.index, 10);
    deleteEnv(index);
  }
});

function deleteEnv(index) {
  environmentsList.splice(index, 1);
  
  if (envEditIndex === index) {
    resetEnvForm();
  } else if (envEditIndex > index) {
    envEditIndex--;
  }
  
  renderEnvironments();
  syncEnvironments(); // Salva a remoção no banco
  showToast('Ambiente excluído.', 'ok');
}

// Inicialização modificada para carregar do banco de dados
initEnvironments();