var loadCharacter = (scene) => {
	const objLoader = new THREE.OBJLoader();
	const mtlLoader = new THREE.MTLLoader();

	// set asset paths
	objLoader.setPath('./asset/object/');
	mtlLoader.setPath('./asset/object/');

	// load objects
	new Promise((resolve) => {
		mtlLoader.load('character.mtl', (materials) => {
		resolve(materials);
		});
	}).then((materials) => {
		materials.preload();
		objLoader.setMaterials(materials);
		objLoader.load('character.obj', (object) => {
			object.position.set(1, 1, 1);
			object.rotateX(Math.PI/2);
			object.rotateY(Math.PI/2);	
			object.scale.set(0.2, 0.2, 0.2);
			// object.scale.set(1, 1, 1);

			// renderer.domElement.addEventListener('click', (event) => {
			// 	posX = ( event.clientX / window.innerWidth ) * 2 - 1;
			// 	posY = - ( event.clientY / window.innerHeight ) * 2 + 1;
			// 	object.position.set(posX, posY, 100);
			// 	console.log(object.position);
			// },false);

			scene.add(object);
			character = object;
			loadedObject = object;
		})
	});
}