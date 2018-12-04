const _fs			= require( 'fs' );
const _log			= require( 'npmlog' );
const { EventEmitter }		= require( 'events' );
const { DeUtilsCore }		= require( 'deutils.js' );

const { GossiperRouter }	= require( './gossiper-router' );
const { GossiperScuttle }	= require( './gossiper-scuttle' );
const { GossiperUtils }		= require( './gossiper-utils' );
const { GossiperMessages }	= require( './gossiper-constants' );
const { GossiperEvents }	= require( './gossiper-constants' );



/**
 *	@constants
 */
const DEFAULT_INTERVAL		= 1000;		//	default interval in milliseconds for gossiper communication





/**
 *	@class Gossiper over Web Socket
 */
class Gossiper extends EventEmitter
{
	/**
	 *	@constructor
	 *
	 *	@param	{object}	oOptions
	 *	@param	{number}	oOptions.interval	- interval in milliseconds for gossiper communication
	 *	@param	{string}	oOptions.url		- local url, 'wss://127.0.0.1:6000', 'udp|tcp...://127.0.0.1:6000' or undefined
	 *	@param	{string}	oOptions.address	- local super node address
	 *	@param	{function}	oOptions.pfnSigner	- local signer function provided by super node
	 */
	constructor( oOptions )
	{
		super();

		//	...
		this.m_nInterval	= DeUtilsCore.isPlainObjectWithKeys( oOptions, 'interval' ) ? oOptions.interval : DEFAULT_INTERVAL;

		//
		//	gossiper router
		//
		this.m_oRouter		= new GossiperRouter();

		//
		//	Scuttle
		//
		this.m_oScuttle		= new GossiperScuttle( oOptions );
	}


	/**
	 * 	start
	 *
	 *	@param	{object}	oSeeds		- seeds for initializing Gossiper
	 *		{
	 *			'wss://127.0.0.1:60001'	: {
	 *				url	: '',
	 *				address	: '',
	 *			},
	 *			...
	 *		}
	 *	@return	{void}
	 */
	start( oSeeds )
	{
		//
		//	initializing peers
		//
		this.m_oSeeds = DeUtilsCore.isPlainObject( oSeeds ) ? oSeeds : {};

		//
		//	try to initialize with initializing peers
		//
		this._handleNewPeers( this.m_oSeeds );

		//
		//	start heartbeat and gossip
		//
		this._startHeartbeatLoop();
		this._startGossipLoop();
	}

	/**
	 *	stop
	 *	@return	{void}
	 */
	stop()
	{
		//
		//	clear intervals
		//
		clearTimeout( this.m_nHeartBeatTimer );
		clearTimeout( this.m_nGossipTimer );
		this.m_nHeartBeatTimer	= null;
		this.m_nGossipTimer	= null;
	}

	/**
	 *	handle message given by caller
	 *	* I AM A CALLEE, THE MESSAGE WAS DELIVERED BY CALLER
	 *
	 *	@param	{object}	oSocket
	 *	@param	{object}	oMessage
	 *	@param	{number}	oMessage.type
	 *	@param	{object}	[oMessage.digest=]
	 *	@param	{object}	[oMessage.request_digest=]
	 *	@param	{array}		[oMessage.updates=]
	 *	@return	{*}
	 */
	onReceivedMessage( oSocket, oMessage )
	{
		if ( ! oSocket )
		{
			return this._emitErrorLog( `call onReceivedMessage with invalid oSocket: ${ JSON.stringify( oSocket ) }.` );
		}
		if ( ! DeUtilsCore.isPlainObjectWithKeys( oMessage, 'type' ) )
		{
			return this._emitErrorLog( `call onReceivedMessage with invalid oMessage: ${ JSON.stringify( oMessage ) }.` );
		}
		if ( ! GossiperMessages.isValidMessageType( oMessage.type ) )
		{
			return this._emitErrorLog( `call onReceivedMessage with invalid oMessage.type: ${ JSON.stringify( oMessage.type ) }.` );
		}

		//
		//	handle message by type
		//
		switch ( oMessage.type )
		{
			case GossiperMessages.REQUEST:
				//
				//	oMsg.digest :
				//	{
				//		'wss://127.0.0.1:9011'	: m_nMaxVersionSeen,
				//		'tcp://127.0.0.1:9012'	: m_nMaxVersionSeen,
				//		...
				//	}
				//
				this._sendMessage( oSocket, this._firstResponseMessage( oMessage.digest ) );
				break;

			case GossiperMessages.FIRST_RESPONSE:
				//
				//	first response from other peers
				//
				//
				//
				//	oMsg.updates
				//	[
				//		[ sPeerUrl, key, value, version ],
				//		[ sPeerUrl, key, value, version ],
				//		...
				// 	],
				//	oMsg.request_digest
				//	{
				// 		sPeerUrl	: 0,
				// 		sPeerUrl	: nLocalMaxVersion,
				//		...
				//	}
				//
				this.m_oScuttle.updateKnownState( oMessage.updates );
				this._sendMessage( oSocket, this._secondResponseMessage( oMessage.request_digest ) );
				break;

			case GossiperMessages.SECOND_RESPONSE:
				//
				//	second response from other peers
				//
				//	oMsg.updates
				//	[
				//		[ sPeerUrl, sKey, vValue, nVersion ],
				//		[ sPeerUrl, sKey, vValue, nVersion ],
				//		...
				// 	]
				//
				this.m_oScuttle.updateKnownState( oMessage.updates );
				break;

			default:
				//	shit went bad
				break;
		}
	}

	/**
	 *	update multi-socket
	 *
	 *	@param	{object}	oMultiSockets
	 *		{
	 *			'wss://127.0.0.1:60001'	: oSocket,
	 *			...
	 *		}
	 *	@return	{number}	- count of successfully updated
	 */
	updatePeerList( oMultiSockets )
	{
		//	...
		this.m_oRouter.updateMultiSockets( oMultiSockets );

		//	...
		if ( DeUtilsCore.isPlainObject( oMultiSockets ) )
		{
			this._handleNewPeers( Object.keys( oMultiSockets ) );
		}
	}

	/**
	 *	create a new peer or return existed instance
	 *
	 *	@param	{string}	sPeerUrl
	 *	@param	{object}	oPeerConfig
	 *	@return {*}
	 */
	addOrUpdatePeer( sPeerUrl, oPeerConfig )
	{
		let oCreate	= this.m_oScuttle.createPeer( sPeerUrl, oPeerConfig );
		if ( oCreate.new )
		{
			//
			//	emit events and listen
			//
			this.emit( 'new_peer', sPeerUrl );
			this._listenToPeer( oCreate.peer );
		}

		return oCreate;
	}

	/**
	 *	set local state
	 *	@param	{string}	sKey
	 *	@param	{}		vValue
	 *	@param	{function}	pfnCallback( err )
	 *	@return	{void}
	 */
	setLocalValue( sKey, vValue, pfnCallback )
	{
		let oLocalPeer	= this.m_oScuttle.getLocalPeer();
		if ( oLocalPeer )
		{
			oLocalPeer.updateLocalValueAndMaxVersion( sKey, vValue, pfnCallback );
		}
	}

	/**
	 *	get local state
	 *	@param	{string}	sKey
	 */
	getLocalValue( sKey )
	{
		let vValue	= null;

		let oLocalPeer	= this.m_oScuttle.getLocalPeer();
		if ( oLocalPeer )
		{
			vValue = oLocalPeer.getValue( sKey );
		}

		return vValue;
	}


	/**
	 * 	start heartbeat
	 *	@private
	 */
	_startHeartbeatLoop()
	{
		this.m_nHeartBeatTimer = setTimeout
		(
			() =>
			{
				let oLocalPeer	= this.m_oScuttle.getLocalPeer();
				if ( oLocalPeer )
				{
					oLocalPeer.beatHeart();
				}

				//	the the call as a loop
				this._startHeartbeatLoop();
			},
			this.m_nInterval
		);
	}

	/**
	 * 	start gossiper
	 *	@private
	 */
	_startGossipLoop()
	{
		this.m_nGossipTimer = setTimeout
		(
			() =>
			{
				this._printDebug();
				this._gossip();

				//	the the call as a loop
				this._startGossipLoop();
			},
			this.m_nInterval
		);
	}

	_printDebug()
	{
		////////////////////////////////////////////////////////////////////////////////
		//	for debug
		////////////////////////////////////////////////////////////////////////////////
		//console.log( `gossiper all peers: `, Object.keys( this.m_oScuttle.m_oPeers ) );
		let oUrl		= GossiperUtils.parsePeerUrl( this.m_oScuttle.m_sLocalUrl );
		let oAllPeerData	= {};
		for ( let sPeerUrl in this.m_oScuttle.m_oPeers )
		{
			let oPeer	= this.m_oScuttle.m_oPeers[ sPeerUrl ];
			oAllPeerData[ sPeerUrl ] = {
				maxVersion	: oPeer.getMaxVersion(),
				attributes	: oPeer.m_oAttributes,
			};
		}

		const oAllPeerDataSorted	= {};
		Object.keys( oAllPeerData ).sort().forEach( sKey =>
		{
			oAllPeerDataSorted[ sKey ] = oAllPeerData[ sKey ];
		});

		_fs.writeFile( `data_${ oUrl.port }.temp`, JSON.stringify( oAllPeerDataSorted, null, 4 ), err =>
		{
			if ( err )
			{
				return console.error( err );
			}
		});
		////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////
	}

	/**
	 *	The method of choosing which peer(s) to gossip to is borrowed from Cassandra.
	 *	They seemed to have worked out all of the edge cases
	 *
	 *	@see http://wiki.apache.org/cassandra/ArchitectureGossip
	 */
	_gossip()
	{
		//	...
		let arrLivePeerUrls	= this.m_oScuttle.getLivePeerUrls();
		let arrDeadPeerUrls	= this.m_oScuttle.getDeadPeerUrls();
		let sLivePeerUrl	= null;
		let sDeadPeerUrl	= null;

		//
		//	Find a live peer to gossip to
		//
		if ( arrLivePeerUrls.length > 0 )
		{
			sLivePeerUrl	= this._chooseRandom( arrLivePeerUrls );
			this._gossipToPeer( sLivePeerUrl );
		}

		//
		//	possibly gossip to a dead peer
		//
		let fProb = arrDeadPeerUrls.length / ( arrLivePeerUrls.length + 1 );
		if ( fProb > Math.random() )
		{
			sDeadPeerUrl	= this._chooseRandom( arrDeadPeerUrls );
			this._gossipToPeer( sDeadPeerUrl );
		}

		//
		//	Gossip to seed under certain conditions
		//
		if ( sLivePeerUrl && ! this.m_oSeeds[ sLivePeerUrl ] &&
			arrLivePeerUrls.length < this.m_oSeeds.length )
		{
			if ( Math.random() < ( this.m_oSeeds.length / this.m_oScuttle.getAllPeerUrls().length ) )
			{
				let arrCertainPeerUrl	= this._chooseRandom( Object.keys( this.m_oScuttle.m_oPeers ) );
				this._gossipToPeer( arrCertainPeerUrl );
			}
		}

		//
		//	Check health of m_oScuttle.m_oPeers
		//
		for ( let sPeerUrl in this.m_oScuttle.m_oPeers )
		{
			if ( sPeerUrl === this.m_oScuttle.m_sLocalUrl )
			{
				//	ignore checking for local peer
				continue;
			}

			//_log.info( 'gossiper', 'will checkIfSuspect for peer %s', sPeerUrl );
			let oPeer = this.m_oScuttle.m_oPeers[ sPeerUrl ];
			if ( oPeer )
			{
				oPeer.checkIfSuspect();
			}
		}
	}

	/**
	 *	choose random
	 *
	 *	@param	{Array}	arrPeers
	 *	@return {string|null}
	 */
	_chooseRandom( arrPeers )
	{
		if ( ! Array.isArray( arrPeers ) || 0 === arrPeers.length )
		{
			return null;
		}

		//
		//	Choose random peer to gossip to
		//
		let sRet		= null;
		let arrLeftPeers	= arrPeers.filter( sPeerUrl => { return sPeerUrl !== this.m_oScuttle.m_sLocalUrl } );
		if ( Array.isArray( arrLeftPeers ) && arrLeftPeers.length > 0 )
		{
			let i	= Math.floor( Math.random() * 1000000 ) % arrLeftPeers.length;
			sRet	= arrLeftPeers[ i ];
		}

		return sRet;
	}

	/**
	 *	gossip to peer
	 *
	 *	@param	{string}	sUrl
	 */
	_gossipToPeer( sUrl )
	{
		if ( ! GossiperUtils.isValidPeerUrl( sUrl ) )
		{
			return this._emitErrorLog( `call _gossipToPeer with invalid sPeerUrl: ${ JSON.stringify( sUrl ) }` );
		}

		//
		//	pickup a socket and send message
		//
		let oSocket = this.m_oRouter.getSocket( sUrl );
		if ( oSocket )
		{
			//
			//	send GossiperMessages.REQUEST message to peer
			//
			this._sendMessage( oSocket, this._requestMessage() );
		}
		else
		{
			this._emitErrorLog( `will not send message to peer: ${ JSON.stringify( sUrl ) }, the socket of this peer was not ready.` );
		}
	}


	////////////////////////////////////////////////////////////////////////////////
	//	MESSAGES
	////////////////////////////////////////////////////////////////////////////////

	/**
	 *	handle new peers
	 *
	 *	@param	{object}	arrNewPeers
	 *		[
	 *			'wss://127.0.0.1:60001'
	 *			...
	 *		]
	 *	@return	{number}
	 */
	_handleNewPeers( arrNewPeers )
	{
		if ( ! Array.isArray( arrNewPeers ) || 0 === arrNewPeers.length )
		{
			return 0;
		}

		//
		//	arrNewPeers
		//	[
		//		sPeerUrl,
		//		sPeerUrl,
		//		...
		// 	]
		//
		let nCount = 0;

		for ( let i = 0; i < arrNewPeers.length; i ++ )
		{
			let sPeerUrl	= arrNewPeers[ i ];
			if ( GossiperUtils.isValidPeerUrl( sPeerUrl ) )
			{
				let oCreateResult = this.addOrUpdatePeer( sPeerUrl, {} );
				if ( oCreateResult.peer &&
					oCreateResult.new )
				{
					nCount ++;
				}
			}
		}

		return nCount;
	}

	/**
	 *	listen to peer
	 *
	 *	@param oPeer
	 */
	_listenToPeer( oPeer )
	{
		if ( ! oPeer )
		{
			return false;
		}

		//	...
		oPeer.on( 'peer_update', ( sKey, vValue ) =>
		{
			this.emit( 'peer_update', oPeer.getUrl(), sKey, vValue );
		});
		oPeer.on( 'peer_alive', () =>
		{
			this.emit( 'peer_alive', oPeer.getUrl() );
		});
		oPeer.on( 'peer_failed', () =>
		{
			this.emit( 'peer_failed', oPeer.getUrl() );
		});

		return true;
	}

	/**
	 *	request message
	 *
	 * 	@description
	 *	send all peers( ip:port ) I known and the max version of data stored here to others
	 *
	 *	@return	{{type: number, digest: {}}}
	 */
	_requestMessage()
	{
		//
		//	digest	:
		//	{
		//		'wss://127.0.0.1:9011'	: m_nMaxVersionSeen,
		//		'wss://127.0.0.1:9012'	: m_nMaxVersionSeen,
		//	}
		//
		return {
			type	: GossiperMessages.REQUEST,
			digest	: this.m_oScuttle.digest(),
		};
	}

	/**
	 *	first response
	 *
	 *	@param	oPeerDigest
	 *		all peers( ip:port ) known by the peer and the max version of data stored in the peer.
	 *		for example:
	 *		{
	 *			'wss://127.0.0.1:9000'	: 1,	//	max version
	 *			'wss://127.0.0.1:9001'	: 2,	//	max version
	 *		}
	 *	@return {{type: number, request_digest: {}, updates: Array}}
	 */
	_firstResponseMessage( oPeerDigest )
	{
		//
		//
		//	deltas		>>> return.updates
		//	[
		//		[ sPeerUrl, key, value, version ],
		//		[ sPeerUrl, key, value, version ],
		//		...
		// 	],
		//	requests	>>> return.request_digest
		//	{
		// 		sPeerUrl	: 0,
		// 		sPeerUrl	: nLocalMaxVersion,
		//		...
		//	},
		//	new_peers
		//	[
		//		sPeerUrl,
		//		sPeerUrl,
		//		...
		// 	]
		//
		let oScuttle = this.m_oScuttle.scuttle( oPeerDigest );

		//
		//	to handle new peers
		//
		this._handleNewPeers( oScuttle.new_peers );

		//	...
		return {
			type		: GossiperMessages.FIRST_RESPONSE,
			request_digest	: oScuttle.requests,
			updates		: oScuttle.deltas
		};
	}

	/**
	 * 	second response
	 *
	 *	@param	oRequests
	 *	@return {{type: number, updates: Array}}
	 */
	_secondResponseMessage( oRequests )
	{
		//
		//	oRequests
		//	{
		// 		sPeerUrl	: 0,
		// 		sPeerUrl	: nLocalMaxVersion,
		//		...
		//	}
		//
		//
		//	return.updates
		//	[
		//		[ sPeerUrl, sKey, vValue, nVersion ],
		//		[ sPeerUrl, sKey, vValue, nVersion ],
		//		...
		// 	]
		//
		return {
			type	: GossiperMessages.SECOND_RESPONSE,
			updates	: this.m_oScuttle.fetchDeltas( oRequests )
		};
	}


	/**
	 * 	send message over socket tunnel
	 *
	 *	@param	{object}	oSocket
	 *	@param	{object}	oMessage
	 *	@param	{number}	oMessage.type
	 *	@param	{object}	[oMessage.digest=]
	 *	@param	{object}	[oMessage.request_digest=]
	 *	@param	{array}		[oMessage.updates=]
	 *	@private
	 */
	_sendMessage( oSocket, oMessage )
	{
		if ( ! oSocket )
		{
			return this._emitErrorLog( `Socket was not ready.` );
		}
		if ( oSocket.OPEN !== oSocket.readyState )
		{
			return this._emitErrorLog
			(
				`Socket readyState: ${ oSocket.readyState } on peer ${ oSocket.peer }, will not send ${ JSON.stringify( oMessage ) }`
			);
		}
		if ( ! DeUtilsCore.isPlainObjectWithKeys( oMessage, 'type' ) )
		{
			return this._emitErrorLog( `call _sendMessage with invalid oMessage: ${ JSON.stringify( oMessage ) }.` );
		}

		//
		//	assemble message with Gossiper format
		//
		let sMessage = JSON.stringify( [ 'gossiper', oMessage ] );
		oSocket.send( sMessage );

		//	...
		this._emitInfoLog( `SENDING ${ sMessage } to ${ oSocket.peer }.` );
	}



	/**
	 *	emit an info to caller
	 *
	 *	@param	{}	vData
	 *	@private
	 */
	_emitInfoLog( vData )
	{
		return this._emitLog( 'info', vData );
	}

	/**
	 *	emit an error to caller
	 *
	 *	@param	{}	vData
	 *	@private
	 */
	_emitErrorLog( vData )
	{
		return this._emitLog( 'error', vData );
	}

	/**
	 *	emit a message to caller
	 *
	 *	@param	{string}	sType
	 *	@param	{any}		vData
	 *	@private
	 */
	_emitLog( sType, vData )
	{
		this.emit( 'log', sType, vData );
	}
}




/**
 *	@exports
 */
module.exports	=
{
	Gossiper	: Gossiper
};