/* ════════════════════════════════════════════════════════════════
 *  rules.js — 외계 행성 진화 게임의 «규칙» 전부
 *  2026 광주하남영재교육원 · 중학 융합과정 (변석환) · 18차시
 *
 *  이 파일에는 서버도 화면도 없다. 순수한 규칙만 있다.
 *  학생 화면과 선생님 화면이 똑같이 읽고, 값이 어긋나지 않는다.
 *
 *  ══ 숫자를 함부로 바꾸지 말 것 ═════════════════════════════════
 *  아래 값들은 학생 12명·12세대를 여섯 번씩 돌려 맞춘 것이다.
 *  하나를 건드리면 나머지가 무너진다. 바꿨으면 반드시 다시 돌려 봐야 한다.
 *    · 수명 대립유전자 빈도가 0.5 근처에 머무는가 (어느 쪽도 정답이 아니어야 한다)
 *    · 물저장 잡종(Ww)이 40% 위로 유지되는가 (멘델이 게임에 살아 있어야 한다)
 *    · 개체 수가 상한에 눌러붙지도, 전멸하지도 않는가
 *
 *  모듈을 쓰지 않는다. window.RULES 로 올린다 —
 *  게임 파일이 일반 스크립트라 섞이면 실행 순서가 꼬인다.
 * ════════════════════════════════════════════════════════════════ */

(function (전역) {
  'use strict';

  /* ── 유전자 9개 ──────────────────────────────────────────────
     값 2 = 순종우성(FF) · 1 = 잡종(Ff) · 0 = 순종열성(ff)
     겉모습은 «우성이 하나라도 있으면 우성» (우열의 법칙) */
  var GENES = [
    { k:'fur',   n:'털',          s:'F', d:'두꺼움', r:'얇음' },
    { k:'color', n:'색',          s:'D', d:'어두움', r:'밝음' },
    { k:'eye',   n:'눈',          s:'E', d:'큰 눈',  r:'작은 눈' },
    { k:'leg',   n:'다리',        s:'L', d:'많음',   r:'적음' },
    { k:'tall',  n:'키',          s:'T', d:'큼',     r:'작음' },
    { k:'water', n:'물저장 조직', s:'W', d:'있음',   r:'없음' },
    { k:'grip',  n:'발톱',        s:'G', d:'강함',   r:'약함' },
    { k:'arm',   n:'팔',          s:'A', d:'있음',   r:'없음' },
    { k:'life',  n:'수명',        s:'V', d:'긺',     r:'짧음' }
  ];
  var NG = GENES.length;

  /* ── 잡종이 유리한 형질 ───────────────────────────────────────
     물저장 조직만은 «잡종일 때» 적응도가 오른다.
       WW = 물주머니가 둘 — 넉넉하지만 몸이 무거워 굼뜨다
       Ww = 하나        — 딱 좋다
       ww = 없음        — 마른 곳에서 버티지 못한다

     이게 없으면 학생은 잡종을 고를 이유가 하나도 없다.
     겉모습이 순종우성과 똑같은데 열성만 자손에게 넘겨 주니까.
     그러면 3:1 분리비도, 숨은 열성이 튀어나오는 놀라움도 게임에서 사라진다.
     실제로 빼고 돌려 보니 잡종이 9%까지 떨어졌다.
     넣으면 WW 29 : Ww 46 : ww 25 로 유지된다 — 멘델 평형이 눈앞에서 일어난다.
     2주차 «마을의 비밀» 겸형적혈구와 똑같은 이야기다. */
  var HET = { water: 14 };

  /* ── 바이옴 8종 ───────────────────────────────────────────────
     왼→오른쪽으로 더워지고, 위→아래로 습해진다.
     fav = 이 구역에서 유리한 겉모습 (1=우성 쪽, 0=열성 쪽)
     w   = 그 형질의 중요도 (안 적으면 1) */
  var BIOMES = [
    { key:'snow',   name:'눈 덮인 곳',   emoji:'❄️', t:0.05, m:0.15, bg:'#cfe6ff', ink:'#123',
      fav:{ fur:1, color:0, water:0, arm:0 },              w:{ fur:2, color:2 } },
    { key:'tundra', name:'툰드라',       emoji:'🌫️', t:0.20, m:0.55, bg:'#b7c4cd', ink:'#123',
      fav:{ fur:1, color:0, tall:0, leg:1 },               w:{ fur:1.5 } },
    { key:'taiga',  name:'침엽수림',     emoji:'🌲', t:0.38, m:0.82, bg:'#2f5d43', ink:'#eaffe9',
      fav:{ tall:1, arm:1, grip:1, color:1 },              w:{ arm:1.5 } },
    { key:'grass',  name:'초원',         emoji:'🌾', t:0.52, m:0.22, bg:'#bcc96a', ink:'#1a1a00',
      fav:{ leg:1, eye:1, tall:1, color:0, fur:0 },        w:{ leg:2 } },
    { key:'forest', name:'초록 숲·천적', emoji:'🐾', t:0.58, m:0.68, bg:'#2e7d4f', ink:'#eaffe9',
      fav:{ color:1, eye:1, leg:1, arm:1, tall:0 },        w:{ color:2, eye:1.5 } },
    { key:'rock',   name:'바위산',       emoji:'🪨', t:0.48, m:0.38, bg:'#8a8f9a', ink:'#111',
      fav:{ grip:1, leg:1, color:1, water:0 },             w:{ grip:2 } },
    { key:'jungle', name:'높은 나무숲',  emoji:'🌴', t:0.80, m:0.80, bg:'#3a6b2f', ink:'#eaffe9',
      fav:{ tall:1, arm:1, grip:1, eye:1, fur:0 },         w:{ tall:2, arm:1.5 } },
    { key:'desert', name:'더운 사막',    emoji:'🏜️', t:0.95, m:0.10, bg:'#e3c47e', ink:'#3a2600',
      fav:{ water:1, fur:0, color:0, eye:0, leg:0 },       w:{ water:2, fur:1.5 } }
  ];

  var PHASES = ['setup', 'survive', 'move', 'breed', 'next', 'env'];
  var PHASE_NAME = {
    lobby:'참가 대기', setup:'유전자 제작', survive:'생존 판정', move:'이동',
    breed:'교배', next:'세대 교체', env:'환경 변화', end:'게임 끝'
  };

  function 기본설정() {
    return {
      /* 생존 확률 = base + 적응도/100 × span
         적응도 0 → 20% · 50 → 50% · 100 → 80%
         «적응도가 곧 살아남을 확률» 이라 설명하기 쉽다.
         올리면 개체가 상한에 눌러붙어 죽음이 의미를 잃고, 내리면 개체군이 무너진다. */
      base:0.20, span:0.60,

      /* 수명의 맞바꾸기
           짧음 : 한 세대만 살지만 한 번에 자손 3마리
           긺   : 자손 2마리 + 생존 8%p 손해, 대신 한 세대 더 산다
         생존 확률만 깎는 방식(-22%p)도 재 봤는데 편차가 너무 커서
         한 판은 수명 유전자가 아예 사라졌다. 지금 값이 가장 안정적이다. */
      lifeCost:0.08, lifeExtra:1, kids:3, lifeKids:2,

      inbreed:1,       // 내 개체끼리 교배하면 자손이 이만큼 준다 (근친약세)
      cellCap:10,      // 한 구역이 넉넉히 먹여 살리는 수
      crowd:0.02,      // 넘으면 한 마리당 깎이는 생존 확률
      rescue:2,        // 전멸한 학생에게 보내는 이주민
      mut:0.02,        // 유전자 하나가 돌연변이할 확률
      cap:16,          // 학생 한 명의 개체 상한
      start:10,        // 시작 개체 수
      moveSec:120, breedSec:240,
      autoScope:'zone',// 시간 초과 자동 교배 : zone=같은 구역만 · near=인접까지
      shift:0.12       // 환경이 한 번에 움직이는 폭
    };
  }

  /* ── 유전자 읽기 ── */
  function 자리(key) { for (var i=0;i<NG;i++) if (GENES[i].k===key) return i; return -1; }
  function 표현형(geno, key) { var i=자리(key); return i>=0 && geno.charAt(i)>='1' ? 1 : 0; }
  function 표현형문자열(geno) {
    var s=''; for (var i=0;i<NG;i++) s += (geno.charAt(i)>='1' ? '1':'0'); return s;
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
  function 보드만들기(env) {
    var g=[];
    for (var r=0;r<5;r++) { g[r]=[];
      for (var c=0;c<5;c++) g[r][c] = 가까운바이옴(c/4+(env.dt||0), r/4+(env.dm||0)).key;
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
    for (var hk in HET) {           // 잡종 강세
      var i=자리(hk);
      if (i>=0 && geno.charAt(i)==='1') s += HET[hk];
    }
    return Math.max(0, Math.min(100, Math.round(s)));
  }

  /* 붐빔은 밖에서 넣어 준다 — 한 칸에 몇 마리가 있는지는 판 전체를 봐야 안다 */
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
  function 자손수(geno, st) { return 표현형(geno,'life')===1 ? st.lifeKids : st.kids; }

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
  function 무작위변화() { return 변화목록[Math.floor(Math.random()*4)]; }   // keep 은 손으로만

  /* 기후를 옮긴다. ±0.36 을 넘기면 판이 거의 한 지형이 된다(정글 13/25) */
  function 환경적용(env, 변화, st) {
    var lim=0.36, s=st.shift;
    return {
      dt: Math.max(-lim, Math.min(lim, (env.dt||0) + 변화.dt*s)),
      dm: Math.max(-lim, Math.min(lim, (env.dm||0) + 변화.dm*s))
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

  /* ══════════════════════════════════════════════════════════════
   *  단계 계산 — 선생님 화면이 부른다
   *  전부 «받은 것을 고쳐서 돌려주는» 순수 함수다. 서버를 모른다.
   * ══════════════════════════════════════════════════════════════ */

  /* ① 생존 판정 — 죽을 개체의 id 목록을 돌려준다 */
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
    return {
      단계:'생존 판정', 죽을것:죽음, 살아남음:산것, 죽음:죽음.length,
      붐빈수:최다, 넉넉한수:st.cellCap, 가장붐빈칸:최다칸
    };
  }

  /* ③ 교배 마감 — 짝을 못 지은 개체를 같은 구역 안에서 무작위로 이어 준다.
        같은 구역에 상대가 없으면 자손을 남기지 못한다 — 이게 «지리적 격리» 다. */
  function 자동교배(aliens, 이미짝지은, st) {
    var 남은=[], i;
    for (i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (a.alive && !이미짝지은[a.id]) 남은.push(a);
    }
    for (i=남은.length-1;i>0;i--) {          // 순서에 따른 유불리를 없앤다
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

  /* ④ 세대 교체 — 다음 세대의 개체 목록을 통째로 만들어 돌려준다.
        어버이는 죽는다. 다만 «수명 긺» 은 lifeExtra 세대만큼 더 산다. */
  function 세대교체(aliens, 짝목록, players, turn, st) {
    var 새것=[], 자손=0, 사망=0, 장수=0, 구제=0;
    var 사람별={}, i;
    for (i=0;i<players.length;i++) 사람별[players[i].id] = { p:players[i], list:[] };

    // 살아남는 어버이
    for (i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (!a.alive) { 사망++; continue; }
      if (표현형(a.geno,'life')===1 && (a.age||0) < st.lifeExtra) {
        var 통=사람별[a.player];
        if (통) { 통.list.push({ player:a.player, geno:a.geno, r:a.r, c:a.c,
                                 alive:true, born:a.born, age:(a.age||0)+1 }); 장수++; }
      } else { 사망++; }
    }

    // 자손 — 부모 «각각의 주인» 에게 간다. 그래야 남과 교배할 이유가 생긴다
    for (i=0;i<짝목록.length;i++) {
      var 짝=짝목록[i], A=짝.a, B=짝.b;
      if (짝.same) {
        // 내 개체끼리 — 한 번만, 그것도 근친약세만큼 적게
        var n = Math.max(1, Math.round((자손수(A.geno,st)+자손수(B.geno,st))/2) - st.inbreed);
        자손 += _낳기(사람별, A.player, A, B, n, turn, st);
      } else {
        자손 += _낳기(사람별, A.player, A, B, 자손수(A.geno,st), turn, st);
        자손 += _낳기(사람별, B.player, B, A, 자손수(B.geno,st), turn, st);
      }
    }

    // 상한을 넘으면 무작위로 줄이고, 한 마리도 없으면 이주민을 보낸다
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
             자손:자손, 사망:사망, 장수생존:장수, 구제:구제 };
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

  /* ── 세대별 형질 빈도 (그래프 재료) ── */
  function 빈도(aliens) {
    var n=0, cnt={}, i;
    for (i=0;i<NG;i++) cnt[GENES[i].k]=0;
    for (i=0;i<aliens.length;i++) {
      var a=aliens[i];
      if (!a.alive) continue;
      n++;
      for (var k=0;k<NG;k++) if (표현형(a.geno, GENES[k].k)===1) cnt[GENES[k].k]++;
    }
    var f={};
    for (i=0;i<NG;i++) f[GENES[i].k] = n ? Math.round(cnt[GENES[i].k]/n*100) : 0;
    return { n:n, f:f };
  }

  전역.RULES = {
    GENES:GENES, NG:NG, BIOMES:BIOMES, HET:HET, PHASES:PHASES, PHASE_NAME:PHASE_NAME,
    기본설정:기본설정, 자리:자리, 표현형:표현형, 표현형문자열:표현형문자열,
    유전자표기:유전자표기, 무작위유전자:무작위유전자,
    바이옴:바이옴, 보드만들기:보드만들기, 적응도:적응도, 생존확률:생존확률,
    자손유전자:자손유전자, 자손수:자손수, 몰림세기:몰림세기,
    변화목록:변화목록, 변화찾기:변화찾기, 무작위변화:무작위변화, 환경적용:환경적용,
    생존판정:생존판정, 자동교배:자동교배, 세대교체:세대교체, 빈도:빈도
  };
})(window);
