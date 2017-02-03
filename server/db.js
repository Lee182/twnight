// data acess object
const Mongo = require('mongodb')
let MongoClient = Mongo.MongoClient
function addHours(d, hours) {
  d = new Date(d)
  d.setMinutes(0)
  d.setSeconds(0)
  d.setMilliseconds(0)
  return new Date(d.getTime() + (1000*60*60) * hours)
}


module.exports = function({mongourl, coll_name}) {


let o = {
  db: null,
  ObjectId: Mongo.ObjectId
}

function ensureConnected(fn) {return function() {
  if (o.db === null) {return Promise.resolve({err: 'db disconnected'})}
  return fn.apply(o, arguments)
}}

o.connect = function() {
  console.log('mongo connnecting...')
  return MongoClient.connect(mongourl).then(function(db){
    console.log('mongo connected') // setup db
    o.db = db
  }).catch(function(err){
    console.log('mongo connection error:', err)
    o.db = null
  })
}


o.create_expirey_index = function(){
  return o.db.collection(coll_name)
  .createIndex('expiersAt',
    {'expiresAt': 1},
    { expireAfterSeconds: 0 })
}

o.add_rsvp = function({bar_id, user_id, hours}){
  if (typeof hours !== 'number' || hours > 24 || hours < 0) {
    return Promise.resolve({err: 'hours invalid'})
  }
  if (typeof bar_id !== 'string' || bar_id.length > 200) {
    return Promise.resolve({err: 'bar_id invalid'})
  }
  if (typeof user_id !== 'string' || user_id.length > 200) {
    return Promise.resolve({err: 'user_id invalid'})
  }

  return o.db
    .collection(coll_name)
    .findOneAndUpdate({
        _id: {bar_id,user_id}
      },
      {$set: {expiresAt: addHours( Date.now(), hours )} },
      {upsert: true, returnOriginal: false})
    .then(function(res){
      console.log('add_rsvp: ', res)
      return res.value
    })
    .catch(function(err){
      console.log('add_rsvp: ', err)
    })
}

o.remove_rsvp = function({bar_id, user_id}){
  if (typeof bar_id !== 'string' || bar_id.length > 200) {
    return Promise.resolve({err: 'bar_id invalid'})
  }
  if (typeof user_id !== 'string' || user_id.length > 200) {
    return Promise.resolve({err: 'user_id invalid'})
  }

  return o.db
    .collection(coll_name)
    .remove({
      _id: {bar_id, user_id}
    })
    .then(function(res){
      return res.result.n === 1
    })
    .catch(function(err){
      return false
    })
}

o.rsvp_data = function() {
  return o.db.collection(coll_name).aggregate([
    {$group: {_id: '$_id.bar_id', user_ids: {$push: '$_id.user_id'}} }
  ]).toArray()
}

var a = ['create_expirey_index', 'add_rsvp']
a.forEach(function(name){
  o[name] = ensureConnected(o[name])
})
return o


}
