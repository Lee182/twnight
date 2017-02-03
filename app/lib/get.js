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
