// ======misc=====
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const mouse = new THREE.Vector2();
const mousePointer = new THREE.Raycaster();
const gravityRay= new THREE.Raycaster();
const GRAVITY = 1.0;
const MOVEMENT = 2.5;
// actual coordinates of floorplan[0][0][0]
let defaultMapGeometry = new THREE.Vector3(0, 0, 0);

// =====Event Triggers======
const DEST_BLACKLIST = [{ z: 10, x: 9, y: 2 }, { z: 10, x: 8, y: 8 }, { z: 10, x: 4, y: 6 }, { z: 10, x: 2 , y: 10 }]
const INTRO 	= { z: 10, x: 10, y: 2 };
const PORTFOLIO = { z: 10, x: 9, y: 8 };
const CONTACT 	= { z: 10, x: 3, y: 6 };
const BONUS		= { z: 10, x: 2 , y: 9 };
let eventRunning = false;

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
let upDown = true;

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
			// character behaviour 
			applyMovement();
			
			// render
			if (controls) controls.update();
			renderer.render(scene, camera);
				
			pointLights.forEach((each) => {
				pointLightsZ.push(each.position.z);
			});

			for (let i = 0; i < pointLights.length; i++) {
				if (pointLights[i].position.z >= pointLightsZ[i] + 4) {
					upDown = false;
				} else if (pointLights[i].position.z <= pointLightsZ[i] - 4) {
					upDown = true;
				}

				if (upDown) {
					pointLights[i].position.lerp(new THREE.Vector3(pointLights[i].position.x, pointLights[i].position.y, pointLightsZ[i] + 15), 0.02);
				} else {
					pointLights[i].position.lerp(new THREE.Vector3(pointLights[i].position.x, pointLights[i].position.y, pointLightsZ[i] - 15), 0.02);
				}
			}
		}	
	}
}

var loadBonusListener = async () => {
	isBonus = true;
	window.addEventListener('load', async () => {
		settings = data.settings;
		document.body.style.background = `rgb(${settings.background})`;
		floorplan = data.bonusStage;
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
			// character behaviour 
			applyMovement();
			
			// render
			if (controls) controls.update();
			renderer.render(scene, camera);
				
			pointLights.forEach((each) => {
				pointLightsZ.push(each.position.z);
			});

			for (let i = 0; i < pointLights.length; i++) {
				if (pointLights[i].position.z >= pointLightsZ[i] + 4) {
					upDown = false;
				} else if (pointLights[i].position.z <= pointLightsZ[i] - 4) {
					upDown = true;
				}
				if (upDown) {
					pointLights[i].position.lerp(new THREE.Vector3(pointLights[i].position.x, pointLights[i].position.y, pointLightsZ[i] + 15), 0.02);
				} else {
					pointLights[i].position.lerp(new THREE.Vector3(pointLights[i].position.x, pointLights[i].position.y, pointLightsZ[i] - 15), 0.02);
				}
			}
		}	
	}
}

// ========== MOVEMNET + EVENT ==========
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

var openURL = async (URL) => {
	if (!eventRunning) {
		eventRunning = true;
		window.open(URL);
	}
}

var applyMovement = async () => {
	let currentPos = getMapLocation(character.position);
	if (currentPos.x === INTRO.x && currentPos.y === INTRO.y) {
		if (progress.length === 3) {
			scene.add(progress.shift());
		}
		await openURL("AboutMe.html");
	} else if (currentPos.x === PORTFOLIO.x && currentPos.y === PORTFOLIO.y) {
		if (progress.length === 2) {
			scene.add(progress.shift());
		}
		await openURL("Portfolio.html");
	} else if ((currentPos.x === CONTACT.x && currentPos.y === CONTACT.y)) {
		if (progress.length === 1) {
			scene.add(progress.shift());
		}
		await openURL("contact.html");
	} else if ((currentPos.x === BONUS.x && currentPos.y === BONUS.y)) {
		await openURL("bonus.html");
	} else if (!(currentPos.x === INTRO.x && currentPos.y === INTRO.y) &&
				!(currentPos.x === PORTFOLIO.x && currentPos.y === PORTFOLIO.y) &&
				!(currentPos.x === CONTACT.x && currentPos.y === CONTACT.y)) {
		eventRunning = false;
	}

	if (isMoving) {
		if (path.length === 0) {
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
			}
		}
	}
}

// BFS pathfinding
var findPath = async (destination) => {
	let dest = getMapLocation(destination);
	let start = getMapLocation(character.position);
	
	// no need to calc this case
	if (dest.x === start.x && dest.y === start.y) {
		return [];
	}

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
	out = path.reverse();
	
	// make sure the character does not step on non-platform blocks
	for (let i = 0; i < DEST_BLACKLIST.length; i++) {
		if (out[out.length - 1].x === DEST_BLACKLIST[i].x &&
			out[out.length - 1].y === DEST_BLACKLIST[i].y) {
			out.pop();
			break;
		}
	}
	return out;
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

	renderer.domElement.addEventListener('click', onMouseDown, false);
	renderer.domElement.addEventListener('touchstart', onMouseDown, false);
}

var onMouseDown = async (event) => {
	controls.autoRotate = false; 
	isMoving = false;
	
	let intersects;
	if (!isMoving) {
		if (isMobile()) {
			mouse.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
			mouse.y = - (event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
		}

		mousePointer.setFromCamera(mouse, camera);
		intersects = mousePointer.intersectObjects(scene.children);

		if (intersects !== null && intersects.length > 0) {
			let target;
			for (let i = 0; i < intersects.length; i++) {
				if (intersects[i].object.type === TYPE_PLATFORM) {
					target = intersects[i].object;
					break;
				}
			}
			
			if (target !== null && 
				MOUSE_POINTED !== target &&
				target.position.z === Math.floor(data.floorplan.length / 2)
			) {
				MOUSE_POINTED = target;
				if (MOUSE_POINTED !== blockOnCursor) {
					if (blockOnCursor !== undefined) blockOnCursor.material.color.set(`rgb(${data.settings.cellColor})`);
					blockOnCursor = MOUSE_POINTED;
					blockOnCursor.material.color.set(0xFFFFFF);
				}	
			}
		} else {
			MOUSE_POINTED = undefined;
		}

		if (MOUSE_POINTED) {
			MOUSE_POINTED.material.color.set(0xFFFFFF);
			isMoving = true;
			path = await findPath(MOUSE_POINTED.position);
		}
	}
}

var isMobile = () => {
	var check = false;
	((a) => {
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) 
			check = true;
	}) (navigator.userAgent||navigator.vendor||window.opera);
	return check;
}
