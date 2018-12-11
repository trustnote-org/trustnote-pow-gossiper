const assert		= require( 'assert' );
const { Gossiper }	= require( '../src/js/gossiper' );
const { GossiperPeer }	= require( '../src/js/gossiper-peer' );

/**
 *	@constants
 */
const _GossiperOptionsMaster	=
{
	seeds		: [],
	interval	: 1000,
	url		: 'wss://127.0.0.1:50000',
	address		: 'my_address',
	pfnSigner	: ( sMessage ) =>
	{
	}
};



describe( 'Gossiper.test', () =>
{
	it( 'should be able to set and retrieve local state', () =>
	{
		let g = new Gossiper( _GossiperOptionsMaster );
		g.setLocalValue( 'hi', 'hello', err => {} );

		assert.equal( 'hello', g.getLocalValue('hi') );
	});

	it( 'should be able to get a list of keys for a peer', ( pfnDone ) =>
	{
		let g = new Gossiper( _GossiperOptionsMaster );
		let oPeer1	= g.addOrUpdatePeer( 'ws://127.0.0.1:60001', {} );

		oPeer1.peer.setValue( 'key1', 'value1', 0, err =>
		{
			let arrAllKeys	= oPeer1.peer.getAllKeys();

			assert.equal( null, err );
			assert.equal( true, arrAllKeys.includes( 'key1' ) );

			pfnDone();
		});
	});

	it( 'should be able to get the value of a key for a peer', ( pfnDone ) =>
	{
		let g = new Gossiper( _GossiperOptionsMaster );
		let oPeer1	= g.addOrUpdatePeer( 'ws://127.0.0.1:60001', {} );

		oPeer1.peer.setValue( 'key1', 'value1', 0, err =>
		{
			let sValue1	= oPeer1.peer.getValue( 'key1' );

			assert.equal( null, err );
			assert.equal( 'value1', sValue1 );

			pfnDone();
		});
	});

	it( 'should be able to get a list of peers', () =>
	{
		let g = new Gossiper( _GossiperOptionsMaster );
		let sPeerUrl1		= 'ws://127.0.0.1:60001';
		let sPeerUrl2		= 'ws://127.0.0.1:60002';
		let oPeer1		= g.addOrUpdatePeer( sPeerUrl1, {} );
		let oPeer2		= g.addOrUpdatePeer( sPeerUrl2, {} );
		let arrAllPeerUrls	= g.m_oScuttle.getAllPeerUrls();

		assert.equal( true, arrAllPeerUrls.includes( oPeer1.peer.getUrl() ) );
		assert.equal( true, arrAllPeerUrls.includes( oPeer2.peer.getUrl() ) );
	});

	it( 'should be able to get address, pfnSigner from local peer', () =>
	{
		let g = new Gossiper( _GossiperOptionsMaster );
		let oLocalPeer	= g.m_oScuttle.getLocalPeer();

		assert.equal( 'function', typeof oLocalPeer.getLocalSigner() );
	});

	it( 'should emit new_peer event when we learn about a new peer', ( pfnDone ) =>
	{
		let g = new Gossiper( _GossiperOptionsMaster );

		//	mock scuttle
		let oMockScuttle	= {
			'ws://127.0.0.1:60001'	: 100,
			'ws://127.0.0.1:60002'	: 100,
		};
		let arrLeanedPeerNames	= [];

		g.on( 'new_peer', sNewPeerName =>
		{
			arrLeanedPeerNames.push( sNewPeerName );
			assert.ok( arrLeanedPeerNames.length > 0 );

			if ( Object.keys( oMockScuttle ).length === arrLeanedPeerNames.length )
			{
				assert.deepEqual( arrLeanedPeerNames, Object.keys( oMockScuttle ) );
				pfnDone();
			}
		});
		g._firstResponseMessage( oMockScuttle );
	});


	it( 'should emit update event when we learn more about a peer', ( pfnDone ) =>
	{
		let g		= new Gossiper( _GossiperOptionsMaster );
		let sPeerUrl1	= 'ws://127.0.0.1:60001';
		let oPeer1	= g.addOrUpdatePeer( sPeerUrl1, {} );

		g.on( 'peer_update', ( sPeerName, sKey, vValue ) =>
		{
			let arrUpdated = [ sPeerName, sKey, vValue ];
			assert.deepEqual
			(
				[ sPeerUrl1, 'key1', 'value1' ],
				arrUpdated
			);

			assert.equal( true, g.m_oScuttle.getAllPeerUrls().includes( sPeerUrl1 ) );
			assert.equal( true, g.m_oScuttle.getLivePeerUrls().includes( sPeerUrl1 ) );
			assert.deepEqual( g.m_oScuttle.getDeadPeerUrls(), [] );

			//	...
			pfnDone();
		});

		oPeer1.peer.updateLocalValueAndMaxVersion( 'key1', 'value1', err =>
		{
			if ( err )
			{
				return console.error( err );
			}
		});
	});

});