//file access 
var common = require('./config/common');
const configProperties = require('./config/config');


// node modules access
const fs = require('fs');
const http = require('http');
const https = require('https');


const express = require("express"),
    cors = require("cors"),
    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest,
    bodyParser = require("body-parser"),
    axios = require('axios'),
    WebSocket = require('websocket').w3cwebsocket;

const socketIo = require("socket.io");

const app = express();
let xelsAPI = configProperties.xelsApi;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.locals.richListdetail;
app.locals.transactionDetails;

// environment variables
process.env.NODE_ENV = 'development';

//create httpsServer
const server = http.createServer(app);
const httpsServer = https.createServer(configProperties.httpsOptions, app);

//const io = socketIo(httpsServer);
const io = socketIo(server);

let AllBlockInfo = [];
// a middleware function with no mount path. This code is executed for every request to the router

app.use(function(req, res, next) {

    // if(req.protocol === 'http')
    // {
    //   res.redirect(301, `https://${req.headers.host}${req.url}`);
    // }

    // else
    // {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Assassin-RequestHash");
    next();
    // }

});
/**  server is listening to port and call all blocks information starts
 *
 *
 */
server.listen(configProperties.httpPort, () => {
    console.log(`Listening on port ${configProperties.httpPort}`);
    fs.exists('YourArrayFile', function(exists) {
        if (exists) {
            ReadFileToSearch().then(result => {
                if (result.InnerMsg.length > 0) {
                    let Url = xelsAPI + '/api/BlockExplorer/RestblockAppend';
                    let query = { 'height': result.InnerMsg[0].height };
                    axios.get(Url, { params: query }).then(response => {

                        let successObj = {
                            "statusCode": response.status,
                            "statusText": response.statusText,
                            "InnerMsg": response.data
                        }

                        let newData = response.data;
                        if (newData.length > 0) {
                            const addedResult = newData.concat(result.InnerMsg);
                            let addIntoFile = filerewrite(addedResult).then(res => {
                                console.log("added into file");
                            });
                        }

                    }).catch(err => console.log("restblock err if"));
                }
            });

        } else {
            let Url = xelsAPI + '/api/BlockExplorer/RestblockAppend';
            let query = { 'height': 0 };
            //console.log("hello not exist")
            axios.get(Url, { params: query }).then(response => {

                let successObj = {
                    "statusCode": response.status,
                    "statusText": response.statusText,
                    "InnerMsg": response.data
                }
                AllBlockInfo = JSON.stringify(successObj);
                fs.writeFile('YourArrayFile', AllBlockInfo, (err, data) => {
                    if (err) {
                        console.log("error " + err);
                    } else {
                        console.log("Successfully Written to File.");
                    }
                });

            }).catch(err => console.log("restblock err else"));

        }
    });
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
    fs.readFile('YourArrayFile', 'utf8', function(err, data) {
        if (err) {
            return err;
        } else {
            res.send(data);
        }
    });
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
    ReadFileToSearch().then(response => {
        if (response.InnerMsg.length > 0) {
            let transactionsInfo = response.InnerMsg.map(a => a.transactions);
            let transactionArray = Array.prototype.concat.apply([], transactionsInfo);
            app.locals.transactionDetails = transactionArray;
            let blocks = response.InnerMsg.slice(pageSize * (page - 1), pageSize * page);
            let data = {
                "totalLength": response.InnerMsg.length,
                "blocksArray": blocks,
                "transactionLength": transactionArray.length
            }
            res.json(data);
        }
    });
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

    ReadFileToSearch().then(dataRes => {

        let p = SearchElement(dataRes.InnerMsg, req.query.value, req.query.types)
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
});
/**  search block information routing ends
 *
 *
 */

/**  method of file read starts
 *
 */
function ReadFileToSearch() {
    return new Promise((resolve, reject) => {
    
        fs.readFile('YourArrayFile', 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                console.log("reading file");
                let parsedData;
                try {
                    parsedData = JSON.parse(data);
                } catch (e) {
                    parsedData = JSON.parse(JSON.stringify(data));
                }
                //let parsedData = JSON.parse(JSON.stringify(data));
                resolve(parsedData);
            }
        });
    }).catch(err => console.log(err));
}
/**  method of file read ends
 *
 */
/**  method of searching elements starts
 *
 *
 */
function SearchElement(arr, value, type) {
    let blockData = common.getMappedData(arr);
    if (type === 'Blocks') {
        return new Promise((resolve, reject) => {
            let arrayFind = [];
            blockData.filter((item) => {
                for (var key in item) {
                    // tslint:disable-next-line:max-line-length
                    if (item[key].toString().includes(value)) {
                        arrayFind.push(item);
                    }
                }
                resolve(arrayFind);
            });
        });
    } else if (type === 'Transactions') {
        let mappedTransaction = common.getMappedTransactionData(app.locals.transactionDetails);
        return new Promise((resolve, reject) => {
            let arrayFind = [];
            mappedTransaction.filter((transactionItem) => {
                for (var key in transactionItem) {
                    // tslint:disable-next-line:max-line-length
                    if (transactionItem.hasOwnProperty(key) && transactionItem[key].toString().includes(value)) {
                        arrayFind.push(transactionItem);
                    }
                }
                resolve(arrayFind);
            });
        });
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
        let data = ReadFileToSearch().then(result => {
            let filteredAddress = transactionMapping(result);
            let groupedAddress = groupAddress(filteredAddress);
            let sortedAddress = sortAddress(groupedAddress);
            app.locals.richListdetail = sortedAddress;
            console.log(sortedAddress);
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
    let transactionData = result.InnerMsg.map(a => a.transactions);
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
/**  method of adding new blocks in existing file starts
 *
 *
 */



function filerewrite(result) {
    return new Promise((resolve, reject) => {
        const unique = [];
        result.map(x => unique.filter(a => a.height === x.height).length > 0 ? null : unique.push(x));
        let obj = {
            "statusCode": 200,
            "statusText": result.statusText,
            "InnerMsg": unique
        }
        let appendData = JSON.stringify(obj);
        fs.writeFile('YourArrayFile', appendData, 'utf8', (err, rows) => {
            //console.log(rows);
            if (err) {
                console.log("Rewrite error");
                reject(err);
            }
            console.log("Successfully saved to File.");
            resolve(rows);

        });
    });
}
/**  method of adding new blocks in existing file ends
 *
 *
 */
/** get newly generated block information routing starts
 *
 *
 */
app.get('/RestBlock', (req, res) => {
    let Url = xelsAPI + req.query.URL;
    axios.get(Url, { params: req.query })
        .then(response => {
            let successObj = {
                "statusCode": response.status,
                "statusText": response.statusText,
                "InnerMsg": response.data
            }
            let newData = response.data;

            if (newData.length) {
                ReadFileToSearch().then(res => {
                    const result = newData.concat(res.InnerMsg);
                    let rewriteData = filerewrite(result).then(res => {
                        console.log("RestBlock Called");
                    });;
                });
                res.status(response.status).json(successObj);
            } else {
                res.status(response.status).json(successObj);
            }
        })
        .catch(error => {
            console.log("Rest Block error");
            console.log(error);
            let errObj = {
                "statusCode": error.response.status,
                "statusText": error.response.statusText,
                "InnerMsg": error.response.data.errors ? error.response.data.errors : ""
            }
            res.status(error.response.status).json(errObj);
        });

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
    console.log(req.query);
    console.log(req.body);
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