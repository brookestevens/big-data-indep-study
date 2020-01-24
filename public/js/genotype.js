let t = THREE;
let TWO_PI = Math.PI * 2;

function animate(scene, camera, renderer, controls){
    // let d = scene.getObjectByName('dashed');
    // if (d.material.gapSize > 0){
    //     // Decrement the gapSize value to animate the path with the dash.
    //     d.material.gapSize -= 0.01;
    // }
    // else{
    //     d.material.gapSize = 2;
    // }
    // d.material.needsUpdate = true; 
    controls.update();
    requestAnimationFrame(() => animate(scene, camera, renderer, controls));
    renderer.render(scene, camera);
}

//do some parametric curves
function getDashedLine(){
    var geometrySpline = new THREE.Geometry();
    for(let i=0; i<= TWO_PI + .1; i+= .1){
        geometrySpline.vertices.push(
            new t.Vector3( 
            5 * Math.cos(3 * i),
            5 * Math.sin(5 * i),
            0)
        );
    }
    let material = new t.LineDashedMaterial( { color: 0xff0000, dashSize: .5, gapSize: .1} );
    return new t.Line( geometrySpline, material ).computeLineDistances(); //use this to get the dashes in the line
}

(function(){
  let scene = new t.Scene();
  scene.background = new t.Color(0x0A0F16);
  let camera = new t.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 1, 1000);
  let renderer = new t.WebGLRenderer({alpha: true});
  camera.position.set(0,0,10);
  camera.lookAt(0,0,0);
  renderer.setSize(window.innerWidth, window.innerHeight);

  //Set up the app here
  let curve = getDashedLine();
  curve.name = 'dashed';
  console.log(curve);
  scene.add(curve);

  // grid
  var gridHelper = new THREE.GridHelper(10, 10);
  scene.add(gridHelper);

  document.body.appendChild(renderer.domElement);
  let controls = new t.OrbitControls(camera, renderer.domElement);
  animate(scene, camera, renderer, controls);
})();