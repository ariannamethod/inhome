// @ts-check

const {spawn, execSync} = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const keepAsset = require('./keepAsset');
const {NodeSSH} = require('node-ssh');
const zlib = require('zlib');
const {optimize} = require('svgo');

const npmCmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
const version = process.argv[2] || 'same';
const changelog = process.argv[3] || '';
const child = spawn(npmCmd, ['run', 'change-version', version, changelog].filter(Boolean), {shell: true});
child.stdout.on('data', (chunk) => {
  console.log(chunk.toString());
});

const publicPath = __dirname + '/public/';
const distPath = __dirname + '/dist/';

async function copyFiles(source, destination) {
  try {
    await fs.mkdir(destination, {recursive: true});
    const files = await fs.readdir(source, {withFileTypes: true});
    for(const file of files) {
      const sourcePath = path.join(source, file.name);
      const destinationPath = path.join(destination, file.name);
      if(file.isFile()) {
        await fs.copyFile(sourcePath, destinationPath);
        console.log(`Copied file ${sourcePath} to ${destinationPath}`);
      } else if(file.isDirectory()) {
        await copyFiles(sourcePath, destinationPath);
      }
    }
  } catch(err) {
    console.error(`Error copying from ${source} to ${destination}:`, err);
    throw err;
  }
}

async function clearOldFiles() {
  try {
    const bundleFiles = await fs.readdir(distPath);
    const files = await fs.readdir(publicPath, {withFileTypes: true});
    for(const file of files) {
      if(file.isDirectory() ||
        bundleFiles.some((bundleFile) => bundleFile === file.name) ||
        keepAsset(file.name)) {
        continue;
      }
      const filePath = path.join(publicPath, file.name);
      await fs.unlink(filePath);
      console.log(`Removed ${filePath}`);
    }
  } catch(err) {
    console.error('Error clearing old files:', err);
    throw err;
  }
}

async function buildSprite() {
  try {
    const spritePath = path.join(__dirname, 'src/assets/sprite.svg');
    const distSpritePath = path.join(distPath, 'sprite.svg');
    const data = await fs.readFile(spritePath, 'utf8');
    const {data: optimized} = optimize(data, {multipass: true});
    await fs.mkdir(distPath, {recursive: true});
    await fs.writeFile(distSpritePath, optimized);
    console.log('Optimized sprite');
  } catch(err) {
    console.error('Sprite optimization failed:', err);
  }
}

child.on('close', (code) => {
  if(code != 0) {
    console.log(`child process exited with code ${code}`);
  }

  const child = spawn(npmCmd, ['run', 'build'], {shell: true});
  child.stdout.on('data', (chunk) => {
    console.log(chunk.toString());
  });

  let error = '';
  child.stderr.on('data', (chunk) => {
    error += chunk.toString();
  });

  child.on('close', (code) => {
    if(code != 0) {
      console.error(error, `build child process exited with code ${code}`);
    } else {
      onCompiled();
    }
  });
});

const ssh = new NodeSSH();
const onCompiled = async() => {
  console.log('Compiled successfully.');
  try {
    await buildSprite();
    await copyFiles(distPath, publicPath);
  } catch(err) {
    console.error('Copying files failed:', err);
  }

  try {
    await clearOldFiles();
  } catch(err) {
    console.error('Clearing old files failed:', err);
  }

  let sshConfig;
  try {
    const config = await fs.readFile(path.join(__dirname, 'ssh.json'), 'utf8');
    sshConfig = JSON.parse(config);
  } catch(err) {
    console.log('No SSH config, skipping upload');
    return;
  }

  const archiveName = 'archive.zip';
  const archivePath = path.join(__dirname, archiveName);
  try {
    execSync(`zip -r ${archivePath} *`, {
      cwd: publicPath
    });
    console.log('Created archive');
  } catch(err) {
    console.error('Failed to create archive:', err);
    return;
  }

  try {
    await ssh.connect({
      ...sshConfig,
      tryKeyboard: true
    });
    console.log('SSH connected');
    await ssh.execCommand(`rm -rf ${sshConfig.publicPath}/*`);
    console.log('Cleared remote files');
    await ssh.putFile(archivePath, path.join(sshConfig.publicPath, archiveName));
    console.log('Uploaded archive');
    await ssh.execCommand(`cd ${sshConfig.publicPath} && unzip ${archiveName} && rm ${archiveName}`);
    console.log('Unzipped archive');
  } catch(err) {
    console.error('SSH operations failed:', err);
  }

  try {
    await fs.unlink(archivePath);
    console.log('Removed local archive');
  } catch(err) {
    console.error('Failed to remove local archive:', err);
  }
  ssh.connection?.destroy();
};

async function compressFolder(folderPath) {
  const archive = {};

  async function processFolder(folderPath, parentKey) {
    const folderName = path.basename(folderPath);
    const folderKey = parentKey ? `${parentKey}/${folderName}` : folderName;
    archive[folderKey] = {};

    const files = await fs.readdir(folderPath);
    for(const file of files) {
      const filePath = path.join(folderPath, file);
      const stats = await fs.stat(filePath);

      if(stats.isFile()) {
        const fileContent = await fs.readFile(filePath);
        const compressedContent = zlib.deflateSync(fileContent);
        archive[folderKey][file] = compressedContent;
        break;
      }/*  else if(stats.isDirectory()) {
        await processFolder(filePath, folderKey);
      } */
    }
  }

  await processFolder(folderPath);

  const compressedArchive = zlib.gzipSync(JSON.stringify(archive));
  return compressedArchive;
}

/* exec(`npm run change-version ${version}${changelog ? ' ' + changelog : ''}; npm run build`, (err, stdout, stderr) => {
  if(err) {
    return;
  }

  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
}); */
