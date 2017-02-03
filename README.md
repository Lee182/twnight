# twitter nightlife

## description
a freecodecamp challenge to build 'going out tonight' tracker with twitter usernames. project uses long-polling to fetch data, and monogodb expiresAt to remove rsvp objects at a given time.

## setup
### install
```shell
# if NODE_ENV isn't set to 'PRODUCTION' devDependencies will be installed
$ npm install
```
### server/keys.js file
it is import to create a file called keys which resembles this format.
```
module.exports = {
  mongourl: 'mongodb://[user]:[pwd]@yourdomain.com:[port]/[db_name]',
  twitter: {
    consumerKey: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
    consumerSecret:'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  },
  yelp: {
    consumer_key: "xxxxxxxxxxxxxxxxxxxxxx",
    consumer_secret: "xxxxxxxxxxxxxxxxxxxxxxxxxxx",
    token: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    token_secret: "xxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```
twitter oauth keys can be obtainend from https://apps.twitter.com/app/new

### running dev mode,
app/** file changes are watched then compiled to dist
```
$ npm run start-dev
```

### running normally
$ npm run start


## mongodb expire at specific time
```
db.mycollection.createIndex({ "expireAt": 1 }, { expireAfterSeconds: 0 })
```
"expireAt" is the field which is checked per document.

given that 'tonight' will change per day, and also different timezones, the hours until 5am localtime is calculated clientside.

this data is sent server side. along with the bar_id to record.


## Licence & Author
Author: Jonathan T L Lee, <jono-lee@hotmail.co.uk>

Licence: MIT
