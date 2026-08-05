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
 *  CDN 하나가 막히면 그날 수업이 날아가기 때문이다.
 * ════════════════════════════════════════════════════════════════ */

const 큐키 = 'rt_queue_v1';
const 토큰키 = 'rt_token_v1';

export const DB = {
  url: null, key: null,
  player: null,          // 이번 회차에서 내 번호
  _보내는중: false,
  _타이머: null,

  /* ── 준비 ── */
  init(설정){
    this.url = (설정 && 설정.SUPABASE_URL || '').replace(/\/+$/, '');
    this.key = 설정 && 설정.SUPABASE_ANON_KEY || '';
    if (!this._타이머){
      this._타이머 = setInterval(() => this.flush(), 5000);
      addEventListener('online', () => this.flush());
    }
    return this.ready();
  },
  ready(){ return !!(this.url && this.key); },

  /* 브라우저마다 하나. 남의 기록을 못 건드리게 하는 열쇠다 */
  token(){
    let t = localStorage.getItem(토큰키);
    if (!t){
      t = (crypto.randomUUID ? crypto.randomUUID()
                             : String(Date.now()) + Math.random().toString(36).slice(2));
      localStorage.setItem(토큰키, t);
    }
    return t;
  },

  /* ── 바닥 ── */
  async _rpc(이름, 인자, 제한ms){
    if (!this.ready()) throw new Error('설정 없음');
    const ac = new AbortController();
    const 시계 = setTimeout(() => ac.abort(), 제한ms || 8000);
    try {
      const r = await fetch(`${this.url}/rest/v1/rpc/${이름}`, {
        method: 'POST',
        headers: {
          'apikey': this.key,
          'Authorization': `Bearer ${this.key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(인자 || {}),
        signal: ac.signal
      });
      if (!r.ok) throw new Error(`${이름} ${r.status} ${await r.text()}`);
      const t = await r.text();
      return t ? JSON.parse(t) : null;
    } finally { clearTimeout(시계); }
  },

  async _get(길, 제한ms){
    if (!this.ready()) return null;
    const ac = new AbortController();
    const 시계 = setTimeout(() => ac.abort(), 제한ms || 8000);
    try {
      const r = await fetch(`${this.url}/rest/v1/${길}`, {
        headers: { 'apikey': this.key, 'Authorization': `Bearer ${this.key}` },
        signal: ac.signal
      });
      if (!r.ok) return null;
      return await r.json();
    } catch(e){ return null; }        // 읽기는 조용히 실패한다
      finally { clearTimeout(시계); }
  },

  /* ── 큐 ── */
  _큐읽기(){ try { return JSON.parse(localStorage.getItem(큐키) || '[]'); } catch(e){ return []; } },
  _큐쓰기(q){ try { localStorage.setItem(큐키, JSON.stringify(q.slice(-200))); } catch(e){} },

  /* 쓰기는 여기로만 들어온다. 곧바로 돌아온다 — 게임을 붙잡지 않는다 */
  enqueue(이름, 인자){
    const q = this._큐읽기();
    // 같은 종류의 최신 보고만 남긴다. 점수는 마지막 값만 의미가 있다
    const 덮어쓰기 = { report_score: true };
    const i = 덮어쓰기[이름] ? q.findIndex(x => x.fn === 이름) : -1;
    if (i >= 0) q[i] = { fn:이름, args:인자 }; else q.push({ fn:이름, args:인자 });
    this._큐쓰기(q);
    this.flush();
  },

  async flush(){
    if (this._보내는중 || !this.ready()) return;
    const q = this._큐읽기();
    if (!q.length) return;
    this._보내는중 = true;
    try {
      while (q.length){
        const 하나 = q[0];
        try { await this._rpc(하나.fn, 하나.args); }
        catch(e){ break; }            // 못 보내면 남겨 둔다. 다음에 다시 시도한다
        q.shift();
        this._큐쓰기(q);
      }
    } finally { this._보내는중 = false; }
  },

  밀린것(){ return this._큐읽기().length; },

  /* ── 학생 ── */
  async join(sessionId, 이름, 모둠){
    const id = await this._rpc('join_session', {
      p_session: sessionId, p_name: 이름, p_token: this.token(), p_team: 모둠 || null
    });
    this.player = id;
    return id;
  },

  점수(plates, wrong, zap, codons){
    if (!this.player) return;
    this.enqueue('report_score', {
      p_player: this.player, p_token: this.token(),
      p_plates: plates|0, p_wrong: wrong|0, p_zap: zap|0, p_codons: codons || []
    });
  },

  유전형(세대, 적혈구, 고산, 살았나, 환경){
    if (!this.player) return;
    this.enqueue('report_genotype', {
      p_player: this.player, p_token: this.token(), p_gen: 세대|0,
      p_blood: 적혈구 || null, p_alt: 고산 || null,
      p_survived: 살았나 === null ? null : !!살았나, p_env: 환경 || null
    });
  },

  기록(종류, 내용){
    if (!this.player) return;
    this.enqueue('log_event', {
      p_player: this.player, p_token: this.token(), p_kind: 종류, p_payload: 내용 || null
    });
  },

  /* ── 읽기 — 실패하면 null ── */
  async 순위(sessionId, 몇명){
    return await this._get(
      `ranking?session_id=eq.${sessionId}&order=rk.asc&limit=${몇명 || 12}`, 6000);
  },

  async 회차(sessionId){
    const r = await this._get(`sessions?id=eq.${sessionId}&select=*`, 6000);
    return r && r[0] || null;
  },

  async 유전자풀(sessionId, 세대){
    const 조건 = 세대 ? `&generation=eq.${세대}` : '';
    return await this._get(
      `genotypes?session_id=eq.${sessionId}${조건}&select=generation,blood,altitude,survived`, 6000);
  },

  /* 서버 시계와 내 시계의 차 — 24대를 같은 순간에 출발시키려면 필요하다 */
  async 시차(){
    const t0 = Date.now();
    const r = await this._get('sessions?select=id&limit=1', 5000);
    if (r === null) return 0;
    return 0;   // PostgREST 는 서버 시각을 안 준다. 회차의 ends_at 을 기준으로 삼는다
  },

  /* ── 선생님 ── */
  async 선생님확인(코드){ return await this._rpc('is_teacher', { p_code: 코드 }); },
  async 회차열기(코드, 제목, 활동){
    return await this._rpc('open_session', { p_code: 코드, p_title: 제목, p_activity: 활동 });
  },
  async 시작(코드, sessionId, 초){
    return await this._rpc('start_round', { p_code: 코드, p_session: sessionId, p_seconds: 초 });
  },
  async 끝내기(코드, sessionId){
    return await this._rpc('stop_round', { p_code: 코드, p_session: sessionId });
  }
};
