const Mnemonic		= require( 'bitcore-mnemonic' );
const Message		= require( 'bitcore-message' );
const { DeUtilsCore }	= require( 'deutils.js' );


/**
 * 	@constants
 */
const DEFAULT_MNEMONIC	= 'describe lock hat defy fever kiss spoon hint dinosaur promote luxury amateur';






/**
 * 	@class GossiperSigner
 */
class GossiperSigner
{
	/**
	 *	@constructor
	 *
	 * 	@param	{object}	 oOptions
	 * 	@param	{string}	 oOptions.mnemonic
	 */
	constructor( oOptions )
	{
		this.m_sMnemonic	= ( DeUtilsCore.isPlainObjectWithKeys( oOptions, 'mnemonic' ) ? oOptions.mnemonic : DEFAULT_MNEMONIC ) || DEFAULT_MNEMONIC;
		this.m_oMnemonicSeed	= new Mnemonic( this.m_sMnemonic );

		//	Calculate HD Master Extended Private Key
		this.m_oMastPrivateKey	= this.m_oMnemonicSeed.toHDPrivateKey();
		this.m_oExtPrivateKey	= this.m_oMastPrivateKey.derive( "m/44'/0'/0'/0/0" );

		//	Derived External Private Key and Public Key
		this.m_oFirstPrivateKey	= this.m_oExtPrivateKey.privateKey;
		this.m_oFirstPublicKey	= this.m_oExtPrivateKey.publicKey;
		this.m_sFirstAddress	= this.m_oFirstPublicKey.toAddress();
	}


	/**
	 * 	get address
	 *
	 *	@return	{string}
	 */
	getAddress()
	{
		return this.m_sFirstAddress;
	}

	/**
	 *	default sign
	 *
	 *	@param	{object}	oJsonMessage
	 *	@param	{function}	pfnCallback( err, sSignature )
	 *	@return	{*}
	 */
	sign( oJsonMessage, pfnCallback )
	{
		if ( ! DeUtilsCore.isPlainObject( oJsonMessage ) )
		{
			return pfnCallback( `call sign with invalid oJsonMessage: ${ JSON.stringify( oJsonMessage ) }` );
		}

		try
		{
			let sMessage	= JSON.stringify( oJsonMessage );
			let oMessage	= new Message( sMessage );
			let sSignature	= oMessage.sign( this.m_oFirstPrivateKey );

			//	...
			pfnCallback( null, sSignature );
		}
		catch ( err )
		{
			pfnCallback( new Error( err ) );
		}
	}

	/**
	 * 	default verify
	 *
	 *	@param	{object}	oJsonMessage
	 *	@param	{string}	sSignature
	 *	@param	{function}	pfnCallback( err, bVerify )
	 *	@return	{*}
	 */
	verify( oJsonMessage, sSignature, pfnCallback )
	{
		if ( ! DeUtilsCore.isPlainObject( oJsonMessage ) )
		{
			return pfnCallback( `call verify with invalid oJsonMessage: ${ JSON.stringify( oJsonMessage ) }` );
		}
		if ( ! DeUtilsCore.isExistingString( sSignature ) )
		{
			return pfnCallback( `call verify with invalid sSignature: ${ JSON.stringify( sSignature ) }` );
		}

		try
		{
			let sMessage	= JSON.stringify( oJsonMessage );
			let bVerified	= new Message( sMessage ).verify( this.m_sFirstAddress, sSignature );

			pfnCallback( null, bVerified );
		}
		catch ( err )
		{
			pfnCallback( new Error( err ) );
		}
	}

}




/**
 *	@exports
 */
module.exports	=
{
	GossiperSigner	: GossiperSigner
};
