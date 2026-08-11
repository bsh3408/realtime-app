/* ════════════════════════════════════════════════════════════════
 *  pix.js — 픽셀 외계인 그리기
 *  2026 광주하남영재교육원 · 중학 융합과정 (변석환)
 *
 *  «겉모습» 열두 자리만 있으면 그린다. 자리 뜻은 rules.js 의 PH 와 같다.
 *    0 털 · 1 밝기(0~6) · 2 눈 · 3 다리 · 4 키 · 5 물저장 · 6 발톱
 *    7 앞다리(1=팔 0=지느러미) · 8 더듬이 · 9 비늘 · 10 빛깔 · 11 날개
 *
 *  ══ 색은 일곱 단계다 ═══════════════════════════════════════════
 *  색 유전자 셋을 더한 값이 밝기(0~6)다. 우열이 아니라 쌓임이라서
 *  «어둡거나 밝거나» 가 아니라 단계가 있다. 눈으로 그 단계가 보여야
 *  학생이 «색은 유전자 하나가 정하는 게 아니구나» 를 알아챈다.
 *
 *  ══ 숨은 형질은 절대 그리지 않는다 ═══════════════════════════════
 *  수명·번식력·내열·내독은 그림에 어떤 흔적도 남기면 안 된다.
 *  하나라도 새어 나가면 «숨은 형질» 이라는 규칙이 무너진다.
 *
 *  ══ 새 형질 ════════════════════════════════════════════════════
 *  비늘·빛깔·날개는 돌연변이로만 생긴다. 생기면 한눈에 알아볼 수
 *  있어야 한다 — 그래야 «부모에게 없던 것이 나타났다» 가 보인다.
 * ════════════════════════════════════════════════════════════════ */

(function (전역) {
  'use strict';

  var W = 120, H = 128;

  /* 밝기 0(아주 검음) → 6(아주 밝음). 일곱 단계 */
  var 살결 = [
    { dark:'#0e1c15', mid:'#1f3a2c', lite:'#2e5340' },
    { dark:'#1b3f2b', mid:'#2f6a49', lite:'#46916a' },
    { dark:'#2d5e3c', mid:'#4b9a63', lite:'#6fbd86' },
    { dark:'#4e6d3a', mid:'#7fae5e', lite:'#a3ca86' },
    { dark:'#6e7449', mid:'#b0b878', lite:'#cdd39c' },
    { dark:'#8b7e5d', mid:'#d9c898', lite:'#f0e3bd' },
    { dark:'#a99b78', mid:'#f2e7c8', lite:'#fffaea' }
  ];
  /* 빛깔 — 색소가 아니라 빛이 튕겨 나오는 색이라 어느 부모와도 안 닮았다 */
  var 빛 = { dark:'#5227b8', mid:'#7b5cff', lite:'#57e6ff' };

  var OUT='#12203a', FUR='#fbfff2', WHITE='#fff', PUP='#101a30';
  var 비늘색 = '#cfe3d6', 날개색 = '#bfe6ff';

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
    var P  = function (i) { return ph.charAt(i) === '1'; };
    var 밝 = parseInt(ph.charAt(1), 10); if (isNaN(밝)) 밝 = 3;
    밝 = Math.max(0, Math.min(살결.length-1, 밝));

    var 털=P(0), 눈큰=P(2), 다리많=P(3), 큼=P(4), 물=P(5), 발톱=P(6),
         팔=P(7), 더듬이=P(8), 비늘=P(9), 빛깔=P(10), 날개=P(11);
    var 지느러미 = !팔;
    // 비늘이 나면 털이 자랄 자리를 비늘이 차지한다
    if (비늘) 털 = false;

    rst();
    var sk = 빛깔 ? 빛 : 살결[밝];
    var cx = 60, bottom = 112;
    var bodyRy = 큼 ? 36 : 25, bodyRx = 30, bodyCy = bottom - bodyRy;

    // 털
    if (털) { var N=22;
      for (var i=0;i<N;i++) { var a = -Math.PI/2 + i/(N-1)*Math.PI*2*0.92;
        fEl((cx+Math.cos(a)*(bodyRx-1))|0, (bodyCy+Math.sin(a)*(bodyRy-1))|0, 7,7, FUR, true); } }

    // 날개 — 몸통 양옆으로 뻗은 얇은 막. 뒤쪽에 그려 몸통이 위로 온다
    if (날개) {
      for (var s0=-1;s0<=1;s0+=2) {
        var wx = cx + s0*(bodyRx-6), wy = (bodyCy - bodyRy*0.45)|0;
        for (var t0=0;t0<28;t0++) {
          // 앞은 넓고 끝으로 갈수록 좁아진다 — 활공하는 막
          var 폭 = Math.round(24 * Math.sqrt(1 - t0/28) );
          for (var q0=0;q0<폭;q0++)
            px(wx + s0*(5+t0), wy + Math.round(t0*0.35) + q0, 날개색, true);
        }
        // 앞가장자리 뼈대
        for (var t1=0;t1<28;t1++) px(wx + s0*(5+t1), (wy + t1*0.35)|0, sk.dark, true);
        // 막을 받치는 살
        for (var v0=1;v0<=3;v0++)
          for (var t6=0;t6<26;t6++) {
            var 폭2 = Math.round(24 * Math.sqrt(Math.max(0,1 - t6/28)));
            var q6 = Math.round(폭2 * v0/4);
            px(wx + s0*(5+t6), wy + Math.round(t6*0.35) + q6, '#8fd0f5', true);
          }
      }
    }

    /* 지느러미 — 팔과 «같은 유전자» 다. 한눈에 구별되지 않으면
       그 규칙이 학생에게 안 보인다. 그래서 몸 밖으로 확실히 내민다.
       (예전에는 등지느러미를 몸통 안쪽에 그려서 털에 다 가려졌다) */
    if (지느러미) {
      // 등지느러미 — 몸통 꼭대기 위로 솟는다
      var 등y = (bodyCy - bodyRy)|0;
      for (var t=0;t<18;t++) {
        var w = Math.max(1, Math.round((18-t)*0.8));
        for (var q=-w;q<=w;q++) px(cx + q + Math.round(t*0.3), 등y - t + 2, sk.lite, true);
      }
      // 옆지느러미 — 양옆으로 넓적하게. 노 젓는 모습
      for (var s1=-1;s1<=1;s1+=2) {
        var px0 = cx + s1*(bodyRx-2), py0 = (bodyCy + bodyRy*0.25)|0;
        for (var t4=0;t4<16;t4++) {
          var h4 = Math.round(9 * Math.sin((1 - t4/16) * Math.PI/2 + 0.35));
          for (var q4=-h4;q4<=h4;q4++)
            px(px0 + s1*t4, py0 + q4 + Math.round(t4*0.45), sk.lite, true);
        }
      }
    }

    // 다리 + 발톱
    var legN = 다리많 ? 6 : 2, spread = bodyRx*1.5;
    for (var L=0;L<legN;L++) {
      var fx = (cx - spread/2 + spread*L/(legN-1))|0;
      for (var y2=0;y2<9;y2++) for (var x2=-3;x2<=3;x2++) px(fx+x2, bottom-3+y2, sk.mid, true);
      var fw = 발톱 ? 6 : 3;
      fEl(fx, bottom+6, fw, 3, sk.dark, true);
      if (발톱) for (var k=-1;k<=1;k++) px(fx + k*fw, bottom+9, OUT, true);
    }

    // 팔 — 마디가 있고 끝에 손이 달린다. 지느러미와 헷갈리면 안 된다
    if (팔) { for (var s=-1;s<=1;s+=2) {
      var ax = cx + s*(bodyRx-3), ay = (bodyCy - bodyRy*0.1)|0;
      // 위팔 — 옆으로 뻗는다
      for (var t2=0;t2<13;t2++)
        fEl((ax + s*t2)|0, (ay + t2*0.25)|0, 3, 3, sk.mid, true);
      // 아래팔 — 아래로 꺾인다
      for (var t5=0;t5<11;t5++)
        fEl((ax + s*13)|0, (ay + 3 + t5)|0, 3, 3, sk.mid, true);
      // 손
      fEl((ax + s*13)|0, (ay + 15)|0, 5, 4, sk.dark, true);
      for (var g2=-1;g2<=1;g2++) px((ax + s*13 + g2*3)|0, (ay + 19)|0, OUT, true);
    } }

    // 몸통
    fEl(cx, bodyCy, bodyRx, bodyRy, sk.mid, true);
    shEl(cx, (bodyCy + bodyRy*0.55)|0, (bodyRx*0.9)|0, (bodyRy*0.4)|0, sk.dark);

    // 비늘 — 몸통 위에 겹겹이. 털 대신 몸을 덮는다
    if (비늘) {
      for (var ry=-bodyRy+4; ry<bodyRy-2; ry+=6) {
        var 어긋 = ((ry/6)|0) % 2 ? 4 : 0;
        for (var rx=-bodyRx+3; rx<bodyRx-1; rx+=8) {
          var sx = cx+rx+어긋, sy = bodyCy+ry;
          for (var d0=-3;d0<=3;d0++) {
            var h0 = 3 - Math.abs(d0);
            for (var e0=0;e0<=h0;e0++)
              if (isS(sx+d0, sy+e0)) buf[ix(sx+d0, sy+e0)] = (e0===h0) ? 비늘색 : sk.lite;
          }
        }
      }
    }
    // 빛깔 — 몸통에 어른거리는 띠
    if (빛깔) {
      for (var by=-bodyRy+6; by<bodyRy-4; by+=7) {
        for (var bx=-bodyRx;bx<=bodyRx;bx++) {
          var yy = bodyCy + by + Math.round(Math.sin(bx*0.22)*2.5);
          if (isS(cx+bx, yy)) buf[ix(cx+bx, yy)] = (by%14===0) ? 빛.lite : '#ff7ae0';
        }
      }
    }

    // 물저장 조직
    if (물) fEl(cx, (bodyCy + bodyRy*0.42)|0, 16, 13, sk.lite, true);
    outline();

    // 눈
    var eR = 눈큰 ? 10 : 5, ey = (bodyCy - bodyRy*0.08)|0;
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

    // 더듬이
    var at = (bodyCy - bodyRy)|0, aL = 더듬이 ? 22 : 8;
    for (var d=-1;d<=1;d+=2) {
      var bx2 = cx + d*10;
      for (var t3=0;t3<aL;t3++) px((bx2 + d*t3*0.4)|0, at - t3, OUT, false);
      fEl((bx2 + d*(aL*0.4))|0, at - aL - 2, 3, 3, sk.mid, false);
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

  전역.PIX = { sprite: sprite, W: W, H: H, buildPix: buildPix, 살결: 살결 };
  전역.sprite = sprite;      // 화면 코드가 예전처럼 sprite() 로 부른다
})(window);
