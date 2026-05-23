/**
 * CIntetize — Auth Logic (login.js)
 *
 * ─── BACKEND INTEGRATION GUIDE ───────────────────────────────────────────────
 *
 *  Todos os pontos de integração estão marcados com o comentário:
 *    // ⚙️ BACKEND: <descrição>
 *
 *  Rotas esperadas no Flask:
 *    POST /api/auth/login          { email, password }     → { token, user }
 *    POST /api/auth/register       { name, email, password }→ { token, user }
 *    POST /api/auth/forgot-password{ email }               → { message }
 *    POST /api/auth/google                                  → { token, user }
 *    POST /api/auth/github                                  → { token, user }
 *
 *  O token JWT recebido deve ser salvo em localStorage com a chave "cintetize_token".
 *  O guard de auth em index.html verifica essa chave ao carregar a página.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API = 'http://localhost:5000/api';

/* ── UTILS ───────────────────────────────────────────── */
function showToast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3000);
}

function setLoading(btn, loading) {
  const label   = btn.querySelector('.btn-label');
  const spinner = btn.querySelector('.btn-spinner');
  btn.disabled  = loading;
  label.hidden  = loading;
  spinner.hidden = !loading;
}

function setError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = msg;
  el.className   = msg ? 'field-group err' : 'field-group';
}

function setSuccess(containerId, msg) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = msg;
  el.className   = 'field-group ok';
}

function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function validatePassword(v) { return v.length >= 8; }

/* ── TABS ─────────────────────────────────────────────── */
const slider = document.getElementById('tabSlider');

document.getElementById('tabLogin').addEventListener('click',  () => activateTab('login'));
document.getElementById('tabSignup').addEventListener('click', () => activateTab('signup'));

function activateTab(tab) {
  const isSignup = tab === 'signup';
  document.getElementById('tabLogin') .classList.toggle('active', !isSignup);
  document.getElementById('tabSignup').classList.toggle('active',  isSignup);
  document.getElementById('panelLogin') .classList.toggle('active', !isSignup);
  document.getElementById('panelSignup').classList.toggle('active',  isSignup);
  slider.classList.toggle('right', isSignup);
  setError('loginError',  '');
  setError('signupError', '');
}

/* ── SHOW / HIDE PASSWORD ────────────────────────────── */
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input  = document.getElementById(btn.dataset.target);
    const isText = input.type === 'text';
    input.type   = isText ? 'password' : 'text';
    btn.querySelector('.eye-open')  .style.display = isText ? '' : 'none';
    btn.querySelector('.eye-closed').style.display = isText ? 'none' : '';
  });
});

/* ── PASSWORD STRENGTH ───────────────────────────────── */
const pwInput   = document.getElementById('signupPassword');
const strengthW = document.getElementById('strengthWrap');
const strengthF = document.getElementById('strengthFill');
const strengthL = document.getElementById('strengthLabel');

const STRENGTH_LEVELS = [
  { min: 0,  max: 25,  color: '#f87171', label: 'Fraca',    bg: 'rgba(248,113,113,.15)' },
  { min: 25, max: 50,  color: '#fbbf24', label: 'Razoável', bg: 'rgba(251,191,36,.15)'  },
  { min: 50, max: 75,  color: '#4f7cff', label: 'Boa',      bg: 'rgba(79,124,255,.15)'  },
  { min: 75, max: 101, color: '#2dd4a0', label: 'Forte',    bg: 'rgba(45,212,160,.15)'  },
];

function measureStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score += 25;
  if (pw.length >= 12) score += 15;
  if (/[A-Z]/.test(pw)) score += 20;
  if (/[0-9]/.test(pw)) score += 20;
  if (/[^A-Za-z0-9]/.test(pw)) score += 20;
  return Math.min(score, 100);
}

pwInput?.addEventListener('input', () => {
  const val = pwInput.value;
  if (!val) { strengthW.hidden = true; return; }
  strengthW.hidden = false;
  const score = measureStrength(val);
  const level = STRENGTH_LEVELS.find(l => score >= l.min && score < l.max) || STRENGTH_LEVELS[3];
  strengthF.style.width      = score + '%';
  strengthF.style.background = level.color;
  strengthL.textContent      = level.label;
  strengthL.style.color      = level.color;
});

/* ── LOGIN ───────────────────────────────────────────── */
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  setError('loginError', '');

  if (!validateEmail(email))    { setError('loginError', 'Insira um e-mail válido.');      return; }
  if (!password)                { setError('loginError', 'Insira sua senha.');              return; }

  setLoading(btn, true);

  try {
    // ⚙️ BACKEND: POST /api/auth/login — envia credenciais, recebe { token, user }
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      // ⚙️ BACKEND: o servidor deve retornar { error: "mensagem" } em caso de erro
      setError('loginError', data.error || 'E-mail ou senha inválidos.');
      return;
    }

    // ⚙️ BACKEND: salva o token JWT no localStorage para o guard de auth
    localStorage.setItem('cintetize_token', data.token);
    localStorage.setItem('cintetize_user',  JSON.stringify(data.user));

    showToast('Entrando... 🎓', 'ok');
    setTimeout(() => { window.location.href = 'index.html'; }, 700);

  } catch {
    /* ── MODO DEMO (sem backend) ── remova este bloco ao conectar o backend ── */
    console.warn('[CIntetize] Backend não encontrado — usando modo demo.');
    localStorage.setItem('cintetize_token', 'demo-token');
    localStorage.setItem('cintetize_user',  JSON.stringify({ name: 'Estudante', email }));
    showToast('Modo demo ativo 🎓', 'ok');
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
    /* ── fim modo demo ─────────────────────────────────────────────────────── */
  } finally {
    setLoading(btn, false);
  }
});

/* ── SIGNUP ──────────────────────────────────────────── */
document.getElementById('signupBtn').addEventListener('click', async () => {
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm  = document.getElementById('signupConfirm').value;
  const terms    = document.getElementById('acceptTerms').checked;
  const btn      = document.getElementById('signupBtn');

  setError('signupError', '');

  if (!name)                          { setError('signupError', 'Insira seu nome.');                  return; }
  if (!validateEmail(email))          { setError('signupError', 'Insira um e-mail válido.');           return; }
  if (!validatePassword(password))    { setError('signupError', 'A senha deve ter ao menos 8 caracteres.'); return; }
  if (password !== confirm)           { setError('signupError', 'As senhas não coincidem.');           return; }
  if (!terms)                         { setError('signupError', 'Aceite os Termos de Uso para continuar.'); return; }

  setLoading(btn, true);

  try {
    // ⚙️ BACKEND: POST /api/auth/register — cria conta, recebe { token, user }
    const res  = await fetch(`${API}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError('signupError', data.error || 'Erro ao criar conta. Tente novamente.');
      return;
    }

    // ⚙️ BACKEND: salva o token e redireciona
    localStorage.setItem('cintetize_token', data.token);
    localStorage.setItem('cintetize_user',  JSON.stringify(data.user));

    showToast('Conta criada! Bem-vindo(a) 🎉', 'ok');
    setTimeout(() => { window.location.href = 'index.html'; }, 800);

  } catch {
    /* ── MODO DEMO ── */
    console.warn('[CIntetize] Backend não encontrado — usando modo demo.');
    localStorage.setItem('cintetize_token', 'demo-token');
    localStorage.setItem('cintetize_user',  JSON.stringify({ name, email }));
    showToast('Conta criada! (modo demo) 🎉', 'ok');
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
    /* ── fim modo demo ── */
  } finally {
    setLoading(btn, false);
  }
});

/* ── FORGOT PASSWORD MODAL ───────────────────────────── */
document.getElementById('forgotLink').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('forgotModal').hidden = false;
});

document.getElementById('forgotClose').addEventListener('click', () => {
  document.getElementById('forgotModal').hidden = true;
  setError('forgotMsg', '');
});

document.getElementById('forgotModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) {
    e.currentTarget.hidden = true;
    setError('forgotMsg', '');
  }
});

document.getElementById('forgotBtn').addEventListener('click', async () => {
  const email = document.getElementById('forgotEmail').value.trim();
  const btn   = document.getElementById('forgotBtn');
  setError('forgotMsg', '');

  if (!validateEmail(email)) { setError('forgotMsg', 'Insira um e-mail válido.'); return; }

  setLoading(btn, true);

  try {
    // ⚙️ BACKEND: POST /api/auth/forgot-password — envia link de redefinição
    const res  = await fetch(`${API}/auth/forgot-password`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) { setError('forgotMsg', data.error || 'Erro ao enviar e-mail.'); return; }
    setSuccess('forgotMsg', 'Link enviado! Verifique sua caixa de entrada.');

  } catch {
    /* ── MODO DEMO ── */
    setSuccess('forgotMsg', 'Link enviado! (modo demo — verifique o console)');
    /* ── fim modo demo ── */
  } finally {
    setLoading(btn, false);
  }
});

/* ── SOCIAL AUTH ─────────────────────────────────────── */
document.getElementById('googleBtn').addEventListener('click', () => {
  // ⚙️ BACKEND: redirecione para o OAuth do Google
  // window.location.href = `${API}/auth/google`;
  showToast('Google OAuth — conecte o backend para ativar.', 'err');
});

document.getElementById('githubBtn').addEventListener('click', () => {
  // ⚙️ BACKEND: redirecione para o OAuth do GitHub
  // window.location.href = `${API}/auth/github`;
  showToast('GitHub OAuth — conecte o backend para ativar.', 'err');
});

/* ── ENTER KEY ───────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const active = document.querySelector('.auth-panel.active');
  if (!active) return;
  if (active.id === 'panelLogin')  document.getElementById('loginBtn') .click();
  if (active.id === 'panelSignup') document.getElementById('signupBtn').click();
});
