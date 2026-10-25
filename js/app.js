(()=>{'use strict';
const $=id=>document.getElementById(id),video=$('video'),preview=$('preview'),canvas=$('canvas'),native=$('native-camera'),view=$('camera-view'),msg=$('camera-msg');
let stream=null,shot=null,frame='classic',mode='web',facing='environment',seq=0,zoom=1,hardware=false,logo=null,pinch=0;
const cameraUI=on=>document.body.classList.toggle('camera-active',on);const visible=(id,on)=>{$(id).hidden=!on};const step=n=>document.querySelectorAll('[data-step]').forEach(el=>{const k=Number(el.dataset.step);el.classList.toggle('current',k===n);el.classList.toggle('done',k<n);el.setAttribute('aria-current',k===n?'step':'false')});const note=t=>{msg.textContent=t;msg.hidden=false};
const logoImage=new Image();logoImage.onload=()=>{logo=logoImage;if(shot)render()};logoImage.src='assets/logo-casamento.svg';
function stop(){seq++;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}video.pause();video.srcObject=null}
function home(){cameraUI(false);step(1);visible('initial-controls',true);visible('live-controls',false);visible('editing',false);video.hidden=true;preview.hidden=true}
function setZoom(v){zoom=Math.max(1,Math.min(3,Number(v)));$('zoom').value=zoom;$('zoom-value').textContent=zoom.toFixed(1)+'×';if(stream&&hardware){const track=stream.getVideoTracks()[0];const caps=track.getCapabilities?.().zoom;if(caps){const target=Math.max(caps.min,Math.min(caps.max,zoom));track.applyConstraints({advanced:[{zoom:target}]}).catch(()=>{hardware=false;video.style.transform='scale('+zoom+')'})}}else video.style.transform='scale('+zoom+')'}
async function start(){cameraUI(true);step(1);visible('welcome-actions',false);visible('photo-workspace',true);mode='web';stop();home();video.style.transform='';zoom=1;note('A abrir a câmara…');const id=seq;if(!navigator.mediaDevices?.getUserMedia){note('Este navegador não permite usar a câmara. Abre o site em HTTPS.');return}try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1440}},audio:false});if(id!==seq){s.getTracks().forEach(t=>t.stop());return}stream=s;video.srcObject=s;video.hidden=false;await video.play();if(id!==seq)return;const caps=s.getVideoTracks()[0].getCapabilities?.()||{};hardware=!!caps.zoom;visible('initial-controls',false);visible('live-controls',true);msg.hidden=true;setZoom(1);$('focus-help').textContent=caps.pointsOfInterest?'Toca na imagem para tentar focar. Usa dois dedos para zoom.':'Usa dois dedos para zoom. A focagem manual depende do telemóvel.'}catch(e){home();note('Não foi possível abrir a câmara: '+(e.name==='NotAllowedError'?'autoriza o acesso à câmara nas permissões do navegador.':e.name==='NotFoundError'?'não foi encontrada nenhuma câmara.':'tenta outro navegador ou a captura do telemóvel.'))}}
function setShot(c){cameraUI(false);step(2);visible('welcome-actions',false);visible('photo-workspace',true);shot=c;stop();video.style.transform='';video.hidden=true;visible('initial-controls',false);visible('live-controls',false);visible('editing',true);msg.hidden=true;render()}
function snap(){if(!stream||!video.videoWidth){note('Aguarda pela imagem da câmara.');return}const c=document.createElement('canvas');const w=video.videoWidth,h=video.videoHeight;c.width=w;c.height=h;const ctx=c.getContext('2d');if(!hardware&&zoom>1){const sw=w/zoom,sh=h/zoom;ctx.drawImage(video,(w-sw)/2,(h-sh)/2,sw,sh,0,0,w,h)}else ctx.drawImage(video,0,0,w,h);setShot(c)}
function openNative(){cameraUI(false);step(1);visible('welcome-actions',false);visible('photo-workspace',true);mode='native';stop();home();native.value='';native.click()}
native.addEventListener('change',()=>{const file=native.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){note('Não foi recebida uma fotografia válida.');return}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{const max=3000,k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*k));c.height=Math.max(1,Math.round(img.naturalHeight*k));c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);setShot(c)};img.onerror=()=>{URL.revokeObjectURL(url);note('Não foi possível ler esta fotografia. Experimenta a câmara integrada.')};img.src=url});
function openGallery(){step(1);stop();const input=$('gallery-input');input.value='';input.click()}
function readPhoto(file){if(!file)return;if(!file.type.startsWith('image/')){note('Seleciona uma imagem válida.');return}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{try{const max=3000,k=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*k));c.height=Math.max(1,Math.round(img.naturalHeight*k));c.getContext('2d').drawImage(img,0,0,c.width,c.height);setShot(c)}catch(e){note('Não foi possível processar a imagem.')}finally{URL.revokeObjectURL(url)}};img.onerror=()=>{URL.revokeObjectURL(url);note('Não foi possível abrir a fotografia.');visible('welcome-actions',false);visible('photo-workspace',true)};img.src=url}
$('gallery-input').addEventListener('change',e=>{const f=e.target.files?.[0];if(f){mode='gallery';readPhoto(f)}});
$('gallery-start').addEventListener('click',openGallery);
$('photo-start').addEventListener('click',()=>{visible('welcome-actions',false);visible('photo-workspace',true);start();$('photo-workspace').scrollIntoView({behavior:'smooth',block:'start'})});
$('back-home').addEventListener('click',()=>{stop();shot=null;home();visible('photo-workspace',false);visible('welcome-actions',true);note('Vamos guardar um momento especial?')});
function line(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function drawLogo(ctx,cx,cy,w,h){if(!logo)return;const ratio=560.71/407.6;const lw=Math.min(w,h*ratio),lh=lw/ratio;ctx.drawImage(logo,cx-lw/2,cy-lh/2,lw,lh)}
function words(ctx,s,x,y,size,color){ctx.textAlign='center';ctx.fillStyle=color;ctx.font='italic '+Math.round(size)+'px Georgia,serif';ctx.fillText(s,x,y)}
function render(){
 if(!shot)return;
 const w=shot.width,h=shot.height,unit=Math.min(w,h),landscape=w>h;
 canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');ctx.drawImage(shot,0,0,w,h);
 // Todas as dimensões dependem da fotografia real: vertical, horizontal ou quadrada.
 const footer=Math.round(Math.min(h*.27,Math.max(unit*.19,w*.135)));
 const gap=Math.max(4,Math.round(unit*.018));
 const textX=w*.68,logoX=w*.19;
 const titleSize=Math.max(10,Math.min(unit*.052,footer*.28,w*.082));
 const dateSize=Math.max(8,Math.min(unit*.028,footer*.17,w*.047));
 function caption(titleColor,dateColor){
   drawLogo(ctx,logoX,h-footer*.51,Math.min(w*.28,footer*.9),footer*.78);
   ctx.textAlign='center';ctx.textBaseline='middle';
   ctx.fillStyle=titleColor;ctx.font='italic '+Math.round(titleSize)+'px Georgia,serif';
   ctx.fillText('Daniela & Pedro',textX,h-footer*.59,w*.57);
   ctx.fillStyle=dateColor;ctx.font=Math.round(dateSize)+'px Georgia,serif';
   ctx.fillText('31 · 07 · 2027',textX,h-footer*.3,w*.5);
   ctx.textBaseline='alphabetic';
 }
 if(frame==='classic'){
   line(ctx,0,h-footer,w,footer,'#f6e8df');
   line(ctx,0,h-footer,w,Math.max(2,Math.round(unit*.005)),'#b27b5c');
   line(ctx,0,0,w,Math.max(2,Math.round(unit*.007)),'#b27b5c');
   caption('#8f6248','#8f6248');
 }else if(frame==='polaroid'){
   const edge=Math.min(unit*.055,h*.06);
   line(ctx,0,0,w,edge,'#fffaf6');line(ctx,0,0,edge,h,'#fffaf6');line(ctx,w-edge,0,edge,h,'#fffaf6');
   line(ctx,0,h-footer,w,footer,'#fffaf6');caption('#9b7058','#9b7058');
 }else if(frame==='minimal'){
   const pad=Math.max(3,unit*.035);
   ctx.strokeStyle='#fff4e9';ctx.lineWidth=Math.max(2,unit*.005);
   ctx.strokeRect(pad,pad,w-2*pad,h-2*pad);
   // Faixa opaca para garantir leitura sobre fotografias claras ou escuras.
   line(ctx,0,h-footer,w,footer,'#382c28');
   caption('#fff2e4','#fff2e4');
 }
 preview.src=canvas.toDataURL('image/jpeg',.9);
 preview.hidden=false;
 document.querySelectorAll('[data-frame]').forEach(button=>{const active=button.dataset.frame===frame;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))});
 $('frame-name').textContent={classic:'Moldura clássica em cobre e champanhe',polaroid:'Polaroid romântica',minimal:'Minimalista com monograma',none:'Fotografia sem moldura'}[frame];
}
function download(c,name){step(3);c.toBlob(blob=>{if(!blob){step(2);note('Não foi possível preparar o ficheiro.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000)},'image/jpeg',.93)}
$('start').addEventListener('click',start);$('native-start').addEventListener('click',openNative);$('flip').addEventListener('click',()=>{facing=facing==='environment'?'user':'environment';start()});$('snap').addEventListener('click',snap);$('close-camera').addEventListener('click',()=>{stop();home();visible('photo-workspace',false);visible('welcome-actions',true);note('Podes voltar a abrir a câmara ou escolher uma fotografia.');});$('zoom').addEventListener('input',e=>setZoom(e.target.value));$('retry').addEventListener('click',()=>{shot=null;home();note('Vamos tirar outra fotografia?');if(mode==='web')start();else if(mode==='gallery')openGallery();else openNative()});
view.addEventListener('click',async e=>{if(!stream)return;const track=stream.getVideoTracks()[0],caps=track.getCapabilities?.()||{};if(!caps.pointsOfInterest)return;const r=view.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;const ring=$('focus-ring');ring.style.left=(x*100)+'%';ring.style.top=(y*100)+'%';ring.hidden=false;setTimeout(()=>ring.hidden=true,750);try{await track.applyConstraints({advanced:[{pointsOfInterest:[{x,y}],focusMode:'single-shot'}]})}catch(err){/* focagem opcional */}});
view.addEventListener('touchstart',e=>{if(e.touches.length===2)pinch=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)}, {passive:true});view.addEventListener('touchmove',e=>{if(e.touches.length===2&&stream&&pinch){e.preventDefault();const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);setZoom(zoom*d/pinch);pinch=d}}, {passive:false});view.addEventListener('touchend',()=>pinch=0);
document.querySelectorAll('[data-frame]').forEach(b=>b.addEventListener('click',()=>{frame=b.dataset.frame;render()}));$('download-original').addEventListener('click',()=>shot&&download(shot,'daniela-pedro-original.jpg'));$('download-framed').addEventListener('click',()=>shot&&download(canvas,'daniela-pedro-moldura.jpg'));window.addEventListener('pagehide',stop);
})();