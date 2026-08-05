/* Supabase 연결 값.
 *
 * 이 두 값은 원래 학생 브라우저로 나가는 «공개 값»이다. 숨길 수 없고 숨길 필요도 없다.
 * 대신 표에 직접 못 쓰게 막아 두었다 — 쓰기는 전부 함수를 지나가고,
 * 함수가 토큰과 선생님 코드를 확인한다. (db/schema.sql 참고)
 *
 * service_role 키는 절대 여기에 넣지 않는다. 그건 무엇이든 할 수 있는 열쇠다.
 */
export const CONFIG = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: ''
};
