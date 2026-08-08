/**
 * ping-test.js
 * ------------------------------------------------------------
 * Measures real round-trip latency of your Socket.io server.
 *
 * SETUP:
 *   Server side handler added in backend/src/socket.ts:
 *     socket.on('ping-test', (data) => socket.emit('pong-test', data));
 *
 * USAGE:
 *   node ping-test.js
 *   node ping-test.js http://localhost:5000 200
 *   node ping-test.js https://chitchatt.tech 200
 * ------------------------------------------------------------
 */

let io;
try {
  io = require('socket.io-client').io;
} catch (e) {
  try {
    io = require('./frontend/node_modules/socket.io-client').io;
  } catch (err) {
    console.error('socket.io-client not found. Run "npm install socket.io-client"');
    process.exit(1);
  }
}

const SERVER_URL = process.argv[2] || 'https://chitchatt.tech';
const SAMPLE_COUNT = parseInt(process.argv[3] || '200', 10);
const DELAY_BETWEEN_PINGS_MS = 50; // small gap so we're not flooding

const latencies = [];

function percentile(sortedArr, p) {
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(idx, sortedArr.length - 1))];
}

function summarize(latencies) {
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  console.log('\n================ RESULTS ================');
  console.log(`Samples collected : ${sorted.length}`);
  console.log(`Min               : ${min} ms`);
  console.log(`Average           : ${avg.toFixed(2)} ms`);
  console.log(`p50 (median)      : ${percentile(sorted, 50)} ms`);
  console.log(`p95               : ${percentile(sorted, 95)} ms`);
  console.log(`p99               : ${percentile(sorted, 99)} ms`);
  console.log(`Max               : ${max} ms`);
  console.log('===========================================\n');

  console.log('Suggested resume phrasing based on this run:');
  console.log(
    `  "p95 signaling latency of ${percentile(sorted, 95)}ms measured via ${sorted.length} ` +
    `round-trip samples against the live deployment"\n`
  );
}

console.log(`Connecting to ${SERVER_URL} ...`);

const socket = io(SERVER_URL, {
  transports: ['websocket', 'polling'], // allow fallback if pure websocket is blocked
  auth: { userId: 'ping-tester' }, // bypass socket authentication check
  extraHeaders: { origin: SERVER_URL },
  reconnection: false,
});

let sent = 0;

socket.on('connect', () => {
  console.log(`Connected (Socket ID: ${socket.id}). Sending ${SAMPLE_COUNT} pings, ${DELAY_BETWEEN_PINGS_MS}ms apart...\n`);
  sendNextPing();
});

socket.on('connect_error', (err) => {
  console.error('Connection failed:', err.message || err);
  if (err.description) console.error('Description:', err.description);
  console.error('Make sure the backend server is running and updated with the ping-test socket handler.');
  process.exit(1);
});

socket.on('pong-test', (data) => {
  const rtt = Date.now() - data.ts;
  latencies.push(rtt);
  process.stdout.write(`\rPing ${latencies.length}/${SAMPLE_COUNT} -> ${rtt}ms   `);

  if (latencies.length >= SAMPLE_COUNT) {
    socket.disconnect();
    summarize(latencies);
    process.exit(0);
  } else {
    setTimeout(sendNextPing, DELAY_BETWEEN_PINGS_MS);
  }
});

function sendNextPing() {
  sent++;
  socket.emit('ping-test', { ts: Date.now(), seq: sent });
}

// Safety timeout in case the server never responds
setTimeout(() => {
  if (latencies.length === 0) {
    console.error('\nNo pong-test responses received after 15s.');
    console.error('Did you add the server-side "ping-test" -> "pong-test" echo handler?');
    process.exit(1);
  }
}, 15000);
