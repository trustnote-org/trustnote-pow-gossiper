const assert		= require( 'assert' );
const { Gossiper }	= require( '../js/gossiper' );
const { GossiperPeer }	= require( '../js/gossiper-peer' );


//
//	mocha --timeout 12000
//
// describe( 'Gossiper.basic.test', () =>
// {
// 	it( 'heartbeat', ( pfnDone ) =>
// 	{
// 		let oSeed = new Gossiper( { ip : '127.0.0.1', port : 7000, seeds : [] } );
// 		oSeed.start( err => {} );
//
// 		let oG1 = new Gossiper( { ip : '127.0.0.1', port : 7001, seeds : ['127.0.0.1:7000'] } );
// 		oG1.start( err => {} );
// 		oG1.setLocalValue( 'holla', 'at', err => {} );
//
// 		let oG2 = new Gossiper( { ip : '127.0.0.1', port : 7002, seeds : ['127.0.0.1:7000'] } );
// 		oG2.start( err => {} );
// 		oG2.setLocalValue( 'your', 'node', err => {} );
//
// 		setTimeout
// 		(
// 			() =>
// 			{
// 				oSeed.stop();
// 				oG1.stop();
// 				oG2.stop();
//
// 				//	...
// 				assert.equal( 'node', oG1.getPeerValue( '127.0.0.1:7002', 'your' ) );
// 				assert.equal( 'node', oG2.getPeerValue( '127.0.0.1:7002', 'your' ) );
// 				assert.equal( 'node', oSeed.getPeerValue( '127.0.0.1:7002', 'your' ) );
// 				assert.equal( 'at', oG2.getPeerValue( '127.0.0.1:7001', 'holla' ) );
//
// 				//	...
// 				pfnDone();
// 			},
// 			10000
// 		);
// 	});
// });