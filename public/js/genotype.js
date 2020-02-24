// let t = THREE;
// let TWO_PI = Math.PI * 2;

// function animate(scene, camera, renderer, controls){
//     // let d = scene.getObjectByName('dashed');
//     // if (d.material.gapSize > 0){
//     //     // Decrement the gapSize value to animate the path with the dash.
//     //     d.material.gapSize -= 0.01;
//     // }
//     // else{
//     //     d.material.gapSize = 2;
//     // }
//     // d.material.needsUpdate = true; 
//     controls.update();
//     requestAnimationFrame(() => animate(scene, camera, renderer, controls));
//     renderer.render(scene, camera);
// }

// //do some parametric curves
// function getDashedLine(){
//     var geometrySpline = new THREE.Geometry();
//     for(let i=0; i<= TWO_PI + .1; i+= .1){
//         geometrySpline.vertices.push(
//             new t.Vector3( 
//             5 * Math.cos(3 * i),
//             5 * Math.sin(5 * i),
//             0)
//         );
//     }
//     let material = new t.LineDashedMaterial( { color: 0xff0000, dashSize: .5, gapSize: .1} );
//     return new t.Line( geometrySpline, material ).computeLineDistances(); //use this to get the dashes in the line
// }

// (function(){
//   let scene = new t.Scene();
//   scene.background = new t.Color(0x0A0F16);
//   let camera = new t.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000);
//   let renderer = new t.WebGLRenderer({alpha: true});
//   camera.position.set(0,0,10);
//   camera.lookAt(0,0,0);
//   renderer.setSize(window.innerWidth, window.innerHeight);

//   //Set up the app here
//   let curve = getDashedLine();
//   curve.name = 'dashed';
//   console.log(curve);
//   scene.add(curve);

//   // grid
//   var gridHelper = new THREE.GridHelper(10, 10);
//   scene.add(gridHelper);

//   document.body.appendChild(renderer.domElement);
//   let controls = new t.OrbitControls(camera, renderer.domElement);
//   animate(scene, camera, renderer, controls);
// })();

let t = THREE;
let TWO_PI = Math.PI * 2;
let MAX_POINTS = 100;
let drawCount = 1;
noise.seed(10);

function animate(scene, camera, renderer){
    let g = scene.getObjectByName('group');
    let index = 3;
    let inc = 0;
    drawCount = (drawCount + 1) % MAX_POINTS; //draw one more point each animation frame
    
    for( let i=0; i< g.children.length; i++){
      g.children[i].geometry.setDrawRange(1, drawCount);
      for(let j=0; j< MAX_POINTS; j++){
        let rand = noise.simplex2(g.children[i].geometry.attributes.position.array[0] + inc, (g.children[i].geometry.attributes.position.array[1] + inc));
        g.children[i].geometry.attributes.position.array[index++] = g.children[i].geometry.attributes.position.array[0] + j;
        g.children[i].geometry.attributes.position.array[index++] = g.children[i].geometry.attributes.position.array[1] + rand; //put fft value here analyzer[i]
        g.children[i].geometry.attributes.position.array[index++] = 0;
        inc += .09;
      }
      index = 3;
      g.children[i].geometry.attributes.position.needsUpdate = true;
    }
    requestAnimationFrame(() => animate(scene, camera, renderer));
    renderer.render(scene, camera);
}

//do some parametric curves
function getDashedLine(){
    var geometry = new t.BufferGeometry();
    var positions = new Float32Array((MAX_POINTS) * 3); // 3 vertices per point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, drawCount);
    var material = new t.LineBasicMaterial(
        { color: new t.Color(Math.random(), Math.random(), 0.5), 
        linewidth: 1 });
    return new t.Line(geometry, material);
}

(function(){
  let scene = new t.Scene();
  scene.background = new t.Color(0x0A0F16);
  let camera = new t.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000);
  let renderer = new t.WebGLRenderer({alpha: true});
  camera.position.set(0,0,20);
  camera.lookAt(0,0,0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  let group = new t.Object3D();
  group.name = "group";
  for(let i=0; i< 256; i++){
    group.add( getDashedLine() );
  }
  group.position.set(-40,0,0);
  let index = 0;
  for( let i=0; i< group.children.length; i++){
      group.children[i].geometry.attributes.position.array[index++] = 15 * Math.cos(i);
      group.children[i].geometry.attributes.position.array[index++] = 15 * Math.sin(i); //put fft value here analyzer[i]
      group.children[i].geometry.attributes.position.array[index++] = 0;
      index = 0;
      group.children[i].geometry.attributes.position.needsUpdate = true;
    }
  
  
  scene.add(group);
  console.log(group);

  // grid
//   var gridHelper = new THREE.GridHelper(10, 10);
//   scene.add(gridHelper);

  document.body.appendChild(renderer.domElement);
  animate(scene, camera, renderer);
})();