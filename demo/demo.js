const { DeUtilsCore }	= require( 'deutils.js' );
const { Gossiper }	= require( '../js/gossiper.js' );
const _ws_service	= require( '../js/gossiper-ws.js' );



/**
 *	global values
 */
let _seed_servers	= [
	'ws://127.0.0.1:50000',
];


/**
 * 	service port
 */
let _servicePort	= 50000;
if ( Array.isArray( process.argv ) && process.argv.length >= 3 )
{
	_servicePort	= parseInt( process.argv[ 2 ] );
}


/**
 *	Gossiper options
 */
let _oGossiperOptions	= {
	interval	: 1000,
	url		: `ws://127.0.0.1:${ _servicePort }`,
	address		: `super_node_address_[${ _servicePort }]`,
	pfnSigner	: ( oJsonMessage, pfnCallback ) =>
	{
		return pfnCallback( null, 'ffOe0whco7/QFJ3ttbdmq4t1QImqizd3G+DlXC/XWltrlv8CZo6jJtUWMpHsGXoA0gtDWZk6RVy0oLEMf7FBCw==' );
	},
	pfnVerify	: ( oJsonMessage, sAddress, sSignature, pfnCallback ) =>
	{
		return pfnCallback( null );
	}
};
let _oGossiper	= new Gossiper( _oGossiperOptions );



/**
 * 	Gossiper
 */
function startGossiper()
{
	_oGossiper.on( 'peer_update', ( sPeerUrl, sKey, vValue ) =>
	{
		console.log( `))) EVENT [peer_update] :: `, sPeerUrl, sKey, vValue );
	});
	_oGossiper.on( 'peer_alive', ( sPeerUrl ) =>
	{
	//	console.log( `))) EVENT [peer_alive] :: `, sPeerUrl );
	});
	_oGossiper.on( 'peer_failed', ( sPeerUrl ) =>
	{
	//	console.log( `))) EVENT [peer_failed] :: `, sPeerUrl );
	});
	_oGossiper.on( 'new_peer', ( sPeerUrl ) =>
	{
		console.log( `))) EVENT [new_peer] :: `, sPeerUrl );
		if ( sPeerUrl !== _oGossiperOptions.url &&
			! _oGossiper.m_oRouter.getSocket( sPeerUrl ) )
		{
			connectToServer( sPeerUrl );
		}
	});


	let oSeeds = {};

	//
	//	start gossiper
	//
	_oGossiper.start( oSeeds );


	//
	//	update data
	//
	setInterval
	(
		() =>
		{
			_oGossiper.setLocalValue( `key_${ _servicePort }`, { now : Date.now(), say : 'yes' }, err =>{} );
		},
		DeUtilsCore.getRandomInt( 1000, 2000 )
	);
}

function onReceiveMessage( sSideType, oWs, sMessage )
{
	try
	{
		let arrJson = JSON.parse( sMessage );
		if ( Array.isArray( arrJson ) &&
			2 === arrJson.length &&
			'gossiper' === arrJson[ 0 ] &&
			DeUtilsCore.isPlainObjectWithKeys( arrJson[ 1 ], 'type' ) )
		{
			_oGossiper.onReceivedMessage( oWs, arrJson[ 1 ] );
		}
		else
		{
			console.error( `${ sSideType } >> invalid message/JSON: ${ sMessage }` );
		}
	}
	catch( e )
	{
		console.error( `${ sSideType } >> onReceivedMessage occurred exception: ${ JSON.stringify( e ) }` );
	}
}


/**
 *	Server
 */
function startServer()
{
	const oServerOptions	= {
		url		: _oGossiperOptions.url,
		port		: _servicePort,
		onStart		: ( err, oWsServer ) =>
		{
			if ( err )
			{
				return console.error( err );
			}

			console.log( `SERVER >> socket server started:${ oWsServer }.` );
			console.log(
				oWsServer.options.host,
				oWsServer.options.port,
				oWsServer.options.handleProtocols,
				oWsServer.options.path );
		},
		onConnection	: ( err, oWs ) =>
		{
			if ( err )
			{
				return console.error( err );
			}

			console.log( `SERVER >> a new client connected in.` );
			console.log( `SERVER >> oWs.url : ${ oWs.url }` );
		},
		onMessage	: ( oWs, sMessage ) =>
		{
			//console.log( `SERVER >> received a message: ${ sMessage }` );
			onReceiveMessage( 'SERVER', oWs, sMessage );
		},
		onError		: ( oWs, vError ) =>
		{
			console.error( `SERVER >> occurred an error: `, vError );
		},
		onClose		: ( oWs, sReason ) =>
		{
			console.log( `SERVER >> socket was closed(${ sReason })` );
		}
	};
	_ws_service.server.createServer( oServerOptions );
}


/**
 *	Client
 */
function connectToServer( sRemotePeerUrl )
{
	if ( _oGossiperOptions.url === sRemotePeerUrl )
	{
		console.log( `CAN'T CONNECT TO SELF.` );
		return false;
	}

	const oClientOptions	= {
		minerGateway	: sRemotePeerUrl,
		onOpen		: ( err, oWs ) =>
		{
			if ( err )
			{
				return console.error( err );
			}

			console.log( `CLIENT >> we have connected to ${ oWs.host } successfully.` );

			//
			//	update the remote socket
			//
			oWs.url	= sRemotePeerUrl;
			_oGossiper.updatePeerList({
				[ sRemotePeerUrl ] : oWs
			});
		},
		onMessage	: ( oWs, sMessage ) =>
		{
			//console.log( `CLIENT >> received a message : ${ sMessage }` );
			onReceiveMessage( 'CLIENT', oWs, sMessage );
		},
		onError		: ( oWs, vError ) =>
		{
			console.error( `CLIENT >> error from server ${ oClientOptions.minerGateway }: `, vError );

			//	...
			setTimeout( () =>
			{
				connectToServer( sRemotePeerUrl );

			}, 2000 );
		},
		onClose		: ( oWs, sReason ) =>
		{
			console.log( `CLIENT >> socket was closed(${ sReason })` );
		}
	};
	_ws_service.client.connectToServer( oClientOptions );

	//	...
	return true;
}




/**
 *	start
 */
startGossiper();
startServer();
for ( let nIndex in _seed_servers )
{
	let sPeerSeed	= _seed_servers[ nIndex ];
	connectToServer( sPeerSeed );
}