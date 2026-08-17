const DEVLOG = [
  { date: 'Acte I — 16 août 2026', title: 'Le socle de la République',
    text: 'Boot tricolore, bureau, barre des tâches, horloge (calendrier révolutionnaire).\nLe squelette est posé : toute application s\'y greffera.' },
  { date: 'Acte II — 16 août 2026', title: 'La fenêtre et la lame',
    text: 'Le gestionnaire de fenêtres : déplacer, empiler, réduire, agrandir…\nEt fermer à la guillotine.' },
  { date: 'Acte III — 16 août 2026', title: 'Le Dossier, fonction secrète',
    text: 'Fonction que le guide ne demandait pas : un vrai gestionnaire de fichiers.\nGlisser-déposer entre dossiers et Bureau, icônes cliquables, apps = fichiers (.app).' },
  { date: 'Acte IV — 16 août 2026', title: 'Cosmétique et partage',
    text: 'Thème jour/nuit (Égalité / Terreur), applications génériques.\nPrêt à partager — sans mot de passe.' },
  { date: 'Acte V — 16 août 2026', title: 'Le visage',
    text: 'Refonte du style : papier filigrané, fenêtres à relief, barre des tâches avec\nlauncher « Assemblée ». Maintenant ça ressemble à un vrai système.' },
  { date: 'Acte VI — 16 août 2026', title: 'La faute capitale',
    text: 'Bug critique corrigé : le système de fichiers s\'initialisait avant d\'indexer\nsa racine → zéro icône, boutons morts. Testé en navigateur headless : plus aucune erreur.' }
];


const FileManager = {
    current : 'bereau',
    root: null, history: [],

    build () {
        this.current = 'bereau';
        this.history = [];
        const root = el('div', 'app app-dossier');
        root.appendChild(el('header', 'masthead', 
            '<h2>LE DOSSIER </h2><span>Bereau national des finchiers . glassez pour désplacer</span>'
        ));

        const toolbar = el('div', 'fm-toolbar');
        const back = el('button', 'fm-btn', '<-'), up = el('button', 'fm-btn', '↑');
        const mk = el('button', 'fm-btn', '📁 +');
        back.addEventListener('click',() => { if ( this.history.length) this.nav( this.history.pop()); 
        });
        up.addEventListener('click', () => { const p = FS.parent(this.current); if (p) this.nav(p.id);});
        mk.addEventListener ('click', () => { const name = prompt('Nom du dossier :'); if (name) FS.mkdir(this.current, name);
        });

        const crumbs = el('div', 'fm-crumbs');
        toolbar.append(back, up, mk, crumbs);

        const split = el('div', 'fm-split');
        this.tree = el('div', 'fm-tree');
        this.grid = el('div', 'fm-grid');
        split.append(this.tree, this.grid);

        const status = el('div', 'fm-status');
        root.append(toolbar, split, status);

        this.grid.addEventListener('dragover', e => { e.preventDefault();
          this.grid.classList.add('drop');
        });
        this.grid.addEventListener('dragleave', () => this.grid.classList.remove('drop'));
        this.grid.addEventListener('drop', e => {
          e.preventDefault(); this.grid.classList.remove('drop'); this.moveTo(this.current);
        });
        window.addEventListener('fschange', () => this.render());

        this.root = root;
        this.render();
        return root;
    },

    //fuck this language I hate it.

    nav(id) { this.current = id; this.render();},

    render(){
      let node = FS.get(this.current);
      if (!node){ node = FS.get('racine'); this.current = 'racine';}

      this.tree.innerHTML = '';
      const buildTree = n => {
        const label = el('span', 'tree-label');
        label.textContent = (n.open ? '▾ ' : '▸ ') + '📁 ' + n.name;
        label.addEventListener('click', e => { e.stopPropagation(); n.open = !n.open; this.render();
        });
        label.addEventListener('dblclick', e => { e.preventDefault(); e.stopPropagation();
          this.moveTo(n.id);
        });
        const li = el('li');
        li.appendChild ('label');
        if (n.open && n.children) {
          const ul = el('ul');
          n.children.forEach(c => { if (c.type === 'folder') ul.appendChild(buildTree(c));});
          li.appendChild(ul);
        }
        return li;
      };
      this.tree.appendChild(buildTree(FS.root));

      this.root.querySelector('.fm-crumbs').innerHTML = '';
      const chain = []; let c = node;
      while (c) { chain.unshift(c); c = FS.parent(c.id);}
      chain.forEach(n => {
        const b = el('button', 'crumb');
        b.textContent = n.name;
        b.addEventListener('click', () => this.nav(n.id));
        this.root.querySelector('.fm-crumbs').appendChild(b);
      });

      this.grid.innerHTML = '';
      FS.children(this.current).forEach(n => this.grid.appendChild(this.item(n)));
      this.root.querySelector('.fm-status').textContent = 
        FS.children(this.current).length + 'element(s) . ' + node.name;
    },

    item(n){
      const it = el('div', 'fm-item' + (n.type === 'folder' ? 'folder' : ''));
      it.draggable = true;
      const icon = n.type === 'folder' ? '📁' : (n.type === 'app' ? '🗡️' : '📄');
      const nm = el('div', 'fm-name');
      nm.textContent = n.name;
      it.append(el('div', 'fm-icon', icon),nm);
      it.addEventListener('click',() => {
        document.querySelectorAll('.fm-item').forEach(x => x.classList.remove('sel'));
        it.classList.add('sel');
      });
      it.addEventListener('dblclick', () => this.open(n));
      it.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation();
        OS.ctxMenu(e.clientX, e.clientY, n);
      });
      it.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', n.id);
        e.dataTransfer.effectAllowed = 'move'; OS.dragId = n.id;
      });
      it.addEventListener('dragover', e =>{
        if (n.type === 'folder') { e.preventDefault(); e.stopPropagation(); it.classList.add('drop');   
        }
      });
      return it;
    },

    open(n) {
      if (n.type === 'folder') { this.history.push(this.current); this.nav(n.id);}
      else OS.open(n);
    },

    moveTo(destId) {
      if (OS.dragId && FS.move(OS.dragId, destId)) OS.dragId = null;
    }
};

const Apps = {
  moniteur: {
    id: 'moniteur', name: 'Le Moniteur', icon: '📰', w: '500', h: '400',
    build(){
      const root = el('div', 'app');
      root.appendChild(el('header', 'masthead', '<h2>LE MONITEUR</h2><span>Journal officiel</span>'));
      const feed = el('div', 'feed');
      DEVLOG.forEach(e => {
        const art = el('article', 'article');
        art.appendChild(el('h3',null, e.title));
      })
    }
    
  }
}