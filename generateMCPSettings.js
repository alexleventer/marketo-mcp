import path from 'path';
import fs from 'fs';

const serverPath = path.join(process.cwd(), 'build', 'index.js');
const constantsPath = path.join(process.cwd(), 'build', 'constants.js');


// look for any env variables inside the file
const env = {};

// Read the constants file
const fileContent = fs.readFileSync(constantsPath, 'utf-8');

// Find all env variables
const envRegex = /process\.env\.(\w+)/g;
let match;
while ((match = envRegex.exec(fileContent)) !== null) {
    const row = { [match[1]]: '<REPLACE_ME>' };
    Object.assign(env, row);
}

const settings = {
    mcpServers : {
        "Marketo": {
            command: "node",
            args: [serverPath],
            env: env
        }
    }
}

console.log('Copy/Paste the following into your MCP client:');
console.log(
    JSON.stringify(settings, null, 2)
);