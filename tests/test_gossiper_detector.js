const assert			= require( 'assert' );
const { GossiperDetector }	= require( '../js/gossiper-detector' );


describe( 'GossiperDetector.test', () =>
{
	it( 'should have a low phi value after only a second', () =>
	{
		let afd = new GossiperDetector();
		let time = 0;

		for ( let i = 0; i < 100; i++)
		{
			time += 1000;
			afd.add(time);
		}

		assert.ok( afd.phi( time + 1000 ) < 0.5 );
	});

	it( 'should have a high phi value after ten seconds', () =>
	{
		let afd = new GossiperDetector();
		let time = 0;

		for ( let i = 0; i < 100; i++ )
		{
			time += 1000;
			afd.add(time);
		}

		assert.ok( afd.phi( time + 10000 ) > 4 );
	});

	it( 'should only keep last 1000 values', () =>
	{
		let afd = new GossiperDetector();
		let time = 0;

		for ( let i = 0; i < 2000; i++ )
		{
			time += 1000;
			afd.add(time);
		}

		assert.equal( 1000, afd.m_arrIntervalList.length );
	});

});
