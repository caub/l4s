const { MongoClient } = require('mongodb');


const coll = (async () => {
  const uri = process.env.DB_URI || 'mongodb://127.0.0.1:38888/';

  const client = await MongoClient.connect(uri);

  client.addListener('error', err => console.error('MongoDB connection error', err));

  return client.db('l4s').collection('contents');
})();

exports.load = async function (lang, prefixes) {
  return (await coll).findOne({ _id: lang }, { projection: prefixes });
};


exports.update = async function (lang, data) {
  const [sets, unsets] = Object.entries(data)
    .reduce(([a, b], [k, v]) => v ? [{ ...a, [k]: v }, b] : [a, { ...b, [k]: 1 }], [{}, {}]); 

  return (await coll).updateOne(
    { _id: lang }, 
    {
      ...Object.keys(sets).length > 0 && { $set: sets },
      ...Object.keys(unsets).length > 0 && { $unset: unsets },
    },
    { upsert: true }
  );
};
