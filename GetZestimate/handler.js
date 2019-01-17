'use strict';
var Zillow  = require('node-zillow')

module.exports.GetZestimate = (event, context, callback) => {
 
  var zwsid = 'X1-ZWz1g5uqm8cbgr_7hp6b'
  var zillow = new Zillow(zwsid)
  var platform = event.queryStringParameters.platform || 'manychat';
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
      console.log(results);
      var timestamp = Date.now();
      var imgSource = `https://maps.googleapis.com/maps/api/staticmap?center=${results.response.address.latitude},${results.response.address.longitude}&zoom=16&size=600x300&maptype=roadmap&markers=color:blue%7C${results.response.address.latitude},${results.response.address.longitude}&key=AIzaSyCVc1hIJf6fq14mKH30pjGSf1q6gSBcZ6I`;
        
      // results here is an object { message: {}, request: {}, response: {}} 
      
      switch (platform) {
        case 'chatfuel':
          data = Object.assign({}, {
            messages: [
                {
                  "attachment": {
                    "type": "image",
                    "payload": {
                      "url": imgSource
                    }
                  }
                },
               {"text": `${results.response.address.street}\n${results.response.address.city}, ${results.response.address.state}\n${results.response.address.zipcode}
               \n
               \n🏡 Estimate: $${results.response.zestimate.amount[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
               \n⬆️ Estimate Range: $${results.response.zestimate.valuationRange[0].low[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - $${results.response.zestimate.valuationRange[0].high[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
               \n
               \n✅ More Information: ${results.response.links.homedetails}
               \n✅ Comparables: ${results.response.links.comparables}
               `}
             ]
          });
          break;
        case 'manychat':
          data = Object.assign({}, {
            "version": "v2",
            "content": {
                "messages": [
                    {
                      "type": "image",
                      "url": imgSource
                    },
                    {
                       "type": "text",
                       "text": `${results.response.address.street}\n${results.response.address.city}, ${results.response.address.state}\n${results.response.address.zipcode}
                        \n
                        \n🏡 Estimate: $${results.response.zestimate.amount[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        \n⬆️ Estimate Range: $${results.response.zestimate.valuationRange[0].low[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - $${results.response.zestimate.valuationRange[0].high[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        \n
                        \n✅ More Information: ${results.response.links.homedetails}
                        \n✅ Comparables: ${results.response.links.comparables}`
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
                    "url": imgSource,
                    "body": `<br/><p>${results.response.address.street}</p><p>${results.response.address.city}, ${results.response.address.state}</p><p>${results.response.address.zipcode}</p><br/><p>🏡 Estimate: $${results.response.zestimate.amount[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p><p>⬆️ Estimate Range: $${results.response.zestimate.valuationRange[0].low[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - $${results.response.zestimate.valuationRange[0].high[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p><br/><p>✅ <a target="_blank" href="${results.response.links.homedetails}">More Information</a></p><p>✅ <a target="_blank" href="${results.response.links.comparables}">Comparables</a></p>`  
                }
              }
            ]
          });
          break;
        default:
          data = Object.assign({}, {
            "version": "v2",
            "content": {
                "messages": [
                    {
                      "type": "image",
                      "url": "https://rockets.chatfuel.com/assets/welcome.png"
                    },
                    {
                       "type": "text",
                       "text": `${results.response.address.street}\n${results.response.address.city}, ${results.response.address.state}\n${results.response.address.zipcode}
                        \n
                        \n🏡 Estimate: $${results.response.zestimate.amount[0]['_']}
                        \n⬆️ Estimate Range: $${results.response.zestimate.valuationRange[0].low[0]['_']} - $${results.response.zestimate.valuationRange[0].high[0]['_']}
                        \n
                        \n✅ More Information: ${results.response.links.homedetails}
                        \n✅ Comparables: ${results.response.links.comparables}`
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
          {"text": "Sorry. I could not create a home valuation for that address. \nPlease try again."}  
        ]}),
      };
    
      callback(null, response);
    })
};
