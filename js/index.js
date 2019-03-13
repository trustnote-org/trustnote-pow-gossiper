'use strict';

const { Gossiper }		= require( './gossiper.js' );
const { GossiperMessages }	= require( './gossiper-constants.js' );
const { GossiperEvents }	= require( './gossiper-constants.js' );
const { GossiperUtils }		= require( './gossiper-utils.js' );



/**
 * 	@exports
 */
module.exports	= {
	Gossiper		: Gossiper,
	GossiperMessages	: GossiperMessages,
	GossiperEvents		: GossiperEvents,
	GossiperUtils		: GossiperUtils,
};
