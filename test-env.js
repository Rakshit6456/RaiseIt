const fs = require('fs');
const str = fs.readFileSync('.env.local', 'utf8');
const match = str.match(/FIREBASE_SERVICE_ACCOUNT_KEY='(.*)'/);
if (match) {
  let val = match[1];
  console.log("Raw from Regex:", val.substring(0, 180));
  // How nextjs parses it (very roughly)
  let parsed = val; // Single quotes in dotenv literally preserve \\n as \\n.
  console.log("After replace:", parsed.replace(/\\n/g, '\n').substring(0, 180));
  try {
    JSON.parse(parsed.replace(/\\n/g, '\n'));
    console.log("JSON parse SUCCESS");
  } catch(e) {
    console.error("JSON parse ERROR:", e.message);
  }
}
