const _fs			= require( 'fs' );
const _path			= require( 'path' );

const UrlParser			= require( 'url-parse' );
const { DeUtilsCore }		= require( 'deutils.js' );
const { DeUtilsNetwork }	= require( 'deutils.js' );

const { GossiperReservedKeys }	= require( './gossiper-constants' );




/**
 * 	@class GossiperUtils
 *	@type {GossiperUtils}
 */
class GossiperUtils
{
	constructor()
	{
	}

	/**
	 * 	parse peer url
	 *
	 *	@param	{string}	sUrl
	 *	@return	{ { hostname : {string}, port : {number}, protocol : {string} }|null }
	 */
	static parsePeerUrl( sUrl )
	{
		let sHostname	= null;
		let nPort	= null;
		let sProtocol	= null;

		if ( DeUtilsCore.isExistingString( sUrl ) )
		{
			//
			//	{
			// 		slashes: true,
			//		protocol: 'ws:',
			//		hash: '',
			//		query: '',
			//		pathname: '/',
			//		auth: '',
			//		host: '127.0.0.1:9000',
			//		port: '9000',
			//		hostname: '127.0.0.1',
			//		password: '',
			//		username: '',
			//		origin: 'ws://127.0.0.1:9000',
			//		href: 'ws://127.0.0.1:9000/'
			// 	}
			//
			let oUrl	= new UrlParser( sUrl );

			sHostname	= oUrl.hostname;
			nPort		= oUrl.port;
			sProtocol	= oUrl.protocol;
		}

		return {
			hostname	: sHostname,
			port		: nPort,
			protocol	: sProtocol,
		};
	}

	/**
	 * 	check if the sPeerUrl is a valid peer name
	 *
	 *	@param	{string}	sPeerUrl	- 'wss://127.0.0.1:8000'
	 *	@return	{boolean}
	 */
	static isValidPeerUrl( sPeerUrl )
	{
		let oPeerUrl = this.parsePeerUrl( sPeerUrl );
		return DeUtilsCore.isExistingString( oPeerUrl.hostname ) &&
			DeUtilsNetwork.isValidPort( oPeerUrl.port ) &&
			DeUtilsCore.isExistingString( oPeerUrl.protocol );
	}


	/**
	 * 	check if sKey is a reserved key
	 *
	 *	@param	{string}	sKey
	 *	@return {boolean}
	 */
	static isReservedKey( sKey )
	{
		return GossiperReservedKeys.includes( sKey );
	}


	/**
	 * 	get apps data directory
	 *
	 *	@return	{string}
	 */
	static getUserAppsDataDir()
	{
		switch( process.platform )
		{
		case 'win32':
			return process.env.LOCALAPPDATA;
		case 'linux':
			return process.env.HOME + '/.config';
		case 'darwin':
			return process.env.HOME + '/Library/Application Support';
		default:
			throw Error("unknown platform "+process.platform);
		}
	}

	/**
	 * 	get package.json directory
	 *
	 *	@param	{string}	sStartDir
	 *	@return	{string}
	 */
	static getPackageJsonDir( sStartDir )
	{
		try
		{
			_fs.accessSync( sStartDir + '/package.json' );
			return sStartDir;
		}
		catch ( e )
		{
			let sParentDir	= path.dirname( sStartDir );
			if ( '/' === sParentDir || 'win32' === process.platform && sParentDir.match( /^\w:[\/\\]$/ ) )
			{
				throw Error( `no package.json found` );
			}

			return this.getPackageJsonDir( sParentDir );
		}
	}

	/**
	 * 	app installation dir, this is where the topmost package.json resides
	 *
	 *	@return {string}
	 */
	static getAppRootDir()
	{
		let sMainModuleDir = path.dirname( process.mainModule.paths[ 0 ] );
		return this.getPackageJsonDir( sMainModuleDir );
	}

	/**
	 * 	read app name from the topmost package.json
	 *
	 *	@return	{string}
	 */
	static getAppName()
	{
		let sAppDir = this.getAppRootDir();
		console.log( `app dir ${ sAppDir }` );
		return require( sAppDir + '/package.json' ).name;
	}

	/**
	 * 	app data dir inside user's home directory
	 *
	 *	@return {string}
	 */
	static getAppDataDir()
	{
		if ( 'win32' === process.platform )
		{
			return ( this.getUserAppsDataDir() + '\\' + this.getAppName() );
		}
		else
		{
			return ( this.getUserAppsDataDir() + '/' + this.getAppName() );
		}
	}


}





/**
 *	@exports
 */
module.exports	=
{
	GossiperUtils	: GossiperUtils
};
