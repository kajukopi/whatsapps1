const Koa = require('koa');
const mongoose = require('mongoose');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const mount = require("koa-mount");
const serve = require("koa-static");
const render = require("koa-hbs-renderer")
const Handlebars = require("handlebars")
const path = require("path")

const app = new Koa();
app.use(bodyParser());

mongoose.connect('mongodb://localhost:27017/crud');

// Static Assets
app.use(mount("/assets", serve(path.join(__dirname, "..", "assets"))));

// Session configuration
app.keys = ['karimroy', 'roykarim']; // Replace with your own secret keys
const sessionConfig = {
  key: 'koa.sess', // cookie key (default is koa.sess)
  maxAge: 86400000, // cookie's expiration time in ms (1 day)
  autoCommit: true, // automatically commit headers (default is true)
  overwrite: true, // can overwrite or not (default is true)
  httpOnly: true, // whether the cookie is accessible only by the server (default is true)
  signed: true, // whether the cookie is signed (default is true)
  rolling: false, // renew session when accessed (default is false)
  renew: false, // renew session when it's nearly expired (default is false)
  sameSite: null, // 'strict', 'lax', 'none', or false to disable (default is null)
};
app.use(session(sessionConfig, app));

// Render Views
const RENDER_CONFIG = {
  cacheExpires: 60,
  contentTag: "content",
  defaultLayout: "default",
  environment: "development",
  extension: ".hbs",
  hbs: Handlebars.create(),
  paths: {
    views: path.join(__dirname, "views"),
    layouts: path.join(__dirname, "views", "layouts"),
    partials: path.join(__dirname, "views", "partials"),
    helpers: path.join(__dirname, "views", "helpers"),
  },
  Promise: Promise,
};

RENDER_CONFIG.hbs.registerHelper("script", function (a, options) {
  return a.toLowerCase().replaceAll(" ", "-")
})

app.use(render(RENDER_CONFIG));

// Apply the routes to the application
const routerUser = require("./routes/user")
const routerAuth = require("./routes/auth")

app.use(routerAuth.routes()).use(routerAuth.allowedMethods());
app.use(routerUser.routes()).use(routerUser.allowedMethods());

module.exports = app
