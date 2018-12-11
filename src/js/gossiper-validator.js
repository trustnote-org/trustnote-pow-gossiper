const _fs		= require( 'fs' );
const Mnemonic		= require( 'bitcore-mnemonic' );
const Message		= require( 'bitcore-message' );
const { DeUtilsCore }	= require( 'deutils.js' );
const { GossiperUtils }	= require( './gossiper-utils' );



/**
 * 	@class GossiperValidator
 */
class GossiperValidator
{
	/**
	 *	@constructor
	 */
	constructor()
	{
		this.m_sMnemonic	= this._loadLocalMnemonic();
		this.m_oMnemonicSeed	= new Mnemonic( this.m_sMnemonic );
		if ( Mnemonic.isValid( this.m_oMnemonicSeed.toString() ) )
		{
			//
			//	mnemonic loaded from local is valid
			//
			this.m_sMnemonic	= this.m_oMnemonicSeed.toString();
		}
		else
		{
			//
			//	generate new
			//
			this.m_oMnemonicSeed	= new Mnemonic();
			this.m_sMnemonic	= this.m_oMnemonicSeed.toString();
		}

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
	 *	default signer
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
	 * 	default verifier
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

		try
		{
			let sMessage	= JSON.stringify( oJsonMessage );
			let bVerified	= new Message( sMessage ).verify( sAddress, sSignature );

			pfnCallback( null, bVerified );
		}
		catch ( err )
		{
			pfnCallback( new Error( err ) );
		}
	}


	/**
	 * 	load local mnemonic
	 *
	 *	@return	{string}
	 *	@private
	 */
	_loadLocalMnemonic()
	{
		let sMnemonic		= null;
		let sAppDataDir		= GossiperUtils.getAppDataDir();
		let sMnemonicFile	= `${ sAppDataDir }/gossiper-validator.json`;

		try
		{
			if ( _fs.existsSync( sAppDataDir ) &&
				_fs.existsSync( sMnemonicFile ) )
			{
				let sContent	= _fs.readFileSync( sMnemonicFile );
				let oJson	= JSON.parse( sContent );
				if ( DeUtilsCore.isPlainObjectWithKeys( oJson, 'mnemonic' ) )
				{
					sMnemonic = oJson.mnemonic;
				}
			}
		}
		catch ( err )
		{
		}

		return sMnemonic;
	}

	/**
	 * 	save mnemonic
	 *
	 *	@param	{string}	sMnemonic
	 *	@return	{boolean}
	 *	@private
	 */
	_saveLocalMnemonic( sMnemonic )
	{
		let bRet		= false;
		let sAppDataDir		= GossiperUtils.getAppDataDir();
		let sMnemonicFile	= `${ sAppDataDir }/gossiper-validator.json`;

		try
		{
			if ( ! _fs.existsSync( sAppDataDir ) )
			{
				_fs.mkdirSync( sAppDataDir, 0o755 );
			}

			_fs.writeFileSync
			(
				sMnemonicFile,
				JSON.stringify({
					mnemonic : sMnemonic,
				}),
				{
					encoding : 'utf8',
					mode : 0o755,
					flag : 'w'
				}
			);

			bRet = true;
		}
		catch ( err )
		{
		}

		return bRet;
	}

}




/**
 *	@exports
 */
module.exports	=
{
	GossiperValidator	: GossiperValidator
};
