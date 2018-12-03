const assert		= require( 'assert' );
const { GossiperPeer }	= require( '../lib/gossiper-peer' );


describe( 'GossiperPeer.test', () =>
{
	//	UpdateWithDelta
	it( "updateWithDelta should set key to value", ( pfnDone ) =>
	{
		let ps = new GossiperPeer();
		ps.updateWithDelta( 'a', 'hello', 12, err =>
		{
			assert.equal( 'hello', ps.getValue( 'a' ) );
			pfnDone();
		});
	});

	it( "updateWithDelta should update the max version", ( pfnDone ) =>
	{
		let ps = new GossiperPeer();
		ps.updateWithDelta( 'a', 'hello', 12, err1 =>
		{
			ps.updateWithDelta( 'a', 'hello', 14, err2 =>
			{
				assert.equal( 14, ps.m_nMaxVersionSeen );
				pfnDone();
			});
		});
	});

	it( "updates should trigger 'update' event", ( pfnDone ) =>
	{
		let ps = new GossiperPeer();
		let n = 0;

		ps.on( 'update', function( k, v )
		{
			++n;
			assert.equal( 'a', k );
			assert.equal( 'hello', v );

			//	...
			assert.equal( 1, n );
			pfnDone();
		});

		ps.updateWithDelta( 'a', 'hello', 12, err =>
		{
		});
	});

	//	updateLocalValue
	it( "updateLocalValue should set key to value", ( pfnDone ) =>
	{
		let ps = new GossiperPeer();

		ps.updateLocalValue( 'a', 'hello', err =>
		{
			assert.equal( 'hello', ps.getValue( 'a' ) );
			pfnDone();
		});
	});

	it ( "updateLocalValue should increment the max version", ( pfnDone ) =>
	{
		let ps = new GossiperPeer();

		ps.updateLocalValue( 'a', 'hello', err1 =>
		{
			ps.updateLocalValue( 'a', 'hello', err2 =>
			{
				assert.equal( 2, ps.m_nMaxVersionSeen );
				pfnDone();
			});
		});
	});

	//	getDeltasAfterVersion
	it( "getDeltasAfterVersion should return all deltas after a version number", ( pfnDone ) =>
	{
		let ps = new GossiperPeer();
		ps.updateLocalValue( 'a', 1, err1 =>
		{
			ps.updateLocalValue( 'b', 'blah', err2 =>
			{
				ps.updateLocalValue( 'a', 'super', err3 =>
				{
					assert.deepEqual( [ [ 'a','super','3' ] ], ps.getDeltasAfterVersion( 2 ) );
					pfnDone();
				});
			});
		});
	});

});
