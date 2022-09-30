/*
let http = Object()
try {
    http = require('node:http2')
} catch (err) {
    http = require('node:http')
}
*/
const http = require('node:http')
const url = require('node:url')
const axios = require('axios')

const port = 3000
const hostname = '127.0.0.1'
const NodeCache = require( "node-cache" );
const appCache = new NodeCache();

const getDataFromAPI = async (result,inputcurrency) => {
    let status = 200;
    if (appCache.has( "inputcurrency" )) {
        _data = appCache.get( "inputcurrency" );
        result.data.push(
            {
              type: 'currency',
              code: 'usd',
              'attributes': {
                value: _data
              }
            }
          )
        result.meta.push({cached:true})
        return status
    } else {
    await axios.get('https://api.coincap.io/v2/assets/' + inputcurrency)
    .then(res => {
      result.data.push(
        {
          type: 'currency',
          code: 'usd',
          'attributes': {
            value: res.data.data.priceUsd
          }
        }
      )
      appCache.set( "inputcurrency", res.data.data.priceUsd, 3 )
    })
    .catch(error => {
      status = error.response.status;
      result.errors.push(
        {
            'status': error.response.status,
            'title': error.response.statusText,
            'detail': error.response.data
        }
      )
    })
    return status
}
}


const server = http.createServer(async function (req, res) {
  let status = 200
  const result = {
    data: [],
    errors: [],
    meta:[]
  }
  const route = url.parse(req.url, true)
  if (route.pathname == '/rates') {
    const inputcurrency = route.query.currency || 'none'
    if (inputcurrency == 'none') {
      status = 400
      result.errors.push(
        {
          'status': 400,
          'title': 'Bad request',
          'detail': 'currency not found'
        }
      )
    } else {
        status = await getDataFromAPI(result,inputcurrency);
    }
  } else {
    status = 404
    result.errors.push(
      {
        'status': 404,
        'title': 'Not found',
        'detail': 'url not found'
      }
    )
  }

  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
