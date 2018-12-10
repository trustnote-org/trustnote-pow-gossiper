/**
 * 	@constants
 */
const MAX_INTERVAL_LIST_LENGTH	= 1000;
const DEFAULT_INTERVAL		= 750;




/**
 * 	@class	GossiperDetector
 */
class GossiperDetector
{
	constructor()
	{
		this.m_nLastTime	= undefined;
		this.m_arrIntervalList	= [];
	}

	/**
	 *	arrival
	 */
	arrival()
	{
		let nArrivalTime	= new Date().getTime();
		let nInterval;

		if ( undefined === this.m_nLastTime )
		{
			nInterval = DEFAULT_INTERVAL;
		}
		else
		{
			nInterval = nArrivalTime - this.m_nLastTime;
		}

		//
		//	build a queue for interval values
		//
		this.m_nLastTime = nArrivalTime;
		this.m_arrIntervalList.push( nInterval );

		if ( this.m_arrIntervalList.length > MAX_INTERVAL_LIST_LENGTH )
		{
			//
			//	removes the first element from an array and returns that removed element.
			// 	This method changes the length of the array.
			//
			this.m_arrIntervalList.shift();
		}
	}


	/**
	 *	get phi
	 *
	 *	@return	{number}
	 */
	getPhi()
	{
 	 	if ( ! this.m_nLastTime )
		{
			return 0;
		}

		let nCurrentTime	= new Date().getTime();
		let nIntervalDiff	= nCurrentTime - this.m_nLastTime;
		let fIntervalAverage	= this._getIntervalAverageValue();
		let fExponent		= -1.0 * nIntervalDiff / fIntervalAverage;
		let fPowerValue		= Math.pow( Math.E, fExponent );

		return -1.0 * ( Math.log( fPowerValue ) / Math.log( 10 ) );
	}


	/**
	 *	get interval mean
	 *
	 *	@return {number}
	 */
	_getIntervalAverageValue()
	{
		if ( 0 === this.m_arrIntervalList.length )
		{
			return 0;
		}

		//	...
		let nSum = this.m_arrIntervalList.reduce
		(
			( nAccumulator, nCurrentValue ) =>
			{
				return ( nAccumulator + nCurrentValue );
			},
			0
		);

		return nSum / this.m_arrIntervalList.length;
	}

}



/**
 *	@exports
 */
module.exports	=
{
	GossiperDetector	: GossiperDetector
};
