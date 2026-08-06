/* Supabase 연결 값.
 *
 * 이 두 값은 원래 학생 브라우저로 나가는 «공개 값»이다. 숨길 수 없고 숨길 필요도 없다.
 * 대신 표에 직접 못 쓰게 막아 두었다 — 쓰기는 전부 함수를 지나가고,
 * 함수가 토큰과 선생님 코드를 확인한다. (비공개 레포의 db/schema.sql 참고)
 *
 * 2026-08-06 에 실제로 공격해 보고 넣었다. 아홉 가지 전부 막혔다 —
 *   선생님 코드 훔쳐보기 · 회차 지우기 · 회차 제목 바꾸기 · 회차 몰래 만들기 ·
 *   점수 표 직접 고치기 · 남의 토큰으로 점수 조작 · 남의 이름 가로채기 ·
 *   틀린 코드로 라운드 시작 · 남의 토큰 훔쳐보기
 *
 * service_role 키는 절대 여기에 넣지 않는다. 그건 무엇이든 할 수 있는 열쇠다.
 * 비어 있으면 서버 없이 도는 «혼자 연습» 상태가 된다. 게임은 그대로 돌아간다.
 */
window.CONFIG = {
  SUPABASE_URL: 'https://jzgsoymvvnktgqwnvnra.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Z3NveW12dm5rdGdxd252bnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NTE1NzIsImV4cCI6MjEwMTUyNzU3Mn0.iQmrc_bp3cbv7h4ohf-IQIocaZWnksDPdmBzR5dZAZg'
};
