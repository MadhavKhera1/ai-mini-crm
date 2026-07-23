const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log("Starting Vite dev server...");
const child = spawn('npx', ['vite', '--port', '5179'], {
  cwd: path.resolve(__dirname, '..'),
  shell: true
});

child.stdout.on('data', (data) => {
  console.log(`[Vite Out]: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`[Vite Err]: ${data}`);
});

setTimeout(() => {
  console.log("Fetching CSS from dev server...");
  http.get('http://localhost:5179/src/styles/global.css', (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log("Headers:", res.headers);
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log("CSS Content (first 1000 chars):");
      console.log(data.substring(0, 1000));
      child.kill();
      process.exit(0);
    });
  }).on('error', (err) => {
    console.error("Error fetching CSS:", err);
    child.kill();
    process.exit(1);
  });
}, 4000);
