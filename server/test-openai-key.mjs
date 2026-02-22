import { readFileSync } from 'fs';

// Tentar carregar .env
try {
  const envContent = readFileSync('.env', 'utf-8');
  for (const line of envContent.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
} catch {}

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.log('OPENAI_KEY_STATUS: not_set');
  process.exit(1);
}

console.log('OPENAI_KEY_STATUS: configured, prefix=' + key.substring(0, 7) + '...');

// Testar com uma chamada leve
const response = await fetch('https://api.openai.com/v1/models', {
  headers: { 'Authorization': 'Bearer ' + key }
});

if (response.ok) {
  console.log('OPENAI_API_STATUS: valid (HTTP 200)');
} else {
  console.log('OPENAI_API_STATUS: error HTTP ' + response.status);
  process.exit(1);
}
