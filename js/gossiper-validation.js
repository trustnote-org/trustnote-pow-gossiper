const { DeUtilsCore }		= require( 'deutils.js' );
const { GossiperSigner }	= require( './gossiper-signer' );



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
	 *	@param	{function}	oOptions.pfnVerify( oJsonMessage, sAddress, sSignature, pfnCallback )
	 *
	 *	@description
	 *
	 * 	oOptions.pfnSigner( oJsonMessage, pfnCallback )
	 *		- local signer function provided by super node
	 *
	 *	oOptions.pfnVerify( oJsonMessage, sAddress, sSignature, pfnCallback )
	 *		- local verify function provided by super node
	 */
	constructor( oOptions )
	{
		//
		//	create new instance GossiperSigner
		//
		this.m_oGossiperSigner		= new GossiperSigner();

		//
		//	assign default signer and verifier
		//
		this.m_pfnSigner	= this.m_oGossiperSigner.sign;
		this.m_pfnVerifier	= this.m_oGossiperSigner.verify;

		//
		//	updates signer and verifier, if they are both correct.
		//
		if ( DeUtilsCore.isPlainObjectWithKeys( oOptions, 'pfnSigner' ) &&
			DeUtilsCore.isFunction( oOptions.pfnSigner ) &&
			DeUtilsCore.isPlainObjectWithKeys( oOptions, 'pfnVerify' ) &&
			DeUtilsCore.isFunction( oOptions.pfnVerify ) )
		{
			this.m_pfnSigner	= oOptions.pfnSigner;
			this.m_pfnVerifier	= oOptions.pfnVerify;
		}
	}

	/**
	 * 	update signer address
	 *
	 *	@param	{function}	pfnSigner
	 *	@param	{function}	pfnVerifier
	 *	@param	{function}	pfnCallback( err )
	 *	@return	{*}
	 */
	updateSignerAndVerifier( pfnSigner, pfnVerifier, pfnCallback )
	{
		if ( ! DeUtilsCore.isFunction( pfnSigner ) )
		{
			return pfnCallback( `call updateSignerAndVerifier with invalid pfnSigner: ${ JSON.stringify( pfnSigner ) }` );
		}
		if ( ! DeUtilsCore.isFunction( pfnVerifier ) )
		{
			return pfnCallback( `call updateSignerAndVerifier with invalid pfnVerifier: ${ JSON.stringify( pfnVerifier ) }` );
		}

		//	...
		this.m_pfnSigner	= pfnSigner;
		this.m_pfnVerifier	= pfnVerifier;

		//	...
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