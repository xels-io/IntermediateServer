const mongoose = require('mongoose');

const Schema = mongoose.Schema;
//create blog schema model
// const blockSchema = new Schema({

//    "transactions":{type:Array},
//    "blockSize":{type:Number},
//    "blockReward":{type:Number},
//    "totalAmount":{type:Number},
//    "transactionCount":{type:Number},
//    "blockData":{type:String},
//    "blockId":{type:String}, 
//    "blockHeader":{type:String},
//    "height":{type:Number,unique:true},
//    "confirmations":{type:Number},
//    "medianTimePast":{type:Number},
//    "blockTime":{type:Number}
// })

const blockSchema = new Schema({
   
   "tx":{type:Array},
   "transactions":{type:Array},
   "hash":{type:String}, 
   "confirmations":{type:Number},
   "size":{type:Number},
   "weight":{type:Number},
   "height":{type:Number},
   "version":{type:Number},
   "versionHex":{type:String},
   "merkleroot":{type:String},
   "time":{type:Number},
   "mediantime":{type:Number},
   "nonce":{type:Number},
   "bits":{type:String},
   "difficulty":{type:Number},
   "chainwork":{type:String},
   "nTx":{type:Number},
   "previousblockhash":{type:String},
   "nextblockhash":{type:String},
   "signature":{type:String},
   "blockreward":{type:Number},

   "modifierv2":{type:String},
   "flags":{type:String},
   "hashproof":{type:String},

   "blocktrust":{type:String},
   "chaintrust":{type:String},
})

const Block = mongoose.model('blocks',blockSchema);

module.exports = Block;