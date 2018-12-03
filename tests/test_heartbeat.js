const assert		= require( 'assert' );
const { Gossiper }	= require( '../lib/gossiper' );
const { GossiperPeer }	= require( '../lib/gossiper-peer' );



//
//	mocha --timeout 80000
//
describe( 'Gossiper.heartbeat.test', () =>
{
	it( 'heartbeat', ( pfnDone ) =>
	{
		let oPeerMaster = new Gossiper( { ip : '127.0.0.1', port : 7000, seeds : [] } );
		oPeerMaster.start( () =>{} );

		let g1 = new Gossiper( { ip : '127.0.0.1', port : 7001, seeds : ['127.0.0.1:7000'] } );
		g1.start( () =>{} );

		let g2 = new Gossiper( { ip : '127.0.0.1', port : 7002, seeds : ['127.0.0.1:7000'] } );
		g2.start( () =>{} );


		//
		//	...
		//
		let bDeadEmitted	= false;
		let bAliveEmitted	= false;

		g2.on( 'peer_failed', ( sPeerName ) =>
		{
			bDeadEmitted = true;
			assert.equal( '127.0.0.1:7001', sPeerName );
		});

		g2.on( 'peer_alive', ( sPeerName ) =>
		{
			bAliveEmitted = true;
			assert.equal( '127.0.0.1:7001', sPeerName );
		});


		//	...
		setTimeout
		(
			() =>
			{
				console.log( "stopping g1" );
				g1.stop();
			},
			10000
		);

		setTimeout
		(
			() =>
			{
				console.log( "starting g1" );
				g1.start( () =>{} );

			},
			45000
		);

		setTimeout
		(
			() =>
			{
				g1.stop();
				oPeerMaster.stop();
				g2.stop();

				assert.ok( bDeadEmitted );
				assert.ok( bAliveEmitted );

				//	...
				pfnDone();
			},
			55000
		);
	});
});