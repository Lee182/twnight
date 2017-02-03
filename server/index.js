var express = require('express')
var app = express()
var http = require('http')
var path = require('path')
var server = http.Server(app)
var port = process.env.PORT || 3000
var bodyParser = require('body-parser')


app.use( require('cookie-parser')() )
app.use( bodyParser.json() )
app.use(function(req,res,next){
  console.log(req.path, req.cookies)
  next()
})
app.use('/',
  express.static(path.resolve(__dirname + '/../dist')))


var k = require('./keys2.js')
var dao = require('./db.js')({
  mongourl: k.mongourl,
  coll_name: 'nightlife_rsvp'
})
dao.connect().then(function(){
  dao.create_expirey_index()
})


var tw_session = require('./twitter-session')({
  dao, port, coll_name: 'nightlife_tw_sessions'})

app.post('/cook_rsvp', function(req,res,next){
  if (req.body === undefined || typeof req.body.bar_id !== 'string') {
    return res.sendStatus(400)
  }
  res.cookie('rsvp', req.body,
    {/*maxAge: 900000,*/ httpOnly: true, path: '/'})
  res.json(req.body)
})

app.get('/twitter', tw_session.twlogin)
app.get('/twitter-callback', tw_session.twlogin_cb, function(req,res,next){
  console.log('/twitter-callback', req.cookies, req.twuser)
  function clearCooks(res) {
    res.clearCookie('rsvp',  { path: '/' })
  }
  if (req.twuser === undefined) {
    clearCooks(res)
    return res.redirect('/')
  }
  var bar_id = req.cookies.rsvp.bar_id
  var location = req.cookies.rsvp.location
  var hours = req.cookies.rsvp.hours
  if (bar_id) {
    dao.add_rsvp({bar_id, user_id: req.twuser, hours}).then(function(result){
      clearCooks(res)
      console.log('special add',result)
      res.redirect(`/?user_id=${req.twuser}&location=${location}`)
    }).catch(function(err){
      clearCooks(res)
      res.redirect('/')
    })
  }
})
app.get('/user_id', tw_session.tw_is_logged_in, function(req,res,next){
  res.json({user_id:req.twuser})
})

var Yelp = require('yelp')
yelp = new Yelp({
  consumer_key: k.yelp.consumer_key,
  consumer_secret: k.yelp.consumer_secret,
  token: k.yelp.token,
  token_secret: k.yelp.token_secret
})

app.post('/yelp', function(req,res,next){
  if (req.body === undefined || typeof req.body.location !== 'string') {
    return res.sendStatus(400)
  }
  yelp.search({
    category_filter: 'bars',
    location: req.body.location
  }).then(function(data) {
    data.businesses = data.businesses.map(function(b){
      return {
        name: b.name,
        img: b.image_url,
        description: b.snippet_text,
        link: b.url,
        id: b.id,

        phone: b.phone,
        coor: b.location.cordinate,
        rating: b.rating,
        going: []
      }
    })
    res.json(data)
  }).catch(function(err){
    res.json({err})
  })
})

app.post('/add_rsvp', tw_session.tw_is_logged_in, function(req,res,next){
  if (req.body === undefined) {
    return res.sendStatus(400)
  }
  if (req.twuser === undefined || req.body.user_id !== req.twuser) {
    return res.sendStatus(400)
  }
  dao.add_rsvp(req.body).then(function(result){
    res.json({rsvp: result})
  })
})

app.post('/remove_rsvp', tw_session.tw_is_logged_in, function(req,res,next){
  if (req.body === undefined) {
    return res.sendStatus(400)
  }
  if (req.twuser === undefined || req.body.user_id !== req.twuser) {
    console.log('here', req.body.user_id, req.twuser)
    return res.sendStatus(400)
  }
  dao.remove_rsvp(req.body).then(function(result){
    res.json({
      user_id: req.body.user_id,
      bar_id: req.body.bar_id,
      removed: true
    })
  })
})

_rsvp_data = {
  now: Date.now(),
  arr: []
}
app.get('/rsvp_data', function(req,res,next){
  if (Date.now() - 3000 < _rsvp_data.now) {
    return res.json(_rsvp_data.arr)
  }
  dao.rsvp_data().then(function(arr){
    _rsvp_data.arr = arr
    _rsvp_data.now = Date.now()
    res.json(arr)
  }).catch(function(err){
    return res.sendStatus(400)
  })
})

server.listen(port, function(){
  console.log('server listening at http://localhost:'+port)
})
