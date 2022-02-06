// add fish(performance.now() to request frame function

const NUM_INSTANCES = 3000;
const FISH_FORWARD = new THREE.Vector3(0, 0, 1);
const UP = new THREE.Vector3(0, 1, 0);
const tempV3 = new THREE.Vector3();

var loadFish = () => {
	const iOffsets = new Float32Array(NUM_INSTANCES * 3);
	const iRotations = new Float32Array(NUM_INSTANCES * 4);
	const iColors = new Float32Array(NUM_INSTANCES * 4);

	const geometry = new THREE.InstancedBufferGeometry();
	geometry.copy(getFishGeometry());
	geometry.setAttribute("iOffset", new THREE.InstancedBufferAttribute(iOffsets, 3));
	geometry.setAttribute("iRotation", new THREE.InstancedBufferAttribute(iRotations, 4));
	geometry.setAttribute("iColor", new THREE.InstancedBufferAttribute(iColors, 4));

	geometry.attributes.iRotation.setUsage(35048);
	geometry.attributes.iOffset.setUsage(35048);

	const fishes = [];
	for (let i = 0; i < NUM_INSTANCES; i++) {
		fishes.push(
			new Fish(i, {
				position: iOffsets,
				rotation: iRotations,
				color: iColors
			})
		);
	}

	const mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	mesh.frustumCulled = false;

	let t0 = performance.now();
	return t => {
		const dt = Math.min((t - t0) / 1000, 0.1);
		
		for (let i = 0; i < NUM_INSTANCES; i++) {
			fishes[i].update(dt);
		}
		geometry.attributes.iRotation.needsUpdate = true;
		geometry.attributes.iOffset.needsUpdate = true;
		t0 = t;
	};
}

// OBJECT CLASSES

class Fish {
	constructor(index, buffers) {
		console.log("fish created!");
		this.index = index;
		this.buffers = buffers;

		this.offsets = {
			position: index * 3,
			rotation: index * 4,
			color: index * 4
		}

		this.rotation = new THREE.Quaternion();
		this.position = new THREE.Vector3();
		this.velocity = new THREE.Vector3();
		this.color = new THREE.Color();

		this.init();
		this.update();
	}

	init() {
		this.color.setHSL(rnd(0.2, 0.6), 0.2, rnd(0.3, 0.7));
		this.color.toArray(this.buffers.color, this.offsets.color);

		this.position.setFromSpherical({
			radius: rnd(10, 300, 1.6),
			phi: Math.PI/2 + rnd(-0.1, 0.1),
			theta: rnd(0, 2 * Math.PI)
		});

		tempV3.set(rnd(5), rnd(4), rnd(3));

		this.velocity.copy(this.position)
			.cross(UP)
			.normalize()
			.multiplyScalar(Math.PI * Math.PI)
			.add(tempV3);
	}

	update(dt) {
		tempV3.copy(this.position).multiplyScalar(-Math.PI / this.position.lengthSq());
		this.velocity.add(tempV3);

		tempV3.copy(this.velocity).multiplyScalar(dt);
		this.position.add(tempV3);

		tempV3.copy(this.velocity).normalize();
		this.rotation.setFromUnitVectors(FISH_FORWARD, tempV3);

		this.position.toArray(
			this.buffers.position,
			this.offsets.position
		);
		this.rotation.toArray(
			this.buffers.rotation,
			this.offsets.rotation
		);
	}
}

var getFishGeometry = () => {
	const shape = new THREE.Shape([
		[-0.8, -1], [-0.03, 1], [-0.01, 1.017], [0.0, 1.0185],
		[0.01, 1.017], [0.03, 1], [0.8, -1], [0, -0.5]
	].map(p => new THREE.Vector2(...p)));

	const fishGeometry = new THREE.ExtrudeGeometry(shape, {
		depth: 0.3,
		bevelEnabled: true,
		bevelSize: 0.1,
		bevelThicness: 0.1,
		bevelSegments: 2
	});

	const matrix = new THREE.Matrix4()
		.makeRotationX(Math.PI/2)
		.setPosition(new THREE.Vector3(0, 0.15, 0));

	fishGeometry.applyMatrix4(matrix);
	return new THREE.BufferGeometry().fromGeometry(fishGeometry);
}

const material = new THREE.RawShaderMaterial({
	uniforms: {},
	vertexShader: `
	  precision highp float;
	  // uniforms (all provided by default by three.js)
	  uniform mat4 modelViewMatrix;
	  uniform mat4 projectionMatrix;
	  uniform mat3 normalMatrix;
	  
	  // default attributes (from fish-geometry)
	  attribute vec3 position;
	  attribute vec3 normal;
  
	  // instance attributes
	  attribute vec3 iOffset;
	  attribute vec4 iRotation;
	  attribute vec4 iColor;
	  
	  // shading-parameters
	  varying vec3 vLighting;
	  varying vec4 vColor;
  
	  // apply a rotation-quaternion to the given vector 
	  // (source: https://goo.gl/Cq3FU0)
	  vec3 rotate(const vec3 v, const vec4 q) {
		vec3 t = 2.0 * cross(q.xyz, v);
		return v + q.w * t + cross(q.xyz, t);
	  }
  
	  void main() {
		// compute lighting (source: https://goo.gl/oS2vIY)
		vec3 ambientColor = vec3(1.0) * 0.3;
		vec3 directionalColor = vec3(1.0) * 0.7;
		vec3 lightDirection = normalize(vec3(-0.5, 1.0, 1.5));
  
		// diffuse-shading
		vec3 n = rotate(normalMatrix * normal, iRotation);
		vLighting = ambientColor + 
			(directionalColor * max(dot(n, lightDirection), 0.0));
  
		vColor = iColor;
  
		// instance-transform, mesh-transform and projection
		gl_Position = projectionMatrix * modelViewMatrix * 
			vec4(iOffset + rotate(position, iRotation), 1.0);
	  }
	`,
	
	fragmentShader: `
	  precision highp float;
	  varying vec3 vLighting;
	  varying vec4 vColor;
  
	  void main() {
		gl_FragColor = vColor * vec4(vLighting, 1.0);
		gl_FragColor.a = 1.0;
	  }
	`,
  
	side: THREE.DoubleSide,
	transparent: false
  });

  function rnd(min = 1, max = 0, pow = 1) {
	  if (arguments.length < 2) {
		  max = min;
		  min = 0;
	  }
	  const rnd = (pow === 1) ? Math.random() : Math.pow(Math.random(), pow);
	  return (max - min) * rnd + min;
  }