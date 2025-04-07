var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var orm = require('orm');
var expressValidator = require('express-validator');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var users = require('./routes/users');
var pads = require('./routes/pads');
var notes = require('./routes/notes');

console.log('📦 Loading settings...');
var settings = require('./settings');
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🛠️  DB Settings:', settings.db);
console.log('🧩 DSN:', settings.dsn);

var async = require('async');
var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(expressValidator());
app.use(cookieParser());
app.use(session({ cookie: { maxAge: 60000 }, secret: 'secret' }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL DB configuration
const { Client } = require('pg');
console.log('🧬 Connecting to PostgreSQL...');

const db = new Client(settings.db);

db.connect(function (err) {
  if (err) {
    console.error('❌ PostgreSQL connection failed:', err.stack);
    process.exit(1); // Crash if DB fails
  }

  console.log('✅ Connected to PostgreSQL database');

  // Create tables
  createTables(function () {
    console.log('🗃️  Database tables are ready');
  });
});

function createTables(next) {
  async.series({
    createUsers: function (callback) {
      db.query(
        `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY NOT NULL,
          email VARCHAR(75) NOT NULL,
          password VARCHAR(128) NOT NULL
        );`,
        [],
        function () {
          console.log('🧑‍💻 users table checked/created');
          callback(null);
        }
      );
    },
    createPads: function (callback) {
      db.query(
        `CREATE TABLE IF NOT EXISTS pads (
          id SERIAL PRIMARY KEY NOT NULL,
          name VARCHAR(100) NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(id)
        );`,
        [],
        function () {
          console.log('📒 pads table checked/created');
          callback(null);
        }
      );
    },
    createNotes: function (callback) {
      db.query(
        `CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY NOT NULL,
          pad_id INTEGER REFERENCES pads(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          name VARCHAR(100) NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );`,
        [],
        function () {
          console.log('📝 notes table checked/created');
          callback(null);
        }
      );
    }
  }, function (err, results) {
    if (err) {
      console.error('❌ Error creating tables:', err);
    }
    if (next) next();
  });
}

// ORM config
orm.settings.set("instance.returnAllErrors", true);
app.use(orm.express(settings.dsn, {
  define: function (db, models, next) {
    console.log('📦 Loading ORM models...');
    db.load("./models", function (err) {
      if (err) {
        console.error('❌ Error loading ORM models:', err);
        return next(err);
      }
      models.User = db.models.users;
      models.Pad = db.models.pads;
      models.Note = db.models.notes;
      console.log('✅ ORM models loaded');
      next();
    });
  }
}));

// Flash Messages
app.use(function (req, res, next) {
  res.locals.flash_messages = {
    success: req.flash('success'),
    error: req.flash('error')
  };
  next();
});

// Inject request + pads
app.use(function (req, res, next) {
  res.locals.req = req;

  if (req.isAuthenticated()) {
    req.user.getPads(function (i, pads) {
      res.locals.pads = pads;
      next();
    });
  } else {
    next();
  }
});

// Routes
app.use('/', users);
app.use('/', pads);
app.use('/', notes);

// 404 handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handlers
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    console.error('⚠️ Error:', err);
    res.status(err.status || 500).render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function (err, req, res, next) {
  console.error('❗ Uncaught Error:', err.message);
  res.status(err.status || 500).render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
