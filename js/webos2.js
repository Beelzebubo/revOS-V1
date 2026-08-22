//webOS2   all the new stuff like terminal, desktop switches, editor, music player and browser
//this is loaded after main script I really didnt wanna change in the original files too much so I only did minimal changes in the original files
// the change was in the index.html near the EOF where a link was added nothing else

(function() {
    'use strict';

var H = 'bureau';

FS.mkfile = function(pid, name, content){
    var p = this.get(pid);
    if (!p || !p.children) return null;
    var f = { id: 'f' + (this.nextId++), name: name, type: 'file', content: content || ''};
    p.children.push(f);
    this._map.set(f.id, f);
    this.emit ();
    return f;
};

FS.write = function(id, content) {
    var n = this.get(id);
    if (!n || n.type !== 'file') return false;
    n.content = content;
    this.emit();
    return true;
}
// this is for custom prompt (the deault one is shitty like really shitty)
function customPrompt(title, placeholder, defaultVal, callback) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; z-index:99999; display:flex; align:center; justify-content:center; background:rgba(0,0,0,.5)';
    var panel = document.createElement('div');
    panel.style.cssText = 'background:var(--win); border:1px solid var(--border); border-radius:9px; padding:20px; min-width:320px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,.4)';
    
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
    btns.style.cssText = 'display:flex; gap:8px; margin-top:14px; justify-content:flex-end';
    var cancelBtn =  document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:6px 14px; border:1px solid var(--border); border-radius:5px; background:var(--win); color:var(--fg); cursor:pointer; font:12px var(--serif)';
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
    overlay.style.cssText = 'position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.5)';
    var panel = document.createElement('div');
    panel.style.cssText = 'background:var(--win); border:1px solid var(--border); border-radius:9px; padding:20px; min-width:320px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,.4);';
    var h = document.createElement('h3');
    h.textContent = title;
    h.style.cssText = 'margin:0 0 8px; font-size:15px; color:var(--red); letter-spacing:.06em; font-family:var(--serif)';
    var p = document.createElement('p'); 
    p.textContent = message;
    p.style.cssText = 'margin:0 0 14px; font:13px var(--serif); color:var(--fg); line-height:1.5';
    var btns = document.createElement ('div');
    btns.style.cssText = 'display:flex; gap:8px; justify-content:flex-end';
    var noBtn = document.createElement('button');
    noBtn.textContent = 'No';
    noBtn.style.cssText = 'padding:6px 14px; border:1px solid var(--border); border-radius:5px; background:var(--win); color:var(--fg); cursor:pointer; font:12px var(--serif)';
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
}, true);

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
    desktops: ['Liberty', 'Equality', 'Fraternity'],
    current : 0,
    init: function() {
        var bar = document.getElementById ('taskbar');
        var sw = el('div');
        sw.id = 'desktop-switcher';
        var icons = ['\u{1F3DB}\uFE0F', '\u2696\uFE0F', '\u{1F91D}'];  // These are codes for the icons I searched how to get icons in js and I got this well it works so meh
        var self = this;
        this.desktops.forEach(function(name, i){
            var b = document.createElement('button');
            b.textContent = icons [i];
            b.title = name;
            b.addEventListener('click', function() {
                self.switchTo(i); 
            });
            if ( i === 0) b.className = 'active';
            sw.appendChild(b);
        });
        var tri = document.getElementById('tricolore');
        if(tri) tri.parentNode.insertBefore(sw, tri.nextSibling);
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

    var _origOpenWindow = OS.openWindow.bind(OS);
    OS.openWindow = function(a) {
        var prev = OS.wid;
        _origOpenWindow(a);
        var obj = OS.wins.get(prev + 1);
        if (obj) obj.desktop = WebOS2.current;
    };

    var _origRT = OS.renderTaskbar.bind(OS);
    OS.renderTaskbar = function() { _origRT(); WebOS2.updatevisibility();};


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
                    ta.className = 'editor-area';
                    ta.value = n.content || '';
                    r.append(bar, ta);
                    return r;
                }
            });
        } else { _origOpen(n);}
    };

    var _origBuild = FileManager.build.bind(FileManager);
    FileManager.build = function() {
        var root = _origBuild();
        var tb = root.querySelector('.fm-toolbar');
        if (tb) {
            var btn = el('button', 'fm-btn', '\uD83D\uDCC4 +');
            btn.addEventListener('click', function() {
                customPrompt('New File', 'File name (.txt)...', '', function(name){
                    if (name){
                        var fname = name.endsWith('.txt') ? name : name + '.txt';
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
        dossier: '\uD83D\uDCC1', assignat: '\uD83E\uDE99', comite:'\uD83D\uDCDC',
        terminal:'\u2328\uFE0F', fanfare:'\uD83C\uDFB5', lantern:'\uD83C\uDF10'
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
            else if (n.type === 'app') icon = APP_ICONS[n.target] || '\uD83E\uDD42';
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

            it.addEventListener('dblclick', function() {OS.open(n);});
            it.addEventListener('contextmenu', function(e) {e.preventDefault();
                OS.ctxMenu(e.clientX, e.clientY, n);
            });
            it.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', n.id);
                e.dataTransfer.effectAllowed = 'move'; OS.dragId = n.id;
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
                return '/' + cwd; 
            },
            clear : function(){
                out.textContent = '';
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
                if (!args.length) return 'open: missing operand (how do you mess up this bad?';
                var t = resolve(args[0]);
                var n = FS.get(t);
                if (!n) {
                    var app = Object.values(Apps).find(function(a) {
                        return a.name.toLowerCase().includes(args[0].toLowerCase());
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
            if (fn) { var result = fn(args); if (result) print(result);}
            else print('revOS' + cmd + ': command not found. type "help" for available commands.');
            prompt.textContent = ps();
        });

        print('revOS Terminal v1.0 -- Type "help" for available commands.\n');
        prompt.textContent = ps ();
        setTimeout(function() { input.focus();}, 50);
        r.addEventListener('click', function() {
            input.focus();
        });
        return r;
    }
};

//youtube music (music player) idk how I am gonna make this one probably need to watch youtube. Oh the irony of watching youtube to steal music from youtube.
//direct iframe embed so its uses no API. Well I will try at least to make it work.

var REVO_MUSIC =  [
    { title: 'La Marseillaise (FR/EN)', id:'PIQSEq6tEVs'},
    { title: 'La Marseillaise- Mireille Mathieu', id: 'SIxOl1EraXA'},   //these code are form youtube https://www.youtube.com/watch?v=hDU4GB1PTxc&list=RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng7fyNgFKWNJFs&index=2  
    // the link above for example's id would be everything after ?v=hDU4GB1PTxc this was a pain to get from youtube.
    {title: 'Cra Ira (It will be Fine)', id: '-HgdeXdkdRo'},
    {title: 'La Carmagnole', id:'u-tqxx2VrpI'}
];
var currentYTFrame = null;
var currentPlayBtn = null;
var fanfarePlayerContainer = null;

function playVideo(videoId) {
    if (currentYTFrame) { currentYTFrame.remove();
        currentYTFrame = null;
    }
    if (!fanfarePlayerContainer) return;

    var frame = document.createElement('iframe');
    frame.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1';
    frame.allow ='autoplay; encrypted-media';
    frame.style.cssText = 'width:100%; height:100%; border:none; border-radius:6px';
    fanfarePlayerContainer.innerHTML = '';
    fanfarePlayerContainer.appendChild(frame);
    fanfarePlayerContainer.style.display = 'block';
    currentYTFrame = frame;
}

function stopVideo() {  //name already implies what its for no?
    if(currentYTFrame) {
        currentYTFrame.remove();
        currentYTFrame = null;
    }
    if (fanfarePlayerContainer) {fanfarePlayerContainer.innerHTML = '';
        fanfarePlayerContainer.style.display = 'none';}
    }

    function extractVideoId(input) {  //this is for the search function where you enter the name of the song only
        if(!input) return null;
        input = input.trim();
        if (/^[\w-]{11}$/.test(input)) return input;
    var m = input.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
    }

    Apps.fanfare = {
        id: 'fanfare', name: 'The Fanfare', icon: '\uD83C\uDFB5', w: 480, h:440,
        build: function () {
            var r = el('div', 'app');
            r.appendChild(el('header', 'masthead', '<h2>THE FANFARE</h2><span>Revolutionary music and more</span>'));

        //now then this is for the search bar

        var search = el('div', 'fanfare-search');
        var snip = document.createElement('input');
        snip.placeholder = 'Search by name or paste Youtube URL...';
        snip.className = 'fanfare-search-input';
        var sbtn = el('button', 'fm-btn', 'Search');
        search.append(snip, sbtn);
        r.appendChild(search);

        fanfarePlayerContainer = el('div', 'fanfare-player');
        fanfarePlayerContainer.style.cssText = 
                'display:none; width:100%; height:200px; margin:8px 0; border-radius:6px; overflow:hidden; background:#000';
        r.appendChild(fanfarePlayerContainer);

        // search handler. As the name suggests it handles the search
        sbtn.addEventListener('click', function() {
            var val = snip.value.trim();
            if (!val) return;
            var vid = extractVideoId(val);
            if (vid) {
                playVideo(vid);
            }else {
                //if its not a url and instead a name then youtube will search by name in new tab
                window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(val), '_blank');
            }
        });
        snip.addEventListener('keydown', function(e) {
            if (e.key === 'Enter')
                sbtn.click();
        });

        var list = el('div', 'fanfare-list');
        REVO_MUSIC.forEach(function(song){
            var row = el('div','fanfare-song');
            var title = el('span');
            title.textContent = '\uD83C\uDFB5' + song.title;
            var btn = el('button', 'fm-btn', '\u25B6');
            btn.addEventListener('click', function(){
                var allBtns = list.querySelectorAll('.fm-btn');
                allBtns.forEach(function(b) {
                    b.textContent = '\u25B6';
                    b.classList.remove('playing');
                });
                playVideo(song.id);
                btn.textContent = '\u23F8';
                btn.classList.add('playing');
                currentPlayBtn = btn;
            });
            row.append(title, btn);
            list.appendChild(row);
        });
        r.appendChild(list);
            return r;
        }
    };

    Apps.lantern = {
     id: 'lantern', name: 'The Lantern', icon:'\uD83C\uDF10', w: 680, h:480,
    build: function(){
        var r = el('div', 'app');
        r.style.padding = '0';
        r.style.flexDirection = 'column';

        // now the url bar
        var bar = el('div', 'lantern-bar');
        var inp = document.createElement('input');
        inp.placeholder = 'Search or enter URl...';
        inp.className = 'lantern-url';
        var go = el('button', 'fm-btn', '\u2192 Go');
        bar.append(inp, go);

        var frame = document.createElement('iframe');
        frame.className = 'lantern-frame';
        frame.sandbox = 'allow-scripts allow-same-origin allow-popups';

        var homePage = '<!DOCTYPE html><html><head><style>'
             + '*{box-sizing:border-box;margin:0}html,body{height:100%}'
                    + 'body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;'
        + 'padding:32px 20px;font-family:Georgia,serif;color:#e9e2d2;text-align:center;overflow:auto;'
                  + 'background:radial-gradient(ellipse at 15% 8%,rgba(30,79,138,.30),transparent 50%),'
               + 'radial-gradient(ellipse at 85% 12%,rgba(168,44,30,.22),transparent 50%),'
            + 'repeating-linear-gradient(0deg,rgba(255,255,255,.015) 0 2px,transparent 2px 5px),'
      + 'linear-gradient(180deg,#1b2742 0%,#0f1626 100%)}'
            + 'body::before{content:"";position:fixed;top:0;left:0;right:0;height:5px;z-index:2;'
         + 'background:linear-gradient(90deg,#1e4f8a 0 33.4%,#f4efe6 33.4% 66.7%,#b5342a 66.7% 100%)}'
                      + '.cockade{width:46px;height:46px;border-radius:50%;border:2px solid #c9a227;'
             + 'background:conic-gradient(#1e4f8a 0 33.3%,#f4efe6 33.3% 66.6%,#b5342a 66.6% 100%);'
                      + 'box-shadow:0 0 18px rgba(201,162,39,.35)}'
            + 'h1{font-size:clamp(28px,5vw,44px);letter-spacing:.22em;color:#c9a227;'
                + 'text-shadow:0 2px 0 rgba(0,0,0,.5)}'
                  + '.slogan{font-style:italic;font-size:13px;letter-spacing:.14em;opacity:.75}'
      + 'form{display:flex;gap:8px;width:min(520px,94%)}'
            + 'input{flex:1;min-width:0;padding:11px 18px;border-radius:24px;border:1px solid rgba(201,162,39,.45);'
                + 'background:rgba(255,255,255,.07);color:#f4efe6;font:14px Georgia,serif;outline:none;'
             + 'box-shadow:inset 0 2px 6px rgba(0,0,0,.35)}'
                + 'input::placeholder{color:rgba(233,226,210,.45);font-style:italic}'
                + 'input:focus{border-color:#c9a227;box-shadow:0 0 0 3px rgba(201,162,39,.18),inset 0 2px 6px rgba(0,0,0,.35)}'
      + 'button{padding:11px 20px;border-radius:24px;border:1px solid #8a6d14;cursor:pointer;'
      + 'font:bold 13px Georgia,serif;letter-spacing:.06em;color:#211c16;'
            + 'background:linear-gradient(180deg,#e8cf6a,#c9a227);'
      + 'box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 2px 6px rgba(0,0,0,.4)}'
        + 'button:hover{filter:brightness(1.08)}'
      + '.tiles{display:grid;grid-template-columns:repeat(4,minmax(118px,150px));gap:14px}'
      + '@media(max-width:560px){.tiles{grid-template-columns:repeat(2,1fr)}}'
               + '.tile{display:flex;flex-direction:column;align-items:center;gap:7px;padding:18px 10px 14px;'
            + 'text-decoration:none;color:#e9e2d2;border:1px solid rgba(201,162,39,.30);border-radius:9px;'
      + 'background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));'
      + 'box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 4px 12px rgba(0,0,0,.35);'
      + 'transition:transform .12s,border-color .12s,box-shadow .12s}'
      + '.tile:hover{transform:translateY(-3px);border-color:#c9a227;'
            + 'box-shadow:0 8px 20px rgba(0,0,0,.45),0 0 14px rgba(201,162,39,.18)}'
      + '.tile .ico{font-size:2rem}.tile .lbl{font-size:12px;opacity:.8}'
      + '</style></head><body>'
            + '<div class="cockade"></div>'
      + '<h1>La Lanterne</h1>'
      + '<p class="slogan">Your window to the world</p>'
      + '<form><input id="hs" placeholder="Search Wikipedia...">'
    + '<button onclick="var q=document.getElementById(\'hs\').value;'
        + 'if(q)location.href=\'https://en.wikipedia.org/w/index.php?search=\'+encodeURIComponent(q);return false">Search</button></form>'
      + '<div class="tiles">'
            + '<a class="tile" href="https://en.wikipedia.org/wiki/French_Revolution"><div class="ico">\uD83C\uDFDB\uFE0F</div><div class="lbl">French Revolution</div></a>'
      + '<a class="tile" href="https://en.wikipedia.org/wiki/History_of_France"><div class="ico">\uD83D\uDCDC</div><div class="lbl">History of France</div></a>'
        + '<a class="tile" href="https://en.wikipedia.org/wiki/La_Marseillaise"><div class="ico">\uD83C\uDFB5</div><div class="lbl">La Marseillaise</div></a>'
        + '<a class="tile" href="https://en.wikipedia.org/wiki/Napoleon"><div class="ico">\u2694\uFE0F</div><div class="lbl">Napoleon</div></a>'
      + '</div></body></html>';
// this shit took me the fuck out 
      frame.srcdoc = homePage

      var nav = function () {
        var url = inp.value.trim();
        if (!url) return;
        if (!url.startsWith('http')) url = 'https://' + url;
        frame.removeAttribute('srcdoc');
        frame.src = url;
      };

      go.addEventListener('click', nav);
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') nav();
      });
      r.append(bar, frame);
      return r;
    }    
};

function addDesktopApps () {
    var bureau = FS.get('bureau');
    if (!bureau || !bureau.children) return;
    var exist = new Set(bureau.children.map(function(c) {
        return c.name;
    }));
    [
        {name: 'The Terminal', target: 'terminal'},
        {name: 'The Fanfare', target: 'fanfare'},
        {name:'The Lantern', target:'lantern'}
    ].forEach(function(a) {
        if (!exist.has(a.name)) {
            bureau.children.push({
                id: 'a'  + (FS.nextId++), name: a.name, type: 'app', target: a.target
            });
        }
    });
}

addDesktopApps();
WebOS2.init();
OS.renderDesktop();
}) ();