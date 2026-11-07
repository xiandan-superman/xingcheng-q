const Appearance=require('../xingcheng-q-motion/appearance');
const Motion=require('../xingcheng-q-motion/core');
const Expressions=require('../xingcheng-q-motion/expressions');
const Emotions=require('../xingcheng-q-motion/emotions');
(function () {
  const TAU = Math.PI * 2;

  function star(ctx, x, y, outer, inner, fill, alpha, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const r = i % 2 === 0 ? outer : inner;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  function capsule(ctx, x, y, w, h, rotation, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.fillStyle = '#FFF8EE';
    const left = -w / 2;
    const top = -h / 2;
    const right = w / 2;
    const bottom = h / 2;
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.moveTo(left + r, top);
    ctx.arcTo(right, top, right, bottom, r);
    ctx.arcTo(right, bottom, left, bottom, r);
    ctx.arcTo(left, bottom, left, top, r);
    ctx.arcTo(left, top, right, top, r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function happyEye(ctx, x, y, rotation, alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation || 0);
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = '#FFF8EE';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 8, 17, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.restore();
  }

  function bodyPath(ctx, s) {
    ctx.beginPath();
    for (let i = 0; i <= 112; i += 1) {
      const a = i / 112 * TAU;
      const delta = Math.atan2(Math.sin(a - s.shapeAngle), Math.cos(a - s.shapeAngle));
      const drop = Math.exp(-(delta * delta) / 0.13) * s.drop * 0.48;
      const pebble = s.pebble * (0.055 * Math.cos(a * 2 + 0.5) + 0.028 * Math.cos(a * 3 + 2.1));
      const cloud = s.cloud * (0.065 * Math.cos(a * 4 + 0.35) - 0.02 * Math.sin(a * 2));
      const r = 122 * (1 + drop + pebble + cloud);
      const px = Math.cos(a) * r + drop * 16;
      const py = Math.sin(a) * r + drop * 8;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function portal(ctx, s, front) {
    if (s.portalAlpha <= 0.01) return;
    ctx.save();
    ctx.translate(s.portalX, s.portalY);
    ctx.rotate(s.portalRotation * Math.PI / 180);
    ctx.globalAlpha = s.portalAlpha;
    ctx.lineCap = 'round';
    const colors = ['#FFC857', '#35C7D8', '#F04424'];
    for (let ring = 0; ring < 3; ring += 1) {
      const radius = (82 + ring * 14) * s.portalOpen;
      const pieces = 12;
      for (let i = 0; i < pieces; i += 1) {
        const a0 = i / pieces * TAU + ring * 0.22;
        const a1 = a0 + 0.28;
        const mid = (a0 + a1) / 2;
        const isFront = Math.sin(mid) >= 0;
        if (isFront !== front) continue;
        ctx.strokeStyle = colors[ring];
        ctx.lineWidth = 4.5 - ring * 0.55;
        ctx.shadowColor = colors[ring];
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * 1.13, 0, a0, a1);
        ctx.stroke();
      }
    }
    for (let i = 0; i < 4; i += 1) {
      const a = s.portalRotation * 0.025 + i * Math.PI / 2;
      star(ctx, Math.cos(a) * 104 * s.portalOpen, Math.sin(a) * 116 * s.portalOpen, 7, 1.8, i % 2 ? '#35C7D8' : '#FFC857', s.portalAlpha, -a);
    }
    ctx.restore();
  }

  function satelliteHand(ctx, x, y, alpha, scale) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale || 1, scale || 1);
    ctx.globalAlpha *= alpha;
    const g = ctx.createRadialGradient(-5, -6, 1, 0, 0, 22);
    g.addColorStop(0, '#FFD873');
    g.addColorStop(0.35, '#FF9A22');
    g.addColorStop(1, '#F04424');
    ctx.fillStyle = g;
    ctx.shadowColor = '#FF9A22';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,238,.7)';
    ctx.beginPath();
    ctx.arc(-5, -6, 4.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function ribbon(ctx, s) {
    if (s.ribbonAlpha <= 0.01) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation * Math.PI / 180);
    ctx.globalAlpha = s.ribbonAlpha;
    ctx.lineCap = 'round';
    const bands = [
      { rx: 158, ry: 52, tilt: -0.25, color: '#FFC857', width: 8, phase: 0 },
      { rx: 138, ry: 70, tilt: 0.62, color: '#35C7D8', width: 6, phase: 2.2 }
    ];
    bands.forEach((b, bi) => {
      const head = s.ribbonRotation * Math.PI / 180 * (bi ? -0.82 : 1) + b.phase;
      for (let i = 0; i < 34; i += 1) {
        const u0 = i / 34;
        const u1 = (i + 1) / 34;
        const point = (u) => {
          const a = head - 1.7 + 1.7 * u;
          const ex = Math.cos(a) * b.rx;
          const ey = Math.sin(a) * b.ry;
          return { x: ex * Math.cos(b.tilt) - ey * Math.sin(b.tilt), y: ex * Math.sin(b.tilt) + ey * Math.cos(b.tilt) };
        };
        const p0 = point(u0);
        const p1 = point(u1);
        const strength = Math.pow(u1, 1.6);
        ctx.globalAlpha = s.ribbonAlpha * (0.08 + 0.92 * strength);
        ctx.strokeStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 7;
        ctx.lineWidth = 1.5 + b.width * strength;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  function character(ctx, s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation * Math.PI / 180);
    ctx.scale(s.scaleX, s.scaleY);
    ctx.globalAlpha *= s.alpha;

    Appearance.drawBody(ctx,()=>bodyPath(ctx,s),122);
    ctx.save();bodyPath(ctx,s);ctx.clip();
    Appearance.drawBrandStar(ctx,s,'story');
    if(s.nextExpression)Emotions.drawFace(ctx,s,1,'story');
    else if(s.expressionScene)Expressions.drawExpressionFace(ctx,s,1,'story');
    else Motion.drawFace(ctx,s,1,'story');
    if (s.cheek > 0.01) {
      ctx.globalAlpha *= s.cheek;
      ctx.fillStyle = 'rgba(255,229,171,.82)';
      ctx.beginPath(); ctx.ellipse(-61, 35, 17, 8, -0.16, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(63, 35, 17, 8, 0.16, 0, TAU); ctx.fill();
    }
    ctx.restore();
    satelliteHand(ctx, s.handLX, s.handLY, s.handAlpha, s.handScale);
    satelliteHand(ctx, s.handRX, s.handRY, s.handAlpha, s.handScale);
    ctx.restore();
  }

  function signal(ctx, s) {
    if (s.signalAlpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = s.signalAlpha;
    const x = s.signalX;
    const y = s.signalY;
    const g = ctx.createRadialGradient(x - 3, y - 4, 1, x, y, 18);
    g.addColorStop(0, '#FFF8EE');
    g.addColorStop(0.3, '#35C7D8');
    g.addColorStop(1, '#118A9B');
    ctx.fillStyle = g;
    ctx.shadowColor = '#35C7D8';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(x, y, 10 * s.signalScale, 0, TAU);
    ctx.fill();
    star(ctx, x, y, 5.5 * s.signalScale, 1.4, '#FFF8EE', 0.9, s.signalRotation);
    ctx.restore();
  }

  function sparkles(ctx, s) {
    if (s.sparkle <= 0.01) return;
    const points = [[-55,-37,16,4],[48,-48,11,2.8],[66,12,8,2],[-36,55,9,2.2],[11,-70,7,1.8]];
    points.forEach((p, i) => star(ctx, s.x + p[0] * s.sparkleSpread, s.y + p[1] * s.sparkleSpread, p[2] * Math.min(1, s.sparkle * 1.7), p[3], i % 2 ? '#35C7D8' : '#FFC857', s.sparkle, s.rotation * 0.02));
  }

  function emotionMarks(ctx, s) {
    if (s.confusion > 0.01) {
      const a = s.confusion;
      ctx.save(); ctx.translate(s.x + 112, s.y - 112); ctx.rotate(-0.12); ctx.globalAlpha = a;
      ctx.strokeStyle = '#35C7D8'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.shadowColor = '#35C7D8'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(-18, -16); ctx.bezierCurveTo(-17, -45, 31, -46, 30, -14); ctx.bezierCurveTo(29, 7, 4, 5, 5, 27); ctx.stroke();
      ctx.fillStyle = '#FFC857'; ctx.beginPath(); ctx.arc(5, 50, 7, 0, TAU); ctx.fill();
      star(ctx, -34, 28, 7, 2, '#FFC857', a, 0.3); ctx.restore();
    }
    if (s.realization > 0.01) {
      const a = s.realization;
      ctx.save(); ctx.translate(s.x + 110, s.y - 120); ctx.globalAlpha = a; ctx.shadowColor = '#FFC857'; ctx.shadowBlur = 12;
      ctx.strokeStyle = '#FFC857'; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, 12); ctx.stroke();
      ctx.fillStyle = '#F04424'; ctx.beginPath(); ctx.arc(0, 38, 8, 0, TAU); ctx.fill();
      for (let i = 0; i < 5; i += 1) { const q = -2.5 + i * 1.25; ctx.strokeStyle = i % 2 ? '#35C7D8' : '#FFC857'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(Math.cos(q) * 43, Math.sin(q) * 43); ctx.lineTo(Math.cos(q) * 58, Math.sin(q) * 58); ctx.stroke(); }
      ctx.restore();
    }
    if (s.joy > 0.01) {
      const a = s.joy;
      const pts = [[-96,-112,10],[0,-146,15],[96,-112,10],[-132,-45,7],[132,-45,7]];
      pts.forEach((p, i) => star(ctx, s.x + p[0], s.y + p[1], p[2] * a, Math.max(1.5, p[2] * .24), i % 2 ? '#35C7D8' : '#FFC857', a, i * .35));
    }
  }

  function welcomeSign(ctx, s) {
    if (s.signAlpha <= 0.01) return;
    ctx.save();
    ctx.translate(s.signX, s.signY);
    ctx.rotate(s.signRotation * Math.PI / 180);
    ctx.scale(s.signScale, s.signScale);
    ctx.globalAlpha = s.signAlpha;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#35C7D8'; ctx.lineWidth = 3; ctx.setLineDash([9, 8]);
    ctx.beginPath(); ctx.ellipse(0, 0, 154, 48, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    const g = ctx.createLinearGradient(-132, -34, 132, 34);
    g.addColorStop(0, '#FFF8EE'); g.addColorStop(0.52, '#FFF1CF'); g.addColorStop(1, '#FFE2A3');
    ctx.fillStyle = g; ctx.strokeStyle = '#F04424'; ctx.lineWidth = 5; ctx.shadowColor = 'rgba(240,68,36,.22)'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.moveTo(-112, -36); ctx.arcTo(128, -36, 128, 36, 22); ctx.arcTo(128, 36, -128, 36, 22); ctx.arcTo(-128, 36, -128, -36, 22); ctx.arcTo(-128, -36, 128, -36, 22); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    star(ctx, -94, 0, 17, 4, '#FFC857', 1, 0.18);
    ctx.fillStyle = '#D94C1F'; ctx.font = '700 35px "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('欢迎返航', 18, 1);
    star(ctx, 112, -26, 7, 2, '#35C7D8', 1, -0.2);
    ctx.restore();
  }

  function thoughtBubble(ctx, s) {
    if (s.thoughtAlpha <= 0.01) return;
    const a = s.thoughtAlpha;
    ctx.save(); ctx.translate(s.thoughtX, s.thoughtY); ctx.scale(s.thoughtScale, s.thoughtScale); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(255,248,238,.94)'; ctx.strokeStyle = '#35C7D8'; ctx.lineWidth = 4; ctx.setLineDash([9,7]); ctx.shadowColor = 'rgba(53,199,216,.24)'; ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(-92,-6); ctx.bezierCurveTo(-104,-48,-60,-78,-24,-58); ctx.bezierCurveTo(4,-88,57,-73,61,-40); ctx.bezierCurveTo(106,-39,114,18,78,37); ctx.bezierCurveTo(59,70,7,67,-10,46); ctx.bezierCurveTo(-47,68,-93,43,-92,-6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,248,238,.92)'; ctx.strokeStyle = '#FFC857'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-83,69,14,0,TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-105,92,8,0,TAU); ctx.fill(); ctx.stroke();
    const chaos = [[-45,-15],[18,-29],[48,19]];
    const order = [[-42,8],[0,-13],[42,8]];
    const colors = ['#FFC857','#35C7D8','#F04424'];
    for (let i = 0; i < 3; i += 1) {
      const px = chaos[i][0] + (order[i][0] - chaos[i][0]) * s.thoughtOrder;
      const py = chaos[i][1] + (order[i][1] - chaos[i][1]) * s.thoughtOrder;
      ctx.save(); ctx.translate(px,py); ctx.rotate(s.thoughtOrbit * (i % 2 ? -1 : 1) + i); ctx.fillStyle = colors[i]; ctx.strokeStyle = colors[i]; ctx.lineWidth = 5;
      if (i === 0) star(ctx,0,0,12,3,colors[i],1,0);
      else if (i === 1) { ctx.beginPath(); ctx.arc(0,0,10,0,TAU); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(11,9); ctx.lineTo(-11,9); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    if (s.thoughtSolved > 0.01) {
      const k = s.thoughtSolved; star(ctx,0,2,34*k,7,'#FFC857',k,s.thoughtOrbit*.4); star(ctx,0,2,15*k,3,'#FFF8EE',k,-s.thoughtOrbit*.5);
    }
    ctx.restore();
  }

  function resultToken(ctx, s) {
    if (s.resultAlpha <= 0.01) return;
    ctx.save(); ctx.globalAlpha = s.resultAlpha; ctx.translate(s.resultX,s.resultY); ctx.rotate(s.resultRotation); ctx.scale(s.resultScale,s.resultScale);
    ctx.shadowColor = '#FFC857'; ctx.shadowBlur = 18; star(ctx,0,0,30,7,'#FFC857',1,0); star(ctx,0,0,13,3,'#FFF8EE',.95,.2); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#35C7D8'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.globalAlpha *= .75;
    ctx.beginPath(); ctx.arc(-10,9,42,-.2,1.15); ctx.stroke(); ctx.restore();
  }

  function catchAndCheck(ctx, s) {
    if (s.catchArc > 0.01) {
      ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(s.rotation*Math.PI/180); ctx.globalAlpha=s.catchArc; ctx.strokeStyle='#35C7D8'; ctx.lineWidth=8; ctx.lineCap='round'; ctx.shadowColor='#35C7D8'; ctx.shadowBlur=10;
      ctx.beginPath(); ctx.arc(0,12,145,.18,Math.PI-.18); ctx.stroke(); ctx.restore();
    }
    if (s.checkAlpha > 0.01) {
      const k=s.checkDraw; ctx.save(); ctx.translate(s.x+105,s.y-98); ctx.scale(s.checkScale,s.checkScale); ctx.globalAlpha=s.checkAlpha;
      ctx.fillStyle='rgba(255,248,238,.94)'; ctx.strokeStyle='#FFC857'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(0,0,38,0,TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle='#F04424'; ctx.lineWidth=8; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath();
      if (k <= .42) { const u=k/.42; ctx.moveTo(-17,1); ctx.lineTo(-17+17*u,1+16*u); }
      else { const u=(k-.42)/.58; ctx.moveTo(-17,1); ctx.lineTo(0,17); ctx.lineTo(0+23*u,17-32*u); }
      ctx.stroke(); star(ctx,30,-31,8,2,'#35C7D8',s.checkAlpha,.2); ctx.restore();
    }
  }

  function baseState() {
    return {
      x: 256, y: 278, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1,
      eyeX: 0, eyeY: 0, eyeOpenL: 0.94, eyeOpenR: 0.94, eyeTilt: 0, eyeAlpha: 1, wink: 0, smile: 0, cheek: 0,
      pebble: 0, cloud: 0, drop: 0, shapeAngle: 0,
      starGlow: 0.28, halo: 0.14,
      handAlpha: 0, handLX: -105, handLY: 36, handRX: 105, handRY: 36, handScale: 1,
      portalAlpha: 0, portalOpen: 0.2, portalRotation: 0, portalX: 104, portalY: 266,
      ribbonAlpha: 0, ribbonRotation: 0,
      signalAlpha: 0, signalX: 480, signalY: 210, signalScale: 1, signalRotation: 0,
      sparkle: 0, sparkleSpread: 1, confusion: 0, realization: 0, joy: 0,
      signAlpha: 0, signX: 256, signY: 474, signScale: 0.72, signRotation: -3
      ,thoughtAlpha: 0, thoughtX: 338, thoughtY: 145, thoughtScale: 0.35, thoughtOrder: 0, thoughtOrbit: 0, thoughtSolved: 0
      ,resultAlpha: 0, resultX: 470, resultY: 80, resultScale: 1, resultRotation: 0, catchArc: 0
      ,checkAlpha: 0, checkScale: 0.5, checkDraw: 0
    };
  }

  function paint(canvas, ctx, s) {
    ctx.clearRect(0, 0, 512, 512);
    portal(ctx, s, false);
    ribbon(ctx, s);
    thoughtBubble(ctx, s);
    signal(ctx, s);
    resultToken(ctx, s);
    character(ctx, s);
    emotionMarks(ctx, s);
    welcomeSign(ctx, s);
    catchAndCheck(ctx, s);
    portal(ctx, s, true);
    sparkles(ctx, s);
  }

  module.exports = { baseState, paint, star };
})();
