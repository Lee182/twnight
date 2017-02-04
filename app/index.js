// tools loading
require('./lib/jonoShortcuts.js')
w.wait = require('./lib/wait.js')
w.postJSON = require('./lib/postJSON.js')
w.get = require('./lib/get.js')
w.querystring = require('querystring')
function hoursTill5am(d) {
  var hhtil5 = 0
  var hh = (new Date(d)).getHours() // 0-23
  if ( hh > 5) {
    return 24 + 5 - hh
  }
  return 5 - hh
}

function autoUpdate() {
  return wait(5000).then(function(){
    vm.rsvp_update()
  }).then(function(){
    return autoUpdate()
  })
}

vueobj = {
  el: '#app',
  data: {
    user_id: undefined,
    ip: undefined,
    location_input: '',
    venues: [],
    rsvp_data: {}
  },
  computed: {},
  watch: {},
  methods: {
    location_input_go: function() {
      let vm = this
      vm.rsvp_update()
      postJSON({
        url: '/yelp',
        data: {
          location: vm.location_input
        },
        cb: function(res){
          vm.venues = res.businesses
        }
      })
    },
    add_rsvp: function(venue) {
      let vm = this
      if (vm.user_id === undefined || venue === undefined) {return undefined}
      var data = {
        bar_id: venue.id,
        user_id: vm.user_id,
        hours: hoursTill5am(Date.now())
      }
      w.postJSON({
        url: '/add_rsvp',
        data,
        cb: function(res){
          console.log('/add_rsvp')
          console.log(res)
          var bar = res.rsvp._id.bar_id
          var user = res.rsvp._id.user_id
          if (vm.rsvp_data[bar] === undefined) {
            vm.rsvp_data[bar] = []
          }
          vm.rsvp_data[bar].push(user)
          vm.$forceUpdate()
        },
        cookies: true
      })
    },
    remove_rsvp: function(venue) {
      let vm = this
      if (vm.user_id === undefined || venue === undefined) {return undefined}
      w.postJSON({
        url: '/remove_rsvp',
        data: {
          bar_id: venue.id,
          user_id: vm.user_id
        },
        cb: function(res){
          console.log('/remove_rsvp', res)
          if (res.removed !== true || vm.rsvp_data[res.bar_id] === undefined) {
            return
          }
          var i = vm.rsvp_data[res.bar_id].findIndex(function(p){
            return p === res.user_id
          })
          vm.rsvp_data[res.bar_id].splice(i, 1)
          vm.$forceUpdate()
        }
      })
    },
    rsvp_update: function() {
      let vm = this
      return get({
        url: '/rsvp_data',
        cookies: false,
        secs: 10000
      }).then(function(res){
        console.log('rsvp_update', Date.now())
        data = {}
        res.map(function(rsvp){
          data[rsvp._id] = rsvp.user_ids
        })
        vm.rsvp = data
      })
    },
    going_click: function(venue){
      let vm = this
      if (vm.user_id === undefined) {
        console.log('herer')
        w.postJSON({
          url: '/cook_rsvp',
          data: {
            bar_id: venue.id,
            location: vm.location_input,
            hours: hoursTill5am(Date.now())
          },
          cookies: true,
          cb: function(res){
            var port = location.port
            if (port !== '') {port = ':'+port}
            location.href = location.protocol + '//' + document.domain + port + '/twitter'
            console.log('/bar_id', res)
          }
        })
        return undefined
      }
      if (vm.rsvp_data[venue.id] === undefined) {
        vm.rsvp_data[venue.id] = []
      }
      const is_going = vm.rsvp_data[venue.id].find(function(p){
        return p === vm.user_id
      })
      if (is_going === undefined){
        return vm.add_rsvp(venue)
      }
      return vm.remove_rsvp(venue)
    }
  },
  filters: {},

  // https://vuejs.org/v2/guide/instance.html#Lifecycle-Diagram
  beforeCreate: function(){},
  created: function(){
    let vm = this
    var redirectdata = querystring.parse(new URL(location.href).search.substr(1))
    vm.user_id = redirectdata.user_id
    if (redirectdata.location) {
      vm.location_input = redirectdata.location
      vm.location_input_go()
    }
    get({url: '/user_id', cookies: true}).then(function(res){
      vm.user_id = res.user_id
    })
    history.pushState({}, 'twitter nightlight', '/')
    autoUpdate()
  },
  beforeMount: function(){},
  mounted: function(){},
  beforeUpdate: function(){},
  updated: function(){},
  beforeDestroy: function(){},
  destroyed: function(){}
}

w.vm = new Vue(vueobj)

// example_venue =
// {
//   name: 'Ye Olde Salutation Inn',
//   description: '"The Sally Inn is one of three pubs that claim to be the oldest in Nottingham (Ye Olde Trip and The Bell are the other two) and I would say this is the best..."',
//   img: 'https://s3-media4.fl.yelpcdn.com/bphoto/KO9-o-J4YCjVY2ju8eK7yw/ms.jpg',
//   link: 'https://www.yelp.com/biz/ye-olde-salutation-inn-nottingham-2?adjust_creative=qXHtGS14FEUgQCaQx1NLhQ&utm_campaign=yelp_api&utm_medium=api_v2_search&utm_source=qXHtGS14FEUgQCaQx1NLhQ',
//   going: ['samlee12', 'JonoLee1']
// },
