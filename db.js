const { MongoClient } = require('mongodb');


async function getDbUri() {
  if (process.env.DB_URI) return process.env.DB_URI;

  if (process.env.NODE_ENV !== 'production') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    console.debug(mongod.getUri());
    return mongod.getUri();
  }
}


module.exports = getDbUri().then(async url => {
  const client = await MongoClient.connect(url);

  client.addListener('error', err => console.error('MongoDB connection error', err));

  return client;
});
