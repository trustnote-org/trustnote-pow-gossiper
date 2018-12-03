const assert			= require( 'assert' );
const { GossiperScuttle }	= require( '../js/gossiper-scuttle' );
const { GossiperPeer }		= require( '../js/gossiper-peer' );


describe( 'GossiperScuttle.test', () =>
{
	//	digest
	it( 'digest should have max versions we have seen', () =>
	{
		let sPeerUrl1	= 'ws://127.0.0.1:60001';
		let sPeerUrl2	= 'ws://127.0.0.1:60002';
		let sPeerUrl3	= 'ws://127.0.0.1:60003';

		//	create Scuttle with peer 1
		let oScuttle = new GossiperScuttle( { url : sPeerUrl1, address : 'my address 1', pfnSigner : sMessage => {} } );

		//	create peer 2, 3
		oScuttle.createPeer( sPeerUrl2, { url : sPeerUrl2, address : 'my address 2' } );
		oScuttle.createPeer( sPeerUrl3, { url : sPeerUrl3, address : 'my address 3' } );

		//	force to update max version
		oScuttle.getPeer( sPeerUrl1 ).m_nMaxVersion	= 10;
		oScuttle.getPeer( sPeerUrl2 ).m_nMaxVersion	= 12;
		oScuttle.getPeer( sPeerUrl3 ).m_nMaxVersion	= 22;

		//
		//	assert
		//
		assert.deepEqual
		(
			{
				[ sPeerUrl1 ]	: 10,
				[ sPeerUrl2 ]	: 12,
				[ sPeerUrl3 ]	: 22
			},
			oScuttle.digest()
		);
	});

	//	scuttle
	//	scuttle new peer
	it( 'new peers should be in result', () =>
	{
		let sPeerUrl1	= 'ws://127.0.0.1:60001';

		let oScuttle	= new GossiperScuttle( { url : sPeerUrl1, address : 'my address 1', pfnSigner : sMessage => {} } );
		let oResult	= oScuttle.scuttle( { 'new_peer': 12 } );

		assert.deepEqual( [ 'new_peer' ], oResult.new_peers );
	});

	it( 'request all information about a new peer', () =>
	{
		let sPeerUrl1	= 'ws://127.0.0.1:60001';

		let oScuttle	= new GossiperScuttle( { url : sPeerUrl1, address : 'my address 1', pfnSigner : sMessage => {} } );
		let oResult 	= oScuttle.scuttle( { 'new_peer' : 12 } );

		assert.deepEqual( { 'new_peer' : 0 }, oResult.requests );
	});

	//	scuttle deltas
	it( 'send peer all deltas for peers we know more about', ( pfnDone ) =>
	{
		let sPeerUrl1	= 'ws://127.0.0.1:60001';
		let sPeerUrl2	= 'ws://127.0.0.1:60002';

		let oScuttle	= new GossiperScuttle( { url : sPeerUrl1, address : 'my address 1', pfnSigner : sMessage => {} } );
		oScuttle.createPeer( sPeerUrl2, { url : sPeerUrl2, address : 'my address 2' } );

		let oPeer1	= oScuttle.getPeer( sPeerUrl1 );
		let oPeer2	= oScuttle.getPeer( sPeerUrl2 );

		oPeer1.updateLocalValueAndMaxVersion( 'hi', 'hello', err1 =>
		{
			oPeer2.updateLocalValueAndMaxVersion( 'me', 'goodbye', err2 =>
			{
				let oResult	= oScuttle.scuttle( { [ sPeerUrl1 ] : 0, [ sPeerUrl2 ] : 0 } );

				assert.deepEqual
				(
					[
						[ sPeerUrl1, 'hi', 'hello', 1 ],
						[ sPeerUrl2, 'me', 'goodbye', 1 ]
					],
					oResult.deltas
				);

				//	...
				pfnDone();
			});
		});
	});

	//
	//	deltas should be sorted by version number
	//	deltas should be ordered by the peer with the most
	//

});
