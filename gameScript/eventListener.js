const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let character;
let INTERSECTED;

var resizeListener = () => {
	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth/window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}, false);
}

var mouseListener = () => {
	renderer.domElement.addEventListener('mousemove', (event) => {
		event.preventDefault();
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	}, false);

	renderer.domElement.addEventListener('click', (event) => {
		event.preventDefault();
		if (INTERSECTED) {
			character.position.set(INTERSECTED.position.x, INTERSECTED.position.y, INTERSECTED.position.z);
		}
	}, false);
}

var loadListener = () => {
	window.addEventListener('load', () => {
		settings = data.settings;
		document.body.style.background = `rgb(${settings.background})`;
		floorplan = data.floorplan;
		initGame();
		character = loadCharacter(scene);
		
		animate();
	});

	const animate = () => {
		// animate
		requestAnimationFrame(animate);
		if (controls) controls.update();

		// cursor action
		raycaster.setFromCamera(mouse, camera);
		const intersects = raycaster.intersectObjects(scene.children);

		if (intersects.length > 0) {
			if (INTERSECTED !== intersects[0].object && intersects[0].object.type === TYPE_PLATFORM) {
				if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
				INTERSECTED = intersects[0].object;
				INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
				INTERSECTED.material.emissive.setHex( 0xff0000 );
			}
		} else {
			if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
			INTERSECTED = undefined;
		}

		// render
		renderer.render(scene, camera);
	}
}