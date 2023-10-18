var loadCharacter = async (scene) => {
	const objLoader = new THREE.OBJLoader();
	const mtlLoader = new THREE.MTLLoader();

	// set asset paths
	objLoader.setPath('./objects/character/');
	mtlLoader.setPath('./objects/character/');

	// load objects
	await mtlLoader.load('character.mtl', (materials) => {
		materials.preload();
		objLoader.setMaterials(materials);
		objLoader.load('character.obj', (object) => {
			// place character to the starting pos
			let pos = getActualPosition({
				x: Math.ceil(data.floorplan[0].length / 2),
				y: 0,
				z: Math.floor(data.floorplan.length / 2)
			});
			if (isBonus) {
				object.position.set(
					Math.ceil(data.bonusStage[0].length / 2),
					0,
					Math.floor(data.bonusStage.length / 2)
				);
			} else {
				object.position.set(
					pos.x,
					pos.y,
					pos.z
				);
			}
			object.rotation.set(0, Math.PI/2, Math.PI/2);
			object.scale.set(0.2, 0.2, 0.2);

			scene.add(object);
			character = object;
		});
	});
}

var loadIntro = async () => {

}

var loadSomething = async () => {
	
}

var loadElse = async () => {
	
}

var loadPortfolio = async () => {
	
}

var loadContact = async () => {
	
}