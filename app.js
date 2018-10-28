// loads environment variables
require('dotenv/config');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Github = require('./src/Github');
const utils = require('./src/utils');

const app = express();
const port = process.env.PORT || 3000;
const client = new Github({ token: process.env.OAUTH_TOKEN });

const dbURI = 'mongodb://user1:user1@twebkoppsilvestri-shard-00-00-y2dgh.mongodb.net:27017,twebkoppsilvestri-shard-00-01-y2dgh.mongodb.net:27017,twebkoppsilvestri-shard-00-02-y2dgh.mongodb.net:27017/test?ssl=true&replicaSet=TWEBKoppSilvestri-shard-0&authSource=admin&retryWrites=true';

const options = {
  useNewUrlParser: true,
  dbName: 'data',
};

mongoose.connect(dbURI, options);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  frequencies: [{
    language: { type: String, require: true },
    frequency: { type: Number, require: true },
  }],
});

const DataModel = mongoose.model('FreqData', userSchema);


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Enable CORS for the client app
app.use(cors());

app.get('/users/:username', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.user(req.params.username)
    .then(user => res.send(user))
    .catch(next);
});

app.get('/users/:username/repos', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.repos(req.params.username, req.query.per_page, req.query.page)
    .then(user => res.send(user))
    .catch(next);
});

app.get('/repos/:username/:repos/commits', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.commits(req.params.username, req.query.per_page, req.params.repos, req.query.page)
    .then(user => res.send(user))
    .catch(next);
});

app.get('/languages/:username', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.userLanguages(req.params.username)
    .then(utils.getReposLanguagesStats)
    .then(stats => res.send(stats))
    .catch(next);
});

app.get('/repos/:username/:repoName/stats/contributors', (req, res, next) => { // eslint-disable-line no-unused-vars
  client.contributors(req.params.username, req.params.repoName)
    .then(stats => { res.send(stats); })
    .catch(next);
});

app.post('/add', (req, res) => {
  DataModel.findOneAndUpdate({ username: req.body.username }, req.body,
    { upsert: true, new: true, runValidators: true })
    .then(item => {
      res.send(item);
    })
    .catch(err => {
      res.status(400).send(err);
    });
});

app.post('/user', (req, res) => {
  DataModel.findOne({ username: req.body.username })
    .then(item => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(item));
    })
    .catch(err => {
      res.send(err);
    });
});

app.post('/frequencies', (req, res) => {
  DataModel.find({})
    .then(item => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(item));
    })
    .catch(err => {
      res.send(err);
    });
});

// Forward 404 to error handler
app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// Error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500);
  res.send(err.message);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening at http://localhost:${port}`);
});
