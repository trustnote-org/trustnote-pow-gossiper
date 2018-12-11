const assert			= require( 'assert' );
const { GossiperDetector }	= require( '../src/js/gossiper-detector' );


describe( 'GossiperDetector.test', () =>
{
	it( 'should have a low phi value after only a second', pfnDone =>
	{
		let oDetector	= new GossiperDetector();
		let nCount	= 100;

		let pfnCallback	= () =>
		{
			assert.ok( oDetector.getPhi() < 0.5 );
			pfnDone();
		};

		let nInterval	= setInterval( () =>
		{
			oDetector.arrival();
			if ( 0 === nCount )
			{
				pfnCallback();
				clearInterval( nInterval );
			}

			nCount --;

		}, 100 );
	});

	// it( 'should have a high phi value after ten seconds', () =>
	// {
	// 	let afd = new GossiperDetector();
	// 	let time = 0;
	//
	// 	for ( let i = 0; i < 100; i++ )
	// 	{
	// 		time += 1000;
	// 		afd.add(time);
	// 	}
	//
	// 	assert.ok( afd.phi( time + 10000 ) > 4 );
	// });
	//
	it( 'should only keep last 1000 values', () =>
	{
		let oDetector	= new GossiperDetector();

		for ( let i = 0; i < 2000; i++ )
		{
			oDetector.arrival();
		}

		assert.equal( 1000, oDetector.m_arrIntervalList.length );
	});

});
