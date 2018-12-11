const _log			= require( 'npmlog' );

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
	url		: 'ws://127.0.0.1:50000',
	address		: 'my_address',
	pfnSigner	: ( sMessage ) =>
	{
	}
};



//
//	mocha --timeout 80000
//
describe( 'Gossiper.heartbeat.test', () =>
{
	it( 'heartbeat', ( pfnDone ) =>
	{
		//	create a child Gossiper
		let oOptChild	= Object.assign( {}, _GossiperOptionsMaster, { url : 'ws://127.0.0.1:50001', address : 'child-address' } );
		let oGChild	= new Gossiper( oOptChild );
		oGChild.start( {} );

		let oOptMaster	= Object.assign( {}, _GossiperOptionsMaster, { url : 'ws://127.0.0.1:50000', address : 'master-address' } );
		let oGMaster	= new Gossiper( oOptMaster );

		oGMaster.addOrUpdatePeer( oOptChild.url, oOptChild );
		oGMaster.start( {} );

		//
		//	...
		//
		let bAliveEmitted	= false;
		let bDeadEmitted	= false;

		oGMaster.on( 'peer_alive', ( sPeerUrl ) =>
		{
			_log.info( 'test_heartbeat', `))) peer_alive :: ${ sPeerUrl }` );

			bAliveEmitted = true;
			assert.equal( oOptChild.url, sPeerUrl );
		});
		oGMaster.on( 'peer_failed', ( sPeerUrl ) =>
		{
			_log.info( 'test_heartbeat', `))) peer_failed :: ${ sPeerUrl }` );

			bDeadEmitted = true;
			assert.equal( oOptChild.url, sPeerUrl );
		});

		//
		//	step 1
		//	mock a message arrived from child peer
		//
		oGMaster.m_oScuttle.getPeer( oOptChild.url ).m_oDetector.arrival();

		//
		//	step 2
		//
		setTimeout
		(
			() =>
			{
				console.log( "mock a message arrived from child peer after 40000 seconds" );
				oGMaster.m_oScuttle.getPeer( oOptChild.url ).m_oDetector.arrival();
			},
			40000
		);
		setTimeout
		(
			() =>
			{
				assert.ok( bAliveEmitted );
				assert.ok( bDeadEmitted );

				//	...
				pfnDone();
			},
			55000
		);
	});
});