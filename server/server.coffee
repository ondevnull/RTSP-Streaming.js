findByUsername = (username, fn) ->
  i = 0
  len = users.length

  while i < len
    user = users[i]
    return fn(null, user)  if user.username is username
    i++
  fn null, null
callFFmpeg = (i, input, prefixout) ->
  util = require("util")
  exec = require("child_process").exec
  rate = 4
  quality = "qvga"
  extraparams = "-b:v 32k"
  suffixout = "camaraip"
  outextension = "jpg"
  children[i] = exec("ffmpeg -loglevel quiet -i " + input + " -r " + rate + " -s " + quality + " " + extraparams + " -f image2 -updatefirst 1 " + basedir + imgdir + prefixout + "_" + suffixout + "." + outextension,
    maxBuffer: 2048 * 1024
  , (error, stdout, stderr) ->
    console.error "FFmpeg's " + prefixout + " exec error: " + error  if error isnt null
  )
  children[i].on "exit", (code) ->
    console.log "FFmpeg child: " + inputs[i] + " exited and is being re-launched"
    children[i] = `undefined`

  children[i].on "SIGTERM", ->
    console.log "FFmpeg child: " + inputs[i] + " got terminated and is being re-launched"
    children[i] = `undefined`
callSocket = (cam) ->
  io.of("/" + cam).on "connection", (client) ->
    console.log basedir + imgdir
    setInterval (->
      fs.readFile basedir + imgdir + cam + "_" + suffixout + "." + outextension, (err, content) ->
        if err
          throw err
        else
          client.volatile.emit "message",
            data: content.toString("base64")
    ), 1000 / rate
http = require("express").createServer()
passport = require("passport")
DigestStrategy = require("passport-http").DigestStrategy
basedir = __dirname + "/../"
imgdir = "img/"
io = require("socket.io").listen(http)
fs = require("fs")
path = require("path")

users = [
  username: "alcaldia"
  password: "amalia saez"
,
  username: "desur"
  password: "cedeno"
,
  username: "jorge"
  password: "una contrasena muy fuerte"
,
  username: "sts"
  password: "sin contrasena"
,
  username: "amtt"
  password: "amtt"
 ]
passport.use new DigestStrategy(
  qop: "auth"
, (username, done) ->
  findByUsername username, (err, user) ->
    return done(err)  if err
    return done(null, false)  unless user
    done null, user.password
, (username, options, done) ->
  process.nextTick ->
    findByUsername username, (err, user) ->
      return done(err)  if err
      return done(null, false)  unless user
      done null, user
)
http.configure ->
  http.use passport.initialize()

http.listen 8081
io.configure "prod", ->
  io.enable "browser client minification"
  io.enable "browser client etag"
  io.enable "browser client gzip"
  io.set "log level", 1
  io.set "transports", [ "websocket", "flashsocket", "htmlfile", "xhr-polling", "jsonp-polling" ]

io.configure "dev", ->
  io.set "transports", [ "websocket" ]

http.get "/", passport.authenticate("digest",
  session: false
), (req, res) ->
  res.sendfile path.normalize(basedir) + "/client/index.html"

http.get "/iribarren.jpg", (req, res) ->
  res.sendfile path.normalize(basedir) + "/client/iribarren.jpg"

http.get "/amtt.png", (req, res) ->
  res.sendfile path.normalize(basedir) + "/client/amtt.png"

http.get "/001.jpg", (req, res) ->
  res.sendfile path.normalize(basedir) + "/img/001_camaraip.jpg"

http.get "/002.jpg", (req, res) ->
  res.sendfile path.normalize(basedir) + "/img/002_camaraip.jpg"

http.get "/003.jpg", (req, res) ->
  res.sendfile path.normalize(basedir) + "/img/003_camaraip.jpg"

http.get "/004.jpg", (req, res) ->
  res.sendfile path.normalize(basedir) + "/img/004_camaraip.jpg"

inputs = [ "rtsp://admin:admin@192.168.71.22/0", "rtsp://admin:admin@192.168.71.23/0", "rtsp://admin:admin@192.168.71.24/0", "rtsp://admin:admin@192.168.71.25/0" ]
outputs = [ "001", "002", "003", "004" ]
totalchildren = inputs.length
children = new Array(totalchildren)
loop_ = `undefined`
frequency = 10
checker = ->
  loop_ = setInterval(->
    i = 0

    while i < totalchildren
      callFFmpeg i, inputs[i], outputs[i]  if children[i] is `undefined`
      i++
  , frequency * 1000)

rate = 4
suffixout = "camaraip"
outextension = "jpg"
checker()
callSocket "001"
callSocket "002"
callSocket "003"
callSocket "004"
