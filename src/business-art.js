import * as THREE from '../vendor/three.module.js?v=0.9.0';
import {sculpture} from './fun-art.js?v=0.9.0';
export function businessPiece(f,shape,color){
 const g=new THREE.Group(),b=(w,h,d,x,y,z,c=color)=>f.box(w,h,d,c,g,x,y,z);
 const add=(type,x=0,z=0,scale=1)=>{const m=sculpture(f,type,color);m.position.set(x,0,z);m.scale.setScalar(scale);g.add(m);return m;};
 if(shape==='arch'){b(.3,2.6,.4,-1.1,1.3,0);b(.3,2.6,.4,1.1,1.3,0);b(2.5,.6,.5,0,2.6,0);b(1.6,.25,.1,0,2.6,.28,'#FFFFFF');}
 else if(shape==='tables'){for(const z of [-.75,.75]){b(2,.15,.65,0,.85,z);b(.15,.8,.5,-.65,.4,z,'#8D99A6');b(.15,.8,.5,.65,.4,z,'#8D99A6');b(2,.16,.25,0,.45,z+.48,'#FFD23F');}}
 else if(shape==='van'||shape==='cars'){const count=shape==='cars'?2:1;for(let i=0;i<count;i++){const z=i*1.5-.5;b(2.4,.85,1,0,.65,z);b(1.5,.65,1,-.2,1.35,z);b(.8,.4,.04,.1,1.4,z+.52,'#69E6FF');for(const x of [-.8,.8])for(const dz of [-.53,.53])b(.4,.4,.16,x,.28,z+dz,'#2B1D0E');}if(shape==='van'){const m=add('cone');m.position.y=1.65;m.scale.setScalar(.65);}}
 else if(shape==='kiosk'){b(2,1.5,1.4,0,.75,0);b(2.5,.3,1.8,0,1.65,0,'#FFD23F');b(1.5,.65,.08,0,1,.73,'#69E6FF');b(1.7,.15,.5,0,.6,.8,'#FFFFFF');}
 else if(shape==='screen'){b(2.8,1.9,.25,0,1.8,0,'#2B1D0E');b(2.5,1.55,.05,0,1.85,.15,'#69E6FF');b(.3,1,.3,-1,.5,0);b(.3,1,.3,1,.5,0);const m=add('rocket',0,.2,.48);m.position.y=1.05;}
 else if(shape==='trail'){for(let i=0;i<5;i++)b(2.6,.12,.35,0,.12,(i-2)*.48,'#D9A86A');for(const x of [-1.2,1.2])b(.1,.7,2.6,x,.45,0);}
 else if(shape==='garden'){for(const x of [-.8,.8])for(const z of [-.7,.7]){b(.7,.25,.7,x,.15,z,'#D9A86A');b(.5,.5,.5,x,.5,z,'#7CD35B');b(.28,.25,.28,x,.85,z,color);}}
 else if(shape==='animals'){add('cat',-.7,0,.75);add('frog',.7,0,.75);}
 else if(shape==='carousel'){f.cylinder(1.3,.25,color,g,0,.2,0);b(.2,2,.2,0,1.2,0,'#8D99A6');f.cylinder(1.4,.25,'#FFD23F',g,0,2.25,0);const spin=new THREE.Group();spin.userData.spin=true;g.add(spin);for(let i=0;i<3;i++){const a=i*Math.PI*2/3,m=sculpture(f,'duck',color);m.scale.setScalar(.45);m.position.set(Math.cos(a)*.85,.35,Math.sin(a)*.85);spin.add(m);}}
 else {const m=add(shape,0,0,shape==='dino'?1.1:1);if(shape==='dino'||shape==='frog')m.userData.sway=true;}
 return g;
}
