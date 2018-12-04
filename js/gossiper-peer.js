const { EventEmitter }		= require( 'events' );
const { DeUtilsCore }		= require( 'deutils.js' );
const { DeUtilsNetwork }	= require( 'deutils.js' );

const { GossiperDetector }	= require( './gossiper-detector' );
const { GossiperUtils }		= require( './gossiper-utils' );


/**
 * 	@constants
 */
const MAX_PHI		=  8;




/**
 *	@class GossiperPeer
 */
class GossiperPeer extends EventEmitter
{
	/**
	 *	@constructor
	 *
	 *	@param	{object}	oOptions
	 *	@param	{string}	[oOptions.url=]		- peer url 'wss://127.0.0.1:6000', 'udp|tcp...://127.0.0.1:6000' or undefined
	 *	@param	{string}	[oOptions.address=]	- super node address
	 *	@param	{function}	[oOptions.pfnSigner=]	- signer function provided by super node
	 */
	constructor( oOptions )
	{
		super();

		//
		//	Detector
		//
		this.m_oDetector		= new GossiperDetector();

		//
		//	Attributes
		//
		this.m_bAlive			= true;

		this.m_oAttributes		= {};
		this.m_nMaxVersion		= 0;
		this.m_nHeartbeatVersion	= 0;

		//
		//	Configurations
		//
		this.m_oConfig =
			{
				url		: DeUtilsCore.isPlainObjectWithKeys( oOptions, 'url' ) ? oOptions.url : null,
				address		: DeUtilsCore.isPlainObjectWithKeys( oOptions, 'address' ) ? oOptions.address : null,
				pfnSigner	: DeUtilsCore.isPlainObjectWithKeys( oOptions, 'pfnSigner' ) ? oOptions.pfnSigner : null
			};
	}

	/**
	 * 	get peer url
	 *
	 *	@return {string|null}	'wss://127.0.0.1:5001'
	 */
	getUrl()
	{
		return this.m_oConfig.url;
	}

	/**
	 * 	get local address
	 *
	 *	@return {string|null}
	 */
	getLocalAddress()
	{
		return this.m_oConfig.address;
	}

	/**
	 * 	get signer
	 *
	 *	@return {function|null}
	 */
	getLocalSigner()
	{
		return this.m_oConfig.pfnSigner;
	}

	/**
	 *	get max version seen
	 *
	 *	@return	{number}
	 */
	getMaxVersion()
	{
		return this.m_nMaxVersion;
	}

	/**
	 *	increase max version seen
	 *
	 *	@return	{boolean}
	 */
	increaseMaxVersion()
	{
		this.m_nMaxVersion ++;
	}

	/**
	 * 	get status of a this peer: alive or not
	 *
	 *	@return {boolean}
	 */
	isAlive()
	{
		return this.m_bAlive;
	}

	/**
	 * 	mark this as alive
	 */
	markAlive()
	{
		if ( ! this.m_bAlive )
		{
			this.m_bAlive = true;
			this.emit( 'peer_alive' );
		}
	}

	/**
	 * 	mark this as dead
	 */
	markDead()
	{
		if ( this.m_bAlive )
		{
			this.m_bAlive = false;
			this.emit( 'peer_failed' );
		}
	}

	/**
	 *	check if this is suspect
	 *
	 *	@return {boolean}
	 *
	 * 	@description
	 *	The getTime() method returns the numeric value corresponding to the time for the specified date according to universal time.
	 *	getTime() always uses UTC for time representation.
	 *	For example, a client browser in one timezone, getTime() will be the same as a client browser in any other timezone.
	 */
	checkIfSuspect()
	{
		//
		//	milliseconds since Jan 1, 1970, 00:00:00.000 GMT
		//
		let nPhi = this.m_oDetector.phi( new Date().getTime() );

		if ( nPhi > MAX_PHI )
		{
			this.markDead();
			return true;
		}
		else
		{
			this.markAlive();
			return false;
		}
	}



	/**
	 *	get keys
	 *
	 *	@return {Array}
	 */
	getAllKeys()
	{
		return Object.keys( this.m_oAttributes );
	}



	/**
	 *	get value
	 *
	 *	@param	{}	sKey
	 *	@return {*}
	 */
	getValue( sKey )
	{
		if ( this.m_oAttributes.hasOwnProperty( sKey ) &&
			Array.isArray( this.m_oAttributes[ sKey ] ) &&
			this.m_oAttributes[ sKey ].length >= 2 )
		{
			//
			//	0	- value
			//	1	- version
			//
			return this.m_oAttributes[ sKey ][ 0 ];
		}

		return undefined;
	}

	/**
	 * 	set value with version by key
	 *
	 *	@param	{string}	sKey
	 *	@param	{}		vValue
	 *	@param	{number}	nVersion
	 *	@param	{function}	pfnCallback( err )
	 */
	setValue( sKey, vValue, nVersion, pfnCallback )
	{
		if ( ! DeUtilsCore.isExistingString( sKey ) )
		{
			return pfnCallback( `call setValue with invalid sKey: ${ JSON.stringify( sKey ) }` );
		}

		this.m_oAttributes[ sKey ] = [ vValue, nVersion ];
		this.emit( 'peer_update', sKey, vValue );

		//	...
		pfnCallback( null );
	}


	/**
	 *	deltas after version
	 *
	 *	@param	{number}	nLowestVersion
	 *	@return {Array}
	 */
	getDeltasAfterVersion( nLowestVersion )
	{
		let arrDeltas	= [];

		for ( let sKey in this.m_oAttributes )
		{
			let vValue	= this.m_oAttributes[ sKey ][ 0 ];
			let nVersion	= this.m_oAttributes[ sKey ][ 1 ];

			if ( nVersion > nLowestVersion )
			{
				arrDeltas.push( [ sKey, vValue, nVersion ] );
			}
		}

		return arrDeltas;
	}

	/**
	 *	update with delta
	 *
	 *	@param	{}		sKey
	 *	@param	{}		vValue
	 * 	@param	{number}	nVersion
	 * 	@param	{function}	pfnCallback( err, bUpdated )
	 */
	updateWithDelta( sKey, vValue, nVersion, pfnCallback )
	{
		if ( ! DeUtilsCore.isExistingString( sKey ) )
		{
			return pfnCallback( `call updateWithDelta with invalid sKey: ${ JSON.stringify( sKey ) }` );
		}
		if ( ! DeUtilsCore.isNumeric( nVersion ) )
		{
			return pfnCallback( `call updateWithDelta with invalid nVersion: ${ JSON.stringify( nVersion ) }` );
		}

		//
		//	It's possibly to get the same updates more than once if we're gossiping with multiple peers at once
		//	ignore them
		//
		if ( nVersion > this.getMaxVersion() )
		{
			//	update max version seen
			this.m_nMaxVersion = nVersion;
			this.setValue( sKey, vValue, nVersion, err =>
			{
				if ( err )
				{
					return pfnCallback( err );
				}

				if ( '__heartbeat__' === sKey )
				{
					this.m_oDetector.add( new Date().getTime() );
				}

				//	yes, updated successfully
				pfnCallback( null, true );
			});
		}
		else
		{
			//	not updated
			pfnCallback( null, false );
		}
	}

	/**
	 * 	This is used when the peerState is owned by this peer
	 *
	 *	@param	{string}	sKey
	 *	@param	{}		vValue
	 *	@param	{function}	pfnCallback( err )
	 *	@return	{boolean}
	 */
	updateLocalValueAndMaxVersion( sKey, vValue, pfnCallback )
	{
		if ( ! DeUtilsCore.isExistingString( sKey ) )
		{
			return pfnCallback( `call updateLocalValue with invalid sKey: ${ JSON.stringify( sKey ) }` );
		}

		this.increaseMaxVersion();
		this.setValue( sKey, vValue, this.getMaxVersion(), err =>
		{
			if ( err )
			{
				return pfnCallback( err );
			}

			//	...
			pfnCallback( null );
		});
	}

	/**
	 *	beat heart
	 */
	beatHeart()
	{
		//
		//	increase version
		//
		this.m_nHeartbeatVersion ++;

		this.updateLocalValueAndMaxVersion( '__heartbeat__', this.m_nHeartbeatVersion, err => {} );
		this.updateLocalValueAndMaxVersion( 'address', this.m_oConfig.address, err =>{} );
	}

}




/**
 *	@exports
 */
module.exports	=
{
	GossiperPeer	: GossiperPeer
};



