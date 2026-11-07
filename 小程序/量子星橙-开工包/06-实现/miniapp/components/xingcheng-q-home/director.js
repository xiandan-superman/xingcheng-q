/* Context-aware large-Q performance. View visibility owns the clock. */

'use strict';
class Director{
 constructor(library,{history={},remember=()=>{}}={}){this.library=library;this.clock=0;this.name='idle';this.time=0;this.reason='quiet';this.quiet=0;this.lastOpening=history.lastOpening||null;this.lastStory=history.lastStory||null;this.remember=remember;this.storyIndex=0;this.nextGap=60;this.pendingEntry=false;this.pendingFeedback=null;this.started=false;this.completed=[];this.justSettled=false;}
 start(name,reason){this.name=name;this.time=0;this.reason=reason;this.justSettled=false;if(this.full){this.lastStory=name;this.remember({lastOpening:this.lastOpening,lastStory:this.lastStory});}}
 enter({welcoming=false,empty=false}={}){this.started=true;this.pendingFeedback=null;this.quiet=0;this.pendingEntry=true;this.empty=empty;if(!welcoming)this.open();else this.start('idle','welcome');}
 open(){const choices=this.empty?['asteroid','clone']:['pancake','snack','clone','sneeze','asteroid'];let next=(choices.indexOf(this.lastOpening)+1)%choices.length;if(choices[next]===this.lastStory)next=(next+1)%choices.length;this.lastOpening=choices[next];this.pendingEntry=false;this.start(this.lastOpening,'entry');}
 activity(){this.quiet=0;}
 returned(kind='tab'){this.activity();if(kind==='answer'){if(this.full)this.pendingFeedback='success';else this.start('feedback:success','answer');}}
 select(name){if(name==='auto'){this.activity();return;}this.start(name,'manual');this.activity();}
 tick(dt,{welcoming=false,smallForeground=false,reduced=false}={}){
  this.justSettled=false;if(!this.started)return;
  if(reduced){
   if(this.full||this.pendingEntry){this.completed.push({name:this.name,reason:this.reason,at:this.clock,reduced:true});this.pendingEntry=false;this.start('idle','entry-still');this.quiet=0;}
   if(this.pendingFeedback&&!welcoming){const kind=this.pendingFeedback;this.pendingFeedback=null;this.start('feedback:'+kind,'answer');}
   if(this.name.startsWith('feedback:')){this.time+=dt;if(this.time>=1.8){this.completed.push({name:this.name,reason:this.reason,at:this.clock,reduced:true});this.start('idle','quiet');}}
   return;
  }
  if(this.reason==='entry-still')this.reason='quiet';this.clock+=dt;this.time+=dt;
  if(this.name!=='idle'){
   const duration=this.name.startsWith('feedback:')?1.8:this.library[this.name].duration;
   if(this.time>=duration){this.completed.push({name:this.name,reason:this.reason,at:this.clock});if(this.completed.length>16)this.completed.shift();this.start('idle','quiet');this.justSettled=true;this.quiet=0;this.nextGap=[60,70,65][this.storyIndex%3];}
   return;
  }
  this.time%=8.2;
  if(this.pendingFeedback&&!welcoming){const kind=this.pendingFeedback;this.pendingFeedback=null;this.start('feedback:'+kind,'answer');return;}
  if(this.pendingEntry&&!welcoming){this.open();return;}
  this.quiet+=dt;
  if(this.quiet>=this.nextGap&&!welcoming&&!smallForeground){const choices=['snack','asteroid','sneeze','clone','pancake','sleep'];let next=choices[this.storyIndex++%choices.length];if(next===this.lastStory)next=choices[this.storyIndex++%choices.length];this.start(next,'occasional');this.quiet=0;}
 }
 get full(){return this.name!=='idle'&&!this.name.startsWith('feedback:');}
 get sample(){return {name:this.name,time:this.time};}
 snapshot(){return {name:this.name,time:this.time,reason:this.reason,clock:this.clock,quiet:this.quiet,nextGap:this.nextGap,full:this.full,pendingEntry:this.pendingEntry,pendingFeedback:this.pendingFeedback,lastOpening:this.lastOpening,lastStory:this.lastStory,completed:this.completed.slice()};}
}
module.exports={Director};

