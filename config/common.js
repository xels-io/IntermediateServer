   // .....common Methods Start Here.....
   var moment = require('moment');
   // node modules access
   mapData: any = [];
   rewardCal: any = 0;
   const consensus = {
     premineHeight: 10,
     premineReward: 187155000,
     proofOfStakeReward: 375,
     firstMiningPeriodHeight: 850000,
     secondMiningPeriodHeight: 850000 + 500000,
     thirdMiningPeriodHeight: 850000 + 500000 + 850000,
     forthMiningPeriodHeight: 850000 + 500000 + 850000 + 500000
   };
/** method for checking objects empty or not starts
*
*
*/
function isEmpty(obj) {
    // null and undefined are "empty"
    if (obj == null) return true;
  
    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length && obj.length > 0)    return false;
    if (obj.length === 0)  return true;
  
    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and toValue enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
  }
/** method for checking objects empty or not ends
*
*
*/
/** method for proof of staking reward starts
*
*
*/
 function GetProofOfStakeReward( height) {
    if (height === 0) {
         this.rewardCal = 0;
         return this.rewardCal;
      } else if (height <= this.consensus.premineHeight) {
         this.rewardCal = 187155000;
         return this.rewardCal;
     } else if (height <= this.consensus.firstMiningPeriodHeight) {
         this.rewardCal = this.consensus.proofOfStakeReward;
         return this.rewardCal;
     } else if (height <= this.consensus.secondMiningPeriodHeight) {
         this.rewardCal = this.consensus.GetProofOfStakeReward - ((37500) * (height - this.consensus.firstMiningPeriodHeight));
         return this.rewardCal;
     } else if (height <= this.consensus.ThirdMiningPeriodHeight) {
         this.rewardCal = this.consensus.ProofOfStakeReward / 2;
         return this.rewardCal;
     } else if (height <= this.consensus.firstMiningPeriodHeight) {
         this.rewardCal = (this.consensus.ProofOfStakeReward / 2) - ((37500) * (height - this.consensus.thirdMiningPeriodHeight));
         return this.rewardCal;
     } else {
         return this.rewardCal;
     }
  }
  /** method for proof of staking reward ends
  *
  *
  */
  /** method for time formatting starts
  *
  *
  */
  function timeFormat (time) {
    const currentDate = new Date(time * 1000);
    let dateString = moment.utc(currentDate).format("DD-MM-YYYY HH:mm:ss");
    return dateString;
  }
 /** method for time formatting ends
  *
  *
  */
  /** method for mapping block data starts
  *
  *
  */
 function getMappedData(blockRowDataAll) {
   
    this.GetProofOfStakeReward(blockRowDataAll[0].height);
    this.mapData = blockRowDataAll.map((tmp) => {
    if (tmp.transactions.length > 1) {
     return {
       blockId: tmp.blockId,
       blockTime: this.timeFormat(tmp.blockTime),
       blockReward: this.GetProofOfStakeReward(tmp.height),
       height: tmp.height,
       confirmations: tmp.confirmations,
       transactionCount: tmp.transactionCount,
       transactions: this.getTransVal(tmp.transactions),
       totalAmount: this.getAmount(tmp.transactions) / 100000000,
        };
     } else {

       return {
         blockId: tmp.blockId,
         blockReward: this.GetProofOfStakeReward(tmp.height),
         blockTime: this.timeFormat(tmp.blockTime),
         height: tmp.height,
         totalAmount: (tmp.totalAmount / 100000000 ),
         confirmations: tmp.confirmations,
         transactionCount: tmp.transactionCount,
         transactions: this.getTransVal(tmp.transactions)
       };
     }
  });
   return this.mapData;
 } 
 /** method for mapping block data ends
 *
 *
 */
 /** method for mapping Transaction data starts
 *
 *
 */
 function getMappedTransactionData(transactionArray) {
  this.mapData = transactionArray.map((tmp) => {
    return {
      transactionId: tmp.txId,
      inputs: tmp.inputs,
      lockTime: this.timeFormat(tmp.lockTime),
      outputs: tmp.outputs.slice(0, tmp.outputs.indexOf(' ')),
      time: this.timeFormat(tmp.time),
      totalOut: (tmp.totalOut / 100000000),
      vIn: tmp.vIn,
      vOut:  tmp.vOut,
      version: tmp.version
    };
  });
 return this.mapData;
}
/** method for mapping Transaction data ends
*
*
*/
/** method for TotalAmount data calculation starts
*
*
*/
 function getAmount(transaction) {
    let y = this.getTransVal(transaction);
    let total = 0;
    if (y.length > 1) {
      y.splice(1, 1);
    }
    y.map((tmpTotal) => {
      if (tmpTotal.vOut.length > 1 ) {
        tmpTotal.vOut.shift();
      }
      tmpTotal.vOut.map((val) => {
        if (!val.cStake) {
          total = total + val.value;
        }
      });
    });
      return total;
    }

    function getTransVal(transactions) {
    if (transactions.length > 0 ) {
      transactions[0].vOut[0].value = this.rewardCal * 100000000;
      return transactions;
    }
  }
/** method for TotalAmount data calculation ends
*
*
*/


/**  construction of vOut array of transaction starts
*
*
*/
function vOutAddress(voutData)
{
  
  let VoutArray = [].concat.apply([], voutData);
  let voutArr = VoutArray.map((tmp) => {
    return {
      address : tmp.address ,
      amount :(tmp.value / 100000000) 
    }
  });
  return voutArr;
}
/**  construction of vOut array of transaction ends
*
*
*/
/**  construction of vIn array of transaction starts
*
*
*/
function vInAddress(vInData)
{
  let VInArray = [].concat.apply([], vInData);
  let vinArr = VInArray.map((tmp) => {
    return {
      address : tmp.address 
    }
  });
  return vinArr;
}
/**  construction of vIn array of transaction ends
*
*
*/
/**  grouping array with same address and sum their value starts
*
*
*/
function groupVOutArray(arr)
{
  result = [];

  arr.forEach(function (a) {
    if ( !this[a.address] ) {
        this[a.address] = { address: a.address, amount: a.amount };
        result.push(this[a.address]);
    } 
    this[a.address].amount += a.amount;
  }, Object.create(null));
  return result;
}
/**  grouping array with same address and sum their value ends
*
*
*/
/**  delete common address from vout array whcih is already in vin array starts
*
*
*/
function CommonAddressDelete(voutArr , vinarr)
{
  voutArr.forEach(function(item, index, array) {
    var ItemIndex = vinarr.findIndex(b => b.address === item.address);
    voutArr.splice(ItemIndex, 1); 
  });
  return voutArr;
}
/**  delete common address from vout array whcih is already in vin array ends
*
*
*/
  module.exports.getMappedData = getMappedData;
  module.exports.getMappedTransactionData = getMappedTransactionData;
  module.exports.isEmpty = isEmpty;
  module.exports.GetProofOfStakeReward = GetProofOfStakeReward;
  module.exports.getAmount = getAmount;
  module.exports.getTransVal = getTransVal;
  module.exports.consensus = consensus;
  module.exports.timeFormat = timeFormat;


  module.exports.CommonAddressDelete = CommonAddressDelete;
  module.exports.groupVOutArray = groupVOutArray;
  module.exports.vInAddress = vInAddress;
  module.exports.vOutAddress = vOutAddress;
  //module.exports.addressMapping = addressMapping;
