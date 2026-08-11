/* ════════════════════════════════════════════════════════════════
 *  pix.js — 픽셀 외계인 그리기
 *  2026 광주하남영재교육원 · 중학 융합과정 (변석환)
 *
 *  «보이는 형질» 아홉 자리만 있으면 그린다.
 *    0 털 · 1 색 · 2 눈 · 3 다리 · 4 키 · 5 물저장 · 6 발톱 · 7 팔 · 8 지느러미
 *
 *  ══ 숨은 형질은 절대 그리지 않는다 ═══════════════════════════════
 *  수명·번식력·내열·내독은 그림에 어떤 흔적도 남기면 안 된다.
 *  하나라도 새어 나가면 «숨은 형질» 이라는 규칙이 무너지고,
 *  학생이 교배해 보지 않고도 알아 버린다.
 *  (예전에는 수명이 더듬이 길이로 드러났다. 그래서 없앴다)
 *
 *  화면 세 개가 같은 그림을 써야 해서 파일로 뺐다.
 *  window.sprite(ph) 로 곧바로 쓸 수 있게 올린다.
 * ════════════════════════════════════════════════════════════════ */

(function (전역) {
  'use strict';

  var W = 120, H = 128;
  var DARK  = { lite:'#4fa87c', mid:'#2f8055', dark:'#1c5738' };
  var LIGHT = { lite:'#fff4dc', mid:'#ecd6a4', dark:'#c4a970' };
  var OUT='#12203a', FUR='#fbfff2', WHITE='#fff', PUP='#101a30';

  var buf, solid;
  var ix = function (x,y) { return y*W + x; };
  function rst(){ buf = new Array(W*H).fill(null); solid = new Array(W*H).fill(false); }
  function px(x,y,c,m){ x|=0; y|=0; if(x<0||y<0||x>=W||y>=H) return;
                        buf[ix(x,y)]=c; if(m) solid[ix(x,y)]=true; }
  function isS(x,y){ return x>=0 && y>=0 && x<W && y<H && solid[ix(x,y)]; }
  function fEl(cx,cy,rx,ry,c,m){
    for (var y=-ry;y<=ry;y++) for (var x=-rx;x<=rx;x++)
      if ((x*x)/(rx*rx)+(y*y)/(ry*ry) <= 1) px(cx+x,cy+y,c,m);
  }
  function shEl(cx,cy,rx,ry,c){
    for (var y=-ry;y<=ry;y++) for (var x=-rx;x<=rx;x++)
      if ((x*x)/(rx*rx)+(y*y)/(ry*ry) <= 1 && isS(cx+x,cy+y)) buf[ix(cx+x,cy+y)]=c;
  }
  function outline(){
    var a=[];
    for (var y=0;y<H;y++) for (var x=0;x<W;x++) {
      if (solid[ix(x,y)]) continue;
      if (isS(x-1,y)||isS(x+1,y)||isS(x,y-1)||isS(x,y+1)||
          isS(x-1,y-1)||isS(x+1,y-1)||isS(x-1,y+1)||isS(x+1,y+1)) a.push([x,y]);
    }
    for (var i=0;i<a.length;i++) buf[ix(a[i][0],a[i][1])] = OUT;
  }

  function buildPix(ph) {
    var P = function (i) { return ph.charAt(i) === '1'; };
    rst();
    var sk = P(1) ? DARK : LIGHT, cx = 60, bottom = 112;
    var bodyRy = P(4) ? 36 : 25, bodyRx = 30, bodyCy = bottom - bodyRy;

    // 털
    if (P(0)) { var N=22;
      for (var i=0;i<N;i++) { var a = -Math.PI/2 + i/(N-1)*Math.PI*2*0.92;
        fEl((cx+Math.cos(a)*(bodyRx-1))|0, (bodyCy+Math.sin(a)*(bodyRy-1))|0, 7,7, FUR, true); } }

    // 지느러미 — 등에 하나, 꼬리처럼 옆에 하나
    if (P(8)) {
      var fy = (bodyCy - bodyRy*0.35)|0;
      for (var t=0;t<16;t++) {
        var w = Math.max(1, 7 - Math.abs(t-8));
        for (var q=-w;q<=w;q++) px(cx + q, fy - 14 + t, sk.lite, true);
      }
      fEl((cx - bodyRx - 6)|0, (bodyCy + bodyRy*0.35)|0, 9, 5, sk.lite, true);
    }

    // 다리 + 발톱
    var legN = P(3) ? 6 : 2, spread = bodyRx*1.5;
    for (var L=0;L<legN;L++) {
      var fx = (cx - spread/2 + spread*L/(legN-1))|0;
      for (var y2=0;y2<9;y2++) for (var x2=-3;x2<=3;x2++) px(fx+x2, bottom-3+y2, sk.mid, true);
      var fw = P(6) ? 6 : 3;
      fEl(fx, bottom+6, fw, 3, sk.dark, true);
      if (P(6)) for (var k=-1;k<=1;k++) px(fx + k*fw, bottom+9, OUT, true);
    }

    // 팔
    if (P(7)) { for (var s=-1;s<=1;s+=2) {
      var ax = cx + s*(bodyRx-2);
      for (var t2=0;t2<10;t2++) px((ax + s*t2*0.5)|0, (bodyCy + 4 + t2*0.6)|0, sk.mid, true);
      fEl((ax + s*5)|0, (bodyCy+11)|0, 3,3, sk.mid, true); } }

    // 몸통
    fEl(cx, bodyCy, bodyRx, bodyRy, sk.mid, true);
    shEl(cx, (bodyCy + bodyRy*0.55)|0, (bodyRx*0.9)|0, (bodyRy*0.4)|0, sk.dark);
    // 물저장 조직
    if (P(5)) fEl(cx, (bodyCy + bodyRy*0.42)|0, 16, 13, sk.lite, true);
    outline();

    // 눈
    var eR = P(2) ? 10 : 5, ey = (bodyCy - bodyRy*0.08)|0;
    var es = Math.min(2*eR*2.1, bodyRx*1.6);
    for (var e=0;e<2;e++) {
      var ex = (cx - es/2 + es*e)|0;
      fEl(ex, ey, eR+1, eR+2, OUT, false);
      fEl(ex, ey, eR, eR+1, WHITE, false);
      fEl(ex, (ey + eR*0.35)|0, (eR*0.62)|0, (eR*0.72)|0, PUP, false);
      px((ex - eR*0.3)|0, (ey - eR*0.2)|0, WHITE, false);
    }
    // 입
    var my = (ey + eR + 4)|0;
    for (var x3=-3;x3<=3;x3++) px(cx+x3, my + (Math.abs(x3)===3 ? -1 : 0), OUT, false);

    // 더듬이 — 길이가 늘 같다. 숨은 형질을 드러내면 안 된다
    var at = (bodyCy - bodyRy)|0, aL = 11;
    for (var d=-1;d<=1;d+=2) {
      var bx = cx + d*10;
      for (var t3=0;t3<aL;t3++) px((bx + d*t3*0.4)|0, at - t3, OUT, false);
      fEl((bx + d*(aL*0.4))|0, at - aL - 2, 3, 3, sk.mid, false);
    }
  }

  var off = document.createElement('canvas');
  off.width = W; off.height = H;
  var octx = off.getContext('2d');
  var cache = {};

  function sprite(ph) {
    ph = String(ph || '');
    if (cache[ph]) return cache[ph];
    buildPix(ph);
    octx.clearRect(0,0,W,H);
    for (var y=0;y<H;y++) for (var x=0;x<W;x++) {
      var c = buf[ix(x,y)];
      if (c) { octx.fillStyle = c; octx.fillRect(x,y,1,1); }
    }
    return cache[ph] = off.toDataURL();
  }

  전역.PIX = { sprite: sprite, W: W, H: H, buildPix: buildPix };
  전역.sprite = sprite;      // 화면 코드가 예전처럼 sprite() 로 부른다
})(window);
