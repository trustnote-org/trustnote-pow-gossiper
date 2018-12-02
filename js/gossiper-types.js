/**
 *	@messages
 */
const GossiperMessages	=
{
	/**
	 *	SYN:
	 *	Gossip Digest Syn Message
	 *
	 *	The node initiating the round of gossip sends the SYN message which contains a compendium of the nodes in the cluster.
	 *	It contains tuples of the IP address of a node in the cluster, the generation and the heartbeat version of the node.
	 */
	REQUEST			: 0,

	/**
	 *	ACK:
	 *	Gossip Digest Ack Message
	 *
	 *	The peer after receiving SYN message compares its own metadata information with
	 *	the one sent by the initiator and produces a diff.
	 *	ACK contains two kinds of data.
	 *	One part consists of updated metadata information (AppStates) that the peer has but the initiator doesn't,
	 *	and the other part consists of digest of nodes the initiator has that the peer doesn't.
	 */
	FIRST_RESPONSE		: 1,

	/**
	 *	ACK2:
	 * 	Gossip Digest Ack2 Message
	 *
	 *	The initiator receives the ACK from peer and updates its metadata from the AppStates and sends back ACK2
	 *	containing the metadata information the peer has requested for.
	 *	The peer receives ACK2, updates its metadata and the round of gossip concludes.
	 */
	SECOND_RESPONSE		: 2,

	/**
	 * 	check if the nType is a valid message type
	 *
	 *	@param	{number}	nType
	 *	@return {boolean}
	 */
	isValidMessageType( nType )
	{
		return Boolean( 'number' === typeof nType ) &&
		[ this.REQUEST, this.FIRST_RESPONSE, this.SECOND_RESPONSE ].includes( nType );
	}
};



/**
 * 	@events
 *
 *	@event	peer_update
 * 	@param	{string}	sPeerUrl
 * 	@param	{string}	sKey
 * 	@param	{}		vValue
 *
 *	@event	peer_alive
 * 	@param	{string}	sPeerUrl
 *
 *	@event	peer_failed
 * 	@param	{string}	sPeerUrl
 *
 *	@event	new_peer
 * 	@param	{string}	sPeerUrl
 */
const GossiperEvents	=
{
	PEER_UPDATE	: 'peer_update',
	PEER_ALIVE	: 'peer_alive',
	PEER_FAILED	: 'peer_failed',
	NEW_PEER	: 'new_peer',
};



/**
 *	@exports
 */
module.exports	=
{
	GossiperMessages	: GossiperMessages,
	GossiperEvents		: GossiperEvents,
};