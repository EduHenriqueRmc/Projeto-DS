const API = 'http://localhost:5000/api';

/* ── Tabs ── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    btn.classList.add('active');
    if (tab === 'dashboard') loadDashboard();
  });
});

/* ── Toast ── */
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => t.className = '', 2800);
}

/* ── Chat ── */
function appendMsg(text, role) {
  const win = document.getElementById('chatWindow');
  document.getElementById('chatEmpty')?.remove();
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.textContent = text;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
  return div;
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const btn = document.getElementById('chatBtn');
  const msg = input.value.trim();
  if (!msg) return;

  appendMsg(msg, 'user');
  input.value = '';
  btn.disabled = true;

  const thinking = appendMsg('Pensando...', 'thinking');

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    thinking.remove();
    appendMsg(data.reply || ('Erro: ' + (data.error || 'resposta inválida')), 'ai');
  } catch {
    thinking.remove();
    appendMsg('Não foi possível conectar ao servidor.', 'ai');
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

document.getElementById('chatBtn').addEventListener('click', sendChat);
document.getElementById('chatInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendChat();
});

/* ── Flashcards ── */
async function generateFlashcards() {
  const title = document.getElementById('fcTitle').value.trim();
  const content = document.getElementById('fcContent').value.trim();
  const btn = document.getElementById('fcBtn');
  const grid = document.getElementById('cardsGrid');

  if (!content) { showToast('Insira o conteúdo base.', 'err'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Gerando...';
  grid.innerHTML = '';

  try {
    const res = await fetch(`${API}/flashcards/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || 'Baralho', content })
    });
    const data = await res.json();

    if (data.flashcards && Array.isArray(data.flashcards)) {
      data.flashcards.forEach(card => {
        const el = document.createElement('div');
        el.className = 'flashcard';
        el.innerHTML = `
          <div class="question">${card.pergunta}</div>
          <div class="answer">${card.resposta}</div>
          <div class="hint">Clique para revelar a resposta</div>
        `;
        el.addEventListener('click', () => {
          el.classList.toggle('flipped');
          el.querySelector('.hint').textContent = el.classList.contains('flipped')
            ? 'Clique para ocultar' : 'Clique para revelar a resposta';
        });
        grid.appendChild(el);
      });
      showToast(`${data.flashcards.length} flashcards criados! 🎉`);
    } else {
      showToast('Erro ao gerar flashcards.', 'err');
    }
  } catch {
    showToast('Não foi possível conectar ao servidor.', 'err');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ Gerar Flashcards';
  }
}

document.getElementById('fcBtn').addEventListener('click', generateFlashcards);
document.getElementById('fcClearBtn').addEventListener('click', () => {
  document.getElementById('fcTitle').value = '';
  document.getElementById('fcContent').value = '';
  document.getElementById('cardsGrid').innerHTML = '';
});

/* ── Dashboard ── */
async function loadDashboard() {
  try {
    const res = await fetch(`${API}/dashboard`);
    const data = await res.json();
    document.getElementById('metSessoes').textContent = data.sessoes ?? 0;
    document.getElementById('metDecks').textContent = data.flash_decks ?? 0;
    document.getElementById('metRetencao').textContent = (data.retencao ?? 0) + '%';
  } catch {
    showToast('Erro ao carregar métricas.', 'err');
  }
}
