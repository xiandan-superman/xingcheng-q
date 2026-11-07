const Motion=require('../xingcheng-q-motion/core');
const Appearance=require('../xingcheng-q-motion/appearance');
const Followup=require('../xingcheng-q-motion/followup');
const Emotions=require('../xingcheng-q-motion/emotions');
(function () {
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const mix = (a, b, t) => a + (b - a) * t;
  function rr(c, x, y, w, h, r) {
    const d = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + d, y);
    c.arcTo(x + w, y, x + w, y + h, d);
    c.arcTo(x + w, y + h, x, y + h, d);
    c.arcTo(x, y + h, x, y, d);
    c.arcTo(x, y, x + w, y, d);
    c.closePath();
  }
  function star(c, x, y, o, i, color, a = 1, r = 0) {
    if (a <= 0.002) return;
    c.save();
    c.translate(x, y);
    c.rotate(r);
    c.globalAlpha *= a;
    c.beginPath();
    for (let n = 0; n < 8; n++) {
      const q = -Math.PI / 2 + (n * Math.PI) / 4,
        d = n % 2 ? i : o;
      n
        ? c.lineTo(Math.cos(q) * d, Math.sin(q) * d)
        : c.moveTo(Math.cos(q) * d, Math.sin(q) * d);
    }
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.restore();
  }
  function cap(c, x, y, w, h, r, color, a = 1) {
    if (a <= 0.002) return;
    c.save();
    c.translate(x, y);
    c.rotate(r);
    c.globalAlpha *= a;
    rr(c, -w / 2, -h / 2, w, h, Math.min(w, h) / 2);
    c.fillStyle = color;
    c.fill();
    c.restore();
  }
  function bodyPath(c, s) {
    c.beginPath();
    for (let n = 0; n <= 120; n++) {
      const a = (n / 120) * TAU;
      const wob =
        s.bean * (0.07 * Math.sin(a * 2 + 0.5) + 0.03 * Math.cos(a * 3));
      const tug = s.tug * 0.11 * Math.cos(a);
      const rad = 103 * (1 + wob + tug);
      const x = Math.cos(a) * rad * (1 + s.squash * 0.14),
        y =
          Math.sin(a) * rad * (1 - s.squash * 0.2) +
          s.squash * 12 * Math.cos(a) * Math.cos(a);
      n ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.closePath();
  }
  function face(c,s){Motion.drawFace(c,{...s,eyeOpenL:s.eyeL,eyeOpenR:s.eyeR},1,'system');}
  function orb(c,s){
    c.save();c.translate(s.x,s.y);c.rotate(s.rot);c.scale(s.sx,s.sy);
    Appearance.drawBody(c,()=>bodyPath(c,s),103);
    c.save();bodyPath(c,s);c.clip();
    if(s.followupScene==='loading'){Followup.drawLoadingStar(c,s);(s.nextExpression?Emotions.drawLoadingFace:Followup.drawLoadingFace)(c,s)}
    else{Appearance.drawBrandStar(c,s,'system');face(c,s)}
    c.restore();c.restore();
  }
  function hand(c, x, y, a = 1, sc = 1) {
    if (a <= 0.002) return;
    c.save();
    c.translate(x, y);
    c.scale(sc, sc);
    c.globalAlpha *= a;
    const g = c.createRadialGradient(-5, -6, 1, 1, 2, 18);
    g.addColorStop(0, "#FFD777");
    g.addColorStop(0.46, "#FF9824");
    g.addColorStop(1, "#EA4929");
    c.fillStyle = g;
    c.shadowColor = "rgba(255,125,32,.35)";
    c.shadowBlur = 9;
    c.beginPath();
    c.arc(0, 0, 14, 0, TAU);
    c.fill();
    c.restore();
  }
  function quantum(c, s) {
    if (s.quantumA <= 0.002) return;
    const colors = ["#35C7D8", "#FFC857", "#F04B28"];
    const phase = [0, 2.12, 4.25];
    c.save();
    c.globalAlpha *= s.quantumA;
    c.translate(256, 264);
    c.rotate(s.quantumTurn);
    c.strokeStyle = `rgba(53,199,216,${0.17 * s.quantumA})`;
    c.lineWidth = 4;
    c.beginPath();
    c.ellipse(0, 0, 170, 104, -0.13, 0, TAU);
    c.stroke();
    phase.forEach((p, n) => {
      const a = p + s.quantumTurn * 0.62;
      const x = Math.cos(a) * 170,
        y = Math.sin(a) * 104;
      const pulse = 1 + 0.12 * Math.sin(s.quantumTurn * 3 + p);
      c.fillStyle = colors[n];
      c.shadowColor = colors[n];
      c.shadowBlur = 18;
      c.beginPath();
      c.arc(x, y, (9 + n * 2) * pulse, 0, TAU);
      c.fill();
      star(c, x, y, 5, 1.4, "#FFF8EE", 0.95, a);
    });
    c.restore();
    if (s.scanA > 0.002) {
      c.save();
      c.globalAlpha *= s.scanA;
      c.strokeStyle = "#35C7D8";
      c.lineWidth = 8;
      c.lineCap = "round";
      c.shadowColor = "#35C7D8";
      c.shadowBlur = 12;
      c.beginPath();
      c.arc(256, 264, 137, -1.1 + s.scanTurn, -0.36 + s.scanTurn);
      c.stroke();
      c.restore();
    }
  }
  function searchFrame(c, s) {
    if (s.frameA <= 0.002) return;
    c.save();
    c.translate(337, 274);
    c.rotate(s.frameRot);
    c.scale(s.frameScale, s.frameScale);
    c.globalAlpha *= s.frameA;
    c.strokeStyle = "#35C7D8";
    c.lineWidth = 7;
    c.setLineDash([15, 12]);
    rr(c, -93, -70, 186, 140, 27);
    c.stroke();
    c.setLineDash([]);
    for (const p of [
      [-70, -48],
      [69, -48],
      [-70, 48],
      [69, 48],
    ])
      star(c, p[0], p[1], 8, 2, "#FFC857", 0.85, p[0] * 0.01);
    c.restore();
  }
  function lens(c, s) {
    if (s.lensA <= 0.002) return;
    c.save();
    c.translate(s.lensX, s.lensY);
    c.rotate(s.lensRot);
    c.scale(s.lensScale, s.lensScale);
    c.globalAlpha *= s.lensA;
    c.strokeStyle = "#35C7D8";
    c.lineWidth = 10;
    c.shadowColor = "rgba(53,199,216,.4)";
    c.shadowBlur = 11;
    c.beginPath();
    c.arc(0, 0, 35, 0, TAU);
    c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = "#FFC857";
    c.lineWidth = 9;
    c.beginPath();
    c.moveTo(26, 26);
    c.lineTo(55, 55);
    c.stroke();
    c.fillStyle = "rgba(53,199,216,.12)";
    c.beginPath();
    c.arc(0, 0, 29, 0, TAU);
    c.fill();
    c.restore();
  }
  function dust(c, s) {
    if (s.dustA <= 0.002) return;
    for (let n = 0; n < 5; n++) {
      const a = n * 1.17 + s.dustTurn,
        r = 34 + n * 8;
      star(
        c,
        337 + Math.cos(a) * r,
        278 + Math.sin(a) * r,
        5 + (n % 2) * 2,
        1.4,
        n % 2 ? "#FFC857" : "#35C7D8",
        s.dustA * (1 - n * 0.1),
        a,
      );
    }
  }
  function antenna(c, s) {
    if (s.antA <= 0.002) return;
    c.save();
    c.globalAlpha *= s.antA;
    c.strokeStyle = "#35C7D8";
    c.lineWidth = 9;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.shadowColor = "rgba(53,199,216,.27)";
    c.shadowBlur = 8;
    c.beginPath();
    c.moveTo(256, 175);
    c.bezierCurveTo(255, 130, 290, 120, 306, 142);
    if (s.knot < 0.5) {
      c.quadraticCurveTo(328, 168, 350, 129);
      c.lineTo(361, 108);
    } else {
      const k = (s.knot - 0.5) * 2;
      c.bezierCurveTo(331, 180, 375, 177, 354, 145);
      c.bezierCurveTo(337, 119, 324, 169, 367, 163);
      c.quadraticCurveTo(386, 158, 382, 121);
      c.lineTo(386, 107);
    }
    c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = "#FFC857";
    c.beginPath();
    c.arc(s.knot < 0.5 ? 361 : 386, 104, 11, 0, TAU);
    c.fill();
    c.restore();
    if (s.waveA > 0.002) {
      for (let n = 0; n < 3; n++) {
        c.save();
        c.globalAlpha *= s.waveA * (1 - n * 0.22);
        c.strokeStyle = n === 1 ? "#FFC857" : "#35C7D8";
        c.lineWidth = 5;
        c.beginPath();
        c.arc(387, 103, 23 + n * 20, -1.03, 0.15);
        c.stroke();
        c.restore();
      }
    }
    if (s.zapA > 0.002) {
      for (let n = 0; n < 4; n++)
        star(
          c,
          352 + (n - 1.5) * 19,
          170 + Math.sin(n * 2) * 15,
          7 + (n % 2) * 2,
          1.7,
          n % 2 ? "#F04B28" : "#FFC857",
          s.zapA,
          n * 0.7 + s.starTurn,
        );
    }
  }
  function pod(c, s) {
    if (s.podA <= 0.002) return;
    c.save();
    c.translate(s.podX, s.podY);
    c.rotate(s.podRot);
    c.scale(s.podScale, s.podScale);
    c.globalAlpha *= s.podA;
    const g = c.createLinearGradient(-65, 0, 65, 0);
    g.addColorStop(0, "rgba(255,248,238,.98)");
    g.addColorStop(0.55, "rgba(213,252,255,.95)");
    g.addColorStop(1, "rgba(53,199,216,.9)");
    rr(c, -66, -34, 132, 68, 34);
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = "#35C7D8";
    c.lineWidth = 5;
    c.stroke();
    c.fillStyle = "rgba(240,75,40,.2)";
    c.beginPath();
    c.arc(-10, 0, 22, 0, TAU);
    c.fill();
    star(
      c,
      -10,
      0,
      15,
      3.6,
      s.podLit ? "#F04B28" : "#9BBABD",
      0.95,
      s.starTurn,
    );
    c.fillStyle = "#FFC857";
    c.beginPath();
    c.moveTo(64, -18);
    c.lineTo(91, 0);
    c.lineTo(64, 18);
    c.closePath();
    c.fill();
    c.restore();
    if (s.flame > 0.002) {
      for (let n = 0; n < 5; n++) {
        const d = 16 + n * 16 * s.flame;
        star(
          c,
          s.podX - 80 - d,
          s.podY + (n - 2) * 7,
          10 * (1 - n * 0.12) * s.flame,
          2.2,
          n % 2 ? "#F04B28" : "#FFC857",
          s.flame * (1 - n * 0.11),
          n * 0.8,
        );
      }
    }
    if (s.smoke > 0.002) {
      for (let n = 0; n < 5; n++) {
        const a = n * 1.31 + s.smokeTurn,
          r = 18 + n * 7;
        c.save();
        c.globalAlpha *= s.smoke * (1 - n * 0.12);
        c.fillStyle = n % 2 ? "rgba(155,186,189,.75)" : "rgba(255,248,238,.92)";
        c.beginPath();
        c.arc(
          s.podX - 82 + Math.cos(a) * r,
          s.podY + Math.sin(a) * r,
          (9 + n * 2) * s.smoke,
          0,
          TAU,
        );
        c.fill();
        c.restore();
        if (n % 2 === 0)
          star(
            c,
            s.podX - 82 + Math.cos(a) * r,
            s.podY + Math.sin(a) * r,
            6,
            1.5,
            "#FFC857",
            s.smoke,
            a,
          );
      }
    }
  }
  function reconnectSignal(c, s) {
    if (s.signalA <= 0.002) return;
    const t = clamp(s.signalT);
    const u = 1 - t;
    const x = u * u * 468 + 2 * u * t * 454 + t * t * 386;
    const y = u * u * 66 + 2 * u * t * 174 + t * t * 104;
    c.save();
    c.globalAlpha *= s.signalA;
    c.strokeStyle = "rgba(53,199,216,.55)";
    c.lineWidth = 6;
    c.lineCap = "round";
    c.setLineDash([10, 12]);
    c.beginPath();
    c.moveTo(468, 66);
    c.quadraticCurveTo(454, 174, 386, 104);
    c.stroke();
    c.setLineDash([]);
    for (let n = 0; n < 4; n++) {
      const back = n * 15;
      star(c, x + back, y - back * 0.25, 9 - n, 2, n % 2 ? "#FFC857" : "#35C7D8", 1 - n * 0.18, s.starTurn + n * 0.6);
    }
    c.fillStyle = "#35C7D8";
    c.shadowColor = "#35C7D8";
    c.shadowBlur = 18;
    c.beginPath();
    c.arc(x, y, 12 + 3 * s.signalPulse, 0, TAU);
    c.fill();
    star(c, x, y, 6, 1.5, "#FFF8EE", 1, s.starTurn);
    c.restore();
    if (s.reconnectGlow > 0.002) {
      for (let n = 0; n < 3; n++) {
        c.save();
        c.globalAlpha *= s.reconnectGlow * (1 - n * 0.22);
        c.strokeStyle = n === 1 ? "#FFC857" : "#35C7D8";
        c.lineWidth = 5;
        c.beginPath();
        c.arc(386, 104, 25 + n * 22 + s.reconnectGlow * 10, -1.1, 0.2);
        c.stroke();
        c.restore();
      }
    }
  }
  function threadTrack(c, s) {
    if (s.trackA <= 0.002) return;
    const cx=345,cy=268,r=77,gap=clamp(s.trackGap),active=1-gap;
    c.save();c.globalAlpha*=s.trackA;
    c.strokeStyle='rgba(155,186,189,.28)';c.lineWidth=13;c.lineCap='round';c.beginPath();c.arc(cx,cy,r,-2.35,2.35);c.stroke();
    const grad=c.createLinearGradient(cx-r,cy-r,cx+r,cy+r);grad.addColorStop(0,'#35C7D8');grad.addColorStop(.55,'#FFC857');grad.addColorStop(1,'#F04B28');c.strokeStyle=grad;c.lineWidth=13;c.beginPath();c.arc(cx,cy,r,-2.35,-2.35+4.7*(.58+.42*active));c.stroke();
    for(let n=0;n<4;n++){const a=-2.35+n*1.56,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;c.fillStyle=n<2||active>.7?(n%2?'#FFC857':'#35C7D8'):'rgba(155,186,189,.5)';c.beginPath();c.arc(x,y,9,0,TAU);c.fill();star(c,x,y,5,1.3,'#FFF8EE',.85,n+s.starTurn)}
    c.shadowColor=active>.65?'rgba(255,123,39,.35)':'rgba(53,199,216,.2)';c.shadowBlur=18;c.fillStyle='rgba(255,253,244,.99)';c.beginPath();c.arc(cx,cy,55,0,TAU);c.fill();c.shadowBlur=0;c.strokeStyle=active>.65?'#FF7B27':'#35C7D8';c.lineWidth=6;c.stroke();
    c.save();c.globalAlpha*=gap;c.fillStyle='#35C7D8';rr(c,cx-19,cy-24,13,48,7);c.fill();rr(c,cx+7,cy-24,13,48,7);c.fill();c.restore();
    c.save();c.globalAlpha*=active;c.fillStyle='#FF7B27';c.beginPath();c.moveTo(cx-14,cy-25);c.lineTo(cx+27,cy);c.lineTo(cx-14,cy+25);c.closePath();c.fill();c.restore();
    if(s.joinGlow>.01){c.strokeStyle=`rgba(255,200,87,${s.joinGlow})`;c.lineWidth=7;c.beginPath();c.moveTo(236,300);c.quadraticCurveTo(278,292,cx-54,cy+16);c.stroke();for(let n=0;n<4;n++)star(c,252+n*22,296-n*5,8-n,2,n%2?'#35C7D8':'#FFC857',s.joinGlow*(1-n*.16),n+s.starTurn)}
    c.restore();
    if(s.rideA>.002){const t=clamp(s.rideT),a=-2.3+t*4.55,x=cx+Math.cos(a)*(r+24),y=cy+Math.sin(a)*(r+18);star(c,x,y,14,3.5,'#FFC857',s.rideA,s.starTurn)}
  }
  function reminderDock(c, s) {
    if (s.reminderA <= 0.002 && s.dockA <= 0.002) return;
    const t = clamp(s.reminderT), u = 1 - t;
    const x = u * u * 446 + 2 * u * t * 472 + t * t * 356;
    const y = u * u * 92 + 2 * u * t * 250 + t * t * 284;
    c.save();
    c.globalAlpha *= Math.max(s.reminderA, s.dockA);
    c.strokeStyle = "rgba(53,199,216,.42)"; c.lineWidth = 5; c.setLineDash([12, 13]);
    c.beginPath(); c.moveTo(446, 92); c.quadraticCurveTo(472, 250, 356, 284); c.stroke(); c.setLineDash([]);
    c.translate(x, y); c.rotate(s.reminderRot); c.scale(s.reminderScale, s.reminderScale);
    const g = c.createLinearGradient(-45, -30, 45, 30); g.addColorStop(0, "rgba(255,248,238,.98)"); g.addColorStop(0.55, "rgba(211,252,255,.96)"); g.addColorStop(1, "rgba(53,199,216,.9)");
    c.fillStyle = g; c.strokeStyle = "#35C7D8"; c.lineWidth = 5; rr(c, -49, -38, 98, 76, 25); c.fill(); c.stroke();
    c.fillStyle = "#FFC857"; c.beginPath(); c.arc(0, 0, 25, 0, TAU); c.fill();
    c.fillStyle = "#FFF8EE"; c.beginPath(); c.arc(0, 0, 19, 0, TAU); c.fill();
    c.strokeStyle = "#F04B28"; c.lineWidth = 5; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(s.clockTurn) * 12, Math.sin(s.clockTurn) * 12); c.moveTo(0, 0); c.lineTo(Math.cos(s.clockTurn - 1.7) * 8, Math.sin(s.clockTurn - 1.7) * 8); c.stroke();
    c.fillStyle = "#F04B28"; c.beginPath(); c.arc(-27, -39, 10, 0, TAU); c.arc(27, -39, 10, 0, TAU); c.fill();
    star(c, 0, 0, 5, 1.3, "#35C7D8", 0.9, s.starTurn);
    c.restore();
    if (s.ringA > 0.002) for (let n = 0; n < 3; n++) { c.save(); c.globalAlpha *= s.ringA * (1 - n * 0.25); c.strokeStyle = n % 2 ? "#FFC857" : "#35C7D8"; c.lineWidth = 5; c.beginPath(); c.arc(355, 284, 52 + n * 20 + s.ringSpread * 16, -0.8, 0.8); c.stroke(); c.restore(); }
    if (s.stampA > 0.002) {
      c.save(); c.globalAlpha *= s.stampA; c.translate(389, 218); c.scale(.65 + .35 * s.stampA, .65 + .35 * s.stampA);
      c.fillStyle = "#35C7D8"; c.shadowColor = "rgba(53,199,216,.35)"; c.shadowBlur = 14;
      c.beginPath(); c.arc(0, 0, 28, 0, TAU); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = "#FFF8EE"; c.lineWidth = 9; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); c.moveTo(-13, 0); c.lineTo(-3, 11); c.lineTo(16, -13); c.stroke(); c.restore();
      for (let n = 0; n < 4; n++) star(c, 389 + Math.cos(n * 1.57) * 44, 218 + Math.sin(n * 1.57) * 35, 7, 1.7, n % 2 ? "#FFC857" : "#F04B28", s.stampA * .7, n + s.starTurn);
    }
  }
  function submitCard(c, s) {
    if (s.cardA <= .002) return;
    c.save(); c.globalAlpha *= s.cardA; c.translate(s.cardX, s.cardY); c.rotate(s.cardRot); c.scale(s.cardScale, s.cardScale);
    c.shadowColor = "rgba(79,64,45,.15)"; c.shadowBlur = 16; c.fillStyle = "rgba(255,253,244,.98)";
    rr(c, -78, -66, 156, 132, 22); c.fill(); c.shadowBlur = 0; c.strokeStyle = "rgba(53,199,216,.55)"; c.lineWidth = 5; c.stroke();
    c.fillStyle = "#FFC857"; rr(c, -53, -40, 76, 11, 6); c.fill();
    c.fillStyle = "rgba(53,199,216,.42)"; rr(c, -53, -14, 106, 9, 5); c.fill(); rr(c, -53, 6, 86, 9, 5); c.fill();
    c.fillStyle = "#FF7B27"; rr(c, -45, 31, 90, 24, 12); c.fill();
    c.fillStyle = "#FFF8EE"; c.beginPath(); c.moveTo(-7, 38); c.lineTo(9, 43); c.lineTo(-7, 49); c.closePath(); c.fill();
    c.restore();
    if (s.sendA > .002) for (let n=0;n<4;n++) star(c,s.cardX-100-n*25,s.cardY+(n%2?9:-8),9-n,2,n%2?"#35C7D8":"#FFC857",s.sendA*(1-n*.18),s.starTurn+n*.5);
    if (s.errorA > .002) {
      const pulse=.82+.18*s.errorA; c.save(); c.globalAlpha*=s.errorA; c.translate(s.cardX+58,s.cardY-55); c.scale(pulse,pulse);
      c.fillStyle="#F04B28"; c.shadowColor="rgba(240,75,40,.38)"; c.shadowBlur=16; c.beginPath(); c.arc(0,0,31,0,TAU); c.fill(); c.shadowBlur=0;
      c.strokeStyle="#FFF8EE"; c.lineWidth=9; c.lineCap="round"; c.beginPath(); c.moveTo(-11,-11); c.lineTo(11,11); c.moveTo(11,-11); c.lineTo(-11,11); c.stroke(); c.restore();
      for(let n=0;n<5;n++) star(c,s.cardX+58+Math.cos(n*1.26)*48,s.cardY-55+Math.sin(n*1.26)*42,7,1.8,n%2?"#FFC857":"#F04B28",s.errorA*.7,n+s.starTurn);
    }
    if (s.retryA > .002) {
      c.save(); c.globalAlpha*=s.retryA; c.strokeStyle="#35C7D8"; c.lineWidth=7; c.lineCap="round"; c.beginPath(); c.arc(s.cardX,s.cardY+89,24,.25,Math.PI*1.75); c.stroke();
      c.fillStyle="#35C7D8"; c.beginPath(); c.moveTo(s.cardX+20,s.cardY+70); c.lineTo(s.cardX+38,s.cardY+74); c.lineTo(s.cardX+25,s.cardY+89); c.closePath(); c.fill(); c.restore();
    }
  }
  function base() {
    return {
      x: 256,
      y: 276,
      rot: 0,
      sx: 1,
      sy: 1,
      bean: 0.1,
      tug: 0,
      squash: 0,
      eyeX: 0,
      eyeY: 0,
      eyeL: 0.95,
      eyeR: 0.95,
      starTurn: 0,
      handA: 0,
      lx: 158,
      ly: 300,
      rx: 354,
      ry: 300,
      handScale: 1,
      quantumA: 0,
      quantumTurn: 0,
      scanA: 0,
      scanTurn: 0,
      frameA: 0,
      frameScale: 0.2,
      frameRot: 0,
      lensA: 0,
      lensX: 330,
      lensY: 250,
      lensScale: 0.2,
      lensRot: 0,
      dustA: 0,
      dustTurn: 0,
      antA: 0,
      knot: 0,
      waveA: 0,
      zapA: 0,
      podA: 0,
      podX: 345,
      podY: 267,
      podRot: 0,
      podScale: 0.2,
      podLit: 1,
      flame: 0,
      smoke: 0,
      smokeTurn: 0,
      signalA: 0,
      signalT: 0,
      signalPulse: 0,
      reconnectGlow: 0,
      trackA: 0,
      trackGap: 1,
      joinGlow: 0,
      rideA: 0,
      rideT: 0,
      reminderA: 0,
      reminderT: 0,
      reminderRot: 0,
      reminderScale: 0.2,
      dockA: 0,
      ringA: 0,
      ringSpread: 0,
      clockTurn: -1.57,
      stampA: 0,
      cardA: 0,
      cardX: 350,
      cardY: 276,
      cardRot: 0,
      cardScale: .25,
      sendA: 0,
      errorA: 0,
      retryA: 0,
    };
  }
  function paint(canvas, c, s, mode) {
    c.clearRect(0, 0, 512, 512);
    if (mode === "loading") quantum(c, s);
    if (mode === "empty") {
      searchFrame(c, s);
      dust(c, s);
      lens(c, s);
    }
    if (mode === "offline") antenna(c, s);
    if (mode === "failure") submitCard(c, s);
    if (mode === "reconnect") { antenna(c, s); reconnectSignal(c, s); }
    if (mode === "resume") threadTrack(c, s);
    if (mode === "reminder") reminderDock(c, s);
    orb(c, s);
    hand(c, s.lx, s.ly, s.handA, s.handScale);
    hand(c, s.rx, s.ry, s.handA, s.handScale);
  }
  module.exports = { base, paint };
})();
