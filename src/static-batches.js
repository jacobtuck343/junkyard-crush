import * as THREE from '../vendor/three.module.js?v=0.8.0';
export function batchStatic(root,geometries,exclude=new Set()){
 const batches=new Map();for(const mesh of [...root.children]){if(!mesh.isMesh||!geometries.includes(mesh.geometry)||exclude.has(mesh))continue;const key=mesh.geometry.uuid+mesh.material.uuid+mesh.castShadow+mesh.receiveShadow;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);}
 for(const meshes of batches.values()){if(meshes.length<2)continue;const first=meshes[0],batch=new THREE.InstancedMesh(first.geometry,first.material,meshes.length);batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;meshes.forEach((mesh,i)=>{mesh.updateMatrix();batch.setMatrixAt(i,mesh.matrix);root.remove(mesh);});batch.computeBoundingSphere();root.add(batch);}
}
