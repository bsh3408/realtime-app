/* ════════════════════════════════════════════════════════════════
 *  rules.js — 외계 행성 진화 게임의 «규칙» 전부
 *  2026 광주하남영재교육원 · 중학 융합과정 (변석환) · 18차시
 *
 *  이 파일에는 서버도 화면도 없다. 순수한 규칙만 있다.
 *  학생 화면·선생님 화면·빔 화면이 똑같이 읽어서 값이 어긋나지 않는다.
 *
 *  ══ 학생에게 «정답표» 를 주지 않는다 ═══════════════════════════
 *  어느 구역에서 무엇이 유리한지는 화면 어디에도 나오지 않는다.
 *  학생은 죽고 살아남는 것을 보고 스스로 알아내야 한다.
 *  그래서 fav 표는 여기(코드)에만 있고, 화면으로는 절대 내보내지 않는다.
 *
 *  모듈을 쓰지 않는다. window.RULES 로 올린다.
 * ════════════════════════════════════════════════════════════════ */

(function (전역) {
  'use strict';

  /* ── 유전자 13개 ──────────────────────────────────────────────
     값 2 = 순종우성(FF) · 1 = 잡종(Ff) · 0 = 순종열성(ff)
     겉모습은 «우성이 하나라도 있으면 우성» (우열의 법칙)

     보임:true  — 그림에 드러난다. 남의 개체도 눈으로 보고 고를 수 있다
     보임:false — 그림에 안 드러난다. 교배해 봐야, 살아 봐야 안다
                  숨은 형질도 환경에 따라 유불리가 있다 */
  var GENES = [
    /* 보이는 형질 9 */
    { k:'fur',   n:'털',          s:'F', d:'두꺼움', r:'얇음',   보임:true },
    { k:'color', n:'색',          s:'D', d:'어두움', r:'밝음',   보임:true },
    { k:'eye',   n:'눈',          s:'E', d:'큰 눈',  r:'작은 눈', 보임:true },
    { k:'leg',   n:'다리',        s:'L', d:'많음',   r:'적음',   보임:true },
    { k:'tall',  n:'키',          s:'T', d:'큼',     r:'작음',   보임:true },
    { k:'water', n:'물저장 조직', s:'W', d:'있음',   r:'없음',   보임:true },
    { k:'grip',  n:'발톱',        s:'G', d:'강함',   r:'약함',   보임:true },
    { k:'arm',   n:'팔',          s:'A', d:'있음',   r:'없음',   보임:true },
    { k:'fin',   n:'지느러미',    s:'N', d:'있음',   r:'없음',   보임:true },
    /* 숨은 형질 4 — 겉으로 드러나지 않는다 */
    { k:'life',  n:'수명',        s:'V', d:'긺',     r:'짧음',   보임:false },
    { k:'fec',   n:'번식력',      s:'R', d:'높음',   r:'낮음',   보임:false },
    { k:'heat',  n:'내열',        s:'H', d:'강함',   r:'약함',   보임:false },
    { k:'tox',   n:'내독',        s:'X', d:'강함',   r:'약함',   보임:false }
  ];
  var NG = GENES.length;
  var 보이는수 = 0;
  for (var _i = 0; _i < NG; _i++) if (GENES[_i].보임) 보이는수++;

  /* ── 잡종이 유리한 형질 ───────────────────────────────────────
     물저장 조직만은 «잡종일 때» 적응도가 오른다.
       WW = 물주머니가 둘 — 넉넉하지만 몸이 무거워 굼뜨다
       Ww = 하나        — 딱 좋다
       ww = 없음        — 마른 곳에서 버티지 못한다
     이게 없으면 학생이 잡종을 고를 이유가 없어 멘델이 게임에서 사라진다.
     이 사실도 학생에게 알려 주지 않는다. 여러 번 낳아 보고 알아내야 한다. */
  var HET = { water: 14 };

  /* ── 바이옴 ───────────────────────────────────────────────────
     왼→오른쪽으로 더워지고, 위→아래로 습해진다.
     바다(sea)는 아주 습한 쪽 끝에 있다 — 비가 계속 늘면 저절로 나타나고,
     «대지 침강» 사건으로 한꺼번에 생기기도 한다.

     fav = 이 구역에서 유리한 겉모습 (1=우성 쪽, 0=열성 쪽)
     w   = 그 형질의 중요도 (안 적으면 1)
     ★ 이 표는 학생에게 절대 보여 주지 않는다 ★ */
  var BIOMES = [
    { key:'snow',   name:'눈 덮인 곳',   emoji:'❄️', t:0.05, m:0.15, bg:'#cfe6ff', ink:'#123',
      fav:{ fur:1, color:0, water:0, arm:0, life:1, fec:0 },        w:{ fur:2, color:2 } },
    { key:'tundra', name:'툰드라',       emoji:'🌫️', t:0.20, m:0.55, bg:'#b7c4cd', ink:'#123',
      fav:{ fur:1, color:0, tall:0, leg:1, life:1 },                w:{ fur:1.5 } },
    { key:'taiga',  name:'침엽수림',     emoji:'🌲', t:0.38, m:0.82, bg:'#2f5d43', ink:'#eaffe9',
      fav:{ tall:1, arm:1, grip:1, color:1, tox:1 },                w:{ arm:1.5 } },
    { key:'grass',  name:'초원',         emoji:'🌾', t:0.52, m:0.22, bg:'#bcc96a', ink:'#1a1a00',
      fav:{ leg:1, eye:1, tall:1, color:0, fur:0, fec:1 },          w:{ leg:2 } },
    { key:'forest', name:'초록 숲·천적', emoji:'🐾', t:0.58, m:0.68, bg:'#2e7d4f', ink:'#eaffe9',
      fav:{ color:1, eye:1, leg:1, arm:1, tall:0, fec:1 },          w:{ color:2, eye:1.5 } },
    { key:'rock',   name:'바위산',       emoji:'🪨', t:0.48, m:0.38, bg:'#8a8f9a', ink:'#111',
      fav:{ grip:1, leg:1, color:1, water:0, tox:1, life:1 },       w:{ grip:2 } },
    { key:'jungle', name:'높은 나무숲',  emoji:'🌴', t:0.80, m:0.80, bg:'#3a6b2f', ink:'#eaffe9',
      fav:{ tall:1, arm:1, grip:1, eye:1, fur:0, fec:1 },           w:{ tall:2, arm:1.5 } },
    { key:'desert', name:'더운 사막',    emoji:'🏜️', t:0.95, m:0.10, bg:'#e3c47e', ink:'#3a2600',
      fav:{ water:1, fur:0, color:0, eye:0, leg:0, heat:1, fec:0 }, w:{ water:2, heat:1.5 } },
    /* 바다 — 아주 습한 쪽. 헤엄치지 못하면 못 산다 */
    { key:'sea',    name:'바다',         emoji:'🌊', t:0.55, m:1.28, bg:'#2f7fb5', ink:'#eaf6ff',
      fav:{ fin:1, leg:0, tall:0, fur:0, grip:0, tox:1 },           w:{ fin:3, leg:1.5 } }
  ];

  /* ══ 재해 ══════════════════════════════════════════════════════
     세대마다 낮은 확률로 한 구역 일대를 덮친다.
     사건마다 «살아남게 해 주는 형질» 이 다르다. 이것도 알려 주지 않는다.

     기본생존 = 아무 형질도 안 맞을 때의 생존 확률
     살아남는 = 맞으면 생존 확률이 오르는 형질 (1=우성 쪽, 0=열성 쪽)
     지형     = 사건이 끝난 뒤 그 칸이 무엇으로 바뀌는가 (null 이면 그대로) */
  var EVENTS = [
    { k:'volcano', n:'화산 폭발', emoji:'🌋', 범위:2, 기본생존:0.15,
      살아남는:{ heat:1, tox:1, fur:0 }, w:{ heat:3, tox:1.5 }, 지형:'rock',
      말:'뜨거운 재가 하늘을 덮었습니다' },
    { k:'meteor',  n:'운석 충돌', emoji:'☄️', 범위:3, 기본생존:0.12,
      살아남는:{ tox:1, grip:1, tall:0 }, w:{ tox:2.5, tall:1.5 }, 지형:null,
      말:'하늘에서 돌이 떨어져 먼지가 뒤덮었습니다' },
    { k:'quake',   n:'지진',      emoji:'🌎', 범위:4, 기본생존:0.30,
      살아남는:{ leg:1, tall:0, grip:1 }, w:{ leg:2.5 }, 지형:null,
      말:'땅이 흔들려 서 있기가 힘듭니다' },
    { k:'sink',    n:'대지 침강', emoji:'🌊', 범위:3, 기본생존:0.08,
      살아남는:{ fin:1, water:1 }, w:{ fin:4 }, 지형:'sea',
      말:'땅이 가라앉아 바다가 되었습니다' },
    { k:'rise',    n:'대지 융기', emoji:'⛰️', 범위:3, 기본생존:0.35,
      살아남는:{ leg:1, grip:1, fin:0 }, w:{ grip:2 }, 지형:'rise',
      말:'바다가 솟아올라 마른 땅이 되었습니다' }
  ];

  var PHASES = ['setup', 'survive', 'move', 'breed', 'next', 'env'];
  var PHASE_NAME = {
    lobby:'참가 대기', setup:'유전자 제작', survive:'생존 판정', move:'이동',
    breed:'교배', next:'세대 교체', env:'환경 변화', end:'게임 끝'
  };

  function 기본설정() {
    return {
      /* 생존 확률 = base + 적응도/100 × span
         적응도 0 → 20% · 50 → 50% · 100 → 80% */
      base:0.20, span:0.60,

      /* 수명 — 오래 사는 대신 생존 판정에서 손해를 본다.
         한 세대를 더 살면 교배를 두 번 하므로 이득이 아주 크다.
         값은 시뮬레이터로 «대립유전자 빈도가 0.5 근처» 가 되게 맞췄다. */
      /* 12세대·12명·6회로 맞춘 값.
         0.14 → 수명 63·개체 147   ·   0.17 → 수명 64·개체 131(최소 69)
         0.20 → 수명 53·개체  87   ·   0.26 → 수명 52·개체  47(너무 얇다)
         0.17 이 «수명이 정답이 되지도, 사라지지도 않으면서» 개체군이 튼튼했다 */
      lifeCost:0.17, lifeExtra:1,

      /* 번식력 — 자손은 2마리 아니면 4마리.
         4마리가 나올 확률이 유전자형에 따라 다르다 (우열이 아니라 «쌓인다»)
           rr 10%  ·  Rr 20%  ·  RR 30% */
      kid2:2, kid4:4, fec0:0.10, fec1:0.20, fec2:0.30,

      inbreed:1,       // 내 개체끼리 교배하면 자손이 이만큼 준다 (근친약세)
      cellCap:14,      // 한 구역이 넉넉히 먹여 살리는 수
      crowd:0.015,     // 넘으면 한 마리당 깎이는 생존 확률
      rescue:2,        // 전멸한 학생에게 보내는 이주민
      mut:0.02,        // 유전자 하나가 돌연변이할 확률
      cap:16,          // 학생 한 명의 개체 상한
      start:10,        // 시작 개체 수
      moveSec:120, breedSec:240,
      autoScope:'zone',
      shift:0.12,      // 환경이 한 번에 움직이는 폭
      eventRate:0.45   // 세대마다 재해가 일어날 확률
    };
  }

  /* ── 유전자 읽기 ── */
  function 자리(key) { for (var i=0;i<NG;i++) if (GENES[i].k===key) return i; return -1; }
  function 표현형(geno, key) { var i=자리(key); return i>=0 && geno.charAt(i)>='1' ? 1 : 0; }
  /* 겉모습 — «보이는» 형질만 내보낸다. 숨은 형질은 여기 들어가지 않는다 */
  function 표현형문자열(geno) {
    var s='';
    for (var i=0;i<NG;i++) if (GENES[i].보임) s += (geno.charAt(i)>='1' ? '1':'0');
    return s;
  }
  function 유전자표기(geno, i) {
    var G=GENES[i], S=G.s.toUpperCase(), s=G.s.toLowerCase(), v=+geno.charAt(i);
    return v===2 ? S+S : v===1 ? S+s : s+s;
  }
  function 무작위유전자() {
    var s=''; for (var i=0;i<NG;i++) s += String(Math.floor(Math.random()*3)); return s;
  }

  /* ── 보드 ── */
  function 가까운바이옴(t, m) {
    var best=BIOMES[0], bd=1e9;
    for (var i=0;i<BIOMES.length;i++) {
      var b=BIOMES[i], d=(t-b.t)*(t-b.t)+(m-b.m)*(m-b.m);
      if (d<bd) { bd=d; best=b; }
    }
    return best;
  }
  function 바이옴(key) {
    for (var i=0;i<BIOMES.length;i++) if (BIOMES[i].key===key) return BIOMES[i];
    return BIOMES[0];
  }
  /* 기후로 판을 만들고, 재해로 바뀐 칸(terrain)을 덮어씌운다.
     재해로 바다가 된 칸은 기후가 바뀌어도 바다로 남는다 */
  function 보드만들기(env, terrain) {
    var g=[];
    for (var r=0;r<5;r++) { g[r]=[];
      for (var c=0;c<5;c++) {
        var k = 가까운바이옴(c/4+(env.dt||0), r/4+(env.dm||0)).key;
        if (terrain) {
          var o = terrain[r+','+c];
          if (o === 'sea') k = 'sea';
          else if (o === 'rise' && k === 'sea') k = 'rock';   // 융기 — 바다가 마른 땅으로
          else if (o) k = o;
        }
        g[r][c]=k;
      }
    }
    return g;
  }

  /* ── 적응도 · 생존 확률 ── */
  function 적응도(geno, biomeKey) {
    var b=바이옴(biomeKey), s=50;
    for (var k in b.fav) {
      var w=(b.w && b.w[k]) || 1;
      s += (표현형(geno,k)===b.fav[k] ? 12 : -12) * w;
    }
    for (var hk in HET) {
      var i=자리(hk);
      if (i>=0 && geno.charAt(i)==='1') s += HET[hk];
    }
    return Math.max(0, Math.min(100, Math.round(s)));
  }

  function 생존확률(geno, biomeKey, st, 넘침) {
    var p = st.base + (적응도(geno,biomeKey)/100) * st.span;
    if (표현형(geno,'life')===1) p -= st.lifeCost;
    p -= (넘침||0) * st.crowd;
    return Math.max(0.03, Math.min(0.95, p));
  }

  /* ── 멘델 ── */
  function 대립(v) { return v===2 ? 1 : v===0 ? 0 : (Math.random()<0.5 ? 1 : 0); }
  function 자손유전자(g1, g2, mut) {
    var out='';
    for (var i=0;i<NG;i++) {
      var v = 대립(+g1.charAt(i)) + 대립(+g2.charAt(i));
      if (mut && Math.random()<mut) v = Math.floor(Math.random()*3);
      out += String(v);
    }
    return out;
  }

  /* 자손 수 — 2 아니면 4.
     번식력은 «우열» 이 아니라 대립유전자가 쌓이는 만큼 확률이 오른다.
     그래서 잡종(Rr)도 순종열성(rr)보다 낫다 — 우열의 법칙과 다른 유전 방식이다 */
  function 넷확률(geno, st) {
    var v = +geno.charAt(자리('fec'));
    return v===2 ? st.fec2 : v===1 ? st.fec1 : st.fec0;
  }
  function 자손수(geno, st) {
    return Math.random() < 넷확률(geno, st) ? st.kid4 : st.kid2;
  }

  /* ── 환경 변화 ── */
  var 변화목록 = [
    { k:'warm', 설명:'행성이 더워졌습니다 (온난화)', dt: 1, dm: 0 },
    { k:'cold', 설명:'행성이 추워졌습니다 (한랭화)', dt:-1, dm: 0 },
    { k:'wet',  설명:'비가 늘었습니다 (습윤화)',     dt: 0, dm: 1 },
    { k:'dry',  설명:'비가 줄었습니다 (건조화)',     dt: 0, dm:-1 },
    { k:'keep', 설명:'큰 변화가 없었습니다',         dt: 0, dm: 0 }
  ];
  function 변화찾기(k) {
    for (var i=0;i<변화목록.length;i++) if (변화목록[i].k===k) return 변화목록[i];
    return null;
  }
  function 무작위변화() { return 변화목록[Math.floor(Math.random()*4)]; }

  function 환경적용(env, 변화, st) {
    var lim=0.36, s=st.shift;
    return {
      dt: Math.max(-lim, Math.min(lim, (env.dt||0) + 변화.dt*s)),
      dm: Math.max(-lim, Math.min(lim, (env.dm||0) + 변화.dm*s))
    };
  }

  /* ══ 재해 ══════════════════════════════════════════════════════
     한 칸을 골라 그 둘레(범위)까지 덮친다.
     그 안의 개체는 «형질에 따라» 살아남는다. 지형이 바뀌기도 한다. */
  function 재해생존확률(geno, ev) {
    var p = ev.기본생존;
    for (var k in ev.살아남는) {
      var w = (ev.w && ev.w[k]) || 1;
      if (표현형(geno,k) === ev.살아남는[k]) p += 0.11 * w;
    }
    return Math.max(0.02, Math.min(0.96, p));
  }

  function 무작위재해() { return EVENTS[Math.floor(Math.random()*EVENTS.length)]; }
  function 재해찾기(k) {
    for (var i=0;i<EVENTS.length;i++) if (EVENTS[i].k===k) return EVENTS[i];
    return null;
  }

  /* 재해를 일으킨다. 어디를 덮칠지·누가 죽을지·지형이 어떻게 바뀔지 돌려준다 */
  function 재해발생(board, aliens, terrain, ev, 중심) {
    ev = ev || 무작위재해();
    var cr = 중심 ? 중심.r : Math.floor(Math.random()*5);
    var cc = 중심 ? 중심.c : Math.floor(Math.random()*5);

    // 중심에서 가까운 순으로 범위만큼 고른다
    var 후보=[], r, c;
    for (r=0;r<5;r++) for (c=0;c<5;c++)
      후보.push({ r:r, c:c, d:Math.max(Math.abs(r-cr), Math.abs(c-cc)) });
    후보.sort(function (a,b) { return a.d - b.d; });
    var 칸들 = 후보.slice(0, ev.범위).map(function (x) { return { r:x.r, c:x.c }; });

    // 침강은 바다가 아닌 곳만, 융기는 바다인 곳만 뜻이 있다
    if (ev.k === 'sink')  칸들 = 칸들.filter(function (x) { return board[x.r][x.c] !== 'sea'; });
    if (ev.k === 'rise')  칸들 = 칸들.filter(function (x) { return board[x.r][x.c] === 'sea'; });
    if (!칸들.length) return null;         // 일어날 자리가 없다

    var 안에 = {}, i;
    for (i=0;i<칸들.length;i++) 안에[칸들[i].r+','+칸들[i].c] = 1;

    var 죽을것=[], 산것=0;
    for (i=0;i<aliens.length;i++) {
      var a = aliens[i];
      if (!a.alive || !안에[a.r+','+a.c]) continue;
      if (Math.random() < 재해생존확률(a.geno, ev)) 산것++;
      else 죽을것.push(a.id);
    }

    var 새terrain = {};
    for (var kk in (terrain||{})) 새terrain[kk] = terrain[kk];
    if (ev.지형) for (i=0;i<칸들.length;i++) {
      var key = 칸들[i].r+','+칸들[i].c;
      if (ev.지형 === 'rise') delete 새terrain[key];   // 바다 표시를 지운다 = 다시 땅
      else 새terrain[key] = ev.지형;
    }

    return {
      사건:ev.k, 이름:ev.n, emoji:ev.emoji, 말:ev.말,
      칸들:칸들, 죽을것:죽을것, 살아남음:산것, 죽음:죽을것.length,
      terrain:새terrain
    };
  }

  /* ── 칸마다 몇 마리인가 ── */
  function 몰림세기(aliens) {
    var m={};
    for (var i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (!a.alive) continue;
      var k=a.r+','+a.c; m[k]=(m[k]||0)+1;
    }
    return m;
  }

  /* ══ 단계 계산 — 선생님 화면이 부른다 ══════════════════════════ */

  function 생존판정(aliens, board, st) {
    var 몰림 = 몰림세기(aliens), 죽음=[], 산것=0;
    var 최다=0, 최다칸='';
    for (var k in 몰림) if (몰림[k]>최다) { 최다=몰림[k]; 최다칸=k; }

    for (var i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (!a.alive) continue;
      var 넘침 = Math.max(0, (몰림[a.r+','+a.c]||0) - st.cellCap);
      if (Math.random() < 생존확률(a.geno, board[a.r][a.c], st, 넘침)) 산것++;
      else 죽음.push(a.id);
    }
    return { 단계:'생존 판정', 죽을것:죽음, 살아남음:산것, 죽음:죽음.length,
             붐빈수:최다, 넉넉한수:st.cellCap, 가장붐빈칸:최다칸 };
  }

  function 자동교배(aliens, 이미짝지은, st) {
    var 남은=[], i;
    for (i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (a.alive && !이미짝지은[a.id]) 남은.push(a);
    }
    for (i=남은.length-1;i>0;i--) {
      var j=Math.floor(Math.random()*(i+1)), t=남은[i]; 남은[i]=남은[j]; 남은[j]=t;
    }
    var 쓴것={}, 짝=[], 실패=0;
    for (i=0;i<남은.length;i++) {
      var A=남은[i];
      if (쓴것[A.id]) continue;
      var 찾음=null;
      for (var y=0;y<남은.length;y++) {
        var B=남은[y];
        if (쓴것[B.id] || B.id===A.id) continue;
        var d=Math.max(Math.abs(A.r-B.r), Math.abs(A.c-B.c));
        if (st.autoScope==='near' ? d<=1 : d===0) { 찾음=B; break; }
      }
      if (찾음) { 쓴것[A.id]=1; 쓴것[찾음.id]=1;
                  짝.push({ a:A, b:찾음, same:A.player===찾음.player }); }
      else { 실패++; }
    }
    return { 짝:짝, 성사:짝.length, 실패:실패 };
  }

  function 세대교체(aliens, 짝목록, players, turn, st) {
    var 새것=[], 자손=0, 사망=0, 장수=0, 구제=0, 넷쌍=0;
    var 사람별={}, i;
    for (i=0;i<players.length;i++) 사람별[players[i].id] = { p:players[i], list:[] };

    for (i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (!a.alive) { 사망++; continue; }
      if (표현형(a.geno,'life')===1 && (a.age||0) < st.lifeExtra) {
        var 통=사람별[a.player];
        if (통) { 통.list.push({ player:a.player, geno:a.geno, r:a.r, c:a.c,
                                 alive:true, born:a.born, age:(a.age||0)+1 }); 장수++; }
      } else { 사망++; }
    }

    for (i=0;i<짝목록.length;i++) {
      var 짝=짝목록[i], A=짝.a, B=짝.b;
      if (짝.same) {
        var n = Math.max(2, 자손수(A.geno, st) - st.inbreed);
        자손 += _낳기(사람별, A.player, A, B, n, turn, st);
      } else {
        var nA = 자손수(A.geno, st), nB = 자손수(B.geno, st);
        if (nA === st.kid4) 넷쌍++;
        if (nB === st.kid4) 넷쌍++;
        자손 += _낳기(사람별, A.player, A, B, nA, turn, st);
        자손 += _낳기(사람별, B.player, B, A, nB, turn, st);
      }
    }

    for (var pid in 사람별) {
      var 통2=사람별[pid], L=통2.list;
      if (L.length > st.cap) {
        for (var s=L.length-1;s>0;s--) { var t2=Math.floor(Math.random()*(s+1)),
          tmp=L[s]; L[s]=L[t2]; L[t2]=tmp; }
        L.length = st.cap;
      }
      if (L.length===0 && st.rescue>0) {
        var 집 = { r: 통2.p.home_r==null?2:통2.p.home_r, c: 통2.p.home_c==null?2:통2.p.home_c };
        for (var q=0;q<st.rescue;q++)
          L.push({ player:+pid, geno:무작위유전자(), r:집.r, c:집.c,
                   alive:true, born:turn+1, age:0 });
        구제++;
      }
      새것 = 새것.concat(L);
    }
    return { 단계:'세대 교체', 개체:새것, 세대:turn+1,
             자손:자손, 사망:사망, 장수생존:장수, 구제:구제, 네마리:넷쌍 };
  }

  function _낳기(사람별, pid, 나, 짝, n, turn, st) {
    var 통=사람별[pid];
    if (!통) return 0;
    var 만듦=0;
    for (var i=0;i<n;i++) {
      if (통.list.length >= st.cap) break;
      통.list.push({ player:pid, geno:자손유전자(나.geno, 짝.geno, st.mut),
                     r:나.r, c:나.c, alive:true, born:turn+1, age:0 });
      만듦++;
    }
    return 만듦;
  }

  /* ── 세대별 형질 빈도 (그래프 재료) ──
     대립유전자 빈도로 잰다 — 겉모습보다 유전자 풀의 변화를 잘 보여 준다 */
  function 빈도(aliens) {
    var n=0, dom={}, i;
    for (i=0;i<NG;i++) dom[GENES[i].k]=0;
    for (i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (!a.alive) continue;
      n++;
      for (var k=0;k<NG;k++) dom[GENES[k].k] += +a.geno.charAt(k);
    }
    var f={};
    for (i=0;i<NG;i++) f[GENES[i].k] = n ? Math.round(dom[GENES[i].k]/(n*2)*100) : 0;
    return { n:n, f:f };
  }

  /* 구역별 유전자 풀 — 빔 화면이 쓴다 */
  function 구역빈도(aliens, r, c) {
    var 안=[];
    for (var i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (a.alive && a.r===r && a.c===c) 안.push(a);
    }
    return 빈도(안);
  }

  전역.RULES = {
    GENES:GENES, NG:NG, 보이는수:보이는수, BIOMES:BIOMES, HET:HET, EVENTS:EVENTS,
    PHASES:PHASES, PHASE_NAME:PHASE_NAME,
    기본설정:기본설정, 자리:자리, 표현형:표현형, 표현형문자열:표현형문자열,
    유전자표기:유전자표기, 무작위유전자:무작위유전자,
    바이옴:바이옴, 보드만들기:보드만들기, 적응도:적응도, 생존확률:생존확률,
    자손유전자:자손유전자, 자손수:자손수, 넷확률:넷확률, 몰림세기:몰림세기,
    변화목록:변화목록, 변화찾기:변화찾기, 무작위변화:무작위변화, 환경적용:환경적용,
    무작위재해:무작위재해, 재해찾기:재해찾기, 재해발생:재해발생, 재해생존확률:재해생존확률,
    생존판정:생존판정, 자동교배:자동교배, 세대교체:세대교체, 빈도:빈도, 구역빈도:구역빈도
  };
})(window);
