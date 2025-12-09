// Test configuration loading

const cfg = require('./env.local.json');

console.log('=== Configuration Test ===');

console.log('env.local.json API URLs:');

console.log('  webBaseUrl:', cfg.api?.webBaseUrl);

console.log('  lanBaseUrl:', cfg.api?.lanBaseUrl);

console.log('\nEnvironment variables:');

console.log('  EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);

console.log('  EXPO_PUBLIC_API_URL_WEB:', process.env.EXPO_PUBLIC_API_URL_WEB);

console.log('  EXPO_PUBLIC_API_URL_LAN:', process.env.EXPO_PUBLIC_API_URL_LAN);