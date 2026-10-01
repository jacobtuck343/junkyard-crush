import {GATE,forecastDeliveries,gatePose} from './delivery-gate.js';
import * as THREE from '../vendor/three.module.js';
import {CONFIG} from './config.js';
import {PALETTE,styleColor} from './visual-style.js';
import {buildVehicle} from './vehicle-builder.js';
import {batchStatic} from './static-batches.js';
export class YardScene {
  constructor(canvas, settings) {
    this.settings=settings;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,settings.reduced?1:1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.setClearColor(PALETTE.fog);this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.scene=new THREE.Scene();this.scene.fog=new THREE.Fog(PALETTE.fog,60,120);this.camera=new THREE.PerspectiveCamera(35,1,.1,100);this.target=new THREE.Vector3(0,0,0);this.shake=0;this.time=0;this.popTime=0;
    this.scene.add(new THREE.HemisphereLight(0xfff5e4,0xbb9c77,2));const sun=new THREE.DirectionalLight(0xffedcb,2.5);sun.position.set(-8,18,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-19,right:19,top:19,bottom:-19,near:1,far:50});sun.shadow.normalBias=.035;sun.shadow.bias=-.0003;this.scene.add(sun);
    this.materials=new Map();this.boxGeometry=new THREE.BoxGeometry(1,1,1);this.cylinderGeometry=new THREE.CylinderGeometry(1,1,1,6);this.particles=[];this.rewardBits=[];
    this.gateQueue=[];this.gateAdvance=0;this.buildYard();this.buildGate();this.buildCrusher();this.buildOperations();this.buildCounty();this.buildPlayer();this.buildForklift();this.vehicle=this.buildVehicle(CONFIG.vehicles[0]);this.scene.add(this.vehicle);this.vehicle.position.set(CONFIG.spawn.x,0,CONFIG.spawn.z);
    const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),this.mat(PALETTE.shade),8),rockTransform=new THREE.Object3D();rocks.castShadow=true;rocks.receiveShadow=true;
    for(let i=0;i<8;i++){rockTransform.position.set(-15+i*4.6,.1,-11-i%2);rockTransform.scale.set(.45+i%3*.12,.35,.5);rockTransform.rotation.set(.2*i,.7*i,0);rockTransform.updateMatrix();rocks.setMatrixAt(i,rockTransform.matrix);}this.scene.add(rocks);
    const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);this.rope=new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xd6c395}));this.scene.add(this.rope);this.rope.visible=false;
    for(let i=0;i<CONFIG.particleBudget;i++){const mesh=this.box(.12,.12,.12,i%3===0?'#ffc465':i%3===1?'#a5aaa0':'#6c7568');mesh.visible=false;this.scene.add(mesh);this.particles.push({mesh,life:0,v:new THREE.Vector3()});}
    for(let i=0;i<12;i++){const mesh=this.box(.25,.08,.18,'#e5d685');mesh.visible=false;this.scene.add(mesh);this.rewardBits.push({mesh,life:0});}
    this.dust=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({color:'#F6E3C4',transparent:true,opacity:.65,flatShading:true,depthWrite:false}),12);this.dust.visible=false;this.scene.add(this.dust);this.dustTime=0;this.dustMatrix=new THREE.Object3D();
    const exclude=new Set([...this.eastFence,...this.stock,...this.particles.map(p=>p.mesh),...this.rewardBits.map(p=>p.mesh),this.vehicle,this.ring]);
    batchStatic(this.scene,[this.boxGeometry,this.cylinderGeometry],exclude);for(const root of [this.extension,this.county,this.depot,this.jobBoard,this.landSign])batchStatic(root,[this.boxGeometry,this.cylinderGeometry]);
    addEventListener('resize',()=>this.resize());this.resize();
  }
  mat(color){color=styleColor(color);if(!this.materials.has(color))this.materials.set(color,new THREE.MeshStandardMaterial({color,flatShading:true,roughness:1,metalness:0}));return this.materials.get(color);}
  box(x,y,z,color,parent=null,px=0,py=0,pz=0){const m=new THREE.Mesh(this.boxGeometry,this.mat(color));m.scale.set(x,y,z);m.position.set(px,py,pz);m.castShadow=y>.12&&x<10;m.receiveShadow=true;if(parent)parent.add(m);return m;}
  cylinder(r,h,color,parent,x,y,z,rotation=0){const m=new THREE.Mesh(this.cylinderGeometry,this.mat(color));m.scale.set(r,h,r);m.position.set(x,y,z);m.rotation.z=rotation;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  text(text,width,color='#f7e8be',background=null){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(background){ctx.fillStyle=background;ctx.fillRect(0,0,1024,256);}ctx.fillStyle=color;ctx.font='900 92px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128,990);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),new THREE.MeshBasicMaterial({map:tex,transparent:!background,side:THREE.DoubleSide}));return mesh;}
  buildYard(){
    this.box(180,.4,180,'#a2b09a',this.scene,0,-.65,0);this.box(22,.5,19,'#8f8264',this.scene,0,-.3,.1);this.box(21.4,.07,18.4,'#ac9c77',this.scene,0,-.025,.1);
    this.box(4.7,.035,11,'#b6a983',this.scene,-3.1,.02,1);this.box(6,.07,5.8,'#777e6a',this.scene,0,.02,-3.6);
    // Ground wear is deterministic and uses shared geometry/materials.
    let seed=39;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<105;i++){const x=rand()*20-10,z=rand()*17-8;const mesh=this.box(.1+rand()*.5,.015,.1+rand()*.4,i%3?'#a29471':'#9c8d6e',this.scene,x,.025,z);mesh.rotation.y=rand()*6;mesh.castShadow=false;}
    this.eastFence=[];for(let z=-7.8;z<=8;z+=1.7)for(const x of [-10.4,10.4]){if(x<0&&z>.5&&z<5.8)continue;const post=this.box(.12,1.2,.12,'#6f7969',this.scene,x,.6,z),panel=this.box(.08,.65,1.64,'#879584',this.scene,x,.52,z+.8);if(x>0)this.eastFence.push(post,panel);}
    for(let x=-10.4;x<10.4;x+=1.7){this.box(.12,1.2,.12,'#687565',this.scene,x,.6,-8.5);this.box(1.64,.65,.08,'#899883',this.scene,x+.8,.5,-8.5);}
    const shack=new THREE.Group();shack.position.set(-7,0,-5.7);this.scene.add(shack);this.box(3.3,2.3,2.6,'#42665b',shack,0,1.15,0);this.box(3.7,.18,2.95,'#344f46',shack,0,2.4,0);this.box(.83,1.5,.05,'#34493e',shack,-.8,.77,1.33);this.box(1.2,.65,.06,'#a7c0ae',shack,.65,1.4,1.34);this.box(.05,.68,.04,'#e2d2a6',shack,.65,1.4,1.39);this.box(1.25,.05,.04,'#e2d2a6',shack,.65,1.4,1.39);
    const sign=this.text('RUSTBUCKET',2.9,'#f7e4b5','#2f4b40');sign.position.set(0,2.05,1.36);shack.add(sign);
    for(let i=0;i<7;i++){this.cylinder(.36,.32,'#374740',this.scene,-8+(i%3)*.72,.18+Math.floor(i/3)*.3,-1.6);}
    for(let i=0;i<4;i++){this.cylinder(.34,.85,i%2?'#b77742':'#597a6a',this.scene,7.8+(i%2)*.85,.45,-6.4+Math.floor(i/2)*.9);this.cylinder(.355,.045,'#d7b87b',this.scene,7.8+(i%2)*.85,.69,-6.4+Math.floor(i/2)*.9);}
    for(let i=0;i<5;i++){const pile=this.box(1.5,.4,.85,['#9e6446','#778d78','#a38c59'][i%3],this.scene,6.8+(i%2),.3+Math.floor(i/2)*.4,5.7);pile.rotation.y=i*.4;}
    this.box(3,.045,2.8,'#cbd18b',this.scene,CONFIG.upgrade.x,.06,CONFIG.upgrade.z);
    for(const x of [-1.48,1.48])this.box(.075,.04,2.9,'#f1edb3',this.scene,CONFIG.upgrade.x+x,.095,CONFIG.upgrade.z);
    for(const z of [-1.4,1.4])this.box(3,.04,.075,'#f1edb3',this.scene,CONFIG.upgrade.x,.095,CONFIG.upgrade.z+z);
    const arrow=this.text('↑ ↑',1.7,'#496e40');arrow.rotation.x=-Math.PI/2;arrow.position.set(CONFIG.upgrade.x,.115,CONFIG.upgrade.z);this.scene.add(arrow);
    const delivery=this.text('TO THE PRESS',2.1,'#ebddb2');delivery.rotation.x=-Math.PI/2;delivery.position.set(-3.2,.07,4.9);this.scene.add(delivery);
    for(let z=1;z>-2.7;z-=1){const a=this.text('▲',.65,'#e6edb3');a.rotation.x=-Math.PI/2;a.position.set(0,.11,z);this.scene.add(a);}
    this.extension=new THREE.Group();this.scene.add(this.extension);this.extension.visible=false;
    this.box(7.5,.5,19,'#7c826c',this.extension,14.1,-.3,.1);this.box(7.5,.07,18.4,'#b9b797',this.extension,14.1,-.025,.1);
    for(let z=-7.8;z<=8;z+=1.7){this.box(.12,1.2,.12,'#647965',this.extension,17.9,.6,z);this.box(.08,.65,1.64,'#829783',this.extension,17.9,.52,z+.8);}
    for(let x=10.5;x<18;x+=1.7){this.box(1.6,.65,.08,'#829783',this.extension,x,.5,-8.5);}
    for(const z of [-4,1]){this.box(5.5,.04,.08,'#eee0a1',this.extension,14,.07,z);for(const x of [11.3,16.7])this.box(.08,.04,4,'#eee0a1',this.extension,x,.07,z+2);}
    const receiving=this.text('HEAVY RECEIVING',5,'#657b63');receiving.rotation.x=-Math.PI/2;receiving.position.set(14,.09,6);this.extension.add(receiving);
    this.landSign=new THREE.Group();this.scene.add(this.landSign);const future=this.text('EAST LOT / $400',3.5,'#dce4bb','#61765a');future.position.set(14,1.5,-1.8);this.landSign.add(future);this.box(.12,1.7,.12,'#5c7056',this.landSign,12.5,.85,-1.8);this.box(.12,1.7,.12,'#5c7056',this.landSign,15.5,.85,-1.8);
    this.landPad=new THREE.Group();this.scene.add(this.landPad);this.box(2,.06,2,'#f0c67a',this.landPad,CONFIG.land.x,.08,CONFIG.land.z);const plus=this.text('+',1.6,'#726335');plus.rotation.x=-Math.PI/2;plus.position.set(CONFIG.land.x,.12,CONFIG.land.z);this.landPad.add(plus);
    for(let i=0;i<8;i++){const x=-18+i*5,z=-15-(i%2)*2;this.cylinder(.2,2.3,'#776c50',this.scene,x,.8,z);const crown=new THREE.Mesh(new THREE.ConeGeometry(1.7,4,6),this.mat(i%2?'#6e8e70':'#779775'));crown.position.set(x,3,z);crown.castShadow=true;this.scene.add(crown);}
  }
  buildGate(){
    this.box(4.7,.12,23,PALETTE.shade,this.scene,-12.8,-.06,-4.5);
    this.box(4.6,.04,5.3,PALETTE.dirt,this.scene,-10.6,.03,3.6);
    for(let i=0;i<7;i++)this.box(.12,.035,1.4,PALETTE.yellow,this.scene,-14.7,.025,6-i*3.2);
    for(const z of [.55,6.35]){this.box(.3,2.6,.3,PALETTE.metal,this.scene,-10.4,1.3,z);this.box(.46,.18,.46,PALETTE.yellow,this.scene,-10.4,2.65,z);}
    const sign=this.text('PICKUP GATE',3.5,PALETTE.yellow,PALETTE.ink);sign.position.set(-10.4,3.2,3.5);sign.rotation.y=Math.PI/2;this.scene.add(sign);
    const arrow=this.text('→',1.8,PALETTE.yellow);arrow.rotation.x=-Math.PI/2;arrow.position.set(-9.5,.09,3.5);this.scene.add(arrow);
  }
  resetGateQueue(save,def,advance=false){
    for(const mesh of this.gateQueue){this.scene.remove(mesh);mesh.traverse(part=>{if(part.isInstancedMesh)part.dispose();});}
    this.gateQueue=forecastDeliveries(save,def).slice(1,advance?4:3).map((vehicle,index)=>{const mesh=this.buildVehicle(vehicle);batchStatic(mesh.userData.shell,[this.boxGeometry,this.cylinderGeometry]);mesh.position.set(GATE.x,0,GATE.z-(index+1)*GATE.spacing);this.scene.add(mesh);return mesh;});
    this.gateAdvance=advance?GATE.seconds:0;this.gateAdvanced=advance;
  }
  advanceGateQueue(save,def){this.resetGateQueue(save,def,true);}
  updateGate(dt){
    this.gateAdvance=Math.max(0,this.gateAdvance-dt);
    if(!this.gateAdvanced)return;
    this.gateQueue.forEach((mesh,index)=>{const pose=gatePose(index,1-this.gateAdvance/GATE.seconds,this.settings.reduced);mesh.position.set(pose.x,pose.y,pose.z);mesh.scale.setScalar(pose.scale);});
  }
  buildOperations(){
    this.jobBoard=new THREE.Group();this.scene.add(this.jobBoard);this.jobBoard.position.set(-5.6,0,-1.4);
    this.box(2.8,.06,2.4,'#85b5b2',this.jobBoard,0,.05,0);this.box(1.6,1,.15,'#3c706d',this.jobBoard,0,1.7,-.8);
    for(const x of [-.65,.65])this.box(.1,1.7,.12,'#506d60',this.jobBoard,x,.85,-.8);
    const sign=this.text('MARA / JOBS',1.4);sign.position.set(0,1.7,-.71);this.jobBoard.add(sign);
    this.box(.5,.7,.4,'#b6794c',this.jobBoard,1,.8,-.1);this.box(.35,.35,.35,'#d8aa7c',this.jobBoard,1,1.33,-.1);this.cylinder(.3,.14,'#5b7c76',this.jobBoard,1,1.57,-.1);
    this.baler=new THREE.Group();this.baler.position.set(13,0,-2);this.scene.add(this.baler);
    this.box(4,.18,3.4,'#667e71',this.baler,0,.1,0);this.box(2.5,.7,2,'#548f89',this.baler,0,.6,0);for(const x of [-1.3,1.3])this.box(.2,1.6,2,'#346563',this.baler,x,1.1,0);
    this.balerRam=this.box(2.4,.25,1.85,'#d0ba69',this.baler,0,1.6,0);this.box(.7,1.1,1.2,'#37655b',this.baler,1.9,.7,0);
    const badge=this.text('BALER / 02',2.4);badge.position.set(0,1.2,1.05);this.baler.add(badge);
    this.worker=new THREE.Group();this.scene.add(this.worker);this.box(.5,.7,.4,'#5a8ca3',this.worker,0,.8,0);this.box(.35,.35,.35,'#c49c76',this.worker,0,1.33,0);this.cylinder(.3,.15,'#e0e8cb',this.worker,0,1.58,0);for(const x of [-.16,.16])this.box(.2,.42,.3,'#344f4c',this.worker,x,.26,0);
    this.workerLoad=this.box(.65,.42,.65,'#ad956d',this.worker,0,.8,.5);
    this.stock=[];for(let i=0;i<8;i++)this.stock.push(this.box(.6,.4,.6,'#9d9676',this.scene,10.9+(i%2)*.7,.25+Math.floor(i/4)*.42,-4.2+Math.floor(i%4/2)*.7));
    this.depot=new THREE.Group();this.scene.add(this.depot);this.box(19,.5,5.3,'#85876d',this.depot,7.6,-.3,11.9);this.box(19,.07,5.3,'#b6b293',this.depot,7.6,-.025,11.9);
    for(let x=-1.5;x<17;x+=1.7)this.box(1.6,.6,.1,'#6b8270',this.depot,x,.35,14.5);
    for(let i=0;i<4;i++){this.box(2,1.3,2.5,i%2?'#577f7a':'#b79a57',this.depot,2+i*3,.7,12.4);this.box(2.04,.12,2.54,'#d9d7b0',this.depot,2+i*3,1.42,12.4);}
    const depotSign=this.text('SOUTH DEPOT',5,'#466856');depotSign.rotation.x=-Math.PI/2;depotSign.position.set(7,.1,10.1);this.depot.add(depotSign);
    this.projectMarker=this.text('YARD PROJECTS',2.8,'#fff0bd','#7b673e');this.projectMarker.position.set(CONFIG.land.x,1.5,CONFIG.land.z);this.scene.add(this.projectMarker);
  }
  buildCounty(){
    this.county=new THREE.Group();this.scene.add(this.county);this.county.visible=false;
    this.box(28,.035,18,'#839391',this.county,3.6,.1,0);this.box(6,.04,12,'#627a7b',this.county,-3.2,.13,1);
    this.box(3,.04,2.8,'#cbd18b',this.county,CONFIG.upgrade.x,.17,CONFIG.upgrade.z);this.box(2.8,.04,2.4,'#85b5b2',this.county,-5.6,.17,-1.4);this.box(2,.04,2,'#d5bd79',this.county,CONFIG.land.x,.17,CONFIG.land.z);
    for(let z=-4;z<7;z+=1.8)this.box(.14,.02,.8,'#e8dfb6',this.county,-.8,.16,z);
    this.box(4.2,3.1,3.6,'#607f87',this.county,-7,1.55,-5.7);this.box(4.5,.18,3.9,'#344e5d',this.county,-7,3.18,-5.7);this.box(2.7,1.9,.06,'#aababb',this.county,-7,1.05,-3.86);
    for(let i=0;i<7;i++)this.box(2.65,.035,.025,'#7b9497',this.county,-7,.3+i*.24,-3.82);
    const sign=this.text('COUNTY WORKS',3.7,'#f2e8c4','#344d5d');sign.position.set(-7,2.58,-3.83);this.county.add(sign);
    for(let i=0;i<3;i++){const x=9+i*2.5;this.box(2.2,1.9,3.3,i%2?'#9c754d':'#557a8e',this.county,x,1,-6);for(let j=0;j<5;j++)this.box(.06,1.8,.04,'#b6b69a',this.county,x-1+j*.5,1,-4.33);}
    for(const x of [10,16])this.box(.28,4.8,.3,'#c9ac62',this.county,x,2.4,-5.2);this.box(6.3,.35,.45,'#d7b46a',this.county,13,4.7,-5.2);this.box(.06,1.5,.06,'#3c5556',this.county,13,3.9,-5.2);this.box(.4,.16,.2,'#455c5e',this.county,13,3.13,-5.2);
    const lanes=this.text('COUNTY SERVICE / RECEIVING',6,'#e9e0b8');lanes.rotation.x=-Math.PI/2;lanes.position.set(11,.17,5.5);this.county.add(lanes);
    const legacy=this.text('COUNTY / 02',2.7,'#e9e2c5','#476c7e');legacy.position.set(0,3.5,-3.85);this.county.add(legacy);
  }
  buildCrusher(){
    this.crusher=new THREE.Group();this.crusher.position.set(0,0,CONFIG.crusher.z);this.scene.add(this.crusher);const g=this.crusher;
    this.box(4.2,.4,3.65,'#314b43',g,0,.2,0);this.box(3.25,.12,3.1,'#798d7b',g,0,.47,0);
    for(const x of [-1.75,1.75]){this.box(.4,3.6,.45,'#dc7540',g,x,1.8,-.9);this.box(.5,.2,.6,'#f3af58',g,x,3.65,-.9);this.cylinder(.12,2.7,'#c3c9b1',g,x,1.85,.85);this.box(.44,.7,.5,'#dc7540',g,x,.65,.85);}
    this.box(4, .55,1.05,'#df7a3d',g,0,3.5,-.7);this.cylinder(.28,1.2,'#b9c3ae',g,0,2.7,-.65);
    this.press=new THREE.Group();g.add(this.press);this.press.position.y=2.5;this.box(3.3,.5,2.8,'#e99345',this.press,0,0,0);this.box(3.35,.15,2.83,'#354b3c',this.press,0,-.25,0);
    for(let i=0;i<7;i++){const stripe=this.box(.25,.36,.024,'#343e31',this.press,-1.35+i*.46,.02,1.413);stripe.rotation.z=-.35;}
    this.box(.6,.85,.65,'#426654',g,2.3,.6,.55);this.cylinder(.09,.12,'#d4f49a',g,2.3,1.07,.55);this.box(.5,.16,.4,'#223b34',g,2.3,1.05,.1);
    this.upgradeFins=[];for(let i=0;i<5;i++){const fin=this.box(.6,.24,.9,'#f4ca69',g,2.05,.35+i*.31,-1);fin.visible=false;this.upgradeFins.push(fin);}
    const badge=this.text('CRUSH / 01',2.5,'#fff0c2');badge.position.set(0,3.48,-.16);g.add(badge);
    this.ring=new THREE.Mesh(new THREE.RingGeometry(2.0,2.08,40),new THREE.MeshBasicMaterial({color:0xe4e99d,side:THREE.DoubleSide,transparent:true,opacity:.7}));this.ring.rotation.x=-Math.PI/2;this.ring.position.set(0,.09,-1.4);this.scene.add(this.ring);
  }
  buildPlayer(){
    this.player=new THREE.Group();this.scene.add(this.player);this.player.position.set(CONFIG.playerStart.x,0,CONFIG.playerStart.z);
    this.body=new THREE.Group();this.player.add(this.body);this.box(.52,.58,.34,'#3e7276',this.body,0,.85,0);this.box(.44,.14,.39,'#d4a65d',this.body,0,1.13,0);this.box(.37,.35,.35,'#dcac75',this.body,0,1.36,0);this.cylinder(.3,.16,'#f3c255',this.body,0,1.56,0);this.box(.7,.065,.48,'#f6ce68',this.body,0,1.5,.02);this.box(.23,.23,.025,'#2d4d4c',this.body,0,.89,.18);
    this.legs=[];for(const x of [-.16,.16]){const leg=this.box(.2,.42,.22,'#294e54',this.body,x,.39,0);this.legs.push(leg);this.box(.23,.18,.35,'#34463b',leg,0,-.43,.15);this.box(.17,.5,.22,'#dcac75',this.body,x*2,.87,0);}
  }
  buildForklift(){
    this.forklift=new THREE.Group();this.player.add(this.forklift);this.forklift.visible=false;
    const g=this.forklift;this.box(1.25,.65,1.45,'#d9a247',g,0,.45,-.3);this.box(1.12,.5,.45,'#697962',g,0,.8,-.95);this.box(.5,.5,.42,'#33473e',g,0,.75,0);
    for(const x of [-.69,.69])for(const z of [-.8,.5])this.cylinder(.32,.2,'#2e4039',g,x,.32,z,Math.PI/2);
    for(const x of [-.43,.43]){this.box(.13,1.95,.16,'#465952',g,x,1,.73);this.box(.15,.12,1.3,'#a2af99',g,x,.19,1.35);this.box(.09,1.5,.09,'#364b40',g,x,1.2,-.6);}
    this.box(1.14,.12,1.1,'#e2b650',g,0,1.99,-.25);this.box(.95,.14,.18,'#869583',g,0,.4,.76);
    this.loaderReinforcement=this.box(1.5,.26,.5,'#718a70',g,0,.6,-1);this.loaderReinforcement.visible=false;
  }
  buildVehicle(def){return buildVehicle(this,def);}
  spawn(def,save){this.scene.remove(this.vehicle);this.vehicle=this.buildVehicle(def);this.scene.add(this.vehicle);this.vehicle.position.set(CONFIG.spawn.x,0,CONFIG.spawn.z);if(save)this.resetGateQueue(save,def);}
  burst(perfect){this.dustTime=this.settings.reduced?0:.7;this.shake=perfect?.22:.12;let i=0;for(const p of this.particles){if(i++>(this.settings.reduced?10:perfect?45:25))break;p.life=.5+Math.random()*.8;p.mesh.visible=true;p.mesh.position.set((Math.random()-.5)*2,.8,CONFIG.crusher.z+(Math.random()-.5)*2);p.v.set((Math.random()-.5)*6,2+Math.random()*5,(Math.random()-.5)*6);p.mesh.rotation.set(Math.random()*3,Math.random()*3,0);}}
  pop(){this.popTime=.3;}
  reward(){for(let i=0;i<this.rewardBits.length;i++){const p=this.rewardBits[i];p.life=.7+i*.04;p.mesh.visible=true;p.mesh.position.set((Math.random()-.5)*2,1+Math.random(),CONFIG.crusher.z+Math.random()*2);}}
  resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;const portrait=w/h<.85;this.camera.fov=portrait?44:35;const distance=portrait?46:31;this.cameraBase=new THREE.Vector3(distance*.47,distance*.9,distance*.69);this.camera.position.copy(this.cameraBase);this.camera.lookAt(0,0,-.6);this.camera.updateProjectionMatrix();}
  project(x,y,z){const p=new THREE.Vector3(x,y,z).project(this.camera);return{x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight};}
  update(dt,model,moving){
    this.updateGate(dt);this.popTime=Math.max(0,this.popTime-dt);this.player.scale.setScalar(1+(this.settings.reduced?0:Math.sin(this.popTime/.3*Math.PI)*.1));
    this.dustTime=Math.max(0,this.dustTime-dt);this.dust.visible=this.dustTime>0;if(this.dust.visible){const age=1-this.dustTime/.7;this.dust.material.opacity=(1-age)*.6;for(let i=0;i<12;i++){const angle=i/12*Math.PI*2;this.dustMatrix.position.set(Math.cos(angle)*(1+age*1.6),.6+age*.9,CONFIG.crusher.z+Math.sin(angle)*(1+age));this.dustMatrix.scale.setScalar(.18+age*.45);this.dustMatrix.updateMatrix();this.dust.setMatrixAt(i,this.dustMatrix.matrix);}this.dust.instanceMatrix.needsUpdate=true;this.dust.computeBoundingSphere();}
    this.time+=dt;const t=this.time;this.upgradeFins.forEach((fin,i)=>fin.visible=i<model.save.speedLevel);
    const rig=model.save.handlingLevel;this.forklift.visible=rig>0;this.loaderReinforcement.visible=rig>=3;this.forklift.scale.setScalar(1+Math.max(0,rig-1)*.1);this.body.position.y=(rig?.25:0)+(moving&&!rig?Math.abs(Math.sin(t*12))*.06:Math.sin(t*2)*.016);this.legs.forEach((leg,i)=>leg.rotation.x=moving&&!rig?Math.sin(t*12+i*Math.PI)*.5:0);
    this.extension.visible=model.save.landOwned;this.landSign.visible=!model.save.landOwned;this.landPad.visible=!model.save.landOwned;this.eastFence.forEach(m=>m.visible=!model.save.landOwned);
    this.jobBoard.visible=model.save.landOwned;this.projectMarker.visible=model.save.landOwned;this.baler.visible=model.save.balerOwned;this.worker.visible=model.save.workerOwned;this.depot.visible=model.save.depotOwned;
    this.county.visible=model.save.yardId==='county';
    this.balerRam.position.y=model.save.balerRemaining>0?1.35+Math.sin(t*4)*.35:1.6;
    const working=model.save.balerRemaining>0,route=(Math.sin(t*.9)+1)/2;this.worker.position.set(working?10.8+route*1.8:11.3,0,-3.8);this.workerLoad.visible=working;this.worker.rotation.y=Math.cos(t*.9)>0?Math.PI/2:-Math.PI/2;
    this.stock.forEach((m,i)=>m.visible=model.save.landOwned&&i<Math.ceil(model.save.scrapLoads/3));
    this.crusher.scale.z=1+model.save.powerLevel*.055;
    const crushing=['ready','pressing','impact','collecting'].includes(model.state);const squash=model.state==='pressing'?model.pressure*.7:model.state==='impact'||model.state==='collecting'?.86:0;
    const rest=model.vehicle.kind==='truck'?3.1:['van','bus','surplus'].includes(model.vehicle.kind)?2.8:2.5;
    this.press.position.y=THREE.MathUtils.damp(this.press.position.y,rest-squash*(rest-.92)/.86,model.state==='impact'?30:12,dt);
    const shell=this.vehicle.userData.shell;shell.scale.set(1+squash*.18,1-squash,squash>.3?1-squash*.13:1);shell.visible=model.state!=='collecting';this.vehicle.userData.bale.visible=model.state==='collecting';
    if(crushing){this.vehicle.position.set(0,.45,CONFIG.crusher.z);this.vehicle.rotation.y=0;}
    if(model.state==='pressing'){this.crusher.position.x=Math.sin(t*67)*model.pressure*.018;this.vehicle.rotation.z=Math.sin(t*42)*model.pressure*.025;}else{this.crusher.position.x=0;this.vehicle.rotation.z=0;}
    this.ring.material.opacity=model.state==='towing'?.5+Math.sin(t*4)*.3:.2;this.rope.visible=model.state==='towing'&&!rig;
    if(this.rope.visible){const p=this.rope.geometry.attributes.position;p.setXYZ(0,this.player.position.x,.8,this.player.position.z);p.setXYZ(1,this.vehicle.position.x,.5,this.vehicle.position.z);p.needsUpdate=true;this.rope.geometry.computeBoundingSphere();}
    for(const p of this.particles){if(p.life<=0)continue;p.life-=dt;p.v.y-=14*dt;p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.x+=dt*4;if(p.mesh.position.y<.1){p.mesh.position.y=.1;p.v.y=Math.abs(p.v.y)*.2;p.v.x*=.8;p.v.z*=.8;}if(p.life<=0)p.mesh.visible=false;}
    for(const p of this.rewardBits){if(p.life<=0)continue;p.life-=dt;p.mesh.position.lerp(this.player.position.clone().add(new THREE.Vector3(0,1+Math.abs(Math.sin(p.life*10))*.35,0)),1-Math.exp(-dt*5));p.mesh.rotation.y+=dt*8;if(p.life<=0)p.mesh.visible=false;}
    this.shake=Math.max(0,this.shake-dt*.5);const focusX=innerWidth/innerHeight<.85?Math.max(-6,Math.min(model.save.landOwned?5:-4,this.player.position.x*.35-3.5)):model.save.landOwned?Math.min(7,Math.max(-3,this.player.position.x*.55)):Math.min(0,Math.max(-3,this.player.position.x*.45));this.target.x=THREE.MathUtils.damp(this.target.x,focusX,3,dt);this.target.z=THREE.MathUtils.damp(this.target.z,model.save.depotOwned?Math.max(0,(this.player.position.z-5)*.65):0,3,dt);this.camera.position.copy(this.cameraBase).multiplyScalar(model.save.landOwned?1.07:1);this.camera.position.x+=this.target.x;this.camera.position.z+=this.target.z;if(!this.settings.reduced)this.camera.position.x+=Math.sin(t*90)*this.shake*this.settings.shake;this.camera.lookAt(this.target.x,0,this.target.z-.6);this.renderer.render(this.scene,this.camera);
  }
}







