const assert			= require( 'assert' );
const { GossiperScuttle }	= require( '../lib/gossiper-scuttle' );
const { GossiperPeer }		= require( '../lib/gossiper-peer' );


describe( 'peer_state.test', () =>
{
	//	digest
	it( 'digest should have max versions we have seen', () =>
	{
		let sPeerName1	= '127.0.0.1:60001';
		let sPeerName2	= '127.0.0.1:60002';
		let sPeerName3	= '127.0.0.1:60003';

		let p1	= new GossiperPeer( sPeerName1 );
		p1.m_nMaxVersionSeen = 10;

		let p2	= new GossiperPeer( sPeerName2 );
		p2.m_nMaxVersionSeen = 12;

		let p3	= new GossiperPeer( sPeerName3 );
		p3.m_nMaxVersionSeen = 22;


		let oPeers =
		{
			[ sPeerName1 ]	: p1,
			[ sPeerName2 ]	: p2,
			[ sPeerName3 ]	: p3,
		};
		let oScuttle = new GossiperScuttle( oPeers );
		assert.deepEqual
		(
			{
				[ sPeerName1 ]	: 10,
				[ sPeerName2 ]	: 12,
				[ sPeerName3 ]	: 22
			},
			oScuttle.digest()
		);
	});

	//	scuttle
	//	scuttle new peer
	it( 'new peers should be in result', () =>
	{
		let oScuttle	= new GossiperScuttle( {} );
		let oResult	= oScuttle.scuttle( { 'new_peer': 12 } );

		assert.deepEqual( [ 'new_peer' ], oResult.new_peers );
	});

	it( 'request all information about a new peer', () =>
	{
		let oScuttle	= new GossiperScuttle( {} );
		let oResult 	= oScuttle.scuttle( { 'new_peer' : 12 } );

		assert.deepEqual( { 'new_peer' : 0 }, oResult.requests );
	});

	//	scuttle deltas
	it( 'send peer all deltas for peers we know more about', ( pfnDone ) =>
	{
		let oPeer1	= new GossiperPeer();

		oPeer1.updateLocalValue( 'hi', 'hello', err =>
		{
			oPeer1.updateLocalValue( 'meh', 'goodbye', err =>
			{
				let oScuttle	= new GossiperScuttle( { 'me' : oPeer1 } );
				let oResult	= oScuttle.scuttle( { 'me': 0, 'new_peer': 12 } );

				assert.deepEqual
				(
					[
						[ 'me', 'hi', 'hello', 1 ],
						[ 'me', 'meh', 'goodbye', 2 ]
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
