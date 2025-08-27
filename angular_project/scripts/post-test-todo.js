const http = require('http');
const data = JSON.stringify({ title: 'Test from agent', completed: false });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/todos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', body);
  });
});

req.on('error', (e) => console.error('Request error', e));
req.write(data);
req.end();
