const { MongoClient } = require('mongodb');


module.exports = (async url => {
  if (process.env.DB_URI) {
    const client = await MongoClient.connect(process.env.DB_URI);

    client.addListener('error', err => console.error('MongoDB connection error', err));

    return client;
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  console.debug(mongod.getUri());

  const client = await MongoClient.connect(mongod.getUri());

  client.addListener('error', err => console.error('MongoDB connection error', err));

  const coll = await client.db('l4s').collection('contents');
  await coll.updateOne(
    { _id: 'en' }, 
    {
      $set: {},
    },
    { upsert: true }
  );

  return client;
})();
