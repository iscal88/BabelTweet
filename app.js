var express = require('express.io')
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , methodOverride = require('method-override')
  , session = require('express-session')

  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , Twit = require('twit'), twit

  , app = express().http().io();


var HASHTAG = "ismael";
var TWITTER_CONSUMER_KEY = "kXKUsV9aBhZwpoywah14CdvDz";
var TWITTER_CONSUMER_SECRET = "zB4KuF6ozYPbZWOz3mJeG928WTDmVT2GXrrT09KRpI83JDFW5Q";

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Twitter profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the TwitterStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Twitter profile), and
//   invoke a callback with a user object.
passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "http://192.168.0.199:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {

      twit = new Twit({
        consumer_key: TWITTER_CONSUMER_KEY,
        consumer_secret: TWITTER_CONSUMER_SECRET,
        access_token: token,
        access_token_secret: tokenSecret
      });

      // Streaming de tweets
      var stream = twit.stream('statuses/filter', { track: HASHTAG })
      stream.on('tweet', function (tweet) {
        app.io.broadcast('newTweet', tweet);
      });

            // To keep the example simple, the user's Twitter profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Twitter account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    });
  }
));

// Guardar el nuevo tweet
app.io.route('saveTweet', function(req) {
  if (req.data.length > 0) {
    twit.post('statuses/update', { status: req.data + " #" + HASHTAG }, 
      function(err, data, response) { });
  }
});

// configure Express
var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(session({secret: 'keyboard cat'}));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use("/app", express.static(__dirname + '/public'));
}


app.get('/', function(req, res){
  console.log(typeof(req.user));
  if (!req.user)
    res.redirect("/auth/twitter");
  else {
    res.redirect("/app");
  }
});

// GET /auth/twitter
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Twitter authentication will involve redirecting
//   the user to twitter.com.  After authorization, the Twitter will redirect
//   the user back to this application at /auth/twitter/callback
app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res){
    // The request will be redirected to Twitter for authentication, so this
    // function will not be called.
  });

// GET /auth/twitter/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.listen(3000);

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/twitter')
}
