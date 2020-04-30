const t = THREE;
const PI = Math.PI;
const TWO_PI = 2 * Math.PI;
const FFT_SIZE = 512;
const FFT_BIN_SIZE = 512/2 ; //Data limit (NOT THE ACTUAL BIN SIZE!)
const inc = TWO_PI/FFT_BIN_SIZE; //this is theta
const radius = 30;

let MAX_POINTS = FFT_BIN_SIZE;
let drawCount = 2;
let beat = false; //toggled with p5 and three

//bloom pass
var bloomParams = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0,
    bloomRadius: 1,
};
//change fft wave color theme
var waveTheme = {
    toggleColorTheme: true,
    warm: {
        colors: [0xFFA730, 0xE26D5A, 0xEFA8B8, 0xA36363,0xD7BBA8]
    },
    cool:{
        colors: [0x2F557F, 0xE0E0E2,0x81D2C7,0xB5BAD0,0x7389AE]
    }
}

//change the FFT sample size
var fftSize = {
    fftBinSize: 64 
}

var fftSections = {
    spectrumSections: 64
}

//do some parametric curves
function getDashedLine(){
    var geometry = new t.BufferGeometry();
    var positions = new Float32Array((MAX_POINTS) * 3); // 3 vertices per point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(1, MAX_POINTS);
    var material = new t.LineBasicMaterial(
        { color: new t.Color(Math.random(), Math.random(), 0.5), 
        linewidth: 1 });
    return new t.Line(geometry, material);
}

//bloom pass
var bloomParams = {
    exposure: 1,
    bloomStrength: 1.5,
    bloomThreshold: 0,
    bloomRadius: .5,
};

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function animate(scene, camera, renderer, controls, composer) {
    let p = scene.getObjectByName('particles');
    let c = scene.getObjectByName('circle');
    let g = scene.getObjectByName('group');
    let ico = scene.getObjectByName('icoGroup');
    if(spectrum){
        let index = index2 = 0;
        let audio_index = 0;
        let scale = (level)+ 1;
        if(beat){
            //changes lightness of purple based on amplitude
            c.material.color.setHSL(Math.random(), 1, .5);
            beat = false;
        }
        //scale the shapes
        // level range is 0 - 1
        c.scale.set(scale, scale, 1);
        ico.children[0].scale.set(scale, scale,scale);
        ico.children[1].scale.set(scale, scale,scale);

        for( let i=0; i< g.children.length; i++){
            // not changing actual bin size, just the amount of samples from array
            for (var j =0; j< fftSize.fftBinSize; j+=inc){
            // for(var j = 0; j <= TWO_PI; j+=inc){
                let R = spectrum[audio_index].map(0,255, 0, 75); //change amplitude
                // the FFT spectrum
                g.children[i].geometry.attributes.position.array[index++] = (R + i) * Math.cos(j);
                g.children[i].geometry.attributes.position.array[index++] = (R + i) * Math.sin(j);
                g.children[i].geometry.attributes.position.array[index++] = 0;
                
                audio_index = (audio_index + 1) % fftSections.spectrumSections; //constrain size
            }
            index = 0;
            if(waveTheme.toggleColorTheme){ //warm pallate
                g.children[i].material.color.set(waveTheme.warm.colors[i]);
                ico.children[0].material.color.set(0xff0000);
                ico.children[1].material.color.set(0xff0000);
                p.material.color.set(0xFFA730);
            }
            else{ //cool pallate
                g.children[i].material.color.set(waveTheme.cool.colors[i]);
                p.material.color.set(0x0000FF);
                ico.children[0].material.color.set(0x524FAF);
                ico.children[1].material.color.set(0x524FAF);
            }
            g.children[i].geometry.attributes.position.needsUpdate = true;
        }
    }
    p.rotation.y += .001;
    ico.children.forEach(element => {
        element.rotation.z -= .001;
        element.rotation.y -= .01;
    });
    //update the effect composer
    composer.passes[1].strength = bloomParams.bloomStrength;
    composer.passes[1].threshold = bloomParams.bloomThreshold;
    composer.passes[1].radius = bloomParams.bloomRadius;

    // controls.update();
    requestAnimationFrame(() => animate(scene, camera, renderer, controls, composer));
    composer.render();
}

function getParticleSystem(){
    let geometry = new t.Geometry();
    var particleMaterial = new t.PointsMaterial({
        color: 'hsl(200 100%, 50%)', 
        size: 3,
        map: new t.TextureLoader().load('./public/assets/particle.jpg'),
        transparent: true,
        blending: t.AdditiveBlending,
        depthWrite: false

    });
    for(let i=0; i< 500; i++ ){
        geometry.vertices.push( new t.Vector3(
            Math.random() * 250 - 125,
            Math.random() * 250 - 125,
            Math.random() * 250 - 125
            
        ));
    }
    geometry.vertices.pop(); //remove last one for 126;
    return new t.Points(geometry, particleMaterial);
}

function getFFTLine(){
    var geometry = new t.BufferGeometry();
    var positions = new Float32Array((FFT_BIN_SIZE + 1) * 3); // 3 vertices per point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setDrawRange(0, FFT_BIN_SIZE + 1);
    var material = new t.LineBasicMaterial(
        { color: new t.Color(0x000000), 
        linewidth: 1 });
    return new t.Line(geometry, material);
}

(function () {
    let scene = new t.Scene();
    scene.background = new t.Color(0x000000);
    let camera = new t.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    let renderer = new t.WebGLRenderer({ alpha: true });
    camera.position.set(0, 0, 170);
    camera.lookAt(0, 0, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);

    //particles in the bg
    let particles = getParticleSystem();
    particles.name= "particles";
    console.log(particles);
    scene.add(particles);
    
    let group = new t.Object3D();
    group.name = "group";
    for(let i=0; i< 5; i++){ //number of lines, if this increases, then the color theme array must increase too
      group.add( getFFTLine() );
    }
    console.log(group);
    scene.add(group);
    
    let icoGroup = new t.Object3D();
    icoGroup.name = "icoGroup";

    //center circle
    var ico1 = new t.Mesh( 
        new t.IcosahedronGeometry(15, 0), 
        new t.MeshBasicMaterial( { color: 0xffffff, wireframe: true } )
    );
    icoGroup.add(ico1);
    var ico2 = new t.Mesh( 
        new t.IcosahedronGeometry(15, 0), 
        new t.MeshBasicMaterial( { color: 0xffffff, wireframe: true } )
    );
    icoGroup.add(ico2);
    ico1.position.set(-110,0,0);
    ico2.position.set(110,0,0);

    //pulsing circle
    var circle = new t.Mesh( new t.CircleGeometry( radius/2, 50 ) , new t.MeshBasicMaterial( { color: 'red'} ));
    var circle2 = new t.Mesh( new t.CircleGeometry( radius/2.5, 50 ) , new t.MeshBasicMaterial( { color: 0x000000} ));
    var circle3 = new t.Mesh( new t.CircleGeometry( radius*.8, 50 ) , new t.MeshBasicMaterial( { color: 0x000000} ));
    circle.name = "circle";

    circle.position.set(0,0,.5); //pulsing circle
    circle2.position.set(0,0,.6); //black center circle
    circle3.position.set(0,0,.4); //put it behind the pulsing circle
    scene.add( icoGroup );
    scene.add( circle);
    scene.add( circle2);
    scene.add( circle3);

    //add the Effect Composer 
    let composer = new t.EffectComposer(renderer);
    let renderpass = new t.RenderPass(scene, camera);
    composer.addPass(renderpass);
    let bloom = new t.UnrealBloomPass( new t.Vector2( window.innerWidth, window.innerHeight ), 
        bloomParams.exposure,
        bloomParams.bloomStrength, 
        bloomParams.bloomRadius, 
        bloomParams.bloomThreshold
    );
    bloom.renderToScreen = true;
    composer.addPass(bloom);

    //Add the GUI
    let gui = new dat.GUI({name: "My_GUI"});
    let editBloom = gui.addFolder("Bloom Settings");
    editBloom.add(bloomParams,"exposure", 0,2);
    editBloom.add(bloomParams, "bloomStrength", 0, 5);
    editBloom.add(bloomParams, "bloomRadius", 0,1);
    editBloom.add(bloomParams, "bloomThreshold", 0, 1);
    // add theme
    let editWave = gui.addFolder("FFT Wave theme");
    editWave.add(waveTheme, "toggleColorTheme");
    // add the FFT bin size
    let editFFTSize = gui.addFolder("FFT Bin Sample Size");
    editFFTSize.add(fftSize, "fftBinSize", 64, 256).step(1);
    editFFTSize.add(fftSections, "spectrumSections", 8, 512).step(2);
    console.log(composer);
    document.body.appendChild(renderer.domElement);
    // let controls = new t.OrbitControls(camera, renderer.domElement);
    animate(scene, camera, renderer, controls = null, composer);
})(); 