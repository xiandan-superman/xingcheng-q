/* GIF encoding stays on this device, away from the interactive preview. */
importScripts('vendor/gifenc.js');
let encoder,width,height;
self.onmessage=event=>{try{
 const message=event.data;
 if(message.type==='start'){width=message.width;height=message.height;encoder=Gifenc.GIFEncoder();self.postMessage({ready:true});}
 else if(message.type==='frame'){const data=new Uint8Array(message.data),palette=Gifenc.quantize(data,256,{format:'rgb565'}),index=Gifenc.applyPalette(data,palette,'rgb565');encoder.writeFrame(index,width,height,{palette,delay:message.delay,repeat:0});self.postMessage({ready:true});}
 else if(message.type==='finish'){encoder.finish();const bytes=encoder.bytes();self.postMessage({bytes},[bytes.buffer]);encoder=null;}
}catch(error){self.postMessage({error:error.message})}};
