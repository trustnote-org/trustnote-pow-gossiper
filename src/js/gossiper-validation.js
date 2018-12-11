const { DeUtilsCore }		= require( 'deutils.js' );
const { GossiperValidator }	= require( './gossiper-validator' );



/**
 * 	@class GossiperValidation
 */
class GossiperValidation
{
	/**
	 *	@constructor
	 *
	 *	@param	{object}	[oOptions]
	 *	@param	{object}	[oOptions.validator]
	 *	@param	{function}	[oOptions.validator.sign]
	 *	@param	{function}	[oOptions.validator.verify]
	 *	@param	{function}	[oOptions.validator.getAddress]
	 *
	 *	@description
	 *
	 * 	oOptions.validator
	 * 		- instance of validator
	 *
	 * 	oOptions.validator.sign( oJsonMessage, pfnCallback )
	 *		- signer function address provided by super node
	 *
	 *	oOptions.validator.verify( oJsonMessage, sAddress, sSignature, pfnCallback )
	 *		- verifier function address provided by super node
	 *
	 *	oOptions.validator.getAddress()
	 *		- function address for getting super node address
	 */
	constructor( oOptions )
	{
		//
		//	construct instance of Validator
		//
		if ( DeUtilsCore.isPlainObjectWithKeys( oOptions, 'validator' ) )
		{
			if ( ! DeUtilsCore.isPlainObject( oOptions.validator ) )
			{
				throw Error( `construct GossiperValidation with invalid oOptions.validator.` );
			}
			if ( ! DeUtilsCore.isFunction( oOptions.validator.sign ) ||
				! DeUtilsCore.isFunction( oOptions.validator.verify ) ||
				! DeUtilsCore.isFunction( oOptions.validator.getAddress ) )
			{
				throw Error( `construct GossiperValidation with invalid instance.` );
			}

			//	use user customized
			this.m_oValidator	= oOptions.validator;
		}
		else
		{
			//	use default
			this.m_oValidator	= new GossiperValidator();
		}
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

		return this.m_oValidator.sign( oJsonMessage, pfnCallback );
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

		return this.m_oValidator.verify( oJsonMessage, sAddress, sSignature, pfnCallback );
	}

}




/**
 *	@exports
 */
module.exports	=
{
	GossiperValidation	: GossiperValidation
};