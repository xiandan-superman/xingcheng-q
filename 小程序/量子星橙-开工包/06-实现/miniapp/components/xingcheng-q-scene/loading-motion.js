const Builder=require('./scenes/loading');
const Core=require('./system-core');
const Followup=require('../xingcheng-q-motion/followup');
const Emotions=require('../xingcheng-q-motion/emotions');

module.exports=function(canvas){
 const source=Builder(canvas,true),ctx=canvas.getContext('2d');
 const raw={duration:6.4,sample(t){source.timeline.seek(t);return Object.assign({},source.state);}};
 const original=Followup.createMotion(raw,'loading');
 const motion={duration:original.duration,sample(t,mode){return Emotions.emotionPose(original.sample(t,mode),'waiting',t,mode)}};
 return {motion,timeline:{duration:()=>6.4,seek(t){Core.paint(canvas,ctx,motion.sample(t),'loading');}}};
};
