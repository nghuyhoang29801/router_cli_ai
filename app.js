const LS_AIS = 'ai_list';
const LS_WORKDIR = 'workdir';
const LS_BRIDGE = 'bridge_host';

const load = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } };
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

let ais = load(LS_AIS, []);
let aiToLimit = null; // Track which AI we are currently marking

// Tự động lấy bridge từ URL (?bridge=IP:PORT) hoặc localStorage, mặc định 127.0.0.1:7700
const urlParams = new URLSearchParams(window.location.search);
let bridgeHost = urlParams.get('bridge') || load(LS_BRIDGE, '127.0.0.1:7700');
if (urlParams.has('bridge')) save(LS_BRIDGE, bridgeHost);

const getURL = (path) => `http://${bridgeHost}${path}`;

const now = () => Date.now();
const isLimited = ai => ai.cooldownUntil && now() < ai.cooldownUntil;
const remainText = ai => {
  const ms = ai.cooldownUntil - now(), min = Math.ceil(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  if (h < 24) return m ? `${h}h${m}m` : `${h}h`;
  const d = Math.floor(h / 24), rh = h % 24;
  return rh ? `${d}d${rh}h` : `${d}d`;
};

const persist = () => { save(LS_AIS, ais); };
const getWorkDir = () => document.getElementById('workdir-input').value.trim();

// ===== Render UI =====
const renderTopAI = () => {
  const top = [...ais]
    .filter(a => a.enabled && !isLimited(a))
    .sort((a, b) => a.priority - b.priority)[0] ?? null;

  const btn = document.getElementById('btn-open-top');
  const nameEl = document.getElementById('top-ai-name');

  if (top) {
    btn.disabled = false;
    nameEl.textContent = top.name;
    btn.onclick = () => window.openCLI(top.name);
  } else {
    btn.disabled = true;
    nameEl.textContent = 'None available';
    btn.onclick = null;
  }
};

// ===== Render AI List =====
const renderAIList = () => {
  const el = document.getElementById('ai-list');
  if (!ais.length) { el.innerHTML = '<p class="empty">No AI configured.</p>'; return; }
  el.innerHTML = [...ais]
    .sort((a, b) => {
      const la = isLimited(a) ? 1 : 0, lb = isLimited(b) ? 1 : 0;
      if (la !== lb) return la - lb;       // not-limited trước
      return a.priority - b.priority;      // sau đó theo priority
    })
    .map(ai => {
      const limited = isLimited(ai);
      const cls = ['ai-item', limited ? 'limited' : '', !ai.enabled ? 'disabled' : ''].filter(Boolean).join(' ');
      return `
        <div class="${cls}" data-name="${ai.name}">
          <div class="ai-main">
            <div class="ai-info">
              <span class="ai-name">${ai.name}</span>
              <span class="status-badge ${limited ? 'limited' : ''}">${limited ? `⛔ ${remainText(ai)}` : 'Ready'}</span>
            </div>
            <div class="ai-actions">
              <button class="btn btn-primary" onclick="openCLI('${ai.name}')" ${!ai.enabled || !ai.command ? 'disabled' : ''}>▶ Open</button>
              <button class="btn" onclick="toggleSettings('${ai.name}')">⚙</button>
              <button class="btn btn-danger" onclick="removeAI('${ai.name}')">✕</button>
            </div>
          </div>
          <!-- Inline settings panel -->
          <div class="ai-settings hidden" id="settings-${ai.name}">
            <label>Command</label>
            <input type="text" value="${ai.command || ''}" onchange="updateField('${ai.name}','command',this.value)" placeholder="e.g. kiro-cli" />
            <label>Priority</label>
            <input type="number" value="${ai.priority}" min="1" style="width:80px"
              onchange="updateField('${ai.name}','priority',parseInt(this.value)||1)" />
            
            <div style="display:flex; gap:6px; margin-left:8px;">
              ${limited 
                ? `<button class="btn" onclick="removeLimit('${ai.name}')">✓ Unmark</button>` 
                : `<button class="btn btn-danger" onclick="markLimited('${ai.name}')">⚠ Limit</button>`}
              <button class="btn" onclick="toggleAI('${ai.name}')">${ai.enabled ? 'Disable' : 'Enable'}</button>
            </div>
          </div>
        </div>`;
    }).join('');
};

const renderAll = () => { renderTopAI(); renderAIList(); };

// ===== Actions =====

window.openCLI = async name => {
  const ai = ais.find(a => a.name === name);
  if (!ai?.command) return;
  const workDir = getWorkDir();
  if (workDir) save(LS_WORKDIR, workDir);
  try {
    const res = await fetch(getURL('/run'), {
      method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ command: ai.command, workDir }),
    });
    if (!res.ok) { const d = await res.json(); alert(`Bridge error: ${d.error}`); }
  } catch { alert(`Bridge not running at ${bridgeHost}.\nRun: python3 bridge.py`); }
};

window.toggleSettings = name => {
  document.getElementById(`settings-${name}`)?.classList.toggle('hidden');
};

window.updateField = (name, field, value) => {
  const ai = ais.find(a => a.name === name);
  if (ai) { ai[field] = value; persist(); renderAll(); }
};

window.toggleAI = name => {
  const ai = ais.find(a => a.name === name);
  if (!ai) return;
  ai.enabled = !ai.enabled;
  persist(); renderAll();
};

window.removeAI = name => {
  if (!confirm(`Remove "${name}"?`)) return;
  ais = ais.filter(a => a.name !== name);
  persist(); renderAll();
};

window.markLimited = name => {
  aiToLimit = name;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('limit-date').value = tomorrow.toISOString().slice(0, 10);
  document.getElementById('limit-picker').classList.remove('hidden');
};

window.removeLimit = name => {
  const ai = ais.find(a => a.name === name);
  if (ai) { ai.cooldownUntil = null; persist(); renderAll(); }
};

const confirmLimit = () => {
  const ai = ais.find(a => a.name === aiToLimit);
  if (!ai) return;
  const val = document.getElementById('limit-date').value;
  if (!val) return;
  const until = new Date(val); until.setHours(23, 59, 59, 999);
  if (until.getTime() <= now()) { alert('Date must be in the future.'); return; }
  ai.cooldownUntil = until.getTime();
  document.getElementById('limit-picker').classList.add('hidden');
  aiToLimit = null;
  persist(); renderAll();
};

const addAI = () => {
  const name = document.getElementById('new-ai-name').value.trim();
  const command = document.getElementById('new-ai-command').value.trim();
  const priority = parseInt(document.getElementById('new-ai-priority').value) || ais.length + 1;
  if (!name) { alert('Name is required.'); return; }
  if (!command) { alert('CLI command is required.'); return; }
  if (ais.find(a => a.name === name)) { alert('Already exists.'); return; }
  ais.push({ name, command, enabled: true, cooldownUntil: null, priority });
  ['new-ai-name', 'new-ai-command'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('new-ai-priority').value = '1';
  document.getElementById('add-ai-form').classList.add('hidden');
  persist(); renderAll();
};

window.switchTab = (os) => {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase() === os);
  });
  document.querySelectorAll('.guide-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${os}`);
  });
};

// ===== Events =====
document.getElementById('btn-confirm-limit').addEventListener('click', confirmLimit);
document.getElementById('btn-cancel-limit').addEventListener('click', () => {
  document.getElementById('limit-picker').classList.add('hidden');
  aiToLimit = null;
});
document.getElementById('btn-add-ai').addEventListener('click', () =>
  document.getElementById('add-ai-form').classList.toggle('hidden'));
document.getElementById('btn-save-ai').addEventListener('click', addAI);
document.getElementById('btn-cancel-ai').addEventListener('click', () =>
  document.getElementById('add-ai-form').classList.add('hidden'));

document.getElementById('btn-toggle-guide').addEventListener('click', (e) => {
  const guide = document.getElementById('shortcut-guide');
  const isHidden = guide.classList.toggle('hidden');
  e.target.textContent = isHidden ? 'Xem hướng dẫn' : 'Đóng hướng dẫn';
});

document.getElementById('btn-pick-dir').addEventListener('click', async () => {
  try {
    const res = await fetch(getURL('/pick-dir'), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
    const d = await res.json();
    if (d.path) { document.getElementById('workdir-input').value = d.path; save(LS_WORKDIR, d.path); }
  } catch { alert(`Bridge not running at ${bridgeHost}.\nRun: python3 bridge.py`); }
});

document.getElementById('workdir-input').addEventListener('change', () => save(LS_WORKDIR, getWorkDir()));

// Expire cooldowns mỗi 60s
setInterval(() => {
  ais.forEach(ai => { if (ai.cooldownUntil && now() >= ai.cooldownUntil) ai.cooldownUntil = null; });
  persist(); renderAll();
}, 60000);

const checkBridge = async () => {
  const dot = document.getElementById('bridge-status-dot');
  if (!dot) return;
  try {
    const res = await fetch(getURL('/run'), { method: 'OPTIONS' });
    if (res.ok || res.status === 204) {
      dot.className = 'dot online';
      dot.title = `Bridge is running at ${bridgeHost}`;
    } else {
      dot.className = 'dot offline';
      dot.title = 'Bridge returned error';
    }
  } catch {
    dot.className = 'dot offline';
    dot.title = `Bridge not connected at ${bridgeHost}`;
  }
};

// Init
setInterval(checkBridge, 5000);
checkBridge();

ais.forEach(ai => { if (!ai.command) ai.command = ''; });
persist();
const wd = load(LS_WORKDIR, '');
if (wd) document.getElementById('workdir-input').value = wd;

// Tự động chọn tab theo OS
if (navigator.platform.toUpperCase().indexOf('WIN') !== -1) {
  switchTab('windows');
} else {
  switchTab('linux');
}

renderAll();
