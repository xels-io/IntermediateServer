const mongoose = require('mongoose');

const Schema = mongoose.Schema;
//create blog schema model
const blockSchema = new Schema({

   "transactions":{type:Array},
   "blockSize":{type:Number},
   "blockReward":{type:Number},
   "totalAmount":{type:Number},
   "transactionCount":{type:Number},
   "blockData":{type:String},
   "blockId":{type:String},
   "blockHeader":{type:String},
   "height":{type:Number,unique:true},
   "confirmations":{type:Number},
   "medianTimePast":{type:Number},
   "blockTime":{type:Number}
})

const Block = mongoose.model('blocks',blockSchema);

module.exports = Block;