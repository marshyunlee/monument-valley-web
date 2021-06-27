const mouse = new THREE.Vector2();
const mousePointer = new THREE.Raycaster();
const gravityRay= new THREE.Raycaster();
const GRAVITY = 1.0;

let character;
let MOUSE_POINTED;
let CHARACTER_LOCATED;

var stop = false;
var frameCount = 0;
var fpsInterval, startTime, now, then, elapsed;

// ========== RESIZE ==========
var resizeListener = () => {
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, false);
}

// ========== ON LOAD ==========
var loadListener = async () => {
	window.addEventListener('load', async () => {
		settings = data.settings;
		document.body.style.background = `rgb(${settings.background})`;
		floorplan = data.floorplan;
		await initGame()
		.then(await loadCharacter(scene)
			.then(() => {
				// limit frame rate based on the settings
				fpsInterval = 1000 / settings.frameRate;
				then = Date.now();
				startTime = then;
				animate();
			})
		);
	});

	const animate = () => {
		requestAnimationFrame(animate);
		now = Date.now();
		elapsed = now - then;
		if (elapsed > fpsInterval) {
			then = now - (elapsed % fpsInterval);

			// gravity action
			applyGravity();
			// cursor action
			applyMovement();
			
			// render
			if (controls) controls.update();
			renderer.render(scene, camera);
		}	
	}
}

var applyGravity = () => {
	// console.log(character.position);
	gravityRay.set(character.position, new THREE.Vector3(0, 0, -1));
	scene.add(new THREE.ArrowHelper(gravityRay.ray.direction, gravityRay.ray.origin, 300, 0xff0000, 0, 0));
	const standingPlatforms = gravityRay.intersectObjects(scene.children);
	if (standingPlatforms.length > 0) {
		let firstEncounter = standingPlatforms[0];
		if (firstEncounter.distance > 0) {
			character.position.set(character.position.x, character.position.y, character.position.z - GRAVITY);
		} else if (firstEncounter.distance < 0) {
			character.position.set(character.position.x, character.position.y, character.position.z + GRAVITY);
		}
	}
}

var applyMovement = () => {
	mousePointer.setFromCamera(mouse, camera);
	const intersects = mousePointer.intersectObjects(scene.children);
	if (intersects.length > 0) {
		if (MOUSE_POINTED !== intersects[0].object && intersects[0].object.type === TYPE_PLATFORM) {
			MOUSE_POINTED = intersects[0].object;
		}
	} else {
		MOUSE_POINTED = undefined;
	}
}

// ========== MOUSE ACTION ==========
var mouseListener = () => {
	renderer.domElement.addEventListener('mousemove', (event) => {
		event.preventDefault();
		mouse.x = (event.clientX/window.innerWidth) * 2-1;
		mouse.y = -(event.clientY/window.innerHeight) * 2+1;
	}, false);

	renderer.domElement.addEventListener('click', onClick, false);
	renderer.domElement.addEventListener('touchstart', onClick, false);
}

var onClick = (event) => {
	let curr = getMapLocation(character.position);
	console.log(curr);
	
	event.preventDefault();
	if (MOUSE_POINTED) {
		character.position.set(MOUSE_POINTED.position.x, MOUSE_POINTED.position.y, MOUSE_POINTED.position.z + blockSize/2 + 10);
	}
}

var getMapLocation = (vectorLocation) => {
	return {
		z: Math.ceil(Math.abs(vectorLocation.z/20 - 11)),
		x: Math.ceil(vectorLocation.x/20 + 6),
		y: Math.ceil(vectorLocation.y/20 + 6)
	}
}



