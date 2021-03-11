const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const connectDB = require('./config/db');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

// Load config
dotenv.config({ path: './config/config.env' })
const PORT = process.env.PORT || 8080;
//Passport config
require('./config/passport')(passport);

connectDB();

// BodyParser
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Method override POST ==> PUT,DELETE
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    let method = req.body._method
    delete req.body._method
    return method
  }
}))

// Express session
app.use(
    session({
      secret: 'secret',
      resave: true,
      saveUninitialized: true
    })
  );

//Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

//Public folder
app.use(express.static('public'))

// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });

//HandelBars Middelware
const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: __dirname + '/views/layouts/',
  partialsDir: __dirname + '/views/partials/',
  helpers: {
      selectCity: require('./views/helpers/selectCity'),
      paginate:require('handlebars-paginate')
  }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');

//Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/trips', require('./routes/trips'));

app.listen(PORT, () => console.log(`server listening at http://localhost:${PORT}`))