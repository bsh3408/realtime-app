/* ════════════════════════════════════════════════════════════════
 *  net.js — Supabase 데이터 계층 + 앱스크립트 호환 껍데기
 *  2026 광주하남영재교육원 · 중학 융합과정 (변석환)
 *
 *  ══ 왜 «껍데기» 인가 ═══════════════════════════════════════════
 *  화면 두 개는 서버에 닿는 곳이 RUN() 하나뿐이다.
 *  그래서 RUN() 만 갈아 끼우면 게임 코드는 손대지 않아도 된다.
 *  주고받는 모양을 앱스크립트 때와 똑같이 맞춘다 — shared/compat.js 와 같은 수법.
 *
 *  옮기면서 게임 규칙을 건드리지 않는 것이 중요하다.
 *  그 균형은 12세대를 여섯 번씩 돌려 맞춘 것이라 다시 맞출 방법이 없다.
 *
 *  ══ 누가 계산하나 ══════════════════════════════════════════════
 *  · 선생님 화면 = 게임 엔진. 생존·세대교체·환경을 rules.js 로 계산해 올린다
 *  · Supabase   = 공유 상태 + «한 개체가 두 번 교배하지 못하게» 막는 자물쇠
 *  · 학생 화면  = 읽기 + 이동·교배신청·수락
 *
 *  라이브러리를 안 쓴다. fetch 만 쓴다.
 *  CDN 하나가 막혀서 수업이 날아가는 일을 막기 위해서다.
 * ════════════════════════════════════════════════════════════════ */

(function (전역) {
  'use strict';

  var 토큰키 = 'evo_token_v1';
  var R = 전역.RULES;

  var EVO = {
    url:null, key:null,
    game:null,          // 지금 방의 evo_game 행
    gameId:null,
    room:'gwangju',     // 방 이름. 주소 뒤 ?room= 으로 바꾼다
    player:null,        // 내 player id
    시각차:0,

    init: function (설정) {
      this.url = ((설정 && 설정.SUPABASE_URL) || '').replace(/\/+$/, '');
      this.key = (설정 && 설정.SUPABASE_ANON_KEY) || '';
      var q = new URLSearchParams(location.search);
      if (q.get('room')) this.room = q.get('room');
      return this.ready();
    },
    ready: function () { return !!(this.url && this.key); },

    token: function () {
      var t = localStorage.getItem(토큰키);
      if (!t) {
        t = (crypto.randomUUID ? crypto.randomUUID()
                               : String(Date.now()) + Math.random().toString(36).slice(2));
        localStorage.setItem(토큰키, t);
      }
      return t;
    },

    /* 쓰기 — 함수를 지난다. 실패하면 던진다(화면이 알려 줘야 한다) */
    rpc: function (이름, 인자, 제한ms) {
      if (!this.ready()) return Promise.reject(new Error('설정 없음'));
      var ac = new AbortController();
      var 시계 = setTimeout(function () { ac.abort(); }, 제한ms || 10000);
      return fetch(this.url + '/rest/v1/rpc/' + 이름, {
        method:'POST',
        headers:{ 'apikey':this.key, 'Authorization':'Bearer '+this.key,
                  'Content-Type':'application/json' },
        body: JSON.stringify(인자 || {}),
        signal: ac.signal
      }).then(function (r) {
        clearTimeout(시계);
        return r.text().then(function (t) {
          if (!r.ok) {
            var msg = t;
            try { var j = JSON.parse(t); msg = j.message || j.hint || t; } catch (e) {}
            throw new Error(msg);
          }
          return t ? JSON.parse(t) : null;
        });
      }, function (e) { clearTimeout(시계); throw e; });
    },

    /* 읽기 — 실패하면 null. 화면이 «잠깐 안 보임» 이 될 뿐 게임은 안 멈춘다 */
    get: function (길, 제한ms) {
      var 나 = this;
      if (!this.ready()) return Promise.resolve(null);
      var ac = new AbortController();
      var 시계 = setTimeout(function () { ac.abort(); }, 제한ms || 10000);
      return fetch(this.url + '/rest/v1/' + 길, {
        headers:{ 'apikey':this.key, 'Authorization':'Bearer '+this.key },
        signal: ac.signal
      }).then(function (r) {
        clearTimeout(시계);
        var d = r.headers.get('date');
        if (d) { var t = Date.parse(d); if (!isNaN(t)) 나.시각차 = t - Date.now(); }
        if (!r.ok) return null;
        return r.json();
      }, function () { clearTimeout(시계); return null; });
    },

    지금: function () { return Date.now() + this.시각차; },

    /* 방을 찾는다. 없으면 선생님이 아직 안 연 것이다 */
    방찾기: function () {
      var 나 = this;
      return this.get('evo_game?code=eq.' + encodeURIComponent(this.room) + '&select=*')
        .then(function (rows) {
          var g = rows && rows[0];
          if (g) { 나.game = g; 나.gameId = g.id; }
          return g || null;
        });
    },

    판읽기: function () {
      var 나 = this, gid = this.gameId;
      return Promise.all([
        this.get('evo_game?id=eq.'+gid+'&select=*'),
        this.get('evo_player_public?game_id=eq.'+gid+'&select=*'),
        /* order=id 가 없으면 순서가 흔들린다.
           포스트그레스는 행을 고치면 «새 판» 을 힙 끝에 붙이므로, 방금 고친
           개체가 목록 맨 뒤로 밀려난다. 그러면 화면이 «1번» 이라고 부르던
           개체가 딴 개체가 되어 버려서, 학생 눈에는 한 자리만 눌렀는데
           통째로 무작위로 바뀐 것처럼 보인다. 실제로 여섯 번 눌러 여섯 번
           다 흔들리는 것을 확인했다. */
        this.get('evo_alien?game_id=eq.'+gid+'&select=*&order=id.asc'),
        /* 아직 답이 없는 신청 + 이번 세대의 «거래» 는 답이 끝난 것까지 가져온다.
           거래 신청 횟수를 셀 때 거절당한 것도 세야 하기 때문이다.
           안 그러면 거절당할 때마다 다시 찔러 볼 수 있다 */
        this.get('evo_request?game_id=eq.'+gid+'&or=(state.eq.pending,kind.eq.trade)&select=*')
      ]).then(function (a) {
        var g = a[0] && a[0][0];
        if (g) { 나.game = g; }
        return { game:g, players:a[1]||[], aliens:a[2]||[], requests:a[3]||[] };
      });
    }
  };

  /* ── 서버 행 → 게임이 쓰는 모양 ── */
  function 개체정리(rows) {
    return (rows||[]).map(function (a) {
      return { id:a.id, player:a.player_id, geno:a.geno, r:a.r, c:a.c,
               r0:a.r0, c0:a.c0, alive:a.alive, born:a.born, age:a.age, bred:a.bred };
    });
  }
  /* 화면 코드가 쓰던 이름(i · g · a)으로 바꿔 준다 */
  function 화면용(a) {
    return { i:a.id, g:a.geno, r:a.r, c:a.c, r0:a.r0, c0:a.c0,
             a:a.alive?1:0, born:a.born, age:a.age, bred:a.bred?1:0 };
  }
  function 설정읽기(g) {
    var st = R.기본설정();
    if (g && g.settings) for (var k in g.settings) st[k] = g.settings[k];
    return st;
  }
  function 보드읽기(g) {
    if (g && g.board && g.board.length === 5) return g.board;
    var st = 설정읽기(g);
    return R.보드만들기({ dt:(g&&g.env_dt)||0, dm:(g&&g.env_dm)||0 }, st.terrain);
  }
  var CHEB = function (a,b) { return Math.max(Math.abs(a.r-b.r), Math.abs(a.c-b.c)); };

  /* ════════════════════════════════════════════════════════════
   *  RUN — 앱스크립트에서 쓰던 이름 그대로
   * ════════════════════════════════════════════════════════════ */
  var 마지막seq = -1;

  var 처리 = {

    /* ── 공통 ── */
    '규칙표': function () {
      return Promise.resolve({ genes:R.GENES, biomes:R.BIOMES,
                               phases:R.PHASES, phaseName:R.PHASE_NAME });
    },

    /* ── 학생 ── */
    '참가': function (이름) {
      return EVO.방찾기().then(function (g) {
        if (!g) return { ok:false, msg:'선생님이 아직 게임을 열지 않았습니다.' };
        return EVO.rpc('evo_join', { p_code:EVO.room, p_name:이름, p_token:EVO.token() })
          .then(function (r) {
            EVO.player = r.player;
            return { ok:true, sid:String(r.player), name:이름 };
          }, function (e) { return { ok:false, msg:e.message }; });
      });
    },

    '학생상태': function (sid, knownSeq) {
      if (!EVO.gameId) {
        return EVO.방찾기().then(function (g) {
          if (!g) return { ok:false, msg:'방을 찾지 못했습니다.' };
          return 처리['학생상태'](sid, null);
        });
      }
      var pid = +sid;
      // 가벼운 길 — 학생이 손댈 게 없는 단계에서 판이 그대로면 계산을 건너뛴다
      return EVO.get('evo_game?id=eq.'+EVO.gameId+'&select=seq,phase,end_at')
        .then(function (rows) {
          var g0 = rows && rows[0];
          if (!g0) return { ok:false, msg:'방이 사라졌습니다.' };
          var 대기 = (g0.phase !== 'move' && g0.phase !== 'breed');
          if (대기 && knownSeq != null && +knownSeq === g0.seq) {
            return { ok:true, same:true, seq:g0.seq, now:EVO.지금(),
                     endAt: g0.end_at ? Date.parse(g0.end_at) : 0 };
          }
          return EVO.판읽기().then(function (판) { return 학생상태만들기(판, pid); });
        });
    },

    /* 개체를 받는다 — 유전자는 서버가 무작위로 정한다.
       처음부터 고르지 못하게 하려는 것이다. 고치려면 DNA 를 써야 한다 */
    '개체받기': function (sid, home) {
      return EVO.rpc('evo_start_aliens', {
        p_player:+sid, p_token:EVO.token(), p_r:home.r, p_c:home.c
      }).then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    /* 유전자 고치기 — 형질 하나를 골라 원하는 값으로. DNA 가 든다 */
    '유전자고치기': function (sid, aid, pos, val) {
      return EVO.rpc('evo_edit_gene', {
        p_player:+sid, p_token:EVO.token(), p_alien:+aid, p_pos:pos, p_val:val
      }).then(function (남은) { return { ok:true, dna:남은 }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    /* 제작 완료 — 개체를 받는 것과 «다 만들었다» 는 다른 일이다.
       선생님이 누가 아직 고치는 중인지 알아야 다음 단계로 넘길 수 있다 */
    '제작완료': function (sid, done) {
      return EVO.rpc('evo_finish_setup', {
        p_player:+sid, p_token:EVO.token(), p_done:!!done
      }).then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    /* 정찰 — 이번 세대 동안 적응도를 볼 수 있게 산다.
       적응도 계산은 학생 브라우저의 RULES 가 한다. 서버는 «샀다» 만 적는다 */
    '정찰': function (sid) {
      return EVO.rpc('evo_scout', { p_player:+sid, p_token:EVO.token() })
        .then(function (남은) { return { ok:true, dna:남은 }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    '거래신청': function (sid, mine, theirs, dna) {
      return EVO.rpc('evo_trade_offer', {
        p_player:+sid, p_token:EVO.token(), p_mine:+mine, p_theirs:+theirs, p_dna:dna|0
      }).then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    '거래응답': function (sid, reqId, accept) {
      return EVO.rpc('evo_trade_answer', {
        p_player:+sid, p_token:EVO.token(), p_req:+reqId, p_accept:!!accept
      }).then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    /* 선생님 — DNA 를 넣어 준다 */
    'DNA설정': function (code, player, amount) {
      return EVO.rpc('evo_set_dna', { p_code:code, p_player:+player, p_amount:amount|0 })
        .then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },
    /* list = [{player, amount, award}] — 무슨 상인지까지 넘긴다 */
    'DNA지급': function (code, list) {
      return EVO.rpc('evo_grant_dna', { p_code:code, p_game:EVO.gameId, p_list:list })
        .then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    '유전자제출': function (sid, genos, home) {
      return EVO.rpc('evo_submit_genes', {
        p_player:+sid, p_token:EVO.token(), p_genos:genos, p_r:home.r, p_c:home.c
      }).then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    '이동제출': function (sid, moves) {
      var m = (moves||[]).map(function (x) { return { i:+x.i, r:x.r, c:x.c }; });
      return EVO.rpc('evo_move', { p_player:+sid, p_token:EVO.token(), p_moves:m })
        .then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    '교배신청': function (sid, aid, toSid, toAid) {
      return EVO.rpc('evo_request_mate', {
        p_player:+sid, p_token:EVO.token(), p_from:+aid, p_to:+toAid
      }).then(function (r) { return { ok:true, 즉시: !!(r && r.instant) }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    '교배응답': function (sid, reqId, accept) {
      return EVO.rpc('evo_answer_mate', {
        p_player:+sid, p_token:EVO.token(), p_req:+reqId, p_accept:!!accept
      }).then(function () { return { ok:true, 거절: !accept }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    /* ── 선생님 ── */
    '교사판': function (code) {
      return (EVO.gameId ? Promise.resolve(EVO.game) : EVO.방찾기()).then(function (g) {
        if (!g) {
          // 아직 방이 없다 — 코드가 맞으면 열어 준다
          return EVO.rpc('evo_open', { p_code:code, p_room:EVO.room })
            .then(function (id) { EVO.gameId = id; return EVO.판읽기().then(교사판만들기); },
                  function (e) { return { ok:false, msg:e.message }; });
        }
        return EVO.판읽기().then(교사판만들기);
      });
    },

    '단계진행': function (code) { return 단계진행(code, null); },
    '단계지정': function (code, phase) { return 단계진행(code, phase); },

    '환경지정': function (code, dir) {
      var g = EVO.game, st = 설정읽기(g);
      var 변화 = R.변화찾기(dir) || R.무작위변화({ dt:g.env_dt, dm:g.env_dm }, st);
      var env = R.환경적용({ dt:g.env_dt, dm:g.env_dm }, 변화, st);
      var 다음 = R.무작위변화(env, st);
      return EVO.rpc('evo_set_state', { p_code:code, p_game:EVO.gameId, p_patch:{
        phase:'env', env_dt:env.dt, env_dm:env.dm,
        board:R.보드만들기(env, st.terrain), forecast:다음.설명, end_at:'',
        result:{ 단계:'환경 변화', 설명:변화.설명, env:env, 예보:다음.설명 }
      }}).then(function () { return { ok:true }; },
               function (e) { return { ok:false, msg:e.message }; });
    },

    /* 선생님이 재해를 직접 일으킨다 — 극적인 순간을 만들 때 */
    '재해지정': function (code, kind) {
      return EVO.판읽기().then(function (판) {
        var g = 판.game, st = 설정읽기(g);
        var board = 보드읽기(g), aliens = 개체정리(판.aliens);
        var 재해 = R.재해발생(board, aliens, st.terrain || {}, R.재해찾기(kind), null);
        if (!재해) return { ok:false, msg:'그 재해가 일어날 자리가 없습니다.' };
        var st2 = {}; for (var kk in st) st2[kk] = st[kk];
        st2.terrain = 재해.terrain;
        return EVO.rpc('evo_mark_dead', { p_code:code, p_game:EVO.gameId, p_ids:재해.죽을것 })
          .then(function () {
            return EVO.rpc('evo_set_state', { p_code:code, p_game:EVO.gameId, p_patch:{
              settings:st2,
              board:R.보드만들기({ dt:g.env_dt, dm:g.env_dm }, 재해.terrain),
              result:{ 단계:'환경 변화', 설명:'선생님이 일으킨 재해',
                       재해:{ k:재해.사건, 이름:재해.이름, emoji:재해.emoji, 말:재해.말,
                              칸들:재해.칸들, 살아남음:재해.살아남음, 죽음:재해.죽음 } }
            }});
          })
          .then(function () { return { ok:true }; },
                function (e) { return { ok:false, msg:e.message }; });
      });
    },

    '설정변경': function (code, patch) {
      var st = 설정읽기(EVO.game);
      for (var k in patch) if (st.hasOwnProperty(k)) st[k] = patch[k];
      return EVO.rpc('evo_set_state', { p_code:code, p_game:EVO.gameId, p_patch:{ settings:st } })
        .then(function () { return { ok:true, settings:st }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    '시간연장': function (code, sec) {
      var g = EVO.game;
      var base = g.end_at ? Math.max(Date.now(), Date.parse(g.end_at)) : Date.now();
      return EVO.rpc('evo_set_state', { p_code:code, p_game:EVO.gameId,
        p_patch:{ end_at:new Date(base + (sec||60)*1000).toISOString() } })
        .then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    },

    '게임초기화': function (code, 명단도) {
      return EVO.rpc('evo_reset', { p_code:code, p_game:EVO.gameId, p_wipe_players:!!명단도 })
        .then(function () { return { ok:true }; },
              function (e) { return { ok:false, msg:e.message }; });
    }
  };

  /* ── 학생이 볼 모양 ── */
  function 학생상태만들기(판, pid) {
    var g = 판.game;
    if (!g) return { ok:false, msg:'방이 사라졌습니다.' };
    var st = 설정읽기(g), board = 보드읽기(g);
    var aliens = 개체정리(판.aliens);

    var me = null, i;
    for (i=0;i<판.players.length;i++) if (판.players[i].id === pid) me = 판.players[i];
    if (!me) return { ok:false, msg:'참가 정보가 없습니다.' };

    var 몰림 = R.몰림세기(aliens);
    var 내것=[], 남=[], cells=[];
    for (var r=0;r<5;r++) for (var c=0;c<5;c++) cells.push({ r:r, c:c, n:0, mine:0 });

    for (i=0;i<aliens.length;i++) {
      var a = aliens[i];
      if (a.player === pid) 내것.push(a);
      if (!a.alive) continue;
      var cell = cells[a.r*5 + a.c];
      cell.n++;
      if (a.player === pid) cell.mine++;
    }

    // 내 개체 근처만 자세히 — 이동은 2칸, 교배는 1칸
    var 반경 = (g.phase === 'move') ? 2 : 1, 관심 = {};
    for (i=0;i<내것.length;i++) {
      var m = 내것[i];
      if (!m.alive) continue;
      for (var dr=-반경;dr<=반경;dr++) for (var dc=-반경;dc<=반경;dc++) {
        var rr=m.r+dr, cc=m.c+dc;
        if (rr>=0&&rr<5&&cc>=0&&cc<5) 관심[rr+','+cc]=1;
      }
    }
    var 이름표 = {};
    for (i=0;i<판.players.length;i++) 이름표[판.players[i].id] = 판.players[i].name;

    for (i=0;i<aliens.length;i++) {
      var b = aliens[i];
      if (!b.alive || b.player === pid) continue;
      if (!관심[b.r+','+b.c]) continue;
      // 남의 개체는 «겉모습» 만 나간다. 숨은 열성은 교배해 봐야 안다
      남.push({ sid:String(b.player), name:이름표[b.player]||'?', i:b.id,
                r:b.r, c:b.c, ph:R.표현형문자열(b.geno, board[b.r][b.c]), bred:b.bred?1:0 });
    }

    // 신청함 — 상대가 어떻게 생겼는지 붙여 준다.
    // 교배 신청과 거래 신청이 같은 표에 있으므로 kind 를 그대로 실어 보낸다.
    var byId = {};
    for (i=0;i<aliens.length;i++) byId[aliens[i].id] = aliens[i];
    var inbox=[], sent=[], 거래낸수=0;
    for (i=0;i<판.requests.length;i++) {
      var q = 판.requests[i];
      var kind = q.kind || 'mate';
      // 거래 신청은 그 세대에만 살아 있다. 지난 세대 것은 없는 셈 친다
      if (kind === 'trade' && q.turn !== g.turn) continue;
      var A = byId[q.from_alien], B = byId[q.to_alien];
      if (!A || !B) continue;
      if (B.player === pid && q.state === 'pending') {
        inbox.push({ id:q.id, kind:kind, dna:q.dna||0,
                     fn:이름표[A.player]||'?', fa:A.id, ta:B.id,
                     fph:R.표현형문자열(A.geno, board[A.r][A.c]), fr:A.r, fc:A.c,
                     tph:R.표현형문자열(B.geno, board[B.r][B.c]) });
      }
      /* 거래는 성사되면 개체 주인이 뒤바뀐다. 그래서 «누가 신청했나» 는
         개체를 타고 찾으면 안 되고 from_player 를 봐야 한다 */
      var 낸사람 = (kind === 'trade') ? q.from_player : A.player;
      if (낸사람 === pid) {
        if (q.state === 'pending')
          sent.push({ id:q.id, kind:kind, dna:q.dna||0,
                      tn:이름표[B.player]||'?', state:q.state });
        if (kind === 'trade') 거래낸수++;   // 거절당한 것도 센다
      }
    }

    // 이번 세대에 태어난 개체 — 숨은 열성이 드러나는 순간
    var 신생 = [];
    for (i=0;i<내것.length;i++)
      if (내것[i].alive && 내것[i].born === g.turn) 신생.push(내것[i].geno);

    /* 더듬이가 긴 개체가 있으면 다음 재해 경보를 볼 수 있다.
       보이는 형질에 «정보» 를 얹어 두면, 남의 외계인을 유심히 볼 이유가 생긴다. */
    var 경보 = null;
    if (st.nextEvent && R.경보볼수있나(내것)) {
      var ev0 = R.재해찾기(st.nextEvent.k);
      if (ev0) 경보 = { 이름:ev0.n, emoji:ev0.emoji,
                        칸: String.fromCharCode(65+st.nextEvent.r) + (st.nextEvent.c+1) };
    }

    var 짝수 = 0;
    for (i=0;i<내것.length;i++) if (내것[i].alive && 내것[i].bred) 짝수++;

    /* 새 형질 — 반 전체에 몇 마리나 퍼졌는가, 그중 내 것은 몇 마리인가.
       «생겼다가 사라졌다» 인지 «퍼지고 있다» 인지는 이 숫자로만 알 수 있다 */
    var 새현황 = [];
    for (i=0;i<R.새형질들.length;i++) {
      var NG2 = R.새형질들[i], 자리2 = R.자리(NG2.k), 전체=0, 내수=0;
      for (var z=0;z<aliens.length;z++) {
        if (!aliens[z].alive) continue;
        if (+aliens[z].geno.charAt(자리2) >= 1) {
          전체++; if (aliens[z].player === pid) 내수++;
        }
      }
      if (전체) 새현황.push({ k:NG2.k, 이름:NG2.n, emoji:NG2.emoji, 전체:전체, 내것:내수 });
    }

    return {
      ok:true, seq:g.seq, phase:g.phase, phaseName:R.PHASE_NAME[g.phase]||g.phase,
      turn:g.turn, board:board, env:{ dt:g.env_dt, dm:g.env_dm },
      endAt: g.end_at ? Date.parse(g.end_at) : 0, now:EVO.지금(),
      forecast: g.forecast || '',
      settings:{ moveMax:2, breedMax:1, cap:st.cap, start:st.start,
                 base:st.base, span:st.span, lifeCost:st.lifeCost, lifeExtra:st.lifeExtra,
                 kids:st.kids, lifeKids:st.lifeKids, inbreed:st.inbreed,
                 cellCap:st.cellCap, crowd:st.crowd, kid2:st.kid2, kid4:st.kid4,
                 tradeMax:st.tradeMax, tradeDnaMax:st.tradeDnaMax,
                 editCost:st.editCost, scoutCost:st.scoutCost },
      /* 잡종 강세(HET)와 구역별 유리 형질(fav)은 일부러 보내지 않는다.
         학생이 살아남는 것을 보고 스스로 알아내야 한다 */
      me:{ id:String(me.id), name:me.name,
           home: (me.home_r==null ? null : { r:me.home_r, c:me.home_c }),
           ready:!!me.ready,
           /* 적응도도 생존 확률도 알려 주지 않는다.
              학생은 «누가 죽고 누가 살았나» 만 보고 규칙을 알아내야 한다.
              붐빔만은 눈에 보이는 사실이라(같은 칸 마릿수) 그대로 둔다. */
           aliens:내것.map(function (a) {
             var v = 화면용(a);
             if (a.alive) v.crowd = Math.max(0, (몰림[a.r+','+a.c]||0) - st.cellCap);
             return v;
           }),
           dna: me.dna || 0, dnaUsed: me.dna_used || 0, trades:거래낸수,
           /* 이번 세대에 받은 상. 학생 화면이 이걸 보고 팝업을 한 번 띄운다 */
           award: (me.award && me.award.turn === g.turn) ? me.award : null,
           /* 정찰을 산 학생만 적응도를 본다. 계산은 학생 브라우저가 한다 */
           scout: (me.scout_turn != null && me.scout_turn === g.turn),
           kids:짝수, kidGenos:신생, cross:me.cross_n||0 },
      cells:cells, near:남, inbox:inbox, sent:sent, 경보:경보, 새형질:새현황,
      /* 재해가 학생 화면에 안 뜨면 «왜 죽었는지» 를 알 방법이 없다.
         board.html 은 뒤에 앉은 학생에게 안 보인다 */
      result: g.result
    };
  }

  /* ── 선생님이 볼 모양 ── */
  var 기록 = [];   // 세대별 형질 빈도. 브라우저에만 둔다 — 그래프 재료일 뿐이다
  var 기록턴 = -1;

  function 교사판만들기(판) {
    var g = 판.game;
    if (!g) return { ok:false, msg:'방을 열지 못했습니다.' };
    var st = 설정읽기(g), board = 보드읽기(g);
    var aliens = 개체정리(판.aliens);

    // 세대가 바뀔 때마다 빈도를 한 번씩 남긴다
    if (g.turn !== 기록턴) {
      var f = R.빈도(aliens);
      if (f.n) { 기록.push({ turn:g.turn, n:f.n, f:f.f }); if (기록.length>40) 기록.shift(); }
      기록턴 = g.turn;
    }

    var cells=[], i;
    for (var r=0;r<5;r++) for (var c=0;c<5;c++) cells.push({ r:r, c:c, list:[] });
    var 통={}, 총=0;
    for (i=0;i<판.players.length;i++)
      통[판.players[i].id] = { id:String(판.players[i].id), name:판.players[i].name,
        live:0, fit:0, _fit:0, biomes:0, _b:{}, cross:판.players[i].cross_n||0,
        dna:판.players[i].dna||0, dnaUsed:판.players[i].dna_used||0,
        ready:!!판.players[i].ready,
        home:(판.players[i].home_r==null?null:{ r:판.players[i].home_r, c:판.players[i].home_c }) };

    for (i=0;i<aliens.length;i++) {
      var a = aliens[i];
      if (!a.alive) continue;
      var p = 통[a.player];
      총++;
      cells[a.r*5+a.c].list.push({ sid:String(a.player),
        name:(p&&p.name)||'?', ph:R.표현형문자열(a.geno, board[a.r][a.c]), bred:a.bred?1:0 });
      if (p) { p.live++; p._fit += R.적응도(a.geno, board[a.r][a.c]); p._b[board[a.r][a.c]]=1; }
    }
    var 학생별=[];
    for (var k in 통) {
      var q=통[k];
      q.fit = q.live ? Math.round(q._fit/q.live) : 0;
      q.biomes = Object.keys(q._b).length;
      delete q._fit; delete q._b;
      학생별.push(q);
    }
    학생별.sort(function (x,y) { return y.live - x.live; });

    return {
      ok:true, seq:g.seq, phase:g.phase, phaseName:R.PHASE_NAME[g.phase]||g.phase,
      turn:g.turn, board:board, env:{ dt:g.env_dt, dm:g.env_dm },
      endAt: g.end_at ? Date.parse(g.end_at) : 0, now:EVO.지금(),
      forecast: g.forecast || '', settings:st, result:g.result,
      log:[], cells:cells, 학생별:학생별, 총개체:총,
      새형질: (function () {
        var out=[];
        for (var i=0;i<R.새형질들.length;i++) {
          var G=R.새형질들[i], j=R.자리(G.k), n=0, 사람={};
          for (var z=0;z<aliens.length;z++) {
            if (!aliens[z].alive) continue;
            if (+aliens[z].geno.charAt(j) >= 1) { n++; 사람[aliens[z].player]=1; }
          }
          if (n) out.push({ k:G.k, 이름:G.n, emoji:G.emoji, 마리:n,
                            사람수:Object.keys(사람).length });
        }
        return out;
      })(),
      /* 판읽기 가 «끝난 거래» 까지 실어 오므로 아직 답이 없는 것만 센다 */
      대기신청:판.requests.filter(function (q) { return q.state === 'pending'; }).length,
      hist:기록,
      _aliens:aliens, _players:판.players
    };
  }

  /* ── 단계 진행 — 여기가 게임 엔진이다 ── */
  function 단계진행(code, 지정) {
    return EVO.판읽기().then(function (판) {
      var g = 판.game;
      if (!g) return { ok:false, msg:'방이 없습니다.' };
      var st = 설정읽기(g), board = 보드읽기(g);
      var aliens = 개체정리(판.aliens);

      var 다음 = 지정;
      if (!다음) {
        다음 = { lobby:'setup', setup:'survive', survive:'move', move:'breed',
                 breed:'next', next:'env', env:'survive' }[g.phase] || 'survive';
      }

      var patch = { phase:다음, end_at:'' , result:null };

      if (다음 === 'setup') {
        return 밀기(code, patch);
      }

      if (다음 === 'survive') {
        /* 개체를 마음대로 옮기지 않는다.
           학생이 고른 자리가 곧 그 개체의 자리다 — 그래야 «내 선택» 이 된다.
           대신 한 칸이 넉넉히 먹여 살리는 수(cellCap)를 열 마리보다 넉넉하게 두어,
           혼자 열 마리를 몰아 두어도 그것만으로 몰살하지는 않게 했다. */
        var rep = R.생존판정(aliens, board, st);
        return EVO.rpc('evo_mark_dead', { p_code:code, p_game:EVO.gameId, p_ids:rep.죽을것 })
          .then(function () {
            patch.result = { 단계:'생존 판정', 살아남음:rep.살아남음, 죽음:rep.죽음,
                             붐빈수:rep.붐빈수, 넉넉한수:rep.넉넉한수 };
            return 밀기(code, patch);
          });
      }

      if (다음 === 'move') {
        return EVO.rpc('evo_stamp_origin', { p_code:code, p_game:EVO.gameId }).then(function () {
          if (st.moveSec > 0) patch.end_at = new Date(Date.now()+st.moveSec*1000).toISOString();
          return 밀기(code, patch);
        });
      }

      if (다음 === 'breed') {
        return EVO.rpc('evo_clear_breed', { p_code:code, p_game:EVO.gameId }).then(function () {
          if (st.breedSec > 0) patch.end_at = new Date(Date.now()+st.breedSec*1000).toISOString();
          return 밀기(code, patch);
        });
      }

      if (다음 === 'next') {
        // 이미 성사된 짝 + 시간 안에 못 한 개체를 같은 구역에서 자동으로
        return EVO.get('evo_pair?game_id=eq.'+EVO.gameId+'&select=*').then(function (pairs) {
          var byId={}, i;
          for (i=0;i<aliens.length;i++) byId[aliens[i].id]=aliens[i];
          var 짝목록=[], 짝지은={};
          for (i=0;i<(pairs||[]).length;i++) {
            var P=pairs[i], A=byId[P.a_alien], B=byId[P.b_alien];
            if (!A || !B) continue;
            짝목록.push({ a:A, b:B, same:P.same_owner });
            짝지은[A.id]=1; 짝지은[B.id]=1;
          }
          var 자동 = R.자동교배(aliens, 짝지은, st);
          짝목록 = 짝목록.concat(자동.짝);

          var rep = R.세대교체(aliens, 짝목록, 판.players, g.turn, st, 보드읽기(g));
          var 보낼것 = rep.개체.map(function (x) {
            return { player:x.player, geno:x.geno, r:x.r, c:x.c,
                     alive:true, born:x.born, age:x.age };
          });
          return EVO.rpc('evo_replace_aliens',
              { p_code:code, p_game:EVO.gameId, p_aliens:보낼것 })
            .then(function () {
              patch.turn = rep.세대;
              /* 없던 형질이 생겼으면 이름과 «누구네 개체에서» 를 함께 올린다.
                 이 수업의 알맹이라, 놓치면 그냥 지나가 버린다 */
              var 이름표2 = {};
              for (var q2=0;q2<판.players.length;q2++)
                이름표2[판.players[q2].id] = 판.players[q2].name;
              var 새소식 = (rep.새형질||[]).map(function (x) {
                return { 형질:x.형질, 이름:x.이름, emoji:x.emoji, 마리:x.마리,
                         누구:이름표2[x.player] || '?', player:String(x.player),
                         칸:String.fromCharCode(65+x.r) + (x.c+1) };
              });
              patch.result = { 단계:'세대 교체', 세대:rep.세대, 자손:rep.자손,
                               사망:rep.사망, 장수생존:rep.장수생존, 구제:rep.구제,
                               새형질:새소식, 출생:rep.출생별, 출생죽음:rep.출생죽음,
                               자동교배:{ 성사:자동.성사, 실패:자동.실패 } };
              return 밀기(code, patch);
            });
        });
      }

      if (다음 === 'env') {
        var 변화 = g.forecast ? _변화by설명(g.forecast) : R.무작위변화({ dt:g.env_dt, dm:g.env_dm }, st);
        var env = R.환경적용({ dt:g.env_dt, dm:g.env_dm }, 변화, st);
        var terrain = st.terrain || {};
        var board2 = R.보드만들기(env, terrain);

        /* 재해 — 세대마다 낮은 확률로 한 구역 일대를 덮친다.
           사건마다 살아남게 해 주는 형질이 다르다. 그것도 알려 주지 않는다. */
        /* 지난 세대에 미리 뽑아 둔 재해가 있으면 그대로 일으킨다.
           경보를 봤는데 다른 게 오면 경보가 거짓말이 된다. */
        var 재해 = null;
        if (st.nextEvent) {
          재해 = R.재해발생(board2, aliens, terrain,
                            R.재해찾기(st.nextEvent.k), { r:st.nextEvent.r, c:st.nextEvent.c });
        }
        /* 다음 세대 재해를 미리 뽑는다 (일어날지 말지도 여기서 정해진다) */
        var 다음재해 = (Math.random() < st.eventRate)
          ? { k: R.무작위재해().k, r: Math.floor(Math.random()*5), c: Math.floor(Math.random()*5) }
          : null;

        var 예보 = R.무작위변화(env, st);   // 다음 세대에 «진짜로 움직일» 방향만 예보한다
        patch.env_dt = env.dt; patch.env_dm = env.dm;
        patch.forecast = 예보.설명;

        var st2 = {}; for (var kk in st) st2[kk] = st[kk];
        st2.nextEvent = 다음재해;

        if (재해) {
          terrain = 재해.terrain;
          board2 = R.보드만들기(env, terrain);
          st2.terrain = terrain;
          patch.settings = st2;
          patch.board = board2;
          patch.result = { 단계:'환경 변화', 설명:변화.설명, env:env, 예보:예보.설명,
                           재해:{ k:재해.사건, 이름:재해.이름, emoji:재해.emoji, 말:재해.말,
                                  칸들:재해.칸들, 살아남음:재해.살아남음, 죽음:재해.죽음 } };
          return EVO.rpc('evo_mark_dead',
              { p_code:code, p_game:EVO.gameId, p_ids:재해.죽을것 })
            .then(function () { return 밀기(code, patch); });
        }

        patch.settings = st2;
        patch.board = board2;
        patch.result = { 단계:'환경 변화', 설명:변화.설명, env:env, 예보:예보.설명 };
        return 밀기(code, patch);
      }

      return 밀기(code, patch);
    });
  }

  function _변화by설명(설명) {
    for (var i=0;i<R.변화목록.length;i++) if (R.변화목록[i].설명 === 설명) return R.변화목록[i];
    return R.무작위변화();
  }

  function 밀기(code, patch) {
    return EVO.rpc('evo_set_state', { p_code:code, p_game:EVO.gameId, p_patch:patch })
      .then(function () { return { ok:true, phase:patch.phase, result:patch.result }; },
            function (e) { return { ok:false, msg:e.message }; });
  }

  /* ── 화면이 부르는 창구 ── */
  function RUN(이름) {
    var args = [].slice.call(arguments, 1);
    var f = 처리[이름];
    if (!f) return Promise.reject(new Error('모르는 호출: ' + 이름));
    try { return Promise.resolve(f.apply(null, args)); }
    catch (e) { return Promise.reject(e); }
  }

  EVO.init(전역.CONFIG || {});
  전역.EVO = EVO;
  전역.RUN = RUN;
  전역.OFFLINE = !EVO.ready();
})(window);
