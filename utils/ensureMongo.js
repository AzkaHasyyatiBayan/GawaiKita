const net = require('net');
const { execSync, spawn } = require('child_process');

/**
 * Memeriksa apakah port TCP tertentu terbuka dan menerima koneksi.
 */
function isPortOpen(host, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

/**
 * Memastikan MongoDB aktif. Jika dijalankan di Windows dan MongoDB berada di WSL,
 * fungsi ini akan otomatis mengaktifkan layanan mongod di WSL dan menjaganya tetap aktif.
 */
async function ensureMongo() {
  const host = '127.0.0.1';
  const port = 27017;

  if (await isPortOpen(host, port, 800)) {
    return true;
  }

  // Jika di Windows dan MongoDB di WSL belum aktif
  if (process.platform === 'win32') {
    try {
      console.log('🔄 Memeriksa & mengaktifkan layanan MongoDB di WSL...');
      execSync('wsl -u root -d Ubuntu systemctl start mongod', { stdio: 'ignore' });

      // Jalankan background keep-alive agar VM WSL tidak auto-terminate saat idle
      spawn('wsl', ['-d', 'Ubuntu', 'bash', '-c', 'while true; do sleep 60; done'], {
        detached: true,
        stdio: 'ignore'
      }).unref();

      // Tunggu hingga port terbuka (maksimal 5 detik)
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await isPortOpen(host, port, 500)) {
          console.log('✅ Layanan MongoDB di WSL aktif.');
          return true;
        }
      }
    } catch (e) {
      // Abaikan jika WSL tidak tersedia
    }
  }

  return false;
}

module.exports = ensureMongo;
