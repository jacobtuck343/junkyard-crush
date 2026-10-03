export const PALETTE={dirt:'#D9A86A',patch:'#C48F52',metal:'#8D99A6',shade:'#6C7784',yellow:'#FFD23F',ink:'#2B1D0E',fog:'#F6E3C4',window:'#9BE7FF'};
const remap={
 '#a2b09a':'#A4DB75','#8f8264':'#C48F52','#ac9c77':'#D9A86A','#b6a983':'#E4BA7F','#777e6a':'#8D99A6','#a29471':'#C48F52','#9c8d6e':'#C48F52',
 '#df7a3d':'#8D99A6','#dc7540':'#8D99A6','#e99345':'#FFD23F','#343e31':'#2B1D0E','#314b43':'#6C7784','#798d7b':'#AAB7C5','#354b3c':'#2B1D0E','#f3af58':'#FFD23F',
 '#42665b':'#3A86FF','#344f46':'#2862BD','#34493e':'#2253A4','#a7c0ae':'#9BE7FF','#2f4b40':'#2B1D0E',
 '#374740':'#2B1D0E','#34433d':'#2B1D0E','#2e4039':'#2B1D0E','#597a6a':'#3A86FF','#b77742':'#FF754D',
 '#6f7969':'#6C7784','#879584':'#8D99A6','#687565':'#6C7784','#899883':'#8D99A6','#647965':'#6C7784','#829783':'#8D99A6',
 '#6e8e70':'#7CD35B','#779775':'#4CB963','#776c50':'#A76537','#d9a247':'#FFD23F','#e2b650':'#FFD23F','#e5d685':'#FFD23F',
 '#7c826c':'#C48F52','#b9b797':'#D9A86A','#85876d':'#C48F52','#b6b293':'#E4BA7F','#548f89':'#8D99A6','#346563':'#6C7784','#d0ba69':'#FFD23F',
 '#839391':'#A4B9CD','#627a7b':'#8D99A6','#607f87':'#3A86FF','#344e5d':'#2663C8','#cbd18b':'#7CD35B','#85b5b2':'#3A86FF','#f0c67a':'#FFD23F',
 '#3e7276':'#3A86FF','#f3c255':'#FFD23F','#f6ce68':'#FFD23F','#d7b46a':'#FFD23F','#c9ac62':'#FFD23F'
};
export const styleColor=color=>remap[color.toLowerCase()]??color;
const vehicleColors=['#FF4D5A','#3A86FF','#FF922B','#A663FF','#17C9AD','#FFD23F','#F450AD','#4D96FF','#7CD35B'];
const ids=['veh_rustcompact','veh_sedan','veh_pickup','veh_van','veh_boxtruck','veh_schoolbus','veh_servicevan','veh_flatbed','veh_surplus'];
export const vehicleColor=def=>def.specialColor??vehicleColors[Math.max(0,ids.indexOf(def.id))%vehicleColors.length];
