/* ════════════════════════════════════════════════════════════════
 *  호환.js — 앱스크립트에서 쓰던 call() 을 그대로 흉내 낸다.
 *
 *  염기뚜이·마을의 비밀은 1500줄이 넘는데 서버에 닿는 곳은 call() 하나뿐이다.
 *  그래서 call() 만 갈아 끼우면 게임 코드는 손대지 않아도 된다.
 *
 *  옮기면서 게임 규칙을 건드리지 않는 것이 중요하다.
 *  그 균형은 수업에서 아이들에게 시험해 맞춰 놓은 것이라, 다시 맞출 방법이 없다.
 *
 *  주고받는 모양을 앱스크립트 때와 똑같이 맞춘다 —
 *    라운드상태 → { now, state, startAt, endAt }
 *    랭킹읽기   → { 개인: [{ n, p, w }] }
 *    영업종료   → { 순위, 전체 }
 *    점수보고   → (응답 안 씀)
 * ════════════════════════════════════════════════════════════════ */

(function (전역) {
  'use strict';

  /* DB 를 여기서 켠다.
     밖에서 켜 주기를 기다렸다가는 아래 SRV 를 정할 때 아직 꺼져 있어
     «서버 없음»으로 굳어 버린다. 실제로 그렇게 한 번 당했다. */
  if (전역.DB && !DB.ready()) DB.init(전역.CONFIG || {});

  var 활동 = 전역.활동이름 || 'ratatouille';   // 게임 파일에서 미리 정해 둘 수 있다
  var 회차 = null;          // 지금 열려 있는 회차
  var 회차읽은때 = 0;
  var 들어갔나 = false;

  function 회차가져오기() {
    // 자주 부르는 자리라 3초는 캐시한다
    if (회차 && Date.now() - 회차읽은때 < 3000) return Promise.resolve(회차);
    return DB.최근회차(활동).then(function (s) {
      회차 = s; 회차읽은때 = Date.now();
      return s;
    });
  }

  /* 이름을 처음 보낼 때 한 번만 들어간다 */
  function 입장보장(이름, 모둠) {
    if (들어갔나 || !이름) return Promise.resolve(DB.player);
    return 회차가져오기().then(function (s) {
      if (!s) return null;
      return DB.join(s.id, 이름, 모둠).then(function (id) {
        들어갔나 = true;
        return id;
      });
    });
  }

  var 처리 = {
    /* 대기실이 4초마다 부른다. 여기서 «다 같이 시작»이 결정된다 */
    라운드상태: function () {
      return 회차가져오기().then(function (s) {
        var now = DB.서버지금();
        if (!s) return { now: now, state: 'waiting', startAt: 0, endAt: 0 };
        return {
          now: now,
          state: s.state,
          startAt: s.started_at ? Date.parse(s.started_at) : 0,
          endAt: s.ends_at ? Date.parse(s.ends_at) : 0
        };
      });
    },

    랭킹읽기: function () {
      return 회차가져오기().then(function (s) {
        if (!s) return { 개인: [] };
        return DB.순위(s.id, 12).then(function (r) {
          if (!r) return { 개인: [] };
          return {
            개인: r.map(function (x) {
              return { n: x.name, p: x.plates, w: x.wrong };
            })
          };
        });
      });
    },

    /* 점수는 큐로 나간다. 게임을 붙잡지 않는다 */
    점수보고: function (p) {
      return 입장보장(p && p.name, p && p.team).then(function (id) {
        if (!id) return null;
        DB.점수(p.plates, p.wrong, p.zap || 0, p.codons || []);
        return null;
      });
    },

    /* 끝나면 마지막 점수를 보내고 내 등수를 받아 온다 */
    영업종료: function (p) {
      return 입장보장(p && p.name, p && p.team).then(function (id) {
        if (!id) return null;
        DB.점수(p.plates, p.wrong, p.zap || 0, p.codons || []);
        // 큐가 실제로 나간 뒤에 읽어야 내 점수가 반영된 등수가 나온다
        return DB.flush().then(function () {
          return 회차가져오기();
        }).then(function (s) {
          if (!s) return null;
          return DB.순위(s.id, 200);
        }).then(function (r) {
          if (!r || !r.length) return null;
          var 나 = null;
          for (var i = 0; i < r.length; i++) if (r[i].name === p.name) { 나 = r[i]; break; }
          return { 순위: 나 ? 나.rk : r.length, 전체: r.length };
        });
      });
    }
  };

  /* 앱스크립트의 call() 과 같은 모양.
     서버가 죽어도 콜백은 반드시 불러 준다 — 안 그러면 화면이 멈춘 채로 남는다 */
  전역.call = function (fn, payload, ok) {
    var 일 = 처리[fn];
    if (!일 || !DB.ready()) { if (ok) ok(null); return; }
    try {
      일(payload).then(
        function (r) { if (ok) { try { ok(r); } catch (e) {} } },
        function () { if (ok) { try { ok(null); } catch (e) {} } }
      );
    } catch (e) { if (ok) ok(null); }
  };

  /* 게임이 «서버가 있나»를 이걸로 판단한다.
     설정이 없으면 null 이라 «혼자 연습하기»로 들어간다 — 그대로 살려 둔다 */
  전역.SRV = DB.ready() ? 처리 : null;

  /* 회차를 밖에서 정해 줄 수도 있다 (?s=12 같은 것) */
  전역.회차정하기 = function (s) { 회차 = s; 회차읽은때 = Date.now(); };

})(window);
