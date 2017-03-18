# SYNTH-API

Declare a route, give it a handler. Each handler specifies what middleware it depends on, when a request comes in, the middlewear is resolved, then the handler is called.

Within your request handlers, you can:
1. Return an object that will be JSONified and sent back to the client, a promise that will then return such data, or make use of the `res` middleware for more advanced operations.

[![Build Status](https://travis-ci.org/JonAbrams/synth-api.svg)](https://travis-ci.org/JonAbrams/synth-api)
[![Code Climate](https://codeclimate.com/github/JonAbrams/synth-api.png)](https://codeclimate.com/github/JonAbrams/synth-api)
[![Test Coverage](https://codeclimate.com/github/JonAbrams/synth-api/coverage.png)](https://codeclimate.com/github/JonAbrams/synth-api)

## Example

**app.js**:

```javascript
const app = require('synth-api').createApp();

app.get('/:userName/tweets', require('./handlers/tweets/index'));
app.get('/:userName/tweets/:id', require('./handlers/tweets/read'));
app.post('/tweets', require('./handlers/tweets/create'));

// built-in middleware: req, res, params
app.middleware('db', require('./middleware/db').db);
app.middleware('mongojs', require('./middleware/db').mongojs);
app.middleware('user', require('./middleware/user').user);
app.middleware('currentUser', require('./middleware/user').currentUser);
```

**handlers/tweets/index.js**

```javascript
module.exports = async function tweetIndex(user, db, params) {
  const tweets = await db.collection('tweets').find({ authorId: user._id }).limit(params.offset || 30)
  return tweets.map(tweet => ({
    author: user.name,
    message: tweet.message,
    date: tweet.date.toISOString(),
  }));
};
```

**handlers/tweets/create.js**

```javascript
module.exports = async function tweetCreate(db, currentUser, params) {
  if (!params.message) throw { status: 422, message: 'Message not provided' };
  return db.collection('tweets').insert({
    author: currentUser._id,
    message: params.message,
    date: new Date(),
  });
};
```

**handlers/tweets/read.js**
```javascript
module.exports = async function tweetRead(user, db, params, mongojs) {
  const tweet = await db.collection('tweets').findOne({ 
    authorId: user._id, 
    _id: mongojs.ObjectId(params.id)
   });
  return {
    author: user.name,
    message: tweet.message,
    date: tweet.date.toISOString(),
  };
};
```

**middleware/db.js**

```javascript
const mongojs = require('mongojs');
const db = mongojs.connect('mongodb://localhost/my_db');

exports.db = db;

exports.mongojs = mongojs;
```

**middleware/user.js**

```javascript
exports.user = async function(params, db) {
  return await db.collections('users').findOne({
    userName: params.userName
   });
};

exports.currentUser = async function(db, req) {
  return db.collection('users').findOne({
    token: cookieFromHeaders(req.headers, 'token')
  });
}

function cookieFromHeaders(headers, cookie) {
  const re = new RegExp(`[; ]${cookie}=([^\\s;]*)`);
  const match = ('' + headers['Cookie']).match(re);
  return unescape(match[1]);
}
```

## License

[MIT](https://github.com/JonAbrams/synth-api/blob/master/LICENSE)

## Credit

- This project was created by Jon Abrams ([Twitter](https://twitter.com/JonathanAbrams) | [GitHub](https://github.com/JonAbrams)).
