/* ════════════════════════════════════════════════════════════════
 *  pix.js — 픽셀 외계인 그리기
 *  2026 광주하남영재교육원 · 중학 융합과정 (변석환)
 *
 *  «겉모습» 열두 자리만 있으면 그린다. 자리 뜻은 rules.js 의 PH 와 같다.
 *    0 털 · 1 몸빛깔(0~8) · 2 눈 · 3 다리 · 4 키 · 5 물저장 · 6 발톱
 *    7 앞다리(1=팔 0=지느러미) · 8 더듬이 · 9 비늘 · 10 빛깔 · 11 날개
 *
 *  ══ 색은 아홉 가지다 ═══════════════════════════════════════════
 *  색 유전자 둘(각 0·1·2)의 짝이 아홉 빛깔을 만든다. 그 아홉은
 *  아홉 구역의 배경색 그 자체라, 어느 구역이든 «딱 맞는 색» 이
 *  있다. 우열이 없어서 잡종(Cc)도 제 값 그대로 드러난다.
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

  /* ── 몸 빛깔 ────────────────────────────────────────────────────
     색은 유전자 둘이 고른 «아홉 빛깔» 가운데 하나다. 그 표는 rules.js
     한 곳에만 둔다 — 여기서 또 적어 두면 두 그림의 색이 어긋난다. */
  function _rgb(c, k) {
    var f = function (v) { v = Math.round(v*k); return Math.max(0, Math.min(255, v)); };
    return '#' + [f(c[0]), f(c[1]), f(c[2])]
      .map(function (v) { return ('0'+v.toString(16)).slice(-2); }).join('');
  }
  function 살빛(ph) {
    var rgb = (전역.RULES && 전역.RULES.겉빛깔)
      ? 전역.RULES.겉빛깔(ph) : [150,175,125];
    return { mid:  _rgb(rgb, 1),
             lite: _rgb(rgb, 1.32),      // 배·물주머니처럼 빛 받는 곳
             dark: _rgb(rgb, 0.62),      // 그늘진 아래쪽
             /* 털도 «제 몸 색» 이다. 늘 흰 털로 그리면 아무리 색을 맞춰도
                몸의 절반이 하얘서 위장이 되지 않는다 — 배경에 맞추면 산다는
                규칙이 털 있는 개체에게만 헛말이 된다 */
             fur:  _rgb(rgb, 1.18) };
  }
  /* 빛깔 — 색 유전자가 아니라 빛이 튕겨 나오는 색이라 어느 부모와도 안 닮았다 */
  var 빛 = { dark:'#5227b8', mid:'#7b5cff', lite:'#57e6ff', fur:'#a98cff' };

  var OUT='#12203a', WHITE='#fff', PUP='#101a30';
  var 날개색 = '#bfe6ff';

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
    /* 자리 뜻은 rules.js 의 PH 와 같다 —
       0 털 · 1 색(0~8) · 2 눈 · 3 다리 · 4 키 · 5 물저장 · 6 발톱
       7 앞다리(1=팔) · 8 더듬이 · 9 비늘 · 10 빛깔 · 11 날개 */
    var P  = function (i) { return ph.charAt(i) === '1'; };
    var 털=P(0), 눈큰=P(2), 다리많=P(3), 큼=P(4), 물=P(5), 발톱=P(6),
         팔=P(7), 더듬이=P(8), 비늘=P(9), 빛깔=P(10), 날개=P(11);
    var 지느러미 = !팔;
    // 비늘이 나면 털이 자랄 자리를 비늘이 차지한다
    if (비늘) 털 = false;

    rst();
    var sk = 빛깔 ? 빛 : 살빛(ph);
    var cx = 60, bottom = 112;
    var bodyRy = 큼 ? 36 : 25, bodyRx = 30, bodyCy = bottom - bodyRy;

    // 털
    if (털) { var N=22;
      for (var i=0;i<N;i++) { var a = -Math.PI/2 + i/(N-1)*Math.PI*2*0.92;
        fEl((cx+Math.cos(a)*(bodyRx-1))|0, (bodyCy+Math.sin(a)*(bodyRy-1))|0, 7,7, sk.fur, true); } }

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
              if (isS(sx+d0, sy+e0)) buf[ix(sx+d0, sy+e0)] = (e0===h0) ? sk.dark : sk.lite;
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


  /* ════════════════════════════════════════════════════════════
   *  옆모습 — 걸어 다니는 그림
   *
   *  앞모습과 «같은 겉모습 열두 자리» 를 읽는다. 두 그림이 어긋나면
   *  학생이 빔 화면에서 본 개체를 자기 화면에서 못 알아본다.
   *
   *  frame 0~3 이 걷기 한 바퀴다. 다리가 번갈아 들리고 몸이 오르내린다.
   * ════════════════════════════════════════════════════════════ */
  var SW = 112, SH = 88;
  var sbuf, ssolid;
  var six = function (x,y) { return y*SW + x; };
  function srst(){ sbuf = new Array(SW*SH).fill(null); ssolid = new Array(SW*SH).fill(false); }
  function spx(x,y,c,m){ x|=0; y|=0; if(x<0||y<0||x>=SW||y>=SH) return;
                         sbuf[six(x,y)]=c; if(m) ssolid[six(x,y)]=true; }
  function sisS(x,y){ return x>=0 && y>=0 && x<SW && y<SH && ssolid[six(x,y)]; }
  function sEl(cx,cy,rx,ry,c,m){
    for (var y=-ry;y<=ry;y++) for (var x=-rx;x<=rx;x++)
      if ((x*x)/(rx*rx)+(y*y)/(ry*ry) <= 1) spx(cx+x,cy+y,c,m);
  }
  function sShade(cx,cy,rx,ry,c){
    for (var y=-ry;y<=ry;y++) for (var x=-rx;x<=rx;x++)
      if ((x*x)/(rx*rx)+(y*y)/(ry*ry) <= 1 && sisS(cx+x,cy+y)) sbuf[six(cx+x,cy+y)]=c;
  }
  function sLine(x0,y0,x1,y1,w,c,m){
    var dx=x1-x0, dy=y1-y0, n=Math.max(Math.abs(dx),Math.abs(dy))||1;
    for (var i=0;i<=n;i++) sEl((x0+dx*i/n)|0, (y0+dy*i/n)|0, w, w, c, m);
  }
  function sOutline(){
    var a=[];
    for (var y=0;y<SH;y++) for (var x=0;x<SW;x++) {
      if (ssolid[six(x,y)]) continue;
      if (sisS(x-1,y)||sisS(x+1,y)||sisS(x,y-1)||sisS(x,y+1)||
          sisS(x-1,y-1)||sisS(x+1,y-1)||sisS(x-1,y+1)||sisS(x+1,y+1)) a.push([x,y]);
    }
    for (var i=0;i<a.length;i++) sbuf[six(a[i][0],a[i][1])] = OUT;
  }

  function buildSide(ph, 걸음) {
    /* 자리 뜻은 rules.js 의 PH 와 같다 —
       0 털 · 1 색(0~8) · 2 눈 · 3 다리 · 4 키 · 5 물저장 · 6 발톱
       7 앞다리(1=팔) · 8 더듬이 · 9 비늘 · 10 빛깔 · 11 날개 */
    var P  = function (i) { return ph.charAt(i) === '1'; };
    var 털=P(0), 눈큰=P(2), 다리많=P(3), 큼=P(4), 물=P(5), 발톱=P(6),
         팔=P(7), 더듬이=P(8), 비늘=P(9), 빛깔=P(10), 날개=P(11);
    var 지느러미 = !팔;
    if (비늘) 털 = false;

    srst();
    var sk = 빛깔 ? 빛 : 살빛(ph);
    var 바닥 = 74, cx = 50;
    var bodyRy = 큼 ? 24 : 17, bodyRx = 27;
    var 흔들 = Math.round(Math.sin(걸음*2) * 1.4);
    var bodyCy = 바닥 - bodyRy - 8 + 흔들;

    // 날개 — 몸 뒤에서 퍼덕인다
    if (날개) {
      var wf = Math.round(Math.sin(걸음*1.7) * 6);
      for (var t=0;t<26;t++) {
        var 폭 = Math.round(15 * Math.sqrt(Math.max(0, 1 - t/26)));
        for (var q=0;q<폭;q++)
          spx(cx - 6 - t*0.85, bodyCy - 6 - t*0.55 - wf*(t/26) + q, 날개색, true);
      }
      sLine(cx-6, bodyCy-6, (cx-6-26*0.85)|0, (bodyCy-6-26*0.55-wf)|0, 1, sk.dark, true);
    }

    // 지느러미 — 등에 하나 솟고, 옆(앞쪽)에 노 하나
    if (지느러미) {
      var 등x = cx - 4;
      for (var t2=0;t2<16;t2++) {
        var w2 = Math.max(1, Math.round((16-t2)*0.7));
        for (var q2=-w2;q2<=w2;q2++)
          spx(등x + q2 - t2*0.35, bodyCy - bodyRy - t2 + 3, sk.lite, true);
      }
    }

    // 다리 — 앞모습 여섯이면 옆에서 셋, 둘이면 둘
    var legN = 다리많 ? 3 : 2;
    for (var i=0;i<legN;i++) {
      var lx = (cx - bodyRx*0.55 + bodyRx*1.1*i/(legN-1))|0;
      var 들 = Math.round(Math.max(0, Math.sin(걸음 + i*2.1)) * 5);
      sLine(lx, bodyCy + bodyRy - 2, lx + 들*0.4, 바닥 - 들, 2, sk.mid, true);
      var fw = 발톱 ? 5 : 3;
      sEl((lx + 들*0.4)|0, 바닥 - 들, fw, 2, sk.dark, true);
      if (발톱) spx((lx + 들*0.4 + fw)|0, 바닥 - 들 + 2, OUT, true);
    }

    // 몸통 + 머리
    sEl(cx, bodyCy, bodyRx, bodyRy, sk.mid, true);
    var hx = (cx + bodyRx*0.62)|0, hy = (bodyCy - bodyRy*0.28)|0, hr = bodyRy - 3;
    sEl(hx, hy, hr, hr, sk.mid, true);
    sShade(cx, (bodyCy + bodyRy*0.5)|0, (bodyRx*0.9)|0, (bodyRy*0.5)|0, sk.dark);

    /* 앞다리는 몸통 «위» 에 올린다. 뒤에 그리면 몸통이 통째로 덮어 버려서
       팔인지 지느러미인지 구별이 안 된다 — 한 유전자로 묶은 뜻이 사라진다 */
    if (팔) {
      var sw = Math.round(Math.sin(걸음 + 1) * 5);
      var shx = (cx + bodyRx*0.28)|0, shy = (bodyCy + bodyRy*0.15)|0;
      sLine(shx, shy, shx + 9 + sw, shy + 15, 2, sk.dark, true);
      sEl((shx + 9 + sw)|0, (shy + 18)|0, 4, 3, sk.dark, true);
    } else {
      // 옆지느러미 — 노 젓듯 앞뒤로 움직인다
      var 노 = Math.round(Math.sin(걸음)*4);
      var px3 = (cx + bodyRx*0.2)|0, py3 = (bodyCy + bodyRy*0.45)|0;
      for (var t7=0;t7<15;t7++) {
        var h7 = Math.round(6 * Math.sqrt(Math.max(0, 1 - t7/15)));
        for (var q7=-h7;q7<=h7;q7++)
          spx(px3 + t7, py3 + q7 + Math.round(t7*0.5) + 노*(t7/15), sk.lite, true);
      }
    }

    // 털
    if (털) {
      for (var f=0;f<15;f++) {
        var a2 = -Math.PI*0.98 + f/14 * Math.PI*1.05;
        sEl((cx + Math.cos(a2)*(bodyRx-2))|0, (bodyCy + Math.sin(a2)*(bodyRy-1))|0, 5,5, sk.fur, true);
      }
    }
    // 비늘
    if (비늘) {
      for (var ry=-bodyRy+3; ry<bodyRy-2; ry+=5) {
        var 어긋 = ((ry/5)|0)%2 ? 3 : 0;
        for (var rx=-bodyRx+2; rx<bodyRx+6; rx+=7) {
          var sx2 = cx+rx+어긋, sy2 = bodyCy+ry;
          for (var d0=-2;d0<=2;d0++) {
            var h0 = 2 - Math.abs(d0);
            for (var e0=0;e0<=h0;e0++)
              if (sisS(sx2+d0, sy2+e0)) sbuf[six(sx2+d0, sy2+e0)] = (e0===h0) ? sk.dark : sk.lite;
          }
        }
      }
    }
    // 빛깔
    if (빛깔) {
      for (var by=-bodyRy+5; by<bodyRy-3; by+=6) {
        for (var bx=-bodyRx;bx<=bodyRx+8;bx++) {
          var yy = bodyCy + by + Math.round(Math.sin(bx*0.24 + 걸음)*2);
          if (sisS(cx+bx, yy)) sbuf[six(cx+bx, yy)] = (by%12===0) ? 빛.lite : '#ff7ae0';
        }
      }
    }
    // 물저장 조직 — 배가 불룩하다
    if (물) sEl((cx-2)|0, (bodyCy + bodyRy*0.45)|0, 13, 8, sk.lite, true);

    sOutline();

    // 눈 — 머리 앞쪽
    var eR = 눈큰 ? 8 : 4;
    var ex = (hx + hr*0.4)|0, ey = (hy - hr*0.12)|0;
    sEl(ex, ey, eR+1, eR+1, OUT, false);
    sEl(ex, ey, eR, eR, WHITE, false);
    sEl((ex+1)|0, (ey+1)|0, (eR*0.58)|0, (eR*0.62)|0, PUP, false);
    spx((ex - eR*0.35)|0, (ey - eR*0.35)|0, WHITE, false);
    // 입
    for (var m=0;m<4;m++) spx(ex + eR - 1 + m, ey + eR + 2, OUT, false);

    /* 더듬이 — 머리 위. 1픽셀 선으로 그렸더니 «긁힌 자국» 처럼 보였다.
       걸을 때 살짝 흔들리게 하되, 굵기를 주어 더듬이로 읽히게 한다 */
    var aL = 더듬이 ? 16 : 6;
    var 흔 = Math.sin(걸음*1.5) * (더듬이 ? 2.5 : 0.8);
    for (var d=0;d<2;d++) {
      var bx2 = hx - 2 + d*6, by2 = (hy - hr + 1)|0;
      var tipx = bx2 + 흔 + aL*0.22, tipy = by2 - aL;
      sLine(bx2, by2, tipx|0, tipy|0, 1, OUT, false);
      sEl(tipx|0, (tipy-2)|0, 2, 2, 더듬이 ? sk.lite : sk.mid, false);
    }
  }

  var soff = document.createElement('canvas');
  soff.width = SW; soff.height = SH;
  var sctx = soff.getContext('2d');
  var scache = {};

  /* 옆모습 한 장. frame 0~3 */
  function side(ph, frame) {
    ph = String(ph || ''); frame = ((frame|0) % 4 + 4) % 4;
    var key = ph + '_' + frame;
    if (scache[key]) return scache[key];
    buildSide(ph, frame * Math.PI/2);
    sctx.clearRect(0,0,SW,SH);
    for (var y=0;y<SH;y++) for (var x=0;x<SW;x++) {
      var c = sbuf[six(x,y)];
      if (c) { sctx.fillStyle = c; sctx.fillRect(x,y,1,1); }
    }
    var im = new Image();
    im.src = soff.toDataURL();
    scache[key] = im;
    return im;
  }
  /* 걷기 네 장을 한꺼번에 */
  function 걷기(ph) { return [side(ph,0), side(ph,1), side(ph,2), side(ph,3)]; }

  전역.PIX = { sprite: sprite, W: W, H: H, buildPix: buildPix, 살빛: 살빛,
               side: side, 걷기: 걷기, SW: SW, SH: SH };
  전역.sprite = sprite;      // 화면 코드가 예전처럼 sprite() 로 부른다
})(window);
