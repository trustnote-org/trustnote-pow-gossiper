'use strict';

const { Gossiper }		= require( './gossiper.js' );
const { GossiperMessages }	= require( './gossiper-types.js' );
const { GossiperEvents }	= require( './gossiper-types.js' );
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
