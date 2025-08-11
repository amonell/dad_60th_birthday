const UI = {
  loginCard: document.getElementById('login-card'),
  mainCard: document.getElementById('main-card'),
  loginForm: document.getElementById('login-form'),
  loginError: document.getElementById('login-error'),
  logoutButton: document.getElementById('logout-button'),
  dateForm: document.getElementById('date-form'),
  dateInput: document.getElementById('skydive-date'),
  submitStatus: document.getElementById('submit-status'),
  toasts: document.getElementById('toasts'),
};

const CREDENTIALS = { username: 'cmonell', password: 'birthday' };
const STORAGE_KEYS = {
  authToken: 'dad60_auth',
  lockedDate: 'dad60_locked_date',
};

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  UI.toasts.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function setMinDateToTomorrow(input) {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  input.min = `${yyyy}-${mm}-${dd}`;
}

function launchConfetti() {
  const durationMs = 2000;
  const end = Date.now() + durationMs;
  const colors = ['#5b8cff', '#8ef0d1', '#ffd166', '#ef476f', '#06d6a0'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 60,
      origin: { x: 0 },
      colors,
      ticks: 200
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 60,
      origin: { x: 1 },
      colors,
      ticks: 200
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

function saveAuth() { localStorage.setItem(STORAGE_KEYS.authToken, 'yes'); }
function clearAuth() { localStorage.removeItem(STORAGE_KEYS.authToken); }
function isAuthed() { return localStorage.getItem(STORAGE_KEYS.authToken) === 'yes'; }

function saveLockedDate(isoDate) { localStorage.setItem(STORAGE_KEYS.lockedDate, isoDate); }
function getLockedDate() { return localStorage.getItem(STORAGE_KEYS.lockedDate); }
function clearLockedDate() { localStorage.removeItem(STORAGE_KEYS.lockedDate); }

function updateUIForAuth() {
  if (isAuthed()) {
    UI.loginCard.classList.add('hidden');
    UI.mainCard.classList.remove('hidden');
    setMinDateToTomorrow(UI.dateInput);
    const locked = getLockedDate();
    if (locked) {
      UI.dateInput.value = locked;
      UI.dateInput.disabled = true;
      const lockedDate = new Date(locked).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      UI.submitStatus.textContent = `Locked: ${lockedDate}`;
    } else {
      UI.submitStatus.textContent = '';
      UI.dateInput.disabled = false;
    }
    launchConfetti();
  } else {
    UI.mainCard.classList.add('hidden');
    UI.loginCard.classList.remove('hidden');
  }
}

UI.loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  UI.loginError.textContent = '';
  const username = new FormData(UI.loginForm).get('username');
  const password = new FormData(UI.loginForm).get('password');
  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    saveAuth();
    updateUIForAuth();
    showToast('Signed in successfully.');
  } else {
    UI.loginError.textContent = 'Incorrect username or password.';
  }
});

UI.logoutButton.addEventListener('click', () => {
  clearAuth();
  showToast('Signed out.');
  updateUIForAuth();
});

async function sendEmail(dateIso) {
  const pretty = new Date(dateIso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const endpoint = 'https://formsubmit.co/ajax/amonell@ucsd.edu';
  const payload = {
    _subject: 'Skydiving Date Choice',
    skydive_date_iso: dateIso,
    skydive_date: pretty,
    _template: 'table',
    _captcha: 'false'
  };
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Email send failed');
    return true;
  } catch (err) {
    const subject = encodeURIComponent('Skydiving Date Choice');
    const body = encodeURIComponent(`Dad chose ${pretty} for skydiving.`);
    window.location.href = `mailto:amonell@ucsd.edu?subject=${subject}&body=${body}`;
    return false;
  }
}

UI.dateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dateIso = UI.dateInput.value;
  if (!dateIso) {
    showToast('Please select a date.');
    return;
  }
  const chosen = new Date(dateIso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (chosen <= today) {
    showToast('Please pick a future date.');
    return;
  }

  UI.submitStatus.textContent = 'Submitting...';
  const ok = await sendEmail(dateIso);
  saveLockedDate(dateIso);
  UI.dateInput.disabled = true;
  const pretty = chosen.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  UI.submitStatus.textContent = `Locked: ${pretty}`;
  showToast(ok ? 'Choice sent and locked!' : 'Choice locked. Email app opened to send.');
});

// Init
updateUIForAuth(); 