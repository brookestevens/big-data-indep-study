const t = THREE;
const PI = Math.PI;
const TWO_PI = 2 * Math.PI;
const FFT_BIN_SIZE = 512 / 2 ; //Data limit (NOT THE ACTUAL BIN SIZE!)
const inc = TWO_PI/FFT_BIN_SIZE; //this is theta
const radius = 30;
const AudioContext = window.AudioContext || window.webkitAudioContext;

let analyzer = null;
let mediaElement = null; //the audio stream
let data = null; //hold fft wave
let audioWave = null;
let drawCount = 2;

//bloom pass
var bloomParams = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0,
    bloomRadius: 1,
};


//Event Listener for the input
// Using the Web Audio API
document.getElementById('song-form').addEventListener('submit', e => {
    e.preventDefault();
    var audioCtx = new AudioContext(); // for audio processing
    mediaElement = new Audio(URL.createObjectURL(e.target[0].files[0])); // Audio Object <audio>
    //console.log(e.target[0].files[0]);
    mediaElement.loop = false;
    mediaElement.controls = true;
    analyzer = audioCtx.createAnalyser();
    analyzer.fftSize = 1024; //bin count => fftSize/2
    data = new Uint8Array(analyzer.frequencyBinCount);
    audioWave = new Uint8Array(analyzer.frequencyBinCount);
    // audio tag -> analyzer -> destination
    audioCtx.createMediaElementSource(mediaElement).connect(analyzer);
    analyzer.connect(audioCtx.destination);
    setTimeout(() => {
        mediaElement.play();
        document.getElementById('song-title').innerHTML = e.target[0].files[0].name;
    }, 500 ); //play after .5 sec
});

//Event for the start/stop playing of song
window.addEventListener('keydown', e => {
    if (e.code === 'KeyP') {
        mediaElement.play();
    }
    if (e.code === "KeyO") {
        mediaElement.pause();
    }
});

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function animate(scene, camera, renderer, controls, composer) {
    if (analyzer != null) {
        analyzer.getByteFrequencyData(data); //get fft bins
        //analyzer.getByteTimeDomainData(audioWave); //audio wave
        let lines = scene.getObjectByName('lines');
        let fft1 = scene.getObjectByName('fft1');
        let fft2 = scene.getObjectByName('fft2');
        let fft3 = scene.getObjectByName('fft3');
        let part = scene.getObjectByName('particles');

        for (var i = 0; i < lines.children.length ; i++) {
            lines.children[i].scale.set(
                data[Math.floor(i % 64)].map(0,255, 1, 5), 
                data[Math.floor(i % 64)].map(0,255, 1, 5), 
                1
            );
        }
        //drawCount = (drawCount + 1) % MAX_POINTS;
        //s.geometry.setDrawRange(1, drawCount); //draw a new segment, skip the start at origin
        //fft1.geometry.setDrawRange(0, FFT_BIN_SIZE ); //draw a new segment, skip the start at origin
        //fft2.geometry.setDrawRange(0, FFT_BIN_SIZE ); //draw a new segment, skip the start at origin
        //fft3.geometry.setDrawRange(0, FFT_BIN_SIZE ); //draw a new segment, skip the start at origin
        // if (drawCount === 0) {
            var audio_index = 0;
            let index = 0;
            for (var i = 0; i < TWO_PI; i+= inc) { 
                let R = data[(audio_index) % 128].map(0,255, 0, 45); //cahnge amplitude
                //need to interpolate the last bits to the begining to 'close' the loop better
                if(i > TWO_PI * .98 ){
                    R = t.Math.lerp(R, part.geometry.vertices[audio_index%FFT_BIN_SIZE].x, t.Math.mapLinear( i, TWO_PI * .98, TWO_PI, 0, 1) );
                }
                part.geometry.vertices[audio_index%FFT_BIN_SIZE].set( R * Math.cos(i) , R * Math.sin(i), 0);
                audio_index++;
                fft1.geometry.attributes.position.array[index++] = (R+3) * Math.cos(i);
                fft1.geometry.attributes.position.array[index++] = (R+3) * Math.sin(i);
                fft1.geometry.attributes.position.array[index++] = 0;
                index -= 3;
                fft2.geometry.attributes.position.array[index++] = (R + 5) * Math.cos(i);
                fft2.geometry.attributes.position.array[index++] = (R + 5) * Math.sin(i);
                fft2.geometry.attributes.position.array[index++] = 0;
                index -= 3;
                fft3.geometry.attributes.position.array[index++] = (R + 7 ) * Math.cos(i);
                fft3.geometry.attributes.position.array[index++] = (R + 7) * Math.sin(i);
                fft3.geometry.attributes.position.array[index++] = 0;
            
                part.geometry.verticesNeedUpdate = true;
            }
        //}
        fft1.geometry.attributes.position.needsUpdate = true;
        fft2.geometry.attributes.position.needsUpdate = true;
        fft3.geometry.attributes.position.needsUpdate = true;
        lines.rotation.z += .001;
        lines.rotation.x += .001;
        lines.rotation.y += .001;
        //else if(lines.rotation.y < PI/4) lines.rotation.y -= .001;
    }
    //controls.update();
    requestAnimationFrame(() => animate(scene, camera, renderer, controls, composer));
    composer.render();
}
// vector3
function getLine(start, end, color) {
    let geometry = new t.Geometry();
    let material = new t.LineBasicMaterial({
        color: color,
        linewidth: 15
    });
    geometry.vertices.push(
        start, end
    );
    return new t.Line(geometry, material);
}

function getParticleSystem(){
    let geometry = new t.Geometry();
    var particleMaterial = new t.PointsMaterial({
        color: 0xffffff, 
        size: 5,
        map: new t.TextureLoader().load('./assets/particle.jpg'),
        transparent: true,
        blending: t.AdditiveBlending,
        depthWrite: false

    });
    for(let i=0; i< TWO_PI; i += inc ){
        geometry.vertices.push( new t.Vector3(
            radius * Math.cos(i),
            radius * Math.sin(i),
            0
        ));
    }
    geometry.vertices.pop(); //remove last one for 126;
    console.log("Segments: ", Math.floor(geometry.vertices.length));
    console.log("Theta: ", inc);
    return new t.Points(geometry, particleMaterial);
}

function getFFTLine(color){ //new t.color();
    var geometry = new t.BufferGeometry();
    var positions = new Float32Array((FFT_BIN_SIZE + 1) * 3); // 3 vertices per point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, FFT_BIN_SIZE + 1);
    var material = new t.LineBasicMaterial(
        { color: color, 
        linewidth: 1 });
    return new t.Line(geometry, material);
}

(function () {
    let scene = new t.Scene();
    scene.background = new t.Color(0x000000);
    let camera = new t.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    let renderer = new t.WebGLRenderer({ alpha: true });
    camera.position.set(0, 0, 300);
    camera.lookAt(0, 0, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);

    let group = new t.Object3D();
    for(let i=0 ; i<= TWO_PI; i+= inc){
        let c = 0xdd0000;
        let rand = Math.floor(Math.random() * 3);
        let start = new t.Vector3 (radius * Math.cos(i), radius * Math.sin(i));
        let end = new t.Vector3 (1.5*radius * Math.cos(i), 1.5*radius * Math.sin(i));
        if(rand === 0) c = 0xdd0000;
        else if(rand === 1) c = 0xd8ced5;
        else c = 0x06cecf;
        group.add(getLine(start, end, c));
    }

    group.name = 'lines';
    scene.add(group);
    console.log(group);

    //particle fft thing
    let particles = getParticleSystem();
    particles.name= "particles";
    console.log(particles);
    scene.add(particles);
    
    let fft_1 = getFFTLine(new t.Color(0xdd0000));
    let fft_2 = getFFTLine(new t.Color(0x06cecf));
    let fft_3 = getFFTLine(new t.Color(0xd8ced5));
    
    fft_1.name = 'fft1';
    fft_2.name = 'fft2';
    fft_3.name = 'fft3';

    console.log(fft_1, fft_2, fft_3);

    scene.add(fft_1);
    scene.add(fft_2);
    scene.add(fft_3);

    //center circle
    var circle = new t.Mesh( new t.CircleGeometry( radius, 50 ) , new t.MeshBasicMaterial( { color: 0x000000 } ));
    circle.position.set(0,0, 10);
    scene.add( circle );

    // var size = 10;
    // var divisions = 10;
    // var gridHelper = new THREE.GridHelper(size, divisions);
    // scene.add(gridHelper);

    //add the Effect Composer 
    let composer = new t.EffectComposer(renderer);
    let renderpass = new t.RenderPass(scene, camera);
    composer.addPass(renderpass);
    let bloom = new t.UnrealBloomPass( new t.Vector2( window.innerWidth, window.innerHeight ), .5, 0, 0);
    bloom.renderToScreen = true;
    composer.addPass(bloom);

    document.body.appendChild(renderer.domElement);
    //let controls = new t.OrbitControls(camera, renderer.domElement);
    animate(scene, camera, renderer, controls = null, composer);
})();