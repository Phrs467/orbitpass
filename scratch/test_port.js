const net = require('net');

const hosts = [
  'ep-delicate-mode-ac2kxsw1-pooler.sa-east-1.aws.neon.tech',
  'ep-delicate-mode-ac2kxsw1.sa-east-1.aws.neon.tech'
];

const ports = [5432, 443];

hosts.forEach(host => {
  ports.forEach(port => {
    const socket = new net.Socket();
    socket.setTimeout(4000);
    socket.on('connect', () => {
      console.log(`✅ CONNECTED: ${host}:${port}`);
      socket.destroy();
    });
    socket.on('timeout', () => {
      console.log(`❌ TIMEOUT: ${host}:${port}`);
      socket.destroy();
    });
    socket.on('error', (err) => {
      console.log(`❌ ERROR: ${host}:${port} - ${err.message}`);
    });
    socket.connect(port, host);
  });
});
