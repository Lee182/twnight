// mongo mongodb://lee182:Mlab+jonomakesAgreatteam1@ds135577.mlab.com:35577/picput
module.exports = {
  mongourl: process.env.MONGOURL,
  twitter: {
    consumerKey: process.env.TW_CON,
    consumerSecret: process.env.TW_CON_SEC,
  },
  yelp: {
    consumer_key: process.env.YELP_CON,
    consumer_secret: process.env.YELP_CON_SEC,
    token: process.env.YELP_TOK,
    token_secret: process.env.YELP_TOK_SEC
  }
}
