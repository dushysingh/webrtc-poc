// http://127.0.0.1:9001
// http://localhost:9001
//const express = require('express');
const fs = require('fs');
const path = require('path');
const url = require('url');
var httpServer = require('http');
var formidable = require('formidable');

const socket_io = require('socket.io');
const RTCMultiConnectionServer = require('rtcmulticonnection-server');
const { file } = require('grunt');
var cors = require('cors')
//express.use(cors());

var PORT = 9002;
var isUseHTTPs = false;

const jsonPath = {
    config: 'config.json',
    logs: 'logs.json'
};

const BASH_COLORS_HELPERS = RTCMultiConnectionServer.BASH_COLORS_HELPER
const getValuesFromConfigJson =
  RTCMultiConnectionServer.getValuesFromConfigJson
const getBashParameters = RTCMultiConnectionServer.getBashParameters
const resolveURL = RTCMultiConnectionServer.resolveURL

var config = getValuesFromConfigJson(jsonPath)
config = getBashParameters(config, BASH_COLORS_HELPERS)

function serverHandler(request, response) {
  console.info(request.url);

  // to make sure we always get valid info from json file
  // even if external codes are overriding it
  config = getValuesFromConfigJson(jsonPath)
  config = getBashParameters(config, BASH_COLORS_HELPERS)

  // HTTP_GET handling code goes below
  try {
    var uri, filename

    try {
      if (!config.dirPath || !config.dirPath.length) {
        config.dirPath = null
      }

      uri = url.parse(request.url).pathname
      filename = path.join(
        config.dirPath ? resolveURL(config.dirPath) : process.cwd(),
        uri
      )
    } catch (e) {
      pushLogs(config, 'url.parse', e)
    }
console.info(filename);

    filename = (filename || '').toString()

    if (request.method == 'POST' && uri.includes('partial-blob')) {
        let form = new formidable.IncomingForm(),
        files=[]
        form.uploadDir = __dirname + '/partial_uploaded'
        form.on('file', (field, file)=>{
             files.push([field, file])
        })
        .on('end', ()=>{
             response.writeHead(200, {'Access-Control-Allow-Origin': '*', 'content-type': 'text/plain'})
             response.end('uploaded')
        })
        form.parse(request)
        return;
     }


    if (request.method == 'POST' && uri.includes('full-blob')) {
      let form = new formidable.IncomingForm(),
      files=[]
      form.uploadDir = __dirname + '/full_uploaded'
      form.on('file', (field, file)=>{
           files.push([field, file])
      })
      .on('end', ()=>{
           response.writeHead(200, {'Access-Control-Allow-Origin': '*', 'content-type': 'text/plain'})
           response.end('uploaded')
      })
      form.parse(request)
      return;
   }


    if (request.method !== 'GET' || uri.indexOf('..') !== -1) {
      try {
        response.writeHead(401, {
          'Content-Type': 'text/plain',
        })
        response.write('401 Unauthorized: ' + path.join('/', uri) + '\n')
        response.end()
        return
      } catch (e) {
        pushLogs(config, '!GET or ..', e)
      }
    }

    var matched = false
    ;[
      '/dist/',
      '/socket.io/',
      '/admin/',
    ].forEach(function (item) {
      if (filename.indexOf(resolveURL(item)) !== -1) {
        matched = true
      }
    })

    // files from node_modules
    ;[
      'RecordRTC.js',
      'FileBufferReader.js',
      'getStats.js',
      'getScreenId.js',
      'adapter.js',
      'MultiStreamsMixer.js',
    ].forEach(function (item) {
      if (
        filename.indexOf(resolveURL('/node_modules/')) !== -1 &&
        filename.indexOf(resolveURL(item)) !== -1
      ) {
        matched = true
      }
    })

    if (filename.search(/.js|.json/g) !== -1 && !matched) {
      try {
        response.writeHead(404, {
          'Content-Type': 'text/plain',
        })
        response.write('404 Not Found: ' + path.join('/', uri) + '\n')
        response.end()
        return
      } catch (e) {
        pushLogs(config, '404 Not Found', e)
      }
    }

    // ;['Video-Broadcasting', 'Screen-Sharing', 'Switch-Cameras'].forEach(
    //   function (fname) {
    //     try {
    //       if (filename.indexOf(fname + '.html') !== -1) {
    //         filename = filename.replace(
    //           fname + '.html',
    //           fname.toLowerCase() + '.html'
    //         )
    //       }
    //     } catch (e) {
    //       pushLogs(config, 'forEach', e)
    //     }
    //   }
    // )

    // var stats

    // try {
    //   stats = fs.lstatSync(filename)

    //   if (
    //     filename.search(/demos/g) === -1 &&
    //     filename.search(/admin/g) === -1 &&
    //     stats.isDirectory() &&
    //     config.homePage === '/demos/index.html'
    //   ) {
    //     if (response.redirect) {
    //       response.redirect('/demos/')
    //     } else {
    //       response.writeHead(301, {
    //         Location: '/demos/',
    //       })
    //     }
    //     response.end()
    //     return
    //   }
    // } catch (e) {
    //   response.writeHead(404, {
    //     'Content-Type': 'text/plain',
    //   })
    //   response.write('404 Not Found: ' + path.join('/', uri) + '\n')
    //   response.end()
    //   return
    // }

    // try {
    //   if (fs.statSync(filename).isDirectory()) {
    //     response.writeHead(404, {
    //       'Content-Type': 'text/html',
    //     })

    //     if (filename.indexOf(resolveURL('/demos/MultiRTC/')) !== -1) {
    //       filename = filename.replace(resolveURL('/demos/MultiRTC/'), '')
    //       filename += resolveURL('/demos/MultiRTC/index.html')
    //     } else if (filename.indexOf(resolveURL('/admin/')) !== -1) {
    //       filename = filename.replace(resolveURL('/admin/'), '')
    //       filename += resolveURL('/admin/index.html')
    //     } else if (filename.indexOf(resolveURL('/demos/dashboard/')) !== -1) {
    //       filename = filename.replace(resolveURL('/demos/dashboard/'), '')
    //       filename += resolveURL('/demos/dashboard/index.html')
    //     } else if (
    //       filename.indexOf(resolveURL('/demos/video-conference/')) !== -1
    //     ) {
    //       filename = filename.replace(
    //         resolveURL('/demos/video-conference/'),
    //         ''
    //       )
    //       filename += resolveURL('/demos/video-conference/index.html')
    //     } else if (filename.indexOf(resolveURL('/demos')) !== -1) {
    //       filename = filename.replace(resolveURL('/demos/'), '')
    //       filename = filename.replace(resolveURL('/demos'), '')
    //       filename += resolveURL('/demos/index.html')
    //     } else {
    //       filename += resolveURL(config.homePage)
    //     }
    //   }
    // } catch (e) {
    //   pushLogs(config, 'statSync.isDirectory', e)
    // }

    var contentType = 'text/plain'
    if (filename.toLowerCase().indexOf('.html') !== -1) {
      contentType = 'text/html'
    }
    if (filename.toLowerCase().indexOf('.css') !== -1) {
      contentType = 'text/css'
    }
    if (filename.toLowerCase().indexOf('.png') !== -1) {
      contentType = 'image/png'
    }

    fs.readFile(filename, 'binary', function (err, file) {
      if (err) {
        response.writeHead(500, {
          'Content-Type': 'text/plain',
        })
        response.write('404 Not Found: ' + path.join('/', uri) + '\n')
        response.end()
        return
      }

      try {
        file = file.replace(
          "connection.socketURL = '/';",
          "connection.socketURL = '" + config.socketURL + "';"
        )
      } catch (e) {}

      response.writeHead(200, {
        'Content-Type': contentType,
      })
      response.write(file, 'binary')
      response.end()
    })
  } catch (e) {
    pushLogs(config, 'Unexpected', e)

    response.writeHead(404, {
      'Content-Type': 'text/plain',
    })
    response.write(
      '404 Not Found: Unexpected error.\n' + e.message + '\n\n' + e.stack
    )
    response.end()
  }
}
// create server from here

if (isUseHTTPs) {
  // server
  var options = {
    headers : {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
      'Access-Control-Max-Age': 2592000, // 30 days
      /** add other headers as per requirement */
    }
  }
  httpServer = require('https')
  options = {
    key: null,
    cert: null,
    ca: null,
  }

  var pfx = false

  if (!fs.existsSync(config.sslKey)) {
    console.log(
      BASH_COLORS_HELPERS.getRedFG(),
      'sslKey:\t ' + config.sslKey + ' does not exist.'
    )
  } else {
    pfx = config.sslKey.indexOf('.pfx') !== -1
    options.key = fs.readFileSync(config.sslKey)
  }

  if (!fs.existsSync(config.sslCert)) {
    console.log(
      BASH_COLORS_HELPERS.getRedFG(),
      'sslCert:\t ' + config.sslCert + ' does not exist.'
    )
  } else {
    options.cert = fs.readFileSync(config.sslCert)
  }

  if (config.sslCabundle) {
    if (!fs.existsSync(config.sslCabundle)) {
      console.log(
        BASH_COLORS_HELPERS.getRedFG(),
        'sslCabundle:\t ' + config.sslCabundle + ' does not exist.'
      )
    }

    options.ca = fs.readFileSync(config.sslCabundle)
  }

  if (pfx === true) {
    options = {
      pfx: sslKey,
    }
  }

  httpApp = httpServer.createServer(options, serverHandler)
} else {
  // local
  httpApp = httpServer.createServer(options, serverHandler)
}

RTCMultiConnectionServer.beforeHttpListen(httpApp, config)
httpApp = httpApp.listen(PORT, 'localhost', async () => {
  RTCMultiConnectionServer.afterHttpListen(httpApp, config)
})
1

socket_io(httpApp).on('connection', (socket) => {
  RTCMultiConnectionServer.addSocket(socket, config)

  //optional code
  const params = socket.handshake.query

  if (!params.socketCustomEvent) {
    params.socketCustomEvent = 'custom-message'
  }

  socket.on(params.socketCustomEvent, function (message) {
    socket.broadcast.emit(params.socketCustomEvent, message)
  })
})
