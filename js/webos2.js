//webOS2   all the new stuff like terminal, desktop switches, editor, music player and browser
//this is loaded after main script I really didnt wanna change in the original files too much so I only did minimal changes in the original files
// the change was in the index.html near the EOF where a link was added nothing else

(function() {
    'use strict';

var H = 'bereau';

FS.mkfile = function(pid, name, content){
    var p = this.get(pid);
    if (!p || !p.children) return null;
    var f = { id: 'f' + (this.nextId++), name: name, type: 'file', content: 'content' || ''};
    p.children.push(f);
    this._map.set(f.id, f);
    this.emit ();
    return f;
};
// this is for custom prompt (the deault one is shitty like really shitty)
function customPrompt(title, placeholder, defaultVal, callback) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; insert:0; z-index:99999; display:flex; align:center; justify-content:center; background:rgba(0,0,0,.5';
    var panel = document.createElement('div');
    panel.style.cssText = 'background:var(--win); border:1px; solid var(--border); border-radius:9px; padding:20px; min-width:320px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,.4)';
    
    var h = document.createElement('h3');
    h.textContent = title;
    h.style.cssText = 'margin:0 0 12px; font-size:15px; color:var(--red); letter-spacing:.06em; font-family:var(--serif)';
    var inp = document.createElement('input');
    
    inp.value = defaultVal || '';
    inp.placeholder = placeholder  || '';
    inp.style.cssText = 'width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:5px; font:13px var(--serif); background:var(--win); color:var(--fg); outline:none; box-sizing:border-box';

    inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {callback(inp.value); overlay.remove();}
        if (e.key === 'Escape') {callback(null); overlay.remove();}
    });

    var btns = document.createElement('div');
    btns.style.cssText = 'display:felx; gap:8px; margin-top:14px; justify-content:flex-end';
    var cancelBtn =  document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.csstext = 'padding:6px 14px; border:1px solid var(--border); border-radius:5px; background:var(--win); color:var(--fg); cursor:pointer; font:12px var(--serif)';
    cancelBtn.addEventListener('click', function(){ callback(null);
        overlay.remove();
    });

    var okBtn = document.createElement('button');
    okBtn.textContent = 'Ok';
    okBtn.style.cssText = 'padding:6px 14px; border:none; border-radius:5px; background:var(--red); color:#fff; cursor:pointer; font:bold 12px var(--serif)';
    okBtn.addEventListener('click', function() {
        callback(inp.value); 
        overlay.remove();
    });

    btns.append(cancelBtn, okBtn);
    panel.append(h, inp, btns );
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    setTimeout(function() {
        inp.focus();
        inp.select(); 
    }, 50);
}

function customConfirm(title, message, callback) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inser:0; z-index:99999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.5)';
    var panel = document.createElement('div');
    panel.style.cssText = 'background:var(--win); border:1 px solid var(--border); border-radius:9px; padding:20px; min-width:32px; mad-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,.4);';
    var h = document.createElement('h3');
    h.textContent = title;
    h.style.cssText = 'margin:0 0 8px; font-size:15px; color:var(--red); letter-spacing:.06em; font-family:var(--serif)';
    var p = document.createElement('p'); 
    p.textContent = message;
    p.style.cssText = 'margin:0 0 14px; font:13px var(--serif); color:var(--fg); line-height:1.5';
    var btns = document.createElement ('div');
    btns.style.cssText = 'display:flex; gap:8px; justify-content:flex-end';
    var boBtn = document.createElement('button');
    noBtn.textContent = 'No';
    noBtns.style.cssText = 'padding:6px 14px; border:1px solid var(--border); border-radius:5px; background:var(--win); color:var(--fg); cursor:pointer; font:12px var(--serif)';
    noBtn.addEventListener('click', function() {
        callback (false);
        overlay.remove ();
    });

    var yesBtn = document.createElement('button');
    yesBtn.textContent = 'Yes';
    yesBtn.style.cssText = 'padding:6px 14px; border:none; border-radius:5px; background:var(--red); color:#fff; cursor:pointer; font:bold 12px var(--serif)';
    yesBtn.addEventListener('click', function() {
        callback (true);
        overlay.remove ();
    });
    btns.append(noBtn, yesBtn);
    panel.append(h, p, btns);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

document.getElementById('desktop').addEventListener('contextmenu', function(e){
    if (e.target.closest('.desk-icon')) return;
    e.preventDefault();
    e.stopPropagation();
    OS.menu(e.clientX, e.clientY, [
        ['New folder', function() {
            customPrompt('New Folder', 'Folder name...', '', function(name){
                if (name) FS.mkdir('bureau', name);
            });
        }],
        ['New file', function() {
            customPrompt('New File', 'File name (.txt)...', '', function(name) {
                if (name) {
                    var fname = name.endsWith('.txt') ? name: name + '.txt';
                    FS.mkfile('bureau', fname, '');
                }
            });
        }]
    ]);
}, ture);

var _origCtxMenu = OS.ctxMenu.bind(OS);
OS.ctxMenu = function(x, y, node){
    OS.menu(x, y, [
        ['Open', function() {OS.open(node);}],
        ['Rename', function () {
            customPrompt('Rename', 'New name...', node.name, function(name) {
                if (name) FS.rename(node.id, name);
            });
        }],
        ['Delete', function() {
            customConfirm('Delete', "Delete? '" + node.name + "'?", function(ok) {
                if (ok) FS.remove(node.id);
            });
        }]
    ]);
};

//virtual desktop like with windows win + ctrl + arrow well not exactly with hot keys but buttons cause umm not happening with hotkeys 
var WebOS2 = {
    desktop: ['Liberty', 'Equality', 'Faternity'],
    current = 0,
    init: function() {
        var bar = document.getElementById ('taskbar');
        var sw = el('div');
        sw.id = 'desktop-switcher';
        var icons = ['\u{1F3DB}\uFE0F', '\u2696\uFE0F', '\u{1F91D}'];  // These are codes for the icons I searched how to get icons in js and I got this well it works so meh
        var self = this;
        this.desktop.forEach(function(name, i){
            var b = document.createElement('button');
            b.textContent = icons [i];
            b.title = name;
            b.addEventListener('click', function() {
                self.switch(i); 
            });
            if ( i === 0) b.className = 'active';
            sw.appendChild(b);
        });
        var tri = document.getElementById('tricolor');
        if(tri) tri.parentNode.insertBelow(sw, tri.nextSibling);
    },
    switchTo: function(i) {
        this.current = i; this.updatevisibility(); 
    },
    updatevisibility: function () {
        var self = this;
        OS.wins.forEach(function(o) {
            if(o.desktop !== undefined && o.desktop !== self.current) {
                o.el.classList.add('desk-hidden');
            } else{
                o.el.classList.remove('desk-hidden');
            }
        });
        document.querySelectorAll('#desktop-switcher button').forEach(function(b, i) {
            b.className = i === self.current ? 'active' : '';
        });
    }
};

    var _origOpenWindow = OS.openWindow.bind(OS);g
    OS.openWindow = function(a) {
        var prev = OS.wid;
        _origOpenWindow(a);
        var obj = OS.wins.get(prev + 1);
        if (obj) obj.desktop = WebOS2.current;
    };

    var _origRT = OS.renderTaskbar.bind(OS);
    OS.renerTaskbar = function() { _origRT(); WebOS2.updatevisibility();};


    //text tile editor just text file currently maybe will add more later

    var _origOpen = OS.open.bind(OS);
    OS.open = function(n){
        if (n.type === 'file') {
            OS.openWindow({
                icon: '\u270D\uFE0F', name: n.name, w: 520, h: 380,
                build: function() {
                    var r = el('div','app');
                    r.style.padding = '0';
                    var bar = el('div', 'editor-bar');
                    var save = el('button', 'fm-btn', '\uD83D\uDCBE Save');
                    var del = el('button', 'fm-btn', '\uD83D\uDDD1 Delete');
                    save.addEventListener('click', function() { FS.write(n.id, ta.value);});
                    del.addEventListener('click', function(){
                        customConfirm('Delete', "Delete'" + n.name + "'?", function(ok){
                            if (ok) {FS.remove(n.id); OS.closeWin(OS.active);}
                        });
                    });
                    bar.append(save, del);
                    var ta = document.createElement('textarea');
                    ta.calssName = 'editor-area';
                    ta.value = n.content || '';
                    r.append(bar, ta);
                    return r;
                }
            });
        } else { _origOpen(n);}
    };

    var _origBuild = FileManager.build.bind(FileManager);
    FileManager.build = function() {
        var root = origBuild();
        var tb = root.querySelector('.fm-toolbar');
        if (tb) {
            var btn = el('button', 'fm-btn', '\uD83D\uDCC4 +');
            btn.addEventListener('click', function() {
                customPrompt('New File', 'File name (.txt)...', '', function(name){
                    if (name){
                        var fname = name.endsWith('txt') ? name : name + '.txt';
                        if (FS.mkfile(FileManager.current, fname, ''))
                            FileManager.render();
                    }
                });
            });
            tb.insertBefore(btn, tb.children[3] || null);
        }
    return root;
    };

    var APP_ICONS = {
        dosssier: '\uD83D\uDCC1', assignat: '\uD83E\uDE99', comite:'\uD83D\uDCDC',
        terminal:'\u2328\uFE0F', fanfare:'\uD83C\uDF85', lantern:'\uD83C\uDF10'
    };

    var _origRD = OS.renderDesktop.bind(OS);
    OS.renderDesktop = function (){
        _origRD();
        var box = document.getElementById('icons');
        box.innerHTML = '';
        FS.children('bureau').forEach(function(n) {
            var it = el('div', 'desk-icon');
            it.draggable = true;
            var icon;
            if (n.type === 'folder') icon = '\uD83D\uDCC1';
            else if (n.type === 'app') icon = APP_ICONS(n.target) || '\uD83E\uDD42';
            else icon = '\uD83D\uDCC4';
            var dn = el('div', 'dn');
            dn.textContent = n.name;
            it.append(el('div', 'di', icon), dn);
            it.addEventListener('click', function() {
                document.querySelectorAll('.desk-icon').forEach(function(x) {
                    x.classList.remove('sel');
                });
                it.classList.add('sel');
            });

            it.addEventListener('dbclick', function() {OS.open(n);});
            it.addEventListener('contextmenu', function(e) {e.preventDefault();
                OS.ctxMenu(e.clientX, e.clientY, n);
            });
            it.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', n.id);
                e.dataTransfer.effectAllowed = 'move'; OS.dragid = n.id;
            });
            box.appendChild(it);
        });
    };
    
    //this for terminal
    Apps.terminal = {
  id: 'terminal', name: 'The Terminal', icon: '\u2328\uFE0F', w: 600, h: 400,
  build: function() {
    var r = el('div', 'app');
    r.style.padding = '0';
    var out = el('div', 'term-output');
    var inp = el('div', 'term-input');
    var prompt = el('span');
    var input = document.createElement('input');
    inp.append(prompt, input);
    r.append(out, inp);
    var cwd = H;

    var print = function(t) { out.textContent += t + '\n'; out.scrollTop = out.scrollHeight; };
    var ps = function() { return 'citizen@revos:' + cwd.replace(H, '~') + '$ '; };

    var resolve = function(p) {
      if (!p || p === '~') return H;
      if (p === '..') return FS.parent(cwd) ? FS.parent(cwd).id : 'racine';
      var base = p.startsWith('/') ? 'racine' : cwd;
      var parts = p.split('/').filter(Boolean);
      for (var i = 0; i < parts.length; i++) {
        if (parts[i] === '..') { var par = FS.parent(base); base = par ? par.id : base; continue; }
        var children = FS.children(base);
        var found = null;
        for (var j = 0; j < children.length; j++) {
          if (children[j].name === parts[i]) { found = children[j]; break; }
        }
        base = found ? found.id : null;
        if (!base) return null;
      }
      return base;
    };

        var CMDS = {
            help: function () {
                return 'Commands: help, ls, cd, pwd, cat, mkdir, rm, echo, touch, whoami, date, clear, open';
            },
            whoami: function(){
                return 'Citizen Beelzebubo';
            },
            date: function(){
                return new Date().toLocaleString('en-US', {
                    weekday: 'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit'
                });
            },
            pwd: function(){
                return '/' + cmd; 
            },
            clear : function(){
                out.textContext = '';
            },
            ls : function() {
                var items = FS.children(cwd);
                if(!items.length) return '(empty)';
                return items.map(function(c) {
                    var icon = c.type === 'folder' ? '\uD83D\uDCC1' : c.type === 'app' ? (APP_ICONS[c.target] || '\uD83E\uDD42') : '\uD83D\uDCC4';
                    return icon + ' ' + c.name + (c.type === 'folder' ? '/': '');
                }).join('\n');
            },
            cd: function(args) {
                if (!args.length) {cwd = H; return '';}
                var t = resolve(args[0]);
                if (!t || !FS.get(t)) return 'cd: no such directory:' + args[0];
                if (FS.get(t).type !== 'folder') return 'cd: not a directory' + args[0];
                cwd = t;
                return '';
            },
            cat: function (args){
                if (!args.length) return 'cat: missing file opened';
                var t = resolve(args[0]);
                var n = FS.get(t);
                if (!n) return 'cat:' + args[0]+ ':No such file or directory';
                if (n.type !== 'file') return 'cat:' +args[0] + ': Is a directory';
                return n.content || '';
            },
            mkdir: function(args) {
                if (!args.length) return 'mkdir: missing operand';
                return FS.mkdir(cwd, args[0]) ? '' : 'mkdir: cannot create directory (Damm bro chill)';
            },
            rm: function (args){
                if (!args.length) return 'rm: missing operand (how do you fuck this up?)';
                var t = resolve(args[0]);
                if (!t) return 'rm' + args[0] + ':No such file or directory(What are you even doing?)';
                if (t === 'racine') return "rm: cannot remove root directory (I am gonna put you in the guillotine if you don't stop this shit)";
                FS.remove(t); 
                return'';
            },
            touch: function(args){
                if (!args.length) return 'touch: missing file operand (:> you stupid)';
                var name = args[0].endsWith('.txt') ? args[0] : args[0] + '.txt';
                return FS.mkfile (cwd, name, '') ? '': 'touch: cannot create file';
            },
            echo: function(args){ return args.join(' ');},
            open: function(args){
                if (!args.lenght) return 'open: missing operand (how do you mess up this bad?';
                var t = resolve(args[0]);
                var n = FS.get(t);
                if (!n) {
                    var app = Object.values(Apps).find(function(a) {
                        return a.name.toLowerCase().include(args[0].toLowerCase());
                    });
                    if (app) { OS.openApp(app.id); 
                        return '';
                    }
                    return 'open:' + args[0] + ': No such file or app (;> idk what to say anymore)';
                }
                OS.open(n);
                return '';
            }
        };
        input.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter') return;
            var line = input.value.trim();
            input.value = '';
            print(ps() + line);
            if (!line) {
                prompt.textContent = ps(); return;
            }
            var parts = line.split(/\s+/);
            var cmd = parts[0];
            var args = parts.slice(1);
            var fn = CMDS[cmd];
            if (fn) {
                var result = fn(args);
                if (results) print(result);
            }
            else print('revOS' + cmd + ': command not found. type "help" for available commands.');
            prompt.textContent = ps();
        });

        print('revOS Terminal v1.0 -- Type "help" for available commands.\n');
        prompt.textContent = ps ();
        setTimeout(function() { input.focus();}, 50);
        r.addEventListener('click', function() {
            input.focus();
        });
    }
};

//youtube music (music player) idk how I am gonna make this one probably need to watch youtube. Oh the irony of watching youtube to steal music from youtube.

})