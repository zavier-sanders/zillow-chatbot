'use strict';

const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const gm = require('gm').subClass({
  imageMagick: true
});
const Zillow = require('node-zillow');
let api_key;

// const parseText = text => (text || '').toUpperCase();
// const getImages = () => fs.readdirSync(IMAGES_DIR);
// const parseImage = image => getImages().find(file => file.indexOf(image) === 0);
// const random = arr => arr[Math.floor(Math.random() * arr.length)];
// const randomImage = () => random(getImages());

module.exports.handler = (event, context, callback) => {

  var zwsid = 'X1-ZWz1g5uqm8cbgr_7hp6b';
  var zillow = new Zillow(zwsid);
  var platform = event.queryStringParameters.platform || 'manychat';
  api_key = event.queryStringParameters.api_key;
  let data;

  var GetSearchResults = {
    address: event.queryStringParameters.address,
    citystatezip: event.queryStringParameters.zipcode
  };

  var GetZestimateParameters = {
    zpid: 1111111
  };

  zillow.get('GetSearchResults', GetSearchResults)
    .then(function (results) {

      let zpid = results.response.results.result[0].zpid[0];
      let zestimate = results.response.results.result[0].zestimate[0];
      console.log('zpid', zpid);
      console.log('zestimate', zestimate);
      console.log('platform ', platform);

      GetZestimateParameters.zpid = zpid;
      return zillow.get('GetZestimate', GetZestimateParameters);
    })
    .then(function (results) {
      console.log(results);
      const {
        IMAGES_DIR,
        TEXT_SIZE,
        TEXT_PADDING,
        WEBVIEW_URL_PROD
      } = process.env;
      // const input = event.queryStringParameters || {};
      const top = `Created For ${results.response.address.street}`;
      const bottom = `$${results.response.zestimate.amount[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      // const image = parseImage(input.image) || randomImage();

      const homeValueEstimate = gm(`${IMAGES_DIR}for-sale-home-tropical.jpeg`);

      homeValueEstimate.size(function (err, {
        height
      }) {
        homeValueEstimate
          .font('./caveat-regular.ttf', 55)
          .fill('white')
          .stroke('white', 1)
          .drawText(0, -(height / 2 - TEXT_PADDING), top, 'center')
          .font('./caveat-regular.ttf', 55)
          .fill('red')
          .stroke('red', 2)
          .draw(`gravity`, 'center', `rotate`, -1, `text -190,${height / 2 - 200} '${bottom}'`) //-35 is rotate angle for text
          .toBuffer(function (err, buffer) {

            var params = {
              Bucket: "remax-chatbot-images",
              Key: "home-value/" + Date.now() + "",
              Body: buffer,
              ContentType: 'image/png',
              ACL: 'public-read'
            };

            s3.upload(params, function (err, data) {
              switch (platform) {
                case 'chatfuel':
                  data = Object.assign({}, {
                    messages: [{
                        "attachment": {
                          "type": "image",
                          "payload": {
                            "url": data.Location
                          }
                        }
                      },
                      {
                        "text": `Homes like yours are selling for between $${results.response.zestimate.valuationRange[0].low[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - $${results.response.zestimate.valuationRange[0].high[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                      },
                      {
                        "text": "This value was derived from area sales, and doesn't include any updates you have made to your home. \n You can take a look here 👇"
                      },
                      {
                        "attachment": {
                          "type": "template",
                          "payload": {
                            "template_type": "generic",
                            "image_aspect_ratio": "horizontal",
                            "elements": [{
                              "title": `Market Report`,
                              "image_url": "https://manybot-thumbnails.s3.eu-central-1.amazonaws.com/fb230777667645921/ca/big_fa20ac57cc21196d07a225fc49394aca.png",
                              "subtitle": "Recent home sales in your neighborhood and how they effect your value",
                              "buttons": [{
                                "type": "web_url",
                                "url": `${WEBVIEW_URL_PROD}/sellers/comps/${results.response.zpid}?api_key=${api_key}`,
                                "messenger_extensions": true,
                                "webview_height_ratio": "full",
                                "title": "See Details"
                              }]
                            }, ]
                          }
                        }
                      },
                    ]
                  });
                  break;
                case 'manychat':
                  data = Object.assign({}, {
                    "version": "v2",
                    "content": {
                      "messages": [{
                          "type": "image",
                          "url": data.Location
                        },
                        {
                          "type": "text",
                          "text": `Homes like yours are selling for between $${results.response.zestimate.valuationRange[0].low[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - $${results.response.zestimate.valuationRange[0].high[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                        },
                        {
                          "type": "text",
                          "text": "This value was derived from area sales, and doesn't include any updates you have made to your home. \n You can take a look here 👇"
                        },
                        {
                          "type": "cards",
                          "elements": [{
                            "title": "Market Report",
                            "subtitle": "Recent home sales in your neighborhood and how they effect your value",
                            "image_url": "https://manybot-thumbnails.s3.eu-central-1.amazonaws.com/fb230777667645921/ca/big_fa20ac57cc21196d07a225fc49394aca.png",
                            "action_url": `${WEBVIEW_URL_PROD}/sellers/comps/${results.response.zpid}?api_key=${api_key}`, //optional
                            "buttons": [{
                              "type": "url",
                              "caption": "See Details",
                              "url": `${WEBVIEW_URL_PROD}/sellers/comps/${results.response.zpid}?api_key=${api_key}`,
                              "actions": [] //optional
                            }] //optional
                          }],
                          "image_aspect_ratio": "horizontal"
                        }
                      ]
                    }
                  });
                  break;
                case 'landbot':
                  data = Object.assign({}, {
                    messages: [{
                      "data": {
                        "url": data.Location,
                        "body": `<br/><p>Homes like yours are selling for between $${results.response.zestimate.valuationRange[0].low[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - $${results.response.zestimate.valuationRange[0].high[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</p>
                          <p>This value was derived from area sales, and doesn't include any updates you have made to your home. <br /> You can take a look here 👇</p>
                          <p><a href='${WEBVIEW_URL_PROD}/sellers/comps/${results.response.zpid}?api_key=${api_key}' target='_blank'>See Details</a></p>`
                      }
                    }]
                  });
                  break;
                default:
                  data = Object.assign({}, {
                    "version": "v2",
                    "content": {
                      "messages": [{
                          "type": "image",
                          "url": data.Location
                        },
                        {
                          "type": "text",
                          "text": `Homes like yours are selling for between $${results.response.zestimate.valuationRange[0].low[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} - $${results.response.zestimate.valuationRange[0].high[0]['_'].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
                        },
                        {
                          "type": "text",
                          "text": "This value was derived from area sales, and doesn't include any updates you have made to your home. \n You can take a look here 👇"
                        },
                        {
                          "type": "cards",
                          "elements": [{
                            "title": "Market Report",
                            "subtitle": "Recent home sales in your neighborhood and how they effect your value",
                            "image_url": "https://manybot-thumbnails.s3.eu-central-1.amazonaws.com/fb230777667645921/ca/big_fa20ac57cc21196d07a225fc49394aca.png",
                            "action_url": `${WEBVIEW_URL_PROD}/sellers/comps/${results.response.zpid}?api_key=${api_key}`, //optional
                            "buttons": [{
                              "type": "url",
                              "caption": "See Details",
                              "url": `${WEBVIEW_URL_PROD}/sellers/comps/${results.response.zpid}?api_key=${api_key}`,
                              "actions": [] //optional
                            }] //optional
                          }],
                          "image_aspect_ratio": "horizontal"
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
            });
          });
      });

    })
    .catch(function (err) {
      let response = {
        statusCode: 200,
        body: JSON.stringify({
          messages: [{
            "text": "Sorry. I could not create a home valuation for that address. \nPlease try again."
          }]
        }),
      };

      callback(null, response);
    })
};