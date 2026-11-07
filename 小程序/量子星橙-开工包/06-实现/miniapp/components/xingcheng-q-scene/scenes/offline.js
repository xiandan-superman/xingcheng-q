const gsap=require('../timeline');
const Core=require('../system-core');
module.exports=function(canvas){
const ctx=canvas.getContext('2d'),s=Core.base();
      Object.assign(s, {
        x: 250,
        y: 300,
        sx: 0.9,
        sy: 0.92,
        eyeX: 11,
        eyeY: -8,
      });
      const draw = () => Core.paint(canvas, ctx, s, "offline");
      const tl = gsap.timeline({ paused: true, onUpdate: draw });
      tl.to(s, { antA: 1, waveA: 1, duration: 0.65, ease: "power2.out" }, 0.3)
        .to(
          s,
          {
            eyeX: 17,
            eyeY: -11,
            rot: 0.05,
            sx: 0.88,
            sy: 0.95,
            duration: 0.7,
            ease: "sine.inOut",
          },
          1,
        )
        .to(
          s,
          {
            waveA: 0.12,
            knot: 1,
            zapA: 1,
            eyeL: 1.12,
            eyeR: 1.12,
            sx: 1.02,
            sy: 0.77,
            squash: 0.5,
            y: 310,
            duration: 0.5,
            ease: "expo.out",
          },
          1.85,
        )
        .to(
          s,
          {
            zapA: 0,
            handA: 1,
            lx: 330,
            ly: 205,
            rx: 382,
            ry: 196,
            x: 244,
            y: 300,
            rot: -0.09,
            duration: 0.55,
            ease: "back.out(1.8)",
          },
          2.45,
        )
        .to(
          s,
          {
            lx: 315,
            ly: 195,
            rx: 399,
            ry: 191,
            tug: 0.7,
            rot: 0.1,
            eyeX: 18,
            eyeY: -10,
            duration: 0.65,
            ease: "power2.inOut",
          },
          3.15,
        )
        .to(
          s,
          {
            lx: 338,
            ly: 210,
            rx: 374,
            ry: 204,
            tug: 0.15,
            rot: -0.12,
            sx: 0.95,
            sy: 0.86,
            duration: 0.42,
            ease: "back.out(2)",
          },
          3.85,
        )
        .to(
          s,
          {
            lx: 312,
            ly: 194,
            rx: 404,
            ry: 190,
            tug: 0.8,
            rot: 0.11,
            duration: 0.62,
            ease: "power2.inOut",
          },
          4.4,
        )
        .to(
          s,
          {
            handA: 0,
            x: 256,
            y: 310,
            rot: 0,
            sx: 0.98,
            sy: 0.73,
            squash: 0.5,
            eyeX: 11,
            eyeY: -8,
            eyeL: 0.28,
            eyeR: 0.28,
            duration: 0.5,
            ease: "power2.out",
          },
          5.15,
        )
        .to(
          s,
          {
            eyeL: 0.95,
            eyeR: 0.95,
            handA: 1,
            lx: 159,
            ly: 314,
            rx: 353,
            ry: 314,
            sx: 0.92,
            sy: 0.9,
            squash: 0,
            duration: 0.55,
            ease: "back.out(2)",
          },
          5.8,
        )
        .to(
          s,
          { waveA: 0.35, starTurn: 2.2, duration: 0.75, ease: "sine.inOut" },
          6.45,
        )
        .to(
          s,
          {
            waveA: 0.05,
            eyeX: 16,
            eyeY: -10,
            sx: 0.93,
            sy: 0.89,
            duration: 1.3,
            ease: "sine.out",
          },
          7.25,
        );
      
      
return {timeline:tl,draw};
}
