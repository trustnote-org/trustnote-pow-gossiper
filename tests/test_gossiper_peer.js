const assert		= require( 'assert' );
const { GossiperPeer }	= require( '../src/js/gossiper-peer' );


describe( 'GossiperPeer.test', () =>
{
	//	UpdateWithDelta
	it( "updateWithDelta should set key to value", ( pfnDone ) =>
	{
		let ps = new GossiperPeer( { url : 'ws://127.0.0.1:50000', address: 'my_address' } );
		ps.updateWithDelta( 'a', 'hello', 12, err =>
		{
			assert.equal( 'hello', ps.getValue( 'a' ) );
			pfnDone();
		});
	});

	it( "updateWithDelta should update the max version", ( pfnDone ) =>
	{
		let ps = new GossiperPeer( { url : 'ws://127.0.0.1:50000', address: 'my_address' } );
		ps.updateWithDelta( 'a', 'hello', 12, err1 =>
		{
			ps.updateWithDelta( 'a', 'hello', 14, err2 =>
			{
				assert.equal( 14, ps.getMaxVersion() );
				pfnDone();
			});
		});
	});

	it( "updates should trigger 'update' event", ( pfnDone ) =>
	{
		let ps = new GossiperPeer( { url : 'ws://127.0.0.1:50000', address: 'my_address' } );
		let n = 0;

		ps.on( 'peer_update', function( k, v )
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
		let ps = new GossiperPeer( { url : 'ws://127.0.0.1:50000', address: 'my_address' } );

		ps.updateLocalValueAndMaxVersion( 'a', 'hello', err =>
		{
			assert.equal( 'hello', ps.getValue( 'a' ) );
			pfnDone();
		});
	});

	it ( "updateLocalValue should increment the max version", ( pfnDone ) =>
	{
		let ps = new GossiperPeer( { url : 'ws://127.0.0.1:50000', address: 'my_address' } );

		ps.updateLocalValueAndMaxVersion( 'a', 'hello', err1 =>
		{
			ps.updateLocalValueAndMaxVersion( 'a', 'hello', err2 =>
			{
				assert.equal( 2, ps.getMaxVersion() );
				pfnDone();
			});
		});
	});

	//	getDeltasAfterVersion
	it( "getDeltasAfterVersion should return all deltas after a version number", ( pfnDone ) =>
	{
		let ps = new GossiperPeer( { url : 'ws://127.0.0.1:50000', address: 'my_address' } );
		ps.updateLocalValueAndMaxVersion( 'a', 1, err1 =>
		{
			ps.updateLocalValueAndMaxVersion( 'b', 'blah', err2 =>
			{
				ps.updateLocalValueAndMaxVersion( 'a', 'super', err3 =>
				{
					assert.equal( 3, ps.getMaxVersion() );
					assert.deepEqual( [ [ 'a', 'super', 3 ], [ 'b', 'blah', 2 ] ], ps.getDeltasAfterVersion( 1 ) );
					assert.deepEqual( [ [ 'a', 'super', 3 ] ], ps.getDeltasAfterVersion( 2 ) );
					assert.deepEqual( [], ps.getDeltasAfterVersion( 3 ) );

					//	...
					pfnDone();
				});
			});
		});
	});

});
