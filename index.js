const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

app.use(cors());

// fetch 2019 account transactions API endpoint
app.get("/2019/:wallet", async (req, res) => {
  const walletID = req.params.wallet;
  const action = req.query.action;
  const startBlock = 6990337;
  const endBlock = 9194676;
  try {
    const results = await loadTxns(walletID, startBlock, endBlock, action);
    res.send(results);
  } catch (e) {
    console.log(e);
    return e;
  }
});

// fetch 2020 account transactions API endpoint
app.get("/2020/:wallet", async (req, res) => {
  const walletID = req.params.wallet;
  const action = req.query.action;
  const startBlock = 9194677;
  const endBlock = 11566959;
  try {
    const results = await loadTxns(walletID, startBlock, endBlock, action);
    res.send(results);
  } catch (e) {
    console.log(e);
    return e;
  }
});

// fetch 2021 account transactions API endpoint
app.get("/2021/:wallet", async (req, res) => {
  const walletID = req.params.wallet;
  const action = req.query.action;
  const startBlock = 11566960;
  const endBlock = 20000000; //end is TBD... block @ 26-08-2021 is ~13XXXXXX.
  try {
    const results = await loadTxns(walletID, startBlock, endBlock, action);
    res.send(results);
  } catch (e) {
    console.log(e);
    return e;
  }
});

//to paginate, add '&page=<page#>&offset=<max#results>' to queryString (as per docs)
async function loadTxns(walletID, startBlock, endBlock, action) {
  let txnList = null;
  const txns = await axios.get(
    `https://api.etherscan.io/api?module=account&action=${action}&address=${walletID}&startblock=${startBlock}&endblock=${endBlock}&sort=asc&apikey=${process.env.ETHERSCAN_KEY}`
  );
  txnList = txns.data.result;

  //filter txnList for results only where "from" === "walletID"
  txnList = txnList.filter(function (x) {
    return x.from === walletID.toLowerCase();
  });

  //loop through txnList for each transaction.timeStamp
  //convert timeStamp to date object
  //query coinbase for daily spot price
  //add spot price to each transaction in txnList.
  for (let i = 0; i < txnList.length; i++) {
    const jsTimestamp = txnList[i].timeStamp * 1000;
    const formattedDate = new Date(jsTimestamp);
    const year = formattedDate.getFullYear();
    const month = formattedDate.getMonth() + 1;
    const date = formattedDate.getDate();
    const apiFormatDate = year + "-" + month + "-" + date;
    const spotPriceETH = await axios.get(
      `https://api.coinbase.com/v2/prices/ETH-USD/spot?date=${apiFormatDate}`
    );
    const spotPrice = spotPriceETH.data;
    txnList[i] = { ...txnList[i], ...spotPrice, formattedDate };
  }

  return txnList;
}

//production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(__dirname + "/public"));
}

//SPA
app.get(/.*/, (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

//listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
