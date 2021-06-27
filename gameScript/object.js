var loadCharacter = async (scene) => {
	const objLoader = new THREE.OBJLoader();
	const mtlLoader = new THREE.MTLLoader();

	// set asset paths
	objLoader.setPath('./asset/object/');
	mtlLoader.setPath('./asset/object/');

	// load objects

	await mtlLoader.load('character.mtl', (materials) => {
		materials.preload();
		objLoader.setMaterials(materials);
		objLoader.load('character.obj', (object) => {
			object.position.set(0, 0 - (6 * blockSize), 0 + (1 * blockSize));
			object.rotation.set(0, Math.PI/2, Math.PI/2);
			// object.scale.set(1, 1, 1);
			object.scale.set(0.2, 0.2, 0.2);

			scene.add(object);
			character = object;
		});
	});
}