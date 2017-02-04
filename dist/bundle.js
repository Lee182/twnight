(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./lib/get.js":2,"./lib/jonoShortcuts.js":3,"./lib/postJSON.js":4,"./lib/wait.js":5,"querystring":8}],2:[function(require,module,exports){
module.exports = function get({url, ms, cookies}) {
  if (!ms){ms = 10000}
  return promise = new Promise(function(done, reject) {
    var req = new XMLHttpRequest()
    req.onload = function() {
      clearTimeout(timer)
      try {
        var obj = JSON.parse(req.response)
        done(obj)
      } catch (e) {
        reject(e)
      }
    };
    req.onerror = function(e) {
      reject(e)
    }
    req.open('get', url, true)
    req.withCredentials = Boolean(cookies)
    req.setRequestHeader('Accept', 'application/json')
    req.send()
    var timer = setTimeout(function(){
      req.abort()
      reject(ms+'ms timeout')
    },ms)
  })
}

},{}],3:[function(require,module,exports){
// Base Browser stuff
window.w = window
w.D = Document
w.d = document

Element.prototype.qs = Element.prototype.querySelector
Element.prototype.qsa = Element.prototype.querySelectorAll
D.prototype.qs = Document.prototype.querySelector
D.prototype.qsa = Document.prototype.querySelectorAll

EventTarget.prototype.on = EventTarget.prototype.addEventListener
EventTarget.prototype.off = EventTarget.prototype.removeEventListener
EventTarget.prototype.emit = EventTarget.prototype.dispatchEvent

// http://stackoverflow.com/questions/11761881/javascript-dom-find-element-index-in-container
Element.prototype.getNodeIndex = function() {
  var node = this
  var index = 0;
  while ( (node = node.previousSibling) ) {
    if (node.nodeType != 3 || !/^\s*$/.test(node.data)) {
        index++;
    }
  }
  return index;
}

NodeList.prototype.toArray = function() {
  return Array.prototype.map.call(this, function(item){
    return item
  })
}

HTMLCollection.prototype.toArray = function() {
  return NodeList.prototype.toArray.call(this)
}

Node.prototype.prependChild = function(el) {
  var parentNode = this
  parentNode.insertBefore(el, parentNode.firstChild)
}

},{}],4:[function(require,module,exports){
module.exports = function postJSON({url, data, progresscb, cb, cookies}) {
  var req = new XMLHttpRequest()
  req.onreadystatechange = function(e) {
    if (req.readyState === 4) {
      if (typeof cb === 'function')
        cb(req.response)
    }
  }
  if (typeof progresscb === 'function')
    req.upload.addEventListener('progress', progresscb)
  // function(e){
  //   $progress.style.width = Math.ceil(e.loaded/e.total) * 100 + '%';
  // }, false);
  req.withCredentials = Boolean(cookies)
  req.open('POST', url, true)
  req.setRequestHeader('Content-Type', 'application/json')
  if (typeof data !== 'string') {
    data = JSON.stringify(data)
  }
  req.responseType = 'json'
  req.send(data)
}

},{}],5:[function(require,module,exports){
module.exports = function(ms){
  return new Promise(function(resolve){
    setTimeout(resolve, ms)
  })
}

},{}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],8:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":6,"./encode":7}]},{},[1]);
