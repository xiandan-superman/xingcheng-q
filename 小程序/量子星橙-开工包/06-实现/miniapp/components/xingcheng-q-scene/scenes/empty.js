const gsap=require('../timeline');
const Core=require('../system-core');
module.exports=function(canvas){
const ctx=canvas.getContext('2d'),s=Core.base();
      Object.assign(s, {
        x: 198,
        y: 296,
        sx: 0.78,
        sy: 0.8,
        eyeX: 14,
        frameA: 0,
        lensA: 0,
      });
      const draw = () => Core.paint(canvas, ctx, s, "empty");
      const tl = gsap.timeline({ paused: true, onUpdate: draw });
      tl.to(
        s,
        { frameA: 1, frameScale: 1, duration: 0.7, ease: "back.out(1.7)" },
        0.3,
      )
        .to(
          s,
          {
            lensA: 1,
            lensScale: 1,
            lensX: 296,
            lensY: 252,
            handA: 1,
            rx: 300,
            ry: 335,
            duration: 0.55,
            ease: "back.out(1.8)",
          },
          1,
        )
        .to(
          s,
          {
            x: 215,
            rot: -8,
            eyeX: 18,
            eyeY: -5,
            lensX: 330,
            lensY: 232,
            lensRot: -0.3,
            duration: 0.8,
            ease: "sine.inOut",
          },
          1.65,
        )
        .to(
          s,
          {
            x: 218,
            rot: 8,
            eyeX: 20,
            eyeY: 6,
            lensX: 362,
            lensY: 302,
            lensRot: 0.35,
            duration: 0.9,
            ease: "sine.inOut",
          },
          2.55,
        )
        .to(
          s,
          {
            frameRot: 0.08,
            dustA: 0.8,
            dustTurn: 2.5,
            eyeX: 13,
            eyeY: 4,
            duration: 0.85,
            ease: "sine.inOut",
          },
          3.55,
        )
        .to(
          s,
          {
            lensA: 0,
            lensScale: 0.2,
            handA: 0,
            duration: 0.35,
            ease: "power2.in",
          },
          4.45,
        )
        .to(
          s,
          {
            x: 256,
            y: 304,
            rot: 0,
            sx: 0.93,
            sy: 0.72,
            squash: 0.45,
            eyeX: 0,
            eyeY: 7,
            eyeL: 0.35,
            eyeR: 0.35,
            duration: 0.55,
            ease: "power2.out",
          },
          4.9,
        )
        .to(
          s,
          {
            handA: 1,
            lx: 140,
            ly: 315,
            rx: 372,
            ry: 315,
            handScale: 1.08,
            eyeL: 1.02,
            eyeR: 1.02,
            sy: 0.9,
            sx: 0.88,
            squash: 0,
            duration: 0.55,
            ease: "back.out(2)",
          },
          5.65,
        )
        .to(
          s,
          {
            lx: 128,
            ly: 304,
            rx: 384,
            ry: 304,
            rot: -0.02,
            dustA: 0.25,
            duration: 0.7,
            ease: "sine.inOut",
          },
          6.25,
        )
        .to(
          s,
          {
            eyeL: 0.16,
            eyeR: 0.16,
            sy: 0.86,
            duration: 0.18,
            ease: "power2.in",
          },
          7.25,
        )
        .to(
          s,
          { eyeL: 0.95, eyeR: 0.95, duration: 0.22, ease: "power2.out" },
          7.43,
        )
        .to(
          s,
          { sx: 0.9, sy: 0.88, handA: 0.92, duration: 0.75, ease: "sine.out" },
          7.65,
        );
      
      
return {timeline:tl,draw};
}
