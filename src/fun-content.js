// Content-only catalogs: shared by save validation, gameplay and procedural art.
export const SPECIALS=[
 ['icecream','Ice Cream Express','cone','#FF91CF','Sprinkles everywhere!'],['clown','Clown Car','hat','#FF4D5A','How did all that fit?'],
 ['duck','Rubber Duck Taxi','duck','#FFD23F','QUACK! The fare is scrap.'],['pizza','Pizza Patrol','pizza','#FF8748','Extra crunchy crust!'],
 ['rocket','Rocket Delivery','rocket','#3A86FF','Houston, we have scrap!'],['donut','Donut Wagon','donut','#E899CD','A hole lot of scrap!'],
 ['banana','Banana Buggy','banana','#FFD23F','Peel out!'],['robot','Robot Repair Van','robot','#8D99A6','BEEP. RECYCLED.'],
 ['dino','Dino Tour Bus','dino','#7CD35B','A prehistoric crunch!'],['disco','Disco Delivery','ball','#B58CFF','The scrap has rhythm!'],
 ['birthday','Birthday Express','cake','#FF91CF','Make a wish. CRUNCH!'],['ufo','Saucer Shuttle','ufo','#69E6FF','Out-of-this-world recycling!'],
 ['burger','Burger Buggy','burger','#D9A86A','Freshly pressed!'],['cactus','Cactus Courier','cactus','#7CD35B','Handle with extra crunch!'],
 ['penguin','Penguin Pool Car','penguin','#69E6FF','One cool customer!'],['rainbow','Rainbow Roadster','rainbow','#B58CFF','A colorful little crunch!'],
 ['toaster','Toast Transport','toaster','#FFD23F','Breakfast is popped!'],['trophy','Trophy Truck','trophy','#FFD23F','First place for recycling!'],
 ['beach','Beach Ball Buggy','ball','#FF8748','Summer in the scrap pile!'],['wizard','Wizard Wagon','hat','#B58CFF','Abra-ca-CRUNCH!'],
 ['cupcake','Cupcake Courier','cake','#69E6FF','Sweet scrap!'],['spacecat','Space Cat Shuttle','cat','#FF91CF','One small crunch for cats!'],
 ['froggy','Frog Hopper','frog','#7CD35B','Ribbit. Recycle. Repeat.'],['treasure','Treasure Taxi','chest','#D9A86A','A bumper full of treasure!']
].map(([id,name,shape,color,line])=>({id,name,shape,color,line}));
const forms=[['robot','Scrap Robot'],['dino','Metal Dinosaur'],['duck','Giant Duck'],['rocket','Moon Rocket'],['ufo','Flying Saucer'],['cactus','Bolt Cactus'],['cat','Workshop Cat'],['frog','Spring Frog'],['trophy','Crush Trophy'],['rainbow','Rainbow Arch'],['donut','Donut Sculpture'],['chest','Treasure Chest']];
const themes=[['Candy','#FF91CF',1],['Sunshine','#FFD23F',1.8],['Cosmic','#69E6FF',3]];
export const DECORATIONS=themes.flatMap(([theme,color,factor],t)=>forms.map(([shape,name],i)=>({id:`decor_${t}_${shape}`,name:`${theme} ${name}`,shape,color,cost:Math.round((120+i*110)*factor),theme})));
export const DISPLAY_SPOTS=[{x:-3.5,z:6.5},{x:0,z:6.5},{x:3.5,z:6.5},{x:-3.5,z:-7},{x:3.5,z:-7},{x:6,z:-7},{x:11,z:-7},{x:14,z:-7}];
export const CRANE={x:16,z:1,radius:2,cost:3200};
export const specialFor=count=>count>=2&&count%3===2?SPECIALS[Math.floor(count/3)%SPECIALS.length]:null;
