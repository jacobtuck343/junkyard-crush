import {sculpture} from './fun-art.js?v=0.8.0';
import * as THREE from '../vendor/three.module.js?v=0.8.0';
import {PALETTE,vehicleColor} from './visual-style.js?v=0.8.0';

// Recipes share geometry/materials through the scene factory. Add a recipe, not a new renderer.
export function buildVehicle(factory,def){
 const group=new THREE.Group(),shell=new THREE.Group();group.add(shell);group.userData={definition:def,shell};
 const color=vehicleColor(def),dark=new THREE.Color(color).multiplyScalar(.64).getStyle(),length=def.length,width=['bus','truck','surplus','tank'].includes(def.kind)?1.65:1.45;
 const box=(x,y,z,c,px=0,py=0,pz=0)=>factory.box(x,y,z,c,shell,px,py,pz);
 const cabin=(z,h=.65,l=1.2)=>{box(width*.85,h,l,color,0,1.02+h*.15,z);box(width*.7,h*.5,.04,PALETTE.window,0,1.16+h*.15,z+l/2+.025);for(const x of [-width*.43,width*.43])box(.04,h*.5,l*.62,PALETTE.window,x,1.16+h*.15,z);};
 box(width,.48,length,color,0,.62);box(width*.9,.16,length*.9,PALETTE.ink,0,.36);
 const recipes={
  car:()=>cabin(-.12,.62,length*.43),
  pickup:()=>{cabin(length*.23,.68,1.1);box(width*.84,.06,length*.42,PALETTE.shade,0,.88,-length*.25);for(const x of [-width*.45,width*.45])box(.14,.34,length*.49,color,x,1,-length*.23);box(width,.33,.12,color,0,1,-length*.47);},
  van:()=>{box(width*.92,1.08,length*.8,color,0,1.3,-.1);box(width*.73,.45,.04,PALETTE.window,0,1.48,length*.4-.07);for(const x of [-width*.47,width*.47])box(.04,.45,.6,PALETTE.window,x,1.48,length*.24);},
  truck:()=>{cabin(length*.33,.8,1.1);box(width,1.38,length*.64,color,0,1.42,-length*.18);for(const x of [-width*.51,width*.51])box(.04,.2,length*.54,PALETTE.yellow,x,1.3,-length*.2);},
  bus:()=>{box(width*.94,1.05,length*.9,color,0,1.28);box(width*.8,.46,.04,PALETTE.window,0,1.48,length*.45+.025);for(const x of [-width*.48,width*.48])for(let i=0;i<6;i++)box(.04,.44,.46,PALETTE.window,x,1.48,-length*.34+i*length*.135);for(const x of [-width*.49,width*.49])box(.04,.13,length*.85,PALETTE.ink,x,1);},
  surplus:()=>{box(width,.7,length*.8,color,0,1.05);cabin(.55,.55,1.45);for(const x of [-width*.52,width*.52])box(.14,.3,length*.8,dark,x,.93);},
  tank:()=>{box(width+.2,.45,length*.75,color,0,1);box(1,.48,1.1,color,0,1.45);box(.22,.22,1.2,dark,0,1.5,1);for(const x of [-width*.55,width*.55])box(.42,.55,length,PALETTE.ink,x,.4);},
  plane:()=>{box(.75,.5,length,color,0,1);box(length*.95,.15,.9,color,0,.9);box(1.4,.12,.55,color,0,1.1,-length*.38);box(.15,.65,.6,color,0,1.4,-length*.37);box(.55,.3,.65,PALETTE.window,0,1.36,.45);box(1.45,.12,.1,PALETTE.ink,0,1,length*.51);}
 };
 (recipes[def.kind]??recipes.car)();
 if(!['tank','plane'].includes(def.kind))for(const x of [-width/2-.08,width/2+.08])for(const z of [-length*.32,length*.32])factory.cylinder(.34,.24,PALETTE.ink,shell,x,.34,z,Math.PI/2);
 for(const x of [-width*.3,width*.3])box(.26,.19,.06,'#FFF4BE',x,.72,length/2+.025);
 // Cheap darker patches vary deterministically by model and remain stable across reloads.
 for(let i=0;i<2;i++){const side=i?1:-1;const patch=box(.035,.17,.35,dark,side*(width/2+.025),.68,(i-.5)*length*.42);patch.rotation.x=(i-.5)*.18;}
 if(def.county)for(const x of [-width*.51,width*.51])box(.04,.13,length*.72,PALETTE.yellow,x,.95,-.1);
 if(def.rarity==='Rare'){const diamond=box(.32,.32,.32,'#69E6FF',0,2.35);diamond.rotation.z=Math.PI/4;}
 if(def.special){const topper=sculpture(factory,def.specialShape,def.specialColor);topper.scale.setScalar(.6);topper.position.y=['bus','truck','van'].includes(def.kind)?1.95:1.55;shell.add(topper);}
 const salvage=factory.box(.5,.2,.45,'#FFD23F',shell,0,.98,length*.36);group.userData.salvage=salvage;
 const bale=factory.box(1.4,.3,1.45,color,group,0,.33,0);bale.visible=false;group.userData.bale=bale;
 return group;
}
