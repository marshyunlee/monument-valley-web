// ======misc=====
const mouse = new THREE.Vector2();
const mousePointer = new THREE.Raycaster();
const gravityRay= new THREE.Raycaster();
const GRAVITY = 1.0;
const MOVEMENT = 2.0;
// actual coordinates of floorplan[0][0][0]
let defaultMapGeometry = new THREE.Vector3(0, 0, 0);

// =====Event Triggers======
const INTRO 	= { z: 10, x: 11, y: 1 };
const PORTFOLIO = { z: 10, x: 10, y: 8 };
const some1		= { z: 10, x: 2, y: 10 };
const some2	 	= { z: 10, x: 1, y: 3 };
const CONTACT 	= { z: 10, x: 6, y: 11 };

// =====Directions=====
const XM = 0; // -x
const XP = 1; // +x
const YM = 2; // -y
const YP = 3; // +y 
const UA = 4; // unreachable/arrival

// =====variables=====
let character;
let MOUSE_POINTED;
let CHARACTER_LOCATED;

var stop = false;
var frameCount = 0;
var fpsInterval, startTime, now, then, elapsed;

var isMoving = false;
var path = [];

var blockOnCursor;

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
		.then(scene.add(progress.shift()))
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

	defaultMapGeometry = new THREE.Vector3(
		0 - (Math.floor(data.floorplan[0].length / 2) * blockSize),
		0 - (Math.floor(data.floorplan[0].length / 2) * blockSize),
		0 + (Math.ceil(data.floorplan.length / 2) * blockSize)
	);

	const animate = () => {
		requestAnimationFrame(animate);
		now = Date.now();
		elapsed = now - then;
		if (elapsed > fpsInterval) {
			then = now - (elapsed % fpsInterval);

			// gravity action
			applyGravity();
			// cursor action
			watchCursor();
			// character behaviour 
			applyMovement();
			
			// render
			if (controls) controls.update();
			renderer.render(scene, camera);
		}	
	}
}

var applyGravity = () => {
	if (!isMoving) {
		gravityRay.set(character.position, new THREE.Vector3(0, 0, -1));
		// gravitty visualization for debugging
		// scene.add(new THREE.ArrowHelper(gravityRay.ray.direction, gravityRay.ray.origin, 300, 0xff0000, 0, 0));
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
}

var watchCursor = () => {
	if (!isMoving) {
		mousePointer.setFromCamera(mouse, camera);
		const intersects = mousePointer.intersectObjects(scene.children);
		if (intersects.length > 0) {
			if (MOUSE_POINTED !== intersects[0].object &&
				intersects[0].object.type === TYPE_PLATFORM &&
				intersects[0].object.position.z === Math.floor(data.floorplan.length / 2)
			) {
				MOUSE_POINTED = intersects[0].object;
				if (MOUSE_POINTED !== blockOnCursor) {
					if (blockOnCursor !== undefined) blockOnCursor.material.color.set(`rgb(${data.settings.cellColor})`);
					blockOnCursor = MOUSE_POINTED;
					blockOnCursor.material.color.set(0xFFFFFF);
				}	
			}
		} else {
			MOUSE_POINTED = undefined;
		}
	}
}

var applyMovement = () => {
	let currentPos = getMapLocation(character.position);
	if (progress.length === 4 && (currentPos.x === INTRO.x && currentPos.y === INTRO.y)) {
		scene.add(progress.shift());
	} else if (progress.length === 3 && (currentPos.x === PORTFOLIO.x && currentPos.y === PORTFOLIO.y)) {
		scene.add(progress.shift());
	} else if (progress.length === 2 && (currentPos.x === some1.x && currentPos.y === some1.y)) {
		scene.add(progress.shift());
	} else if (progress.length === 1 && (currentPos.x === some2.x && currentPos.y === some2.y)) {
		scene.add(progress.shift());
	}

	if (isMoving) {
		if (path.length === 0) {
			console.log("arrived!");
			isMoving = false;
			MOUSE_POINTED.material.color.set(`rgb(${data.settings.cellColor})`);
		} else {
			let next = getActualPosition(path[0]);
			if (character.position.x > next.x) {
				character.rotation.set(Math.PI/2, -Math.PI/2, 0);
				character.position.set(character.position.x - MOVEMENT, character.position.y, character.position.z);
			} else if (character.position.x < next.x) {
				character.rotation.set(0, Math.PI/2, Math.PI/2);
				character.position.set(character.position.x + MOVEMENT, character.position.y, character.position.z);
			} else if (character.position.y > next.y) {
				character.rotation.set(Math.PI/2, 0, 0);
				character.position.set(character.position.x, character.position.y - MOVEMENT, character.position.z);
			} else if (character.position.y < next.y) {
				character.rotation.set(-Math.PI/2, 0, Math.PI);
				character.position.set(character.position.x, character.position.y + MOVEMENT, character.position.z);
			}

			if (character.position.x === next.x && character.position.y === next.y) {
				path.shift();
				console.log(path.length + ' nodes to the destination!');
			}
		}
	}
}

// BFS pathfinding
var findPath = async (destination) => {
	let dest = getMapLocation(destination);
	let start = getMapLocation(character.position);
	let destKey = `${dest.x}x${dest.y}`

	let queue = [start];
	let parents = {};

	while (queue.length > 0) {
		let curr = queue.shift();
		let currKey = `${curr.x}x${curr.y}`

		// no need to run any further
		if (currKey === destKey) {
			break;
		}

		// XM, XP, YM, YP
		let neighbors = [
			{z: curr.z, x: curr.x - 1, y: curr.y},
			{z: curr.z, x: curr.x + 1, y: curr.y},
			{z: curr.z, x: curr.x, y: curr.y - 1},
			{z: curr.z, x: curr.x, y: curr.y + 1}
		];

		for (let i = 0; i < neighbors.length; i++) {
			const tempZ = neighbors[i].z;
			const tempX = neighbors[i].x;
			const tempY = neighbors[i].y;

			// do nothing if the neighbor is out of the grid
			if (tempX < 0 || tempX > data.floorplan[0].length - 1 ||
				tempY < 0 || tempY > data.floorplan[0].length - 1) {
				continue;
			}

			if (data.floorplan[tempZ][tempX][tempY] !== 1) {
				continue;
			}
			
			let temp = {
				z: tempZ,
				x: tempX,
				y: tempY
			}
			let tempKey = `${temp.x}x${temp.y}`

			if (tempKey in parents) {
				continue;
			}
			
			parents[tempKey] = {
				key: currKey,
				platform: curr
			};

			queue.push(neighbors[i]);
		}
	}

	// configure path
	let path = [];
	let backword = dest;

	while (backword !== start) {
		path.push(backword);

		const { key, platform } = parents[destKey];
		backword = platform;
		destKey = key;
	}
	return path.reverse();
}

// map coordinates: { z, x, y }
var getMapLocation = (vectorLocation) => {
	return {
		z: Math.ceil(Math.abs(vectorLocation.z/20 - 11)),
		x: Math.ceil(vectorLocation.x/20 + 6),
		y: Math.ceil(vectorLocation.y/20 + 6)
	}
}

var getActualPosition = (mapVector) => {
	return new THREE.Vector3(
		mapVector.x === undefined ? 0 : defaultMapGeometry.x + (mapVector.x * blockSize),
		mapVector.y === undefined ? 0 : defaultMapGeometry.y + (mapVector.y * blockSize),
		mapVector.z === undefined ? 0 : defaultMapGeometry.z - (mapVector.z * blockSize)
	);
}

// ========== MOUSE ACTION ==========
var mouseListener = () => {
	renderer.domElement.addEventListener('mousemove', (event) => {
		event.preventDefault();
		mouse.x = (event.clientX/window.innerWidth) * 2 - 1;
		mouse.y = -(event.clientY/window.innerHeight) * 2 + 1;
	}, false);

	renderer.domElement.addEventListener('click', onClick, false);
	renderer.domElement.addEventListener('touchstart', onClick, false);
}

var onClick = async (event) => {
	// current location of the character (block-based) for debugging
	// let curr = getMapLocation(character.position);
	// console.log(curr);
	
	// reset the destination upon click
	isMoving = false;
	watchCursor();
	path = [];

	event.preventDefault();
	if (MOUSE_POINTED) {
		MOUSE_POINTED.material.color.set(0xFFFFFF);
		isMoving = true;
		path = await findPath(MOUSE_POINTED.position);
	}
}
