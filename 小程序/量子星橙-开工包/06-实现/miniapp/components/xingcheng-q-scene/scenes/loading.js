const gsap=require('../timeline');
const Core=require('../system-core');
module.exports=function(canvas,sampleOnly=false){
const ctx=canvas.getContext('2d'),s=Core.base();
      Object.assign(s, {
        quantumA: 1,
        scanA: 0.35,
        x: 256,
        y: 272,
        bean: 0.12,
      });
      const draw = () => {if(!sampleOnly)Core.paint(canvas, ctx, s, "loading")};
      const tl = gsap.timeline({ paused: true, onUpdate: draw });
      tl.to(
        s,
        {
          quantumTurn: Math.PI * 2,
          scanTurn: Math.PI * 2,
          starTurn: Math.PI * 2,
          duration: 6.4,
          ease: "none",
        },
        0,
      )
        .to(
          s,
          {
            eyeX: 13,
            eyeY: -3,
            sx: 0.98,
            sy: 1.02,
            duration: 1.2,
            ease: "sine.inOut",
          },
          0,
        )
        .to(
          s,
          {
            eyeX: -12,
            eyeY: 1,
            sx: 1.02,
            sy: 0.98,
            duration: 1.6,
            ease: "sine.inOut",
          },
          1.2,
        )
        .to(
          s,
          {
            eyeX: 8,
            eyeY: 5,
            sx: 0.98,
            sy: 1.02,
            duration: 1.6,
            ease: "sine.inOut",
          },
          2.8,
        )
        .to(
          s,
          { eyeX: 0, eyeY: 0, sx: 1, sy: 1, duration: 2, ease: "sine.inOut" },
          4.4,
        )
        .to(
          s,
          { eyeL: 0.14, eyeR: 0.14, duration: 0.13, ease: "power2.in" },
          3.12,
        )
        .to(
          s,
          { eyeL: 0.95, eyeR: 0.95, duration: 0.18, ease: "power2.out" },
          3.25,
        )
        .to(s, { scanA: 0.85, duration: 0.45, ease: "sine.out" }, 4.55)
        .to(s, { scanA: 0.35, duration: 0.55, ease: "sine.in" }, 5.25);
      
      
return {timeline:tl,draw,state:s};
}
