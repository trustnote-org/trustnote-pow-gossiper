const _log			= require( 'npmlog' );


//
//	process.env.ENV_UNIT_TEST	= true/false;
//
const _bEnvUnitTest		= process.env && 'object' === typeof process.env && 'string' === typeof process.env.ENV_UNIT_TEST && 'true' === process.env.ENV_UNIT_TEST.toLowerCase();




/**
 * 	@class GossiperLog
 *	@type {GossiperLog}
 */
class GossiperLog
{
	constructor()
	{
	}

	/**
	 * 	info
	 *
	 *	@param	{string}	sString
	 *	@return	{void}
	 */
	static info( sString )
	{
		if ( _bEnvUnitTest )
		{
			_log.info( 'GOSSIPER', sString );
		}
		else
		{
			console.log( sString );
		}
	}

	/**
	 * 	warn
	 *
	 *	@param	{string}	sString
	 *	@return	{void}
	 */
	static warn( sString )
	{
		if ( _bEnvUnitTest )
		{
			_log.warn( 'GOSSIPER', sString );
		}
		else
		{
			console.warn( sString );
		}
	}

	/**
	 * 	error
	 *
	 *	@param	{string}	sString
	 *	@return	{void}
	 */
	static error( sString )
	{
		if ( _bEnvUnitTest )
		{
			_log.error( 'GOSSIPER', sString );
		}
		else
		{
			console.error( sString );
		}
	}
}





/**
 *	@exports
 */
module.exports	=
{
	GossiperLog	: GossiperLog
};
