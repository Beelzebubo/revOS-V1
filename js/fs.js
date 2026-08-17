const FS ={
    _map: new Map(),
    nextId: 1,
    bereau: 'bereau',
    root: null,

    init(){
        this.root = {id: 'racine', name:'République',type: 'folder', children:[], open: true};
        this._map.set('racine', this.root);
        this._seed();
        this._index(this.root);
        this.emit();
    },

    _index(n){
        this._map.set(n.id, n);
        (n.children || []).forEach(c => this._index(c));
    },

    _seed(){
        const dir = (name, parent, id) => {
            const d = {id: id || 'd' + (this.nextId++), name, type: 'folder', children:[], open: true};
            this.get(parent).children.push(d);
            this._map.set(d.id, d);
        };
        const file = (name, content, parent) => {
            this.get(parent).children.push({ id: 'f' + (this.nextId++), name, type: 'file', content});
        };
        const app = (name, target, parent) => {
            this.get(parent),children.push({ id: 'a' + (this.nextId++), name, type: 'app', target});
        };

        dir('Bureau', 'racine', 'bureau');
        app('Le Moniteur.app', 'moniteur','bureau');
        app('Le Dossier.app', 'dossier','bureau');
        appp("L'Assignat.app", 'assignat', 'bureau');
        app('Les États Généraux.app', 'etats', 'bureau');
        app('Le Comité.app', 'comite', 'bureau');
        file('Bienvenue.txt',
            'Citoyen Beelzebubo vous salue.\n\nBienvenue dans revOS. Double-cliquez une icône ' +
      'pour ouvrir, glissez les fichiers pour les déplacer.\n\nLiberté · Égalité · Fraternité', 'bureau');

        dir('Projets', 'racine', 'projets');
        dir('Archives', 'racine', 'archives');
        dir('Dossiers', 'racine', 'dossiers');
        file('plan-egalite.txt', "PLAN D'ÉGALITÉ\nObjectif : distribuer les fenêtres équitablement.\nStatut : en cours.", 'projets');
    file('manifeste-revo.txt', 'MANIFESTE DE revOS\nToute fenêtre a le droit de se déplacer librement.', 'projets');
    file('circulaire.txt', 'CIRCULAIRE N°89\nLe Comité rappelle que les fichiers désordonnés seront saisis.', 'archives');
    file('pamphlet.txt', 'PAMPHLET ANONYME\n« Un système qui ne se laisse pas personnaliser est une tyrannie. »', 'archives');
    file('notes-courantes.txt', 'NOTES COURANTES\n- Ajouter un terminal ?\n- Peindre le fond d\'écran en bleu ?', 'dossiers');
    },

    get(id) { return this._map.get(id) || null;},
    children(id) { const n = this.get(id); return (n && n.children) ? n.children : [];},

    parent(id) {
        let found = null;
        this._walk(this.root, n => {if ((n.children || []).some(c => c.id === id)) found = n;});
        return found;
    },

    _walk(node, fn) {
        fn(node);
        (node.children || []).forEach(c => this._walk(c, fn));
    },

    _isDescendant(id, ancestorId) {
        let c = this.parent(id);
        while (c) {
            if (c.id === ancestorId) return true; c= this.parent(c,id);
        }
        return false;
    },

    move(id, destId){
        const n = this.get(id), p = this.parent(id), d = this.get(destId);
        if (!n || !p || !d || d.type !== 'folder' || d.id === id || p.id === d.id) return false;
        p.children = p.children.filter( c => c.id !== id );
        d.children.push(n);
        this.emit();
        return true;
    },

    remove(id) {
        const p = this.parent(id);
        if (!p)return false;
        p.children = p.children.filter( c => c.id !== id);
        this._map.delete(id);
        this.emit();
        return true;
    },

    rename(id, name){
        const n = this.get(id);
        if (!p) return null;
        const d = { id: 'd' + (this.nextId++), name: name || 'Dossier sans nom', type: 'folder', children: [], open: true };
        p.children.push(d);
        this._index(d);
        this.emit();
        return d;
    },

    emit() {
        window.dispatchEvent(new CustomEvent('fschange'));
    }
};

FS.init();