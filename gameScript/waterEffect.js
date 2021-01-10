var loadWaterEffect = (scene) => {
	const refractorGeometry = new THREE.CircleBufferGeometry(500, 100);
	let refractor = new Refractor(refractorGeometry, {
		color: 0xccf6f0,
		textureWidth: 1024,
		textureHeight: 1024,
		shader: WaterRefractionShader
	});
	refractor.position.set(0, 0, -150);

	const dudvMap = new THREE.TextureLoader().load('texture/waterdudv.jpg');
	dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;
	refractor.material.uniforms[ "tDudv" ].value = dudvMap;
	
	scene.add(refractor);
	return refractor;
}

// add this line in request frame function
// waterEffect.material.uniforms["time"].value += clock.getDelta()