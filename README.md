# SYNTH-API

Scans through the specified directory and builts endpoints that are then added to an Express app.

Each API endpoint is crafted by merely by giving it the name of the HTTP method it handles.

Synth-api is one of the major features provided by the [Synth](http://www.synthjs.com) framework but is made available here for people who just want a stripped down module, and not the rest of the Synth framework (which includes support for asset compilation and more fun things).

Within your request handlers, you can either return data that will be JSONified and sent back to the client, a promise that will then return such data, or call the methods on the Express response object directly. e.g. `return { theData: true };`, `return fetchData().then(…);`, or `res.send(…)`.

[![Build Status](https://travis-ci.org/JonAbrams/synth-api.svg)](https://travis-ci.org/JonAbrams/synth-api)
[![Code Climate](https://codeclimate.com/github/JonAbrams/synth-api.png)](https://codeclimate.com/github/JonAbrams/synth-api)

## Example Usage

**app.js**:

```javascript
var express = require('express');
var synthApi = require('synth-api');

var app = express();
synthApi.generateHandlers({
  resourceDir: __dirname + '/resources', // This is the default, not required
  prefix: '/api', // This is the default, not required
  app: app,
  timeout: 300
});

app.listen(80);
```

## generateHandlers()

### Options

| option | Type | Default | What it does |
|--------|------|---------|--------------|
| prefix | String | '/api' | Specifies what should precede the resource name for the generated routes. |
| resourceDir | String | process.cwd() + '/resources' | The directory to look into for generating the API endpoints. |
|   app  | ExpressApp | null | If given an Express app, it will have the API and view endpoints automatically attached. |
| timeout| Number | 5000 | Time (in milliseconds) before an error response is returned to the client instead of the expected result. |
| catchAll | Function | null | An optional Express style request handler to handle any requests to the api path that are not handled (regardless of HTTP method). Can be used to return a custom 404 error. Note: This function should not return data or a promise. It should use the Express response object. |

### Returns

generateHandlers() returns an object with a 'handers' key, which is an array of all the API handlers generated.

Each handler object contains the following keys:

- **file** - String - Path to the js file that the API handler was found in.
- **method** - String - The HTTP method that this handler respnds to. e.g. 'get', 'post', 'put', or 'delete'.
- **path** - String - The URL path that the endpoint responds to. e.g. `'/api/tweets'`
- **isCustom** - Boolean - Whether this handler is a custom method. This is good to know so that you register it before the non-custom methods. For example, you want '/api/tweets/favorites' to be registered with your Express apps before '/api/tweets/:id'.
- **funcName** - String - The name of function. e.g. `'getIndex'`
- **resources** - Array[String] - The list of resources that this handler is a child of. e.g. the handler at '/api/tweets/1234/comments' would have a resources array of `['tweets', 'comments']`.

## Defining API endpoints

For this, just check out the existing [Synth Documentation](http://www.synthjs.com).

## License

[MIT](https://github.com/JonAbrams/synth/blob/master/LICENSE)

## Credit

- This project was created by Jon Abrams ([Twitter](https://twitter.com/JonathanAbrams) | [GitHub](https://github.com/JonAbrams)).
