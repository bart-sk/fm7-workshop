import Redis from 'ioredis';

const state = {
  client: null,
};

export function connect(redisConfig = {}) {
  console.log("Connecting to redis...");
  return new Promise((resolve, reject) => {
    const client = new Redis(redisConfig);

    client.on('error', (e) => {
      client.disconnect();
      reject(e);
    });

    client.on('connect', () => {
      state.client = client;
      resolve(state.client);
    });
  });
};

export default function redis() {
  return state.client;
}

export function disconnect() {
  if (state.client) {
    state.client.disconnect();
  }
}
