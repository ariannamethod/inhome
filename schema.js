const {execSync} = require('child_process');
const {readFileSync, writeFileSync} = require('fs');

const willPaste = process.argv[2] === '1';
const sourceFile = willPaste ? process.argv[3] : process.argv[2];

let sourceContent = (() => {
  if (willPaste) {
    let clipboardCmd;
    if (process.platform === 'darwin') {
      clipboardCmd = 'pbpaste';
    } else if (process.platform === 'win32') {
      clipboardCmd = 'powershell Get-Clipboard';
    } else {
      clipboardCmd = 'xclip -selection clipboard -o';
    }
    try {
      return execSync(clipboardCmd, {encoding: 'utf8'});
    } catch {
      if (sourceFile) {
        return readFileSync(sourceFile, 'utf8');
      }
    }
  }
  if (sourceFile) {
    return readFileSync(sourceFile, 'utf8');
  }
})();

if(sourceContent) {
  const path = `${__dirname}/src/scripts/in/schema.json`;
  const schemaIn = readFileSync(path, 'utf8');
  const replaced = schemaIn.replace(/("API": ).+?(,\n)/, `$1${sourceContent}$2`);
  writeFileSync(path, replaced);
}

execSync(`node ${__dirname}/src/scripts/format_schema.js`);
const formattedSchema = readFileSync(`${__dirname}/src/scripts/out/schema.json`, 'utf8');

const schemaTsPath = `${__dirname}/src/lib/mtproto/schema.ts`;
const schemaTs = readFileSync(schemaTsPath, 'utf8');
const replaced = schemaTs.replace(/(export default )\{.+?( as )/, `$1${formattedSchema}$2`);
writeFileSync(schemaTsPath, replaced);

execSync(`npm run generate-mtproto-types`);
