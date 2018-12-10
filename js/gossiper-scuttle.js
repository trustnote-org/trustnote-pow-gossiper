const { EventEmitter }		= require( 'events' );
const { DeUtilsCore }		= require( 'deutils.js' );
const { DeUtilsNetwork }	= require( 'deutils.js' );

const { GossiperPeer }		= require( './gossiper-peer' );
const { GossiperUtils }		= require( './gossiper-utils' );




/**
 * 	@class GossiperScuttle
 *	@type {GossiperScuttle}
 */
class GossiperScuttle extends EventEmitter
{
	/**
	 *	@constructor
	 *
	 *	@param	{object}	oOptions
	 *	@param	{string}	oOptions.url		- local url, 'wss://127.0.0.1:6000', 'udp|tcp...://127.0.0.1:6000' or undefined
	 *	@param	{string}	oOptions.address	- local super node address
	 */
	constructor( oOptions )
	{
		super();

		//
		//	all peers
		//
		this.m_oPeers		= {};
		this.m_sLocalUrl	= oOptions.url;

		//
		//	add self to peers
		//
		this.createPeer( oOptions.url, oOptions );
	}

	/**
	 *	get peer by url
	 *
	 *	@param	{string}	sUrl
	 *	@return {*}
	 */
	getPeer( sUrl )
	{
		let oPeer	= null;

		if ( GossiperUtils.isValidPeerUrl( sUrl ) &&
			DeUtilsCore.isPlainObject( this.m_oPeers[ sUrl ] ) )
		{
			oPeer = this.m_oPeers[ sUrl ];
		}

		return oPeer;
	}

	/**
	 * 	get local peer
	 *
	 *	@return {*}
	 */
	getLocalPeer()
	{
		return this.getPeer( this.m_sLocalUrl );
	}

	/**
	 *	create a new peer or return existed instance
	 *
	 *	@param	{string}	sPeerUrl
	 *	@param	{object}	oPeerConfig
	 *	@return {*}
	 */
	createPeer( sPeerUrl, oPeerConfig )
	{
		let oPeer	= null;
		let bNew	= false;

		if ( GossiperUtils.isValidPeerUrl( sPeerUrl ) )
		{
			if ( this.m_oPeers[ sPeerUrl ] )
			{
				//
				//	already exists
				//
				oPeer	= this.m_oPeers[ sPeerUrl ];
			}
			else
			{
				//
				//	create new
				//
				let oPeerOptions = Object.assign( {}, oPeerConfig, { url : sPeerUrl } );
				this.m_oPeers[ sPeerUrl ] = new GossiperPeer( oPeerOptions );

				//	...
				bNew	= true;
				oPeer	= this.m_oPeers[ sPeerUrl ];
			}
		}

		return {
			peer	: oPeer,
			new	: bNew,
		};
	}


	/**
	 *	get peer keys
	 *
	 *	@param	{string}	sPeerUrl
	 *	@return {Array}
	 */
	getPeerAllKeys( sPeerUrl )
	{
		let arrKeys	= null;
		let oPeer	= this.m_oPeers[ sPeerUrl ];

		if ( oPeer )
		{
			arrKeys	= oPeer.getAllKeys();
		}

		return arrKeys;
	}

	/**
	 *	get peer value
	 *
	 *	@param	{string}	sPeerUrl
	 *	@param	{string}	sKey
	 *	@return {*}
	 */
	getPeerValue( sPeerUrl, sKey )
	{
		let vValue	= null;
		let oPeer	= this.m_oPeers[ sPeerUrl ];

		if ( oPeer )
		{
			vValue	= oPeer.getValue( sKey );
		}

		return vValue;
	}

	/**
	 *	get max version seen of peer
	 *
	 *	@param	{string}	sPeerUrl
	 *	@return	{number}
	 */
	getPeerMaxVersion( sPeerUrl )
	{
		if ( ! DeUtilsCore.isExistingString( sPeerUrl ) )
		{
			return 0;
		}
		if ( ! DeUtilsCore.isPlainObject( this.m_oPeers[ sPeerUrl ] ) )
		{
			return 0;
		}

		return this.m_oPeers[ sPeerUrl ].getMaxVersion();
	}

	/**
	 *	get all peer urls
	 *
	 *	@return {Array}
	 *
	 * 	@description
	 *	this.m_oPeers
	 *	{
	 *		'wss://127.0.0.1:6001'	: { ... },
	 *		'wss://127.0.0.1:6002'	: { ... },
	 *	}
	 */
	getAllPeerUrls()
	{
		let arrUrls = [];

		for ( let sPeerUrl in this.m_oPeers )
		{
			arrUrls.push( sPeerUrl );
		}

		return arrUrls;
	}

	/**
	 *	get live peer name list
	 *
	 *	@return {Array}
	 *
	 * 	@description
	 * 	@see	.getAllPeerUrls()
	 */
	getLivePeerUrls()
	{
		let arrUrls = [];

		for ( let sPeerUrl in this.m_oPeers )
		{
			if ( this.m_oPeers[ sPeerUrl ].isAlive() )
			{
				arrUrls.push( sPeerUrl );
			}
		}

		return arrUrls;
	}

	/**
	 *	get dead peers
	 *
	 *	@return {Array}
	 *
	 * 	@description
	 * 	@see	.getAllPeerUrls()
	 */
	getDeadPeerUrls()
	{
		let arrUrls = [];

		for ( let sPeerUrl in this.m_oPeers )
		{
			if ( ! this.m_oPeers[ sPeerUrl ].isAlive() )
			{
				arrUrls.push( sPeerUrl );
			}
		}

		return arrUrls;
	}

	/**
	 *	digest
	 *	All peers( ip:port ) I known and the max version of data stored here.
	 *
	 * 	@return
	 * 	{
	 * 		'wss://127.0.0.1:9011'	: maxVersion,
	 * 		'wss://127.0.0.1:9012'	: maxVersion,
	 * 		...
	 * 	}
	 */
	digest()
	{
		let oDigest	= {};

		for ( let sPeerUrl in this.m_oPeers )
		{
			let oPeer		= this.m_oPeers[ sPeerUrl ];
			oDigest[ sPeerUrl ]	= oPeer.getMaxVersion();
		}

		return oDigest;
	}


	/**
	 *	* HEART OF THE BEAST *
	 *
	 *	@param	{object}	oDigest
	 *		all peers( ip:port ) known by the peer and the max version of data stored in the peer.
	 *		for example:
	 *		{
	 *			'wss://127.0.0.1:9000'	: 1,	//	max version
	 *			'wss://127.0.0.1:9001'	: 2,	//	max version
	 *		}
	 *	@return	{object}
	 */
	scuttle( oDigest )
	{
		let arrDeltasWithPeer	= [];
		let oRequests		= {};
		let arrNewPeers		= [];

		if ( DeUtilsCore.isPlainObject( oDigest ) )
		{
			for ( let sPeerUrl in oDigest )
			{
				if ( ! oDigest.hasOwnProperty( sPeerUrl ) )
				{
					continue;
				}

				//
				//	sPeerUrl	- 'ws://ip:port'
				//
				let oPeer		= this.m_oPeers[ sPeerUrl ];
				let nPeerMaxVersion	= this.getPeerMaxVersion( sPeerUrl );
				let nDigestMaxVersion	= oDigest[ sPeerUrl ];

				if ( ! this.m_oPeers[ sPeerUrl ] )
				{
					//
					//	We don't know about this peer.
					// 	Request all information.
					//
					oRequests[ sPeerUrl ]	= 0;
					arrNewPeers.push( sPeerUrl );
				}
				else if ( nPeerMaxVersion > nDigestMaxVersion )
				{
					//
					//	We have more recent information for this peer.
					// 	Build up deltas.
					//
					//	{
					//		peer	: peer name,
					//		deltas	:
					//		[
					//			[ sKey, vValue, nVersion ],
					//			[ sKey, vValue, nVersion ],
					//			[ sKey, vValue, nVersion ],
					// 		]
					// 	}
					//
					//
					arrDeltasWithPeer.push
					(
						{
							peer	: sPeerUrl,
							deltas	: oPeer.getDeltasAfterVersion( nDigestMaxVersion )
						}
					);
				}
				else if ( nPeerMaxVersion < nDigestMaxVersion )
				{
					//
					//	They have more recent information.
					// 	Request it.
					//
					oRequests[ sPeerUrl ] = nPeerMaxVersion;
				}
				else
				{
					//
					//	Everything is the same.
					//
				}
			}
		}

		//
		//	Sort by peers with most deltas
		//
		arrDeltasWithPeer.sort
		(
			( a, b ) =>
			{
				return ( b.deltas.length - a.deltas.length );
			}
		);

		let arrDeltas = [];
		for ( let i = 0; i < arrDeltasWithPeer.length; i ++ )
		{
			let oPeer		= arrDeltasWithPeer[ i ];
			let arrPeerDeltas	= oPeer.deltas;

			//
			//	Sort deltas by version number ASC
			//
			//	arrPeerDeltas
			//	[
			//		[ key, value, version ],
			//		[ key, value, version ],
			//		[ key, value, version ],
			// 	]
			//
			arrPeerDeltas.sort
			(
				( a, b ) =>
				{
					return a[ 2 ] - b[ 2 ];
				}
			);

			if ( arrPeerDeltas.length > 1 )
			{
				//	console.log(peer_deltas);
			}

			for ( let j in arrPeerDeltas )
			{
				let arrDelta	= null;

				//
				//	step 1:
				//	arrDelta	- [ key, value, version ]
				//
				arrDelta	= arrPeerDeltas[ j ];

				//
				//	step 2:
				//	Array.unshift() method adds one or more elements to the beginning of an array
				// 	and returns the new length of the array.
				//
				//	arrDelta	- [ sPeerName, key, value, version ]
				//
				arrDelta.unshift( oPeer.peer );

				//
				//	build into list arrDeltas
				//
				arrDeltas.push( arrDelta );
			}
		}

		//
		//
		//	arrDeltas
		//	[
		//		[ sPeerName, key, value, version ],
		//		[ sPeerName, key, value, version ],
		//		...
		// 	],
		//	oRequests
		//	{
		// 		sPeerName	: 0,
		// 		sPeerName	: nLocalMaxVersion,
		//		...
		//	},
		//	arrNewPeers
		//	[
		//		sPeerName,
		//		sPeerName,
		//		...
		// 	]
		//
		return {
			'deltas'	: arrDeltas,		//	for updates
			'requests'	: oRequests,		//	objects
			'new_peers'	: arrNewPeers		//	array
		};
	}

	/**
	 *	update known state
	 *	@param	arrDeltas
	 */
	updateKnownState( arrDeltas )
	{
		if ( ! Array.isArray( arrDeltas ) )
		{
			return false;
		}

		//
		//	arrDeltas
		//	[
		//		[ sPeerUrl, key, value, version ],
		//		[ sPeerUrl, key, value, version ],
		//		...
		// 	],
		//
		for ( let i = 0; i < arrDeltas.length; i ++ )
		{
			let arrDelta	= arrDeltas[ i ];
			if ( ! Array.isArray( arrDelta ) || arrDelta.length < 4 )
			{
				continue;
			}

			//
			//	Array.shift() method removes the first element from an array and
			// 	returns that removed element. This method changes the length of the array.
			//
			let sPeerUrl	= arrDelta.shift();
			if ( DeUtilsCore.isExistingString( sPeerUrl ) )
			{
				let oDeltaPeer	= this.m_oPeers[ sPeerUrl ];
				if ( oDeltaPeer )
				{
					let sKey	= arrDelta[ 0 ];
					let vValue	= arrDelta[ 1 ];
					let nVersion	= arrDelta[ 2 ];

					if ( DeUtilsCore.isExistingString( sKey ) &&
						DeUtilsCore.isNumeric( nVersion ) )
					{
						//
						//	Okay, update now
						//
						oDeltaPeer.updateWithDelta( sKey, vValue, nVersion, err =>
						{
						});
					}
				}
			}
		} // end for

		return true;
	}


	/**
	 *	build updates for GossiperMessages.SECOND_RESPONSE
	 *	@param	{object}	oRequests
	 *	@return	{Array}
	 */
	fetchDeltas( oRequests )
	{
		//
		//	oRequests
		//	{
		// 		sPeerName	: 0,
		// 		sPeerName	: nLocalMaxVersion,
		//		...
		//	}
		//
		if ( ! DeUtilsCore.isPlainObject( oRequests ) )
		{
			return [];
		}

		//	...
		let arrDeltas = [];

		for ( let sPeerUrl in oRequests )
		{
			let nMaxVersionSeenByPeer = oRequests[ sPeerUrl ];
			if ( ! DeUtilsCore.isNumeric( nMaxVersionSeenByPeer ) )
			{
				continue;
			}

			let oPeer = this.m_oPeers[ sPeerUrl ];
			if ( oPeer )
			{
				//
				//
				//	arrPeerDeltas
				//	[
				//		[ sKey, vValue, nVersion ],
				//		[ sKey, vValue, nVersion ],
				//		...
				// 	]
				//
				let arrPeerDeltas = oPeer.getDeltasAfterVersion( nMaxVersionSeenByPeer );

				//	Sort deltas by version number ASC
				arrPeerDeltas.sort
				(
					( a, b ) =>
					{
						return a[ 2 ] - b[ 2 ];
					}
				);

				for ( let j in arrPeerDeltas )
				{
					//
					//	Array.unshift() method adds one or more elements to the beginning of an array
					// 	and returns the new length of the array.
					//	arrPeerDeltas[ j ]
					//	-	[ sPeerName, sKey, vValue, nVersion ],
					//
					arrPeerDeltas[ j ].unshift( sPeerUrl );
					arrDeltas.push( arrPeerDeltas[ j ] );
				}
			}
		}

		//
		//	arrDeltas
		//	[
		//		[ sPeerUrl, sKey, vValue, nVersion ],
		//		[ sPeerUrl, sKey, vValue, nVersion ],
		//		...
		// 	]
		//
		return arrDeltas;
	}

}





/**
 *	@exports
 *	@type {GossiperScuttle}
 */
module.exports	=
{
	GossiperScuttle	: GossiperScuttle
};
