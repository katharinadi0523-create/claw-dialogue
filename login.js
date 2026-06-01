// login.js
const ROWAN_PROFILE = {
  name: 'Rowan DI',
  role: 'AI产品规划部-AF产品组',
  avatar: 'R'
};
const AGENTFOUNDRY_PROFILE = {
  name: 'Agent Foundry',
  role: '新星 Agent Foundry',
  avatarImage: 'assets/avatar-agentfoundry.png'
};
const DEFAULT_PROFILE = {
  name: '张三',
  role: '财务运营 · 产品部',
  avatar: '张'
};
const USER_PROFILES = {
  admin: ROWAN_PROFILE,
  diruonan: ROWAN_PROFILE,
  agentfoundry: AGENTFOUNDRY_PROFILE
};
const VALID_CREDENTIALS = {
  admin: 'diruonan',
  diruonan: 'diruonan',
  agentfoundry: 'agentfoundry2026'
};

function getUserProfile(username) {
  return USER_PROFILES[username] || DEFAULT_PROFILE;
}

function renderAvatar(avatarEl, profile) {
  if (!avatarEl) return;

  if (profile.avatarImage) {
    avatarEl.textContent = '';
    avatarEl.classList.add('avatar-image');
    let img = avatarEl.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      avatarEl.appendChild(img);
    }
    img.src = profile.avatarImage;
    return;
  }

  avatarEl.classList.remove('avatar-image');
  avatarEl.querySelector('img')?.remove();
  avatarEl.textContent = profile.avatar || '';
}

function applyUserProfile(username) {
  const profile = getUserProfile(username);
  renderAvatar(document.querySelector('.user-card .avatar'), profile);
  const nameEl = document.querySelector('.user-card .user-name');
  const roleEl = document.querySelector('.user-card .user-role');
  if (nameEl) nameEl.textContent = profile.name;
  if (roleEl) roleEl.textContent = profile.role;
}

function logout() {
  sessionStorage.removeItem('claw_logged_in');
  sessionStorage.removeItem('claw_username');
  applyUserProfile('');
  const loginOverlay = document.getElementById('loginOverlay');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const userAvatarWrap = document.getElementById('userAvatarWrap');
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  if (loginOverlay) loginOverlay.classList.remove('hidden');
  if (usernameInput) usernameInput.value = '';
  if (passwordInput) passwordInput.value = '';
  if (userAvatarWrap) userAvatarWrap.removeAttribute('data-menu-open');
  if (userAvatarBtn) userAvatarBtn.setAttribute('aria-expanded', 'false');
  document.getElementById('loginErrorMsg')?.remove();
}

function setupUserAvatarMenu() {
  const userAvatarWrap = document.getElementById('userAvatarWrap');
  const userAvatarBtn = document.getElementById('userAvatarBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!userAvatarWrap || !userAvatarBtn || !logoutBtn) return;

  const closeMenu = () => {
    userAvatarWrap.removeAttribute('data-menu-open');
    userAvatarBtn.setAttribute('aria-expanded', 'false');
  };

  userAvatarBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = userAvatarWrap.getAttribute('data-menu-open') === 'true';
    if (isOpen) {
      closeMenu();
      return;
    }
    userAvatarWrap.setAttribute('data-menu-open', 'true');
    userAvatarBtn.setAttribute('aria-expanded', 'true');
  });

  logoutBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    logout();
  });

  document.addEventListener('click', (event) => {
    if (!userAvatarWrap.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

function isValidLogin(username, password) {
  return VALID_CREDENTIALS[username] === password;
}

document.addEventListener('DOMContentLoaded', () => {
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const usernameInput = document.getElementById('username');

  // Check if already logged in (using sessionStorage as a mock state)
  if (sessionStorage.getItem('claw_logged_in') === 'true') {
    loginOverlay.classList.add('hidden');
    applyUserProfile(sessionStorage.getItem('claw_username') || 'admin');
  }

  setupUserAvatarMenu();

  // Toggle password visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      // Change icon slightly (could swap use href here if needed, keeping simple for now)
      togglePasswordBtn.style.opacity = type === 'text' ? '0.5' : '1';
    });
  }

  // Form submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
      
      if (isValidLogin(username, password)) {
        // Success animation
        const btn = loginForm.querySelector('.btn-submit');
        const originalText = btn.innerText;
        btn.innerText = '登录成功...';
        btn.style.background = '#10B981'; // Green
        
        setTimeout(() => {
          sessionStorage.setItem('claw_logged_in', 'true');
          sessionStorage.setItem('claw_username', username);
          applyUserProfile(username);
          loginOverlay.classList.add('hidden');
          // Reset button in case they log out later
          setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = '';
          }, 500);
        }, 800);
      } else {
        // Error shake animation
        loginForm.style.animation = 'shake 0.5s';
        setTimeout(() => {
          loginForm.style.animation = '';
        }, 500);
        
        let errorMsg = document.getElementById('loginErrorMsg');
        if (!errorMsg) {
          errorMsg = document.createElement('div');
          errorMsg.id = 'loginErrorMsg';
          errorMsg.className = 'login-error show';
          errorMsg.innerText = '用户名或密码错误，请重试';
          loginForm.insertBefore(errorMsg, loginForm.querySelector('.form-options'));
        }
      }
    });
  }
});

// Add shake animation style dynamically
const style = document.createElement('style');
style.innerHTML = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);
