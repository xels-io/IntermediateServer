var common = require('./config/common');
const configProperties = require('./config/config');


// node modules access
const http = require('http');
const https = require('https');

//mongoDB connection
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/blockchain_db',{ useNewUrlParser: true,useUnifiedTopology: true });
mongoose.Promise = global.Promise;

const express = require("express"),
    cors = require("cors"),
    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest,
    bodyParser = require("body-parser"),
    axios = require('axios'),
    WebSocket = require('websocket').w3cwebsocket;

const socketIo = require("socket.io");

const app = express();
let xelsAPI = configProperties.xelsApi;

var whitelist = ['https://blockexplorer.xels.io','http://localhost:4200'];
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by cors policy'))
        }
    }
}



app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.locals.richListdetail;
app.locals.transactionDetails;

// environment variables
process.env.NODE_ENV = 'development';

//create httpsServer
//const server = http.createServer(app);
const httpsServer = https.createServer(configProperties.httpsOptions, app);

//const io = socketIo(httpsServer);
const io = socketIo(httpsServer);

app.use(function(req, res, next) {

    if(req.protocol === 'http')
    {
      res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Assassin-RequestHash");
    next();

});
/**  server is listening to port and call all blocks information starts
 *
 *
 */

const Block = require('./models/block');

function updateDB(){

    Block.find().sort({height:-1}).limit(1).exec((err,docs)=>{
        if(err){
            console.log(err);
        }else{
            let height=0;

            if(docs.length>0){
                height = docs[0].height;
            }

            let Url = xelsAPI + '/api/BlockStore/getallblocksfromheight';
            let query = { 'height': height,showTransactionDetails:true };

            console.log("DB Updating...")
            axios.get(Url, { params: query }).then(response => {
                if(response.data.length>0){
                    Block.insertMany(response.data,function(err,docs){
                        if(err){
                            console.log(err)
                        }else{

                            console.log('Database updated('+response.data.length+' records) from height='+(height+1))
                        }

                    })
                }else{
                    console.log('No new block found! Last block height='+height)
                }


            }).catch(err => console.log("restblock err else",err));
        }
    })


}
httpsServer.listen(configProperties.httpsPort, () => {
    console.log(`Listening on port ${configProperties.httpsPort}`);
    updateDB();
    setInterval(function () {
        Block.find().sort({heights:-1}).limit(1).exec((err,docs)=>{
            if(docs.length>0){
                updateDB(docs[0].height);
                //console.log(docs[0].height);
            }else{
                updateDB();
            }
        })
    },5*60*1000);
    // 
});

/**  server is listening to port and call all blocks information ends
 *
 *
 */

/**  socket connection with client starts
 *
 *
 */
io.on("connection", socket => {
    console.log("New client connected");
    socket.on("disconnect", () => console.log("Client disconnected"));
});
/**  socket connection with client ends
 *
 *
 */
// var server = http.createServer((req, res) => {
//   console.log(req.headers);
//   res.writeHead(301,{Location: `https://${req.headers.host}${req.url}`});
//  res.end();
// });

// server.listen(configProperties.httpPort);


// Api Starts from here
/**  get all block information starts
 *
 *
 */
app.get('/getAllBlock', (req, res) => {
    return res.redirect('/getAllBlocksParams/page=1/perPage=10')
});
/**  get all block information ends
 *
 *
 */
/**  get block information per page starts
 *
 *
 */
 app.get('/getAllBlocksParams/page=:page/perPage=:perPage', (req, res) => {
    let pageSize = req.params.perPage;
    let page = req.params.page;
    let offset = (page*pageSize)-pageSize;
    Block.find().skip(offset).limit(parseInt(pageSize)).sort({height:-1}).exec((err,docs)=>{
        if(err){
            console.log('Query Error:',err);
        }else{
            Block.countDocuments().exec((err,count)=>{
                let data = {
                    "totalLength": count,
                    "blocksArray": docs
                }
                res.json(data);
            })


        }
    })
});

app.get('/getTransactions/page=:page/perPage=:perPage', (req, res) => {
    let pageSize = req.params.perPage;
    if(pageSize>0){
        pageSize = parseInt(pageSize)
    }else{
        pageSize = 10;
    }
    let page = req.params.page;
    if(page>0){
        page = parseInt(page)
    }else{
        page = 1;
    }
    let offset = (page*pageSize)-pageSize;
    let searchValue = req.query['search'];

    let aggregate = [{ $unwind :'$transactions'}];
    let aggregateForCount = [{ $unwind :'$transactions'}];
    if(searchValue){
        let orConditions = [
            {'transactions.txid':{ $regex: searchValue }},
            // {'transactions.inputs':{ $regex: searchValue }},
            // {'transactions.outputs':{ $regex: searchValue }}
        ];
        aggregate.push({ $match:{$or:orConditions}})
        aggregateForCount.push({ $match:{$or:orConditions}})
    }
    aggregate.push({ $project : {
            height : '$height',
            txid : '$transactions.txid',
            time : '$transactions.time',
            lockTime : '$transactions.lockTime',
            // inputs : '$transactions.inputs',
            // outputs : '$transactions.outputs',
            vin : '$transactions.vin',
            vout : '$transactions.vout'
        } })
    aggregate.push({ $sort : { height : -1 } });
    aggregate.push({ $skip :offset});
    aggregate.push({ $limit :pageSize});
    Block.aggregate(aggregate).exec((err,transactions)=>{

        if(err){
            console.log(err);
        }else{
            aggregateForCount.push({ $count : 'transactions'});
            Block.aggregate(aggregateForCount).exec((err,total)=>{

                if(err){
                    console.log(err)
                }else{
                    if(!total[0]){
                        total[0] = {transactions:0};
                    }
                    let total_tx= total[0].transactions;
                    let data = {
                        transactions,
                        "transactionLength": total_tx
                    }
                    res.json(data);
                }
            })
        }
    })
});
/**  get block information per page ends
 *
 *
 */
/**  address routing starts
 *
 *
 */
app.get('/address/page=:page/perPage=:perPage', (req, res) => {
    let y = "address";
    let pageSize = req.params.perPage;
    let page = req.params.page;
    showAddressList(y).then(result => {
        if (result.InnerMsg.length > 0) {
            {
                let perPageResult = result.InnerMsg.slice(pageSize * (page - 1), pageSize * page);

                let data = {
                    "totalLength": result.InnerMsg.length,
                    "richList": perPageResult
                }
                res.status(200).json(data);
            }
        }
    });
});
/**  address routing per page ends
 *
 *
 */

app.get('/', (req, res) => {
    res.redirect('/getAllBlock');
});
/**  search block information routing starts
 *
 *
 */
app.get('/getSearchVal', (req, res) => {
    SearchElement(req.query.value, req.query.types)
        .then(result => {
            if (result.length > 0) {
                let successObj = {
                    "statusCode": 200,
                    "statusText": 'Ok',
                    "InnerMsg": result
                }
                //console.log(successObj);
                res.status(200).json(successObj);
            } else {
                let notFounObj = {
                    "statusCode": '',
                    "statusText": 'Ok',
                    "InnerMsg": "No Matches Found"
                }
                res.status(200).json(notFounObj);
            }
        }).catch(err => console.log(err));
});
/**  search block information routing ends
 *
 *
 */

/**  method of read all blocks start
 *
 */
function ReadAllData() {
    return new Promise((resolve, reject) => {

        Block.find().sort({height:-1}).exec((err,docs)=>{
            if(err){
                console.log('Query Error:',err);
                reject(err)
            }else{
                resolve(docs)


            }
        })

    }).catch(err => console.log(err));
}
/**  method of read all blocks ends
 *
 */
/**  method of searching elements starts
 *
 *
 */
function SearchElement(value, type) {

    if (type === 'Blocks') {
        return new Promise((resolve, reject) => {
            let orConditions = [{hash:value}];
            if(Number(value)){
                orConditions.push({height:Number(value)});
            }
            Block.find({$or:orConditions}).exec((err,docs)=>{
                if(err){
                    console.log('Query Error:',err)
                }else{
                    console.log(docs)
                    resolve(docs);
                }

            })
        });
    } else if (type === 'Transactions') {
        let orConditions = [
                {'transactions.txid':{ $regex: value }},
            ];
        return new Promise((resolve,reject)=>{
            let ag = [
                { $unwind :'$transactions'},
                { $match:{$or:orConditions}},
                { $project : {
                        txid : '$transactions.txid',
                        time : '$transactions.time',
                    } }
            ];
            Block.aggregate(ag).exec((err,transactions)=>{
                if(err){
                    console.log(err);
                }else{
                    let txdata = common.getMappedTransactionData(transactions)
                    resolve(txdata);
                }
            })
        })
    } else if (type === 'RichAddress') {
        let searchAddress = app.locals.richListdetail;
        return new Promise((resolve, reject) => {
            let arrayFind = [];
            searchAddress.filter((listItem) => {
                for (var key in listItem) {
                    // tslint:disable-next-line:max-line-length
                    if (listItem[key].toString().includes(value)) {
                        arrayFind.push(listItem);
                    }
                }
                resolve(arrayFind);
            });
        });
    }
}
/**  method of searching elements ends
 *
 *
 */
/**  address mapping of transaction starts
 *
 *
 */
function showAddressList(y) {
    return new Promise((resolve, reject) => {
        ReadAllData().then(result => {
            let filteredAddress = transactionMapping(result);
            let groupedAddress = groupAddress(filteredAddress);
            let sortedAddress = sortAddress(groupedAddress);
            app.locals.richListdetail = sortedAddress;
            let successObj = {
                "statusCode": 200,
                "statusText": "Ok",
                "InnerMsg": sortedAddress
            }
            resolve(successObj);
        }).catch(err => console.log(err));
    });

}
/**  method of mapping transaction and filtered Address  starts
 *
 *
 */
function transactionMapping(result) {
    let transactionData = result.map(a => a.transactions);
    let transactionArray = [].concat.apply([], transactionData);
    let filteredTransaction = addressMapping(transactionArray);
    return filteredTransaction;
}
/**  method of mapping transaction and filtered Address  ends
 *
 *
 */
/**  method of mapping richlist address starts
 *
 *
 */
function addressMapping(transactionArray) {
    let mappedData = common.getMappedTransactionData(transactionArray);
    if (mappedData.length > 0) {
        let voutData = mappedData.map(a => a.vOut);
        let vInData = mappedData.map(a => a.vIn);
        const a = common.vOutAddress(voutData);
        const b = common.vInAddress(vInData);
        let filteredAddress = common.CommonAddressDelete(a, b);

        return filteredAddress;
    }
}
/**  method of mapping richlist address ends
 * 
 *
 *
 */
/**  method of grouping richlist address starts
 *
 *
 */
function groupAddress(groupAddress) {
    let groupedArr = common.groupVOutArray(groupAddress);
    return groupedArr;
}
/**  method of grouping richlist address ends
 *
 *
 */
/**  method of sorting richlist starts
 *
 *
 */
function sortAddress(mapAddress) {
    let sortedAddress = mapAddress.sort((a, b) => (a.amount > b.amount) ? -1 : 1);
    return sortedAddress;
}
/**  method of sorting richlist ends
 *
 *
 */

/** get newly generated block information routing starts
 *
 *
 */
app.get('/RestBlock', (req, res) => {
    let height = req.query['height'];
    if(height){
        Block.find({height:{$gt:height}}).limit(100).sort({height:-1}).exec((err,docs)=>{
            if(err){
                console.log("Rest Block error");
                let errObj = {
                    "statusCode": 500,
                    "statusText": 'ERROR',
                    "InnerMsg": 'Rest Block ERROR'
                }
                res.status(500).json(errObj);
            }else{
                let successObj = {
                    "statusCode": 200,
                    "statusText": 'OK',
                    "InnerMsg": docs
                }
                res.status(200).json(successObj);
            }

        })
    }else{
        let errObj = {
            "statusCode": 400,
            "statusText": 'ERROR',
            "InnerMsg": 'Minimum height should be provided'
        }
        res.status(500).json(errObj);
    }


});
/** get newly generated block information routing ends
 *
 *
 */
/** generic Get api response routing starts
 *
 *
 */
app.get('/GetAPIResponse', (req, res) => {
    let URL = req.query.URL;
    const parseParams = (params) => {
        if (params.URL)
            delete params.URL;
        const keys = Object.keys(params);
        let options = '';
        keys.forEach((key) => {
            const isParamTypeObject = typeof params[key] === 'object';
            const isParamTypeArray = isParamTypeObject && (params[key].length >= 0);
            if (!isParamTypeObject && !isParamTypeArray) {
                options += `${key}=${params[key]}&`;
            }
            if (isParamTypeObject && isParamTypeArray) {
                let index = 0;
                params[key].forEach((element, index) => {

                    Object.keys(element).forEach((keyName) => {

                        options += `${key}[${index}].`;
                        options += `${keyName}=${element[keyName]}&`;

                    });
                });
            }
        });
        let str = options ? options.slice(0, -1) : options;
        return encodeURI(str);
    };

    let Url = xelsAPI + URL;
    axios.get(xelsAPI + URL, { params: req.query, paramsSerializer: params => parseParams(params) })
        .then(response => {
            let successObj = {
                "statusCode": response.status,
                "statusText": response.statusText,
                "InnerMsg": response.data
            }
            res.status(response.status).json(successObj);
        }).catch(error => {
            console.log(error);
            let errObj = {
                "statusCode": error.response.status,
                "statusText": error.response.statusText,
                "InnerMsg": error.response.data.errors ? error.response.data.errors : ""
            }
            res.status(error.response.status).json(errObj);
        });
 


});
/** generic Get api response routing ends
 *
 *
 */
/** generic Post api response routing starts
 *
 *
 */
app.post('/PostAPIResponse', (req, res) => {

    console.log("req.query");
    let URL = '';
    if (common.isEmpty(req.query)) {
        req.query = req.body;
        URL = req.query.URL;
    } else {
        URL = req.query.URL;
    }
    axios({ method: 'post', url: xelsAPI + URL, data: req.query })
        .then(response => {
            let successObj = {
                "statusCode": response.status,
                "statusText": response.statusText,
                "InnerMsg": response.data
            }
            res.status(response.status).json(successObj);
        }).catch(error => {
            let errObj = {
                "statusCode": error.response.status,
                "statusText": error.response.statusText,
                "InnerMsg": error.response.data.errors ? error.response.data.errors : ""
            }
            res.status(error.response.status).json(errObj);
        });
   

});
/** generic Post api response routing ends
 *
 *
 */