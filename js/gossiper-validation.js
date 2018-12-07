const { DeUtilsCore }		= require( 'deutils.js' );



/**
 * 	@class GossiperValidation
 */
class GossiperValidation
{
	/**
	 *	@constructor
	 *
	 *	@param	{object}	oOptions
	 *	@param	{function}	oOptions.pfnSigner( oJsonMessage, pfnCallback )
	 *					- local signer function provided by super node
	 *	@param	{function}	oOptions.pfnVerify( oJsonMessage, sAddress, sSignature, pfnCallback )
	 *					- local verify function provided by super node
	 */
	constructor( oOptions )
	{
		this.m_pfnSigner	= DeUtilsCore.isPlainObjectWithKeys( oOptions, 'pfnSigner' ) ? oOptions.pfnSigner : null;
		this.m_pfnVerifier	= DeUtilsCore.isPlainObjectWithKeys( oOptions, 'pfnVerify' ) ? oOptions.pfnVerify : null;
	}


	/**
	 * 	update signer address
	 *
	 *	@param	{function}	pfnSigner
	 *	@param	{function}	pfnCallback( err )
	 *	@return	{*}
	 */
	updateSigner( pfnSigner, pfnCallback )
	{
		if ( ! DeUtilsCore.isFunction( pfnSigner ) )
		{
			return pfnCallback( `call updateSigner with invalid pfnSigner: ${ JSON.stringify( pfnSigner ) }` );
		}

		this.m_pfnSigner = pfnSigner;
		pfnCallback( null );
	}

	/**
	 *	update verifier address
	 *
	 *	@param	{function}	pfnVerifier
	 *	@param	{function}	pfnCallback
	 */
	updateVerifier( pfnVerifier, pfnCallback )
	{
		if ( ! DeUtilsCore.isFunction( pfnSigner ) )
		{
			return pfnCallback( `call updateSigner with invalid pfnSigner: ${ JSON.stringify( pfnSigner ) }` );
		}

		this.m_pfnVerifier = pfnVerifier;
		pfnCallback( null );
	}

	/**
	 *	sign
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
		if ( ! DeUtilsCore.isFunction( this.m_pfnSigner ) )
		{
			return pfnCallback( `m_pfnSigner is not a function.` );
		}

		return this.m_pfnSigner( oJsonMessage, pfnCallback );
	}

	/**
	 * 	verify
	 *
	 *	@param	{object}	oJsonMessage
	 *	@param	{string}	sAddress
	 *	@param	{string}	sSignature
	 *	@param	{function}	pfnCallback( err, bVerify )
	 *	@return	{*}
	 */
	verify( oJsonMessage, sAddress, sSignature, pfnCallback )
	{
		if ( ! DeUtilsCore.isPlainObject( oJsonMessage ) )
		{
			return pfnCallback( `call verify with invalid oJsonMessage: ${ JSON.stringify( oJsonMessage ) }` );
		}
		if ( ! DeUtilsCore.isExistingString( sAddress ) )
		{
			return pfnCallback( `call verify with invalid sAddress: ${ JSON.stringify( sAddress ) }` );
		}
		if ( ! DeUtilsCore.isExistingString( sSignature ) )
		{
			return pfnCallback( `call verify with invalid sSignature: ${ JSON.stringify( sSignature ) }` );
		}
		if ( ! DeUtilsCore.isFunction( this.m_pfnVerifier ) )
		{
			return pfnCallback( `m_pfnVerifier is not a function.` );
		}

		return this.m_pfnVerifier( oJsonMessage, sAddress, sSignature, pfnCallback );
	}

}




/**
 *	@exports
 */
module.exports	=
{
	GossiperValidation	: GossiperValidation
};
