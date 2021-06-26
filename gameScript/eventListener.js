const mouse = new THREE.Vector2();
const mousePointer = new THREE.Raycaster();
const gravityRay= new THREE.Raycaster();
const GRAVITY = 1.0;

let character;
let MOUSE_POINTED;
let CHARACTER_LOCATED;
// ========== RESIZE ==========

var resizeListener = () => {
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, false);
}

// ========== ON LOAD ==========
var loadListener = () => {
	window.addEventListener('load', () => {
		settings = data.settings;
		document.body.style.background = `rgb(${settings.background})`;
		floorplan = data.floorplan;
		initGame();
		character = loadCharacter(scene);
		console.log(character)
		
		animate();
	});

	const animate = () => {
		// animate
		requestAnimationFrame(animate);
		if (controls) controls.update();

		// gravity action
		applyGravity();

		// cursor action
		applyMovement();
		let curr = getMapLocation(character.position);
		// console.log(curr);
		// console.log(data.floorplan[curr.z][curr.x][curr.y]);

		// render
		renderer.render(scene, camera);
	}
}

var applyGravity = () => {
	gravityRay.set(character.position, new THREE.Vector3(0, 0, -1));
	// scene.add(new THREE.ArrowHelper(gravityRay.ray.direction, gravityRay.ray.origin, 300, 0xff0000) );
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



