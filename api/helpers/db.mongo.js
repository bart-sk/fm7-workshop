import { MongoClient } from 'mongodb';

const state = { db: null, client: null };

export const connect = ({ uri, db }) => {
  if (state.db) {
    return state.db;
  }

  console.log("Connecting to mongodb...");
  return new Promise((resolve, reject) => {
    MongoClient.connect(uri, (err, client) => {
      if (err) {
        reject(err);
      } else {
        state.db = client.db(db);
        resolve(client);
      }
    });
  });
};

export const db = () => {
  return state.db;
};

export const close = done => {
  if (state.client) {
    state.client.close(err => {
      state.db = null;
      state.client = null;
      done(err);
    });
  }
};
