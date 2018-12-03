const assert		= require( 'assert' );
const { Gossiper }	= require( '../js/gossiper' );
const { GossiperPeer }	= require( '../js/gossiper-peer' );


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
		let oOption2	= Object.assign( {}, _GossiperOptionsMaster, { url : 'ws://127.0.0.1:50001' } );
		let oG2		= new Gossiper( oOption2 );
		oG2.start( {} );

		let oOption3	= Object.assign( {}, _GossiperOptionsMaster, { url : 'ws://127.0.0.1:50002' } );
		let oG3		= new Gossiper( oOption3 );
		oG3.start( {} );

		let oOption1	= Object.assign( {}, _GossiperOptionsMaster, { url : 'ws://127.0.0.1:50000' } );
		let oG1		= new Gossiper( oOption1 );
		oG1.addOrUpdatePeer( oOption2.url, oOption2 );
		oG1.addOrUpdatePeer( oOption3.url, oOption3 );

		oG1.start( {} );


		//
		//	...
		//
		let bAliveEmitted	= false;
		let bDeadEmitted	= false;

		oG3.on( 'peer_alive', ( sPeerUrl ) =>
		{
			console.log( `peer_alive :: ${ sPeerUrl }` );

			bAliveEmitted = true;
			assert.equal( oOption2.url, sPeerUrl );
		});
		oG3.on( 'peer_failed', ( sPeerUrl ) =>
		{
			console.log( `peer_failed :: ${ sPeerUrl }` );

			bDeadEmitted = true;
			assert.equal( oOption2.url, sPeerUrl );
		});


		//	...
		setTimeout
		(
			() =>
			{
				console.log( "stopping peer 2" );
				oG2.stop();
			},
			1000
		);

		setTimeout
		(
			() =>
			{
				console.log( "starting peer 2" );
				oG2.start( {} );
			},
			4500
		);

		setTimeout
		(
			() =>
			{
				oG2.stop();
				oG1.stop();
				oG3.stop();

				assert.ok( bAliveEmitted );
				assert.ok( bDeadEmitted );

				//	...
				pfnDone();
			},
			55000
		);
	});
});