import {chooseVehicle} from './config.js?v=0.9.0';
export const GATE={x:-11.4,z:3.5,spacing:5.6,seconds:.4,openingMinZ:1,openingMaxZ:6};
// Forecast the actual delivery selector without advancing player progress.
export function forecastDeliveries(save,current,count=4){
 const projected={...save,discoveries:[...save.discoveries]},line=[current];
 for(let i=1;i<count;i++){projected.crushed++;if(!projected.discoveries.includes(line[i-1].id))projected.discoveries.push(line[i-1].id);line.push(chooseVehicle(projected));}
 return line;
}
export function gatePose(index,progress=1,reduced=false){
 const t=Math.max(0,Math.min(1,progress)),ease=1-(1-t)**3,pop=reduced?0:Math.sin(t*Math.PI);
 return{x:GATE.x,z:GATE.z-(index+1-ease)*GATE.spacing,y:pop*.18,scale:1+pop*.1};
}
