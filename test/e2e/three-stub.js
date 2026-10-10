// Minimal stand-in for three@0.167 so the app's own logic can run headless here. Not shipped.
export const DoubleSide = 2;
class Vector3 { constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this} copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this} clone(){return new Vector3(this.x,this.y,this.z)}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this} sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this} multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}
  length(){return Math.hypot(this.x,this.y,this.z)} lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}
  distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z)} normalize(){const l=this.length()||1;return this.multiplyScalar(1/l)}
  lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this}
  cross(v){const {x,y,z}=this;this.x=y*v.z-z*v.y;this.y=z*v.x-x*v.z;this.z=x*v.y-y*v.x;return this}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z}
  project(){this.x=0;this.y=0;this.z=0.5;return this} unproject(){return this}
  setFromMatrixColumn(m,i){const e=m.elements;this.x=e[i*4];this.y=e[i*4+1];this.z=e[i*4+2];return this}
  applyAxisAngle(){return this} setFromSpherical(){return this} applyMatrix4(){return this} sizeOf(){return 3} }
class Vector2 { constructor(x=0,y=0){this.x=x;this.y=y} set(x,y){this.x=x;this.y=y;return this} copy(v){this.x=v.x;this.y=v.y;return this} }
class Color { constructor(c){this.v=c;this.r=this.g=this.b=1} set(){return this} setHex(){return this} copy(){return this} clone(){return new Color(this.v)} lerp(){return this} multiplyScalar(){return this} getHex(){return this.v||0} }
class BufferAttribute { constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.needsUpdate=false;this.count=array.length/itemSize} setUsage(){return this} }
class BufferGeometry { constructor(){this.attributes={};} setAttribute(n,a){this.attributes[n]=a;return this} setFromPoints(){return this} setDrawRange(){return this} computeBoundingSphere(){} dispose(){} }
class Obj { constructor(){this.position=new Vector3();this.rotation=new Vector3();this.scale=new Vector3(1,1,1);this.children=[];this.visible=true;this.userData={};this.matrix={elements:new Array(16).fill(0)};this.renderOrder=0;this.up=new Vector3(0,1,0);}
  add(o){this.children.push(o);return this} remove(o){const i=this.children.indexOf(o);if(i>=0)this.children.splice(i,1);return this} lookAt(){} updateMatrixWorld(){} getWorldPosition(v){return (v||new Vector3()).copy(this.position)} }
class Mesh extends Obj { constructor(g,m){super();this.geometry=g;this.material=m} computeLineDistances(){return this} }
class Line extends Mesh {} class Points extends Mesh {}
const matProps = (o,p={})=>Object.assign(o,{opacity:1,transparent:false,color:new Color(0),dispose(){}},p);
class Material { constructor(p={}){matProps(this,p)} } 
const geos = ['SphereGeometry','RingGeometry']; 
export class Scene extends Obj { constructor(){super();this.background=null} }
export class PerspectiveCamera extends Obj { constructor(f,a){super();this.fov=f;this.aspect=a;this.matrix.elements=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]} updateProjectionMatrix(){} }
export class WebGLRenderer { constructor(o={}){this.domElement=o.canvas||document.createElement('canvas')} setSize(){} setPixelRatio(){} render(){} dispose(){} setClearColor(){} }
export class Raycaster { constructor(){this.params={Mesh:{},Line:{threshold:1},Points:{}}} setFromCamera(){} intersectObjects(){return []} intersectObject(){return []} }
export class CanvasTexture { constructor(c){this.image=c} dispose(){} }
export class AmbientLight extends Obj {} export class PointLight extends Obj {}
export { Vector3, Vector2, Color, BufferAttribute, BufferGeometry, Mesh, Line, Points };
export class SphereGeometry extends BufferGeometry { constructor(){super();this.attributes.position=new BufferAttribute(new Float32Array(9),3)} }
export class RingGeometry extends SphereGeometry {}
export class MeshBasicMaterial extends Material {} export class MeshStandardMaterial extends Material {}
export class LineBasicMaterial extends Material {} export class LineDashedMaterial extends Material {} export class PointsMaterial extends Material {}
