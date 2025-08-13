// @ts-check
const fs = require('fs');

// get emoji-test from here: https://unicode.org/Public/emoji/
let data;
try {
  data = fs.readFileSync(__dirname + '/in/emoji-test.txt').toString();
} catch (err) {
  console.error('Failed to read emoji-test.txt:', err.message);
  process.exit(1);
}

const versions = {};
data.split('\n').forEach((line) => {
  const match = line.match(/^(.+?) *;.+#.+ E([\d\.]+?) /);
  if(!match) {
    return;
  }

  const codePoints = match[1].split(' ').join('-').toLowerCase();
  const version = (+match[2]).toFixed(1);
  const obj = versions[version] ?? (versions[version] = {});

  obj[codePoints] = 0;
});

console.log(versions);
fs.writeFileSync('./out/emoji_versions.json', JSON.stringify(versions, null, '\t'));
