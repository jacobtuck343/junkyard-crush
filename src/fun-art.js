import {batchStatic} from './static-batches.js?v=0.8.0';
import * as THREE from '../vendor/three.module.js?v=0.8.0';
import {DECORATIONS,DISPLAY_SPOTS,CRANE} from './fun-content.js?v=0.8.0';
// All sculpture parts reuse the scene's box/cylinder geometry and cached materials.
export function sculpture(f,shape,color){
 const g=new THREE.Group(),ink='#2B1D0E',white='#FFFFFF',yellow='#FFD23F';
 const b=(x,y,z,px=0,py=0,pz=0,c=color)=>f.box(x,y,z,c,g,px,py,pz);
 const c=(r,h,x,y,z,col=color,rot=0)=>f.cylinder(r,h,col,g,x,y,z,rot);
 const eyes=(y,z)=>{b(.14,.17,.06,-.24,y,z,ink);b(.14,.17,.06,.24,y,z,ink);};
 switch(shape){
 case 'robot': b(.95,1,.55,0,.8);b(.85,.65,.65,0,1.65);eyes(1.7,.35);for(const x of [-.65,.65])b(.25,.8,.3,x,.85);for(const x of [-.3,.3])b(.32,.45,.45,x,.22);break;
 case 'dino': b(.8,.85,1.5,0,.8);b(.6,1,.6,0,1.5,.65);b(.75,.5,.9,0,2,.95);for(const x of [-.5,.5])b(.3,.6,.55,x,.3);b(.4,.3,1,0,.65,-1);eyes(2,1.43);break;
 case 'duck':case 'frog':case 'cat':case 'penguin':b(1,1,.85,0,.65);b(.8,.65,.75,0,1.4);eyes(1.5,.4);if(shape==='duck')b(.6,.2,.4,0,1.25,.5,yellow);else if(shape==='cat')for(const x of [-.3,.3])b(.2,.35,.2,x,1.88);else for(const x of [-.55,.55])b(.4,.25,.7,x,.2,.2);break;
 case 'rocket':c(.5,1.7,0,1,0);c(.32,.45,0,2.05,0,yellow);for(const x of [-.6,.6])b(.3,.65,.6,x,.4);b(.4,.4,.05,0,1.3,.5,'#69E6FF');break;
 case 'ufo':c(1,.25,0,.65,0);c(.55,.55,0,1,0,'#69E6FF');for(const x of [-.65,.65])b(.16,.5,.16,x,.25);break;
 case 'cactus':b(.45,1.9,.45,0,1);for(const x of [-.6,.6]){b(.7,.3,.35,x,1);b(.25,.8,.35,x*1.4,1.3);}break;
 case 'rainbow':for(let i=0;i<7;i++){const angle=i*Math.PI/6;b(.4,.4,.45,Math.cos(angle),.3+Math.sin(angle),0,['#FF4D5A','#FF8748','#FFD23F','#7CD35B','#69E6FF','#3A86FF','#B58CFF'][i]);}break;
 case 'donut':for(let i=0;i<8;i++){const a=i*Math.PI/4;b(.48,.48,.45,Math.cos(a)*.62,.85+Math.sin(a)*.62,0,i%2?color:'#D9A86A');}break;
 case 'trophy':b(.8,.2,.8,0,.1,0,ink);c(.18,.65,0,.5,0,yellow);c(.65,.65,0,1.15,0,yellow);for(const x of [-.75,.75])b(.25,.5,.2,x,1.1,0,yellow);break;
 case 'hat':c(.85,.15,0,.1,0);for(let i=0;i<4;i++)c(.6-i*.12,.3,0,.3+i*.3,0);break;
 case 'cone':for(let i=0;i<3;i++)c(.15+i*.12,.3,0,.2+i*.3,0,'#D9A86A');c(.52,.5,0,1.1,0,color);break;
 case 'pizza':b(1.5,.25,1,0,.4,0,yellow);for(const x of [-.45,0,.45])c(.16,.04,x,.55,.1,'#FF4D5A');break;
 case 'banana':for(let i=0;i<4;i++)b(.4,.35,.55,(i-1.5)*.35,.3+Math.abs(i-1.5)*.23,0,yellow);break;
 case 'cake':c(.7,.55,0,.4,0);c(.73,.15,0,.75,0,white);b(.12,.6,.12,0,1.1,0,yellow);break;
 case 'burger':c(.7,.25,0,.25,0,'#D9A86A');c(.75,.15,0,.45,0,'#7CD35B');c(.7,.22,0,.63,0,ink);c(.7,.3,0,.87,0,'#D9A86A');break;
 case 'toaster':b(1,.8,.65,0,.5);for(const x of [-.25,.25])b(.3,.5,.2,x,1,0,'#D9A86A');break;
 case 'chest':b(1.2,.7,.8,0,.4);b(1.25,.16,.85,0,.85,0,yellow);b(.2,.3,.1,0,.65,.45,yellow);break;
 default:c(.65,1.1,0,.7,0);for(const x of [-.35,.35])b(.2,.65,.1,x,.7,.6,white);
 }
 return g;
}
export function installFunArt(yard){
 const root=new THREE.Group();yard.scene.add(root);let signature='',burstLife=0,burstShape='';const confetti=new THREE.Group();root.add(confetti);
 const crane=new THREE.Group();root.add(crane);crane.position.set(CRANE.x,0,-5);
 yard.box(1.8,.3,1.8,'#FFD23F',crane,0,.15,0);yard.box(.5,3.5,.5,'#8D99A6',crane,0,1.9,0);
 const arm=yard.box(.25,.25,1,'#FFD23F',root),rope=yard.box(.06,1,.06,'#2B1D0E',root),magnet=new THREE.Group();root.add(magnet);yard.cylinder(.55,.25,'#FF4D5A',magnet,0,0,0);const load=yard.box(.85,.5,.85,'#69E6FF',magnet,0,-.4,0);
 const controlPad=new THREE.Group();root.add(controlPad);yard.box(1.5,.04,1.5,'#FFD23F',controlPad,CRANE.x,.09,CRANE.z);const label=yard.text('MAGNET',1.4,'#2B1D0E');label.rotation.x=-Math.PI/2;label.position.set(CRANE.x,.12,CRANE.z);controlPad.add(label);
 const displays=new THREE.Group();root.add(displays);const center=new THREE.Vector3(CRANE.x,3.7,-5),end=new THREE.Vector3(),direction=new THREE.Vector3();
 return{burst(def){if(!def.special)return;if(burstShape!==def.specialShape){confetti.clear();burstShape=def.specialShape;for(let i=0;i<3;i++){const piece=sculpture(yard,def.specialShape,def.specialColor);piece.scale.setScalar(.25);confetti.add(piece);}}burstLife=yard.settings.reduced?.35:1;},update(model,dt=0){
 burstLife=Math.max(0,burstLife-dt);confetti.visible=burstLife>0;confetti.children.forEach((p,i)=>{const age=1-burstLife;p.position.set((i-1)*age*3,.8+Math.sin(age*Math.PI)*2,-3.7+age*(i%2?2:-2));p.rotation.set(age*3,age*4,age);});const s=model.save,key=s.decorSlots.join('|')+'|'+s.landOwned;if(signature!==key){signature=key;displays.traverse(m=>{if(m.isInstancedMesh)m.dispose();});displays.clear();s.decorSlots.forEach((id,i)=>{const d=DECORATIONS.find(x=>x.id===id);if(!d||(i>=6&&!s.landOwned))return;const pos=DISPLAY_SPOTS[i],g=sculpture(yard,d.shape,d.color);g.scale.setScalar(.8);g.position.set(pos.x,0,pos.z);displays.add(g);yard.box(1.8,.12,1.8,'#8D99A6',g,0,0,0);batchStatic(g,[yard.boxGeometry,yard.cylinderGeometry]);});batchStatic(displays,[yard.boxGeometry,yard.cylinderGeometry]);}
 controlPad.visible=crane.visible=arm.visible=rope.visible=magnet.visible=s.craneOwned;if(!s.craneOwned)return;
 const t=1-s.craneTimer/2;let x=13,z=-2;
 if(s.craneMode==='pickup'){x=3+(13-3)*t;z=1+(-2-1)*t;}else if(s.craneMode==='drop'){x=13;z=-2;}
 end.set(x,3.7,z);direction.subVectors(end,center);arm.position.copy(center).add(end).multiplyScalar(.5);arm.scale.z=direction.length();arm.rotation.y=Math.atan2(direction.x,direction.z);
 const height=s.craneMode==='drop'?2.8-Math.sin(t*Math.PI)*1.5:2.8;magnet.position.set(x,height,z);rope.position.set(x,(3.7+height)/2,z);rope.scale.y=3.7-height;load.visible=s.craneCargo>0;
 }};
}

export function decorationPreviews(yard,items){const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setSize(128,128);renderer.setPixelRatio(1);const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,20);camera.position.set(3,2.8,4);camera.lookAt(0,.9,0);scene.add(new THREE.HemisphereLight(0xffffff,0xd9a86a,2.5));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(-3,5,4);scene.add(sun);const result={};try{for(const d of items){const mesh=sculpture(yard,d.shape,d.color);scene.add(mesh);renderer.render(scene,camera);result[d.id]=renderer.domElement.toDataURL('image/png');scene.remove(mesh);}}finally{renderer.dispose();renderer.forceContextLoss();}return result;}
