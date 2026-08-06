/* ════════════════════════════════════════════════════════════════
 *  db.js — 실시간 수업앱 공통 데이터 계층
 *  2026 광주하남영재교육원 · 중학 융합과정 (변석환)
 *
 *  첫째 규칙 — 게임이 서버를 기다리지 않는다.
 *    · 쓰기는 전부 큐에 넣고 곧바로 돌아온다. 실패하면 큐에 남아 나중에 간다
 *    · 읽기는 실패하면 null 이다. 화면이 «순위 없음»이 될 뿐 게임은 안 멈춘다
 *    · 학교망이 supabase 를 막아도 수업은 끝까지 굴러가야 한다
 *
 *  라이브러리를 안 쓴다. fetch 만 쓴다.
 *  모듈도 안 쓴다 — 게임 파일이 일반 스크립트라 섞이면 실행 순서가 꼬인다.
 *  그냥 window.DB 로 올린다.
 * ════════════════════════════════════════════════════════════════ */

(function (전역) {
  'use strict';

  var 큐키 = 'rt_queue_v1';
  var 토큰키 = 'rt_token_v1';

  var DB = {
    url: null, key: null,
    player: null,          // 이번 회차에서 내 번호
    서버시각차: 0,          // 서버 - 내 시계. 여러 대를 같은 순간에 출발시키는 데 쓴다
    _보내는중: false,
    _타이머: null,

    /* ── 준비 ── */
    init: function (설정) {
      this.url = ((설정 && 설정.SUPABASE_URL) || '').replace(/\/+$/, '');
      this.key = (설정 && 설정.SUPABASE_ANON_KEY) || '';
      if (!this._타이머) {
        var 나 = this;
        this._타이머 = setInterval(function () { 나.flush(); }, 5000);
        addEventListener('online', function () { 나.flush(); });
      }
      return this.ready();
    },
    ready: function () { return !!(this.url && this.key); },

    /* 브라우저마다 하나. 남의 기록을 못 건드리게 하는 열쇠다 */
    token: function () {
      var t = localStorage.getItem(토큰키);
      if (!t) {
        t = (crypto.randomUUID ? crypto.randomUUID()
                               : String(Date.now()) + Math.random().toString(36).slice(2));
        localStorage.setItem(토큰키, t);
      }
      return t;
    },

    /* ── 바닥 ── */
    _rpc: function (이름, 인자, 제한ms) {
      if (!this.ready()) return Promise.reject(new Error('설정 없음'));
      var ac = new AbortController();
      var 시계 = setTimeout(function () { ac.abort(); }, 제한ms || 8000);
      return fetch(this.url + '/rest/v1/rpc/' + 이름, {
        method: 'POST',
        headers: {
          'apikey': this.key,
          'Authorization': 'Bearer ' + this.key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(인자 || {}),
        signal: ac.signal
      }).then(function (r) {
        clearTimeout(시계);
        if (!r.ok) return r.text().then(function (t) { throw new Error(이름 + ' ' + r.status + ' ' + t); });
        return r.text().then(function (t) { return t ? JSON.parse(t) : null; });
      }, function (e) { clearTimeout(시계); throw e; });
    },

    /* 읽기는 조용히 실패한다. 서버 시각도 함께 챙긴다(Date 헤더) */
    _get: function (길, 제한ms) {
      var 나 = this;
      if (!this.ready()) return Promise.resolve(null);
      var ac = new AbortController();
      var 시계 = setTimeout(function () { ac.abort(); }, 제한ms || 8000);
      return fetch(this.url + '/rest/v1/' + 길, {
        headers: { 'apikey': this.key, 'Authorization': 'Bearer ' + this.key },
        signal: ac.signal
      }).then(function (r) {
        clearTimeout(시계);
        var d = r.headers.get('date');
        if (d) { var t = Date.parse(d); if (!isNaN(t)) 나.서버시각차 = t - Date.now(); }
        if (!r.ok) return null;
        return r.json();
      }, function () { clearTimeout(시계); return null; });
    },

    서버지금: function () { return Date.now() + this.서버시각차; },

    /* ── 큐 ── */
    _큐읽기: function () { try { return JSON.parse(localStorage.getItem(큐키) || '[]'); } catch (e) { return []; } },
    _큐쓰기: function (q) { try { localStorage.setItem(큐키, JSON.stringify(q.slice(-200))); } catch (e) {} },

    /* 쓰기는 여기로만 들어온다. 곧바로 돌아온다 — 게임을 붙잡지 않는다 */
    enqueue: function (이름, 인자) {
      var q = this._큐읽기();
      // 점수는 마지막 값만 의미가 있다. 같은 종류는 덮어쓴다
      var 덮어쓰기 = { report_score: true };
      var i = -1;
      if (덮어쓰기[이름]) {
        for (var k = 0; k < q.length; k++) if (q[k].fn === 이름) { i = k; break; }
      }
      if (i >= 0) q[i] = { fn: 이름, args: 인자 }; else q.push({ fn: 이름, args: 인자 });
      this._큐쓰기(q);
      this.flush();
    },

    flush: function () {
      var 나 = this;
      if (this._보내는중 || !this.ready()) return Promise.resolve();
      var q = this._큐읽기();
      if (!q.length) return Promise.resolve();
      this._보내는중 = true;

      function 하나씩() {
        var q2 = 나._큐읽기();
        if (!q2.length) { 나._보내는중 = false; return Promise.resolve(); }
        return 나._rpc(q2[0].fn, q2[0].args).then(function () {
          var q3 = 나._큐읽기(); q3.shift(); 나._큐쓰기(q3);
          return 하나씩();
        }, function () { 나._보내는중 = false; });   // 못 보내면 남겨 둔다
      }
      return 하나씩();
    },

    밀린것: function () { return this._큐읽기().length; },

    /* ── 학생 ── */
    join: function (sessionId, 이름, 모둠) {
      var 나 = this;
      return this._rpc('join_session', {
        p_session: sessionId, p_name: 이름, p_token: this.token(), p_team: 모둠 || null
      }).then(function (id) { 나.player = id; return id; });
    },

    점수: function (plates, wrong, zap, codons) {
      if (!this.player) return;
      this.enqueue('report_score', {
        p_player: this.player, p_token: this.token(),
        p_plates: plates | 0, p_wrong: wrong | 0, p_zap: zap | 0, p_codons: codons || []
      });
    },

    유전형: function (세대, 적혈구, 고산, 살았나, 환경) {
      if (!this.player) return;
      this.enqueue('report_genotype', {
        p_player: this.player, p_token: this.token(), p_gen: 세대 | 0,
        p_blood: 적혈구 || null, p_alt: 고산 || null,
        p_survived: 살았나 === null ? null : !!살았나, p_env: 환경 || null
      });
    },

    기록: function (종류, 내용) {
      if (!this.player) return;
      this.enqueue('log_event', {
        p_player: this.player, p_token: this.token(), p_kind: 종류, p_payload: 내용 || null
      });
    },

    /* ── 읽기 — 실패하면 null ── */
    순위: function (sessionId, 몇명) {
      return this._get('ranking?session_id=eq.' + sessionId + '&order=rk.asc&limit=' + (몇명 || 12), 6000);
    },

    회차: function (sessionId) {
      return this._get('sessions?id=eq.' + sessionId + '&select=*', 6000)
        .then(function (r) { return (r && r[0]) || null; });
    },

    최근회차: function (활동) {
      return this._get('sessions?activity=eq.' + encodeURIComponent(활동) +
                       '&select=*&order=created_at.desc&limit=1', 6000)
        .then(function (r) { return (r && r[0]) || null; });
    },

    유전자풀: function (sessionId, 세대) {
      var 조건 = 세대 ? '&generation=eq.' + 세대 : '';
      return this._get('genotypes?session_id=eq.' + sessionId + 조건 +
                       '&select=generation,blood,altitude,survived', 6000);
    },

    /* ── 선생님 ── */
    선생님확인: function (코드) { return this._rpc('is_teacher', { p_code: 코드 }); },
    회차열기: function (코드, 제목, 활동) {
      return this._rpc('open_session', { p_code: 코드, p_title: 제목, p_activity: 활동 });
    },
    시작: function (코드, sessionId, 초) {
      return this._rpc('start_round', { p_code: 코드, p_session: sessionId, p_seconds: 초 });
    },
    끝내기: function (코드, sessionId) {
      return this._rpc('stop_round', { p_code: 코드, p_session: sessionId });
    }
  };

  전역.DB = DB;
})(window);
