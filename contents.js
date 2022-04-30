const clientPromise = require('./db');

const coll = clientPromise.then(client => client.db('l4s').collection('contents'));

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
