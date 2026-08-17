// revOS — le noyau : démarrage, gestionnaire de fenêtres, barre des tâches, horloge.
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

const OS = {
  z: 10,
  wid: 0,
  wins: new Map(),
  active: null,
  dragId: null,
  revMode: false,
  stats: { windowsOpened: 0 },

  boot() {
    this.renderDesktop();
    document.getElementById('deskmeta').textContent =
      new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) +
      ' · La Nation vous salue, Citoyen Beelzebubo';
    this.tick();
    setInterval(() => this.tick(), 1000);

    document.getElementById('theme').addEventListener('click', () => {
      const dark = document.body.classList.toggle('dark');
      document.getElementById('theme').textContent = dark ? '☾' : '☀';
    });
    document.getElementById('clock').addEventListener('click', () => {
      this.revMode = !this.revMode;
      this.tick();
    });
    document.getElementById('launcher').addEventListener('click', e => {
      e.stopPropagation();
      this.menu(10, innerHeight - 40, Object.values(Apps).map(a => [a.icon + ' ' + a.name, () => this.openApp(a.id)]));
    });

    const desktop = document.getElementById('desktop');
    desktop.addEventListener('dragover', e => e.preventDefault());
    desktop.addEventListener('drop', e => {
      e.preventDefault();
      if (this.dragId && FS.move(this.dragId, 'bureau')) this.dragId = null;
    });
    desktop.addEventListener('contextmenu', e => {
      if (e.target.closest('.desk-icon')) return;
      e.preventDefault();
      this.menu(e.clientX, e.clientY, [
        ['Nouveau dossier', () => { const name = prompt('Nom :'); if (name) FS.mkdir('bureau', name); }]
      ]);
    });
    document.addEventListener('click', () => { document.getElementById('ctxmenu').style.display = 'none'; });
    window.addEventListener('fschange', () => this.renderDesktop());

    setTimeout(() => document.getElementById('boot').classList.add('done'), 2600);
    setTimeout(() => document.getElementById('boot').remove(), 3400);
  },

  tick() {
    const d = new Date();
    document.getElementById('clock').textContent = this.revMode
      ? revCal(d)
      : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  },

  openApp(id) {
    const a = Apps[id];
    if (!a) return;
    for (const o of this.wins.values()) {
      if (o.a.id === id) {
        if (o.min) this.minimizeWin(o);
        else this.focus(o);
        return;
      }
    }
    this.openWindow(a);
  },

  open(n) {
    if (n.type === 'folder') {
      this.openApp('dossier');
      if (FileManager.root) FileManager.nav(n.id);
    } else if (n.type === 'app') this.openApp(n.target);
    else this.openViewer(n);
  },

  openViewer(node) {
    this.openWindow({
      icon: '📄', name: node.name, w: 480, h: 340,
      build() {
        const r = el('div', 'app');
        r.appendChild(el('pre', 'view', node.content || ''));
        return r;
      }
    });
  },

  openWindow(a) {
    const id = ++this.wid;
    this.stats.windowsOpened++;
    window.dispatchEvent(new CustomEvent('statschange'));

    const win = document.createElement('div');
    win.className = 'win';
    win.style.left = (40 + ((id % 6) * 30)) + 'px';
    win.style.top = (30 + ((id % 6) * 24)) + 'px';
    win.style.width = a.w + 'px';
    win.style.height = a.h + 'px';

    const tb = el('div', 'titlebar');
    const t = el('span', 't-title');
    t.textContent = a.icon + ' ' + a.name;
    tb.appendChild(t);
    const btns = el('div', 't-btns');
    const obj = { id, a, el: win, min: false, max: false };
    const ACT = { min: 'minimizeWin', max: 'maximizeWin', close: 'closeWin' };
    ['min', 'max', 'close'].forEach(k => {
      const label = k === 'min' ? '—' : (k === 'max' ? '▢' : '✕');
      const b = el('button', 'tb-' + k, label);
      b.addEventListener('click', e => { e.stopPropagation(); this[ACT[k]](obj); });
      btns.appendChild(b);
    });
    tb.appendChild(btns);

    const body = el('div', 'winbody');
    win.append(tb, body);
    win.addEventListener('pointerdown', () => this.focus(obj), true);
    this.makeDraggable(tb, obj);

    document.getElementById('windows').appendChild(win);
    body.appendChild(a.build());
    this.wins.set(id, obj);
    this.focus(obj);
  },

  makeDraggable(tb, obj) {
    const win = obj.el;
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('.t-btns') || obj.max) return;
      const r = win.getBoundingClientRect();
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      const move = ev => {
        let x = Math.max(0, Math.min(ev.clientX - ox, innerWidth - r.width));
        let y = Math.max(0, Math.min(ev.clientY - oy, innerHeight - 40 - r.height));
        win.style.left = x + 'px';
        win.style.top = y + 'px';
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  },

  focus(obj) {
    this.wins.forEach(o => o.el.classList.remove('focused'));
    obj.el.classList.add('focused');
    obj.el.style.zIndex = ++this.z;
    this.active = obj;
    this.renderTaskbar();
  },

  minimizeWin(obj) {
    obj.min = !obj.min;
    obj.el.style.display = obj.min ? 'none' : 'flex';
    if (!obj.min) this.focus(obj);
    this.renderTaskbar();
  },

  maximizeWin(obj) {
    obj.max = !obj.max;
    obj.el.classList.toggle('max', obj.max);
    if (obj.max) this.focus(obj);
  },

  closeWin(obj) {
    const win = obj.el;
    win.classList.add('guillotining');
    win.appendChild(el('div', 'blade'));
    window.dispatchEvent(new CustomEvent('statschange'));
    setTimeout(() => {
      win.remove();
      this.wins.delete(obj.id);
      if (this.active === obj) this.active = null;
      this.renderTaskbar();
    }, 520);
  },

  renderTaskbar() {
    const box = document.getElementById('tasks');
    box.innerHTML = '';
    this.wins.forEach(o => {
      const b = el('button', 'task' + (o === this.active ? ' active' : ''));
      b.textContent = o.a.icon + ' ' + o.a.name;
      b.addEventListener('click', () => {
        if (o.min) this.minimizeWin(o);
        else if (o === this.active) this.minimizeWin(o);
        else this.focus(o);
      });
      box.appendChild(b);
    });
  },

  renderDesktop() {
    const box = document.getElementById('icons');
    box.innerHTML = '';
    FS.children('bureau').forEach(n => {
      const it = el('div', 'desk-icon');
      it.draggable = true;
      const icon = n.type === 'folder' ? '📁' : (n.type === 'app' ? '🗡️' : '📄');
      const dn = el('div', 'dn');
      dn.textContent = n.name;
      it.append(el('div', 'di', icon), dn);
      it.addEventListener('click', () => {
        document.querySelectorAll('.desk-icon').forEach(x => x.classList.remove('sel'));
        it.classList.add('sel');
      });
      it.addEventListener('dblclick', () => this.open(n));
      it.addEventListener('contextmenu', e => { e.preventDefault(); this.ctxMenu(e.clientX, e.clientY, n); });
      it.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', n.id); e.dataTransfer.effectAllowed = 'move'; this.dragId = n.id; });
      box.appendChild(it);
    });
  },

  menu(x, y, items) {
    const m = document.getElementById('ctxmenu');
    m.innerHTML = '';
    items.forEach(([label, fn]) => {
      const b = el('button', 'ctx-item', label);
      b.addEventListener('click', () => { m.style.display = 'none'; fn(); });
      m.appendChild(b);
    });
    m.style.display = 'block';
    m.style.left = Math.min(x, innerWidth - m.offsetWidth - 8) + 'px';
    m.style.top = Math.min(y, innerHeight - 48 - m.offsetHeight) + 'px';
  },

  ctxMenu(x, y, node) {
    this.menu(x, y, [
      ['Ouvrir', () => this.open(node)],
      ['Renommer', () => {
        const name = prompt('Nouveau nom :', node.name);
        if (name) FS.rename(node.id, name);
      }],
      ['Supprimer', () => {
        if (confirm('Supprimer « ' + node.name + ' » ?')) FS.remove(node.id);
      }]
    ]);
  }
};

function revCal(d) {
  const epoch = Date.UTC(1792, 8, 22);
  const months = ['Vendémiaire', 'Brumaire', 'Frimaire', 'Nivôse', 'Pluviôse', 'Ventôse',
    'Germinal', 'Floréal', 'Prairial', 'Messidor', 'Thermidor', 'Fructidor'];
  const days = ['Primidi', 'Duodi', 'Tridi', 'Quartidi', 'Quintidi', 'Sextidi',
    'Septidi', 'Octidi', 'Nonidi', 'Décadi'];
  let n = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - epoch) / 86400000);
  let year = 1;
  while (n >= (year % 4 === 0 ? 366 : 365)) { n -= (year % 4 === 0 ? 366 : 365); year++; }
  if (n < 360) {
    const m = Math.floor(n / 30), dd = n % 30;
    return days[dd % 10] + ' ' + (dd + 1) + ' ' + months[m] + ' An ' + year;
  }
  return 'Sans-culottide ' + (n - 359) + ' An ' + year;
}

OS.boot();
