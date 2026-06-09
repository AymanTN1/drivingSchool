const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/components/Dashboard.jsx',
  'frontend/src/components/LandingPage.jsx',
  'frontend/src/components/Login.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find all instances of: fetch('${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/...',
  // And replace the single quotes with backticks.
  content = content.replace(/'(\$\{import\.meta\.env\.VITE_API_URL \|\| "http:\/\/localhost:8080"\}\/api\/[^']+)'/g, '`$1`');

  fs.writeFileSync(file, content);
});
console.log('Done replacing strings!');
