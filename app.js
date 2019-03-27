const express = require("express"),
    cors = require("cors"),
    // signalR = require("@aspnet/signalr"),
    XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    WebSocket = require('websocket').w3cwebsocket;
    const env = require('./server');
const socketIo = require("socket.io");
const http = require("http");
const app = express(),
bodyParser = require("body-parser");

var fs = require("fs");
const axios = require('axios');

let port = (env.port)?env.port:4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//file access 
var common = require('./config/common');

// environment variables
process.env.NODE_ENV = 'development';

// uncomment below line to test this code against staging environment
// process.env.NODE_ENV = 'staging';


// config variables
const config = require('./config/config.js');



const server = http.createServer(app);
const io = socketIo(server);
let base = `http://localhost:37221`;
let dataVal;

//etherum wallet address generation 
let Accounts = require('ethereumjs-wallet');
    //let acc_eth = new Accounts();
let acc = Accounts.generate();
function etherumWallet()
{
  let wallet ={
    'network':'mainnet',
    'public':acc.getAddressString(),
    'private':acc.getPrivateKeyString()
  };
  return wallet;
}

let AllBlockInfo = [];
io.on("connection", socket => {
    console.log("New client connected");
    socket.on("disconnect", () => console.log("Client disconnected"));
});

server.listen(port, () => {
	console.log(`Listening on port ${port}`);
	axios.get(base+'/api/BlockExplorer/GetAllBlockInfo').then(response =>{
        let successObj = {
          "statusCode" : response.status,
            "statusText" : response.statusText,
            "InnerMsg" : response.data
        }
        AllBlockInfo = JSON.stringify(successObj);
        //console.log(AllBlockInfo);
        fs.writeFile('YourArrayFile', AllBlockInfo,(err, data) =>{
          if (err) {console.log("eeeeee "+err);}
          else{
            console.log("Successfully Written to File.");
          }
        })
      }); 
});



  app.get('/getAllBlock', (req, res) => {
    fs.readFile('YourArrayFile', 'utf8', function (err,data) {
      if (err) {
        console.log("GetAllBlock");
        return err;
      }
      else
      {
        res.send(data);
      }     
    });
  });
 

app.get('/getEthWallet', (req,res) => {
  let m = etherumWallet();
  res.json(m);
});
app.get('/RestBlock', (req,res ) =>{
    let Url = base+ req.query.URL;
    axios.get(Url , {params: req.query})
    .then(response =>{
      let successObj = {
        "statusCode" : response.status,
        "statusText" : response.statusText,
        "InnerMsg" : response.data
      }
      let newData =response.data;
      fs.readFile('YourArrayFile', 'utf8', (err,OldData) => {
        if (err) {
          console.log("RestBlock Before");
          return err;
        }
        else
        {
          let m= JSON.parse(OldData);
          const result = newData.concat(m.InnerMsg);
          const unique = [];
          result.map(x => unique.filter(a => a.height == x.height).length > 0 ? null : unique.push(x));
          let obj = {
            "statusCode" : m.status,
            "statusText" : m.statusText,
            "InnerMsg" : unique
          }
         let appendData = JSON.stringify(obj);
          fs.writeFile('YourArrayFile', appendData , function(err) {
            if(err) {
              console.log("RestBlock After");
              return;
             } 
             else{
              console.log("Successfully Added to File.");
             }
            });
        }     
      });
      res.status(response.status).json(successObj);
    })
    .catch(error => {
      console.log(error);
      let errObj = {
        "statusCode" : response.status,
        "statusText" : response.statusText,
        "InnerMsg" : response.data
      }
      res.status(response.status).json(errObj);
    });
  
});

app.get('/GetAPIResponse', (req, res) => {
  let URL = req.query.URL;
  const parseParams = (params) => {
   if(params.URL)
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
        let index = 0 ;
        params[key].forEach((element) => {
         let m = `${key}[0]`;
         Object.keys(element).forEach(keeee =>{
          options += `${key}[0].${keeee}=${element[keeee]}&`;
         }
           );
        });
      }
    });
    let str =  options ? options.slice(0, -1) : options;
    return encodeURI(str);
   };

  axios.get(base + URL, {params: req.query , paramsSerializer: params => parseParams(params)})
  .then(response => {
    let successObj = {
      "statusCode" : response.status,
        "statusText" : response.statusText,
        "InnerMsg" : response.data
    }
      res.status(response.status).json(successObj);
  }).catch(error => {
   
    let errObj ={ "statusCode" : error.response.status,
        "statusText" : error.response.statusText,
        "InnerMsg" : error.response.data.errors ? error.response.data.errors : ""
      }
      res.status(error.response.status).json(errObj);
    });

});

app.post('/PostAPIResponse',  (req, res) => {
  if(common.isEmpty(req.query)){
    req.query = req.body? req.body : req.query;
      let URL = req.query.URL;
        axios({ method: 'post', url: base + URL, data: req.query })
        .then(response => {
          let successObj = {
            "statusCode" : response.status,
              "statusText" : response.statusText,
              "InnerMsg" : response.data
          }
            res.status(response.status).json(successObj);
        }).catch(error => {
          let errObj ={ 
            "statusCode" : error.response.status,
              "statusText" : error.response.statusText,
              "InnerMsg" : error.response.data.errors ? error.response.data.errors : ""
            }
            res.status(error.response.status).json(errObj);
          });
  }
  else{
    let URL = req.query.URL;
        axios({ method: 'post', url: base + URL, data: req.query })
        .then(response => {
          let successObj = {
            "statusCode" : response.status,
              "statusText" : response.statusText,
              "InnerMsg" : response.data
          }
            res.status(response.status).json(successObj);
        }).catch(error => {
          let errObj ={ 
            "statusCode" : error.response.status,
              "statusText" : error.response.statusText,
              "InnerMsg" : error.response.data.errors ? error.response.data.errors : ""
            }
            res.status(error.response.status).json(errObj);
          });
  }
   
});

// a middleware function with no mount path. This code is executed for every request to the router
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, X-Assassin-RequestHash");
    next();
});


//unused codes

// connection.on("BroadcastMessage", (type, payload) => {
//   let url = '/api/BlockExplorer/GetBlockInfo?height='+ payload;
  // request(base + url, (err, response, body) => {
  //     if(err){
  //         console.log('error:', err);
  //     } else {
  //         dataVal = JSON.parse(body);
  //         io.sockets.emit('data',dataVal);
  //     }
  //   });
// });



// let connection = new signalR.HubConnectionBuilder()
//   .withUrl(base + '/notify',{
//     skipNegotiation: true,
//     transport: signalR.HttpTransportType.WebSockets
//   })
//   .build();
//   connection.on("Receive", (payload) => {
//     //console.log(payload);
//   });
//   connection
//   .start()
//   .then(() => {
//     console.log("connection started");
     
//   })
//   .catch(err => console.log(err));