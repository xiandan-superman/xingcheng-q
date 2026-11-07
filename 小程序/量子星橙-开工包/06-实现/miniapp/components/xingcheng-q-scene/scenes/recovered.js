const gsap=require('../timeline');
const Core=require('../system-core');
module.exports=function(canvas){
const ctx=canvas.getContext('2d'),s=Core.base();
      Object.assign(s, { x: 252, y: 309, sx: .92, sy: .82, eyeX: 12, eyeY: -9, antA: 1, knot: 1, waveA: .04 });
      const draw = () => Core.paint(canvas, ctx, s, "reconnect");
      const tl = gsap.timeline({ paused: true, onUpdate: draw });
      tl.to(s, { signalA: 1, signalT: .18, signalPulse: 1, starTurn: .8, eyeX: 18, eyeY: -11, duration: .7, ease: "power2.out" }, .35)
        .to(s, { signalT: .62, signalPulse: .2, rot: -.05, sx: .89, sy: .86, duration: .85, ease: "sine.inOut" }, 1.1)
        .to(s, { signalT: 1, signalPulse: 1, eyeL: 1.13, eyeR: 1.13, y: 302, sx: .98, sy: .73, squash: .4, duration: .62, ease: "power3.in" }, 2.05)
        .to(s, { reconnectGlow: 1, zapA: .9, duration: .25, ease: "expo.out" }, 2.72)
        .set(s, { knot: 0 }, 2.9)
        .to(s, { waveA: 1, reconnectGlow: .45, zapA: 0, signalA: 0, handA: 1, lx: 156, ly: 278, rx: 354, ry: 278, eyeX: 0, eyeY: -3, x: 256, y: 281, sx: .82, sy: 1.04, squash: 0, duration: .55, ease: "back.out(2.2)" }, 3.02)
        .to(s, { y: 252, rot: -.12, sx: .76, sy: .9, lx: 149, ly: 254, rx: 363, ry: 254, starTurn: 2.1, duration: .48, ease: "power2.out" }, 3.72)
        .to(s, { y: 282, rot: .08, sx: .9, sy: .8, duration: .45, ease: "bounce.out" }, 4.23)
        .to(s, { reconnectGlow: .15, waveA: .7, eyeL: .16, eyeR: .16, duration: .16, ease: "power2.in" }, 5.02)
        .to(s, { eyeL: .95, eyeR: .95, handA: .85, rot: 0, sx: .88, sy: .86, y: 286, duration: 1.28, ease: "sine.out" }, 5.18);
       
return {timeline:tl,draw};
}
