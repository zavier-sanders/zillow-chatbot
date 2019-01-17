'use strict';
var Zillow  = require('node-zillow')

module.exports.handler = (event, context, callback) => {
  // Parameters
  // address: required
  // zipcode: reqiured
  // platform: optional
  // mortgagePayoff: optional


 
  var zwsid = 'X1-ZWz1g5uqm8cbgr_7hp6b'
  var zillow = new Zillow(zwsid)
  var platform = event.queryStringParameters.platform || 'manychat';
  let mortgagePayoff = event.queryStringParameters.mortgagePayoff || 0;
  let equityHigh;
  let equityLow;
  let valueLow;
  let valueHigh; 
  let data;
  
  var GetSearchResults = {
    address: event.queryStringParameters.address,
    citystatezip: event.queryStringParameters.zipcode
  };
  
  var GetZestimateParameters = {
    zpid: 1111111
  };
  
  zillow.get('GetSearchResults', GetSearchResults)
    .then(function(results) {
      
      let zpid = results.response.results.result[0].zpid[0];
      let zestimate = results.response.results.result[0].zestimate[0];
      console.log('zpid', zpid);
      console.log('zestimate', zestimate);
      console.log('platform ', platform);

      GetZestimateParameters.zpid = zpid;
      return zillow.get('GetZestimate', GetZestimateParameters);
    })
    .then(function(results) {
      valueHigh = results.response.zestimate.valuationRange[0].high[0]['_'];
      valueLow = results.response.zestimate.valuationRange[0].low[0]['_'];
      equityHigh = (valueHigh - (valueHigh * 0.10) - mortgagePayoff).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      equityLow = (valueLow - (valueLow * 0.10) - mortgagePayoff).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      switch (platform) {
        case 'chatfuel':
          data = Object.assign({}, {
            messages: [
                {
                  "text": `Ok. Here is what I have calculated. This is based on an estimated market value - the cost of sales - your pay off 
                  \n If all goes according to plan you would be left with around $${equityLow} - $${equityHigh}`
                }
             ]
          });
          break;
        case 'manychat':
          data = Object.assign({}, {
            "version": "v2",
            "content": {
                "messages": [
                    {
                       "type": "text",
                       "text": `Ok. Here is what I have calculated. This is based on an estimated market value - the cost of sales - your pay off 
                       \n If all goes according to plan you would be left with around $${equityLow} - $${equityHigh}`
                    }
                ]
            }
          });
          break;
        case 'landbot':
          data = Object.assign({}, {
            messages: [
              {
                "data": {
                    "body": `<p>Ok. Here is what I have calculated. This is based on an estimated market value - the cost of sales - your pay off </p>
                    <p>If all goes according to plan you would be left with around $${equityLow} - $${equityHigh}</p>`
                }
              }
            ]
          });
          break;
        default:
          data = Object.assign(results.response, {
            "version": "v2",
            "content": {
                "messages": [
                  {
                    "type": "text",
                    "text": `Ok. Here is what I have calculated. This is based on an estimated market value - the cost of sales - your pay off 
                    \n If all goes according to plan you would be left with around $${equityLow} - $${equityHigh}`
                 }
                ]
            }
          });
      };

      let response = {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    
      callback(null, response);
    })
    .catch(function(err) {
      let response = {
        statusCode: 200,
        body: JSON.stringify({messages: [
          {"text": "Sorry. I could not calculate a home equity for that address. \nPlease try again."}  
        ]}),
      };
    
      callback(null, response);
    })
};
