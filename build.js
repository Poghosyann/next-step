const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let destPath = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
  }
}

try {
  console.log("Creating public directory...");
  fs.mkdirSync('public', { recursive: true });
  
  console.log("Copying static landing page files...");
  fs.copyFileSync('index.html', 'public/index.html');
  fs.copyFileSync('styles.css', 'public/styles.css');
  fs.copyFileSync('script.js', 'public/script.js');
  if (fs.existsSync('logo.png')) fs.copyFileSync('logo.png', 'public/logo.png');

  console.log("Building React CRM...");
  if (fs.existsSync(path.join(__dirname, 'crm', 'frontend', 'package-lock.json'))) {
    fs.unlinkSync(path.join(__dirname, 'crm', 'frontend', 'package-lock.json'));
  }
  if (fs.existsSync(path.join(__dirname, 'crm', 'frontend', 'node_modules'))) {
    fs.rmSync(path.join(__dirname, 'crm', 'frontend', 'node_modules'), { recursive: true, force: true });
  }
  execSync('npm install --include=dev', { cwd: path.join(__dirname, 'crm', 'frontend'), stdio: 'inherit' });
  execSync('npm run build', { cwd: path.join(__dirname, 'crm', 'frontend'), stdio: 'inherit' });

  console.log("Copying React build to public/academy-portal...");
  if (fs.existsSync('public/crm')) {
    fs.rmSync('public/crm', { recursive: true, force: true });
  }
  if (fs.existsSync('public/academy-portal')) {
    fs.rmSync('public/academy-portal', { recursive: true, force: true });
  }
  copyDir(path.join(__dirname, 'crm', 'frontend', 'dist'), path.join(__dirname, 'public', 'academy-portal'));

  console.log("Building React Site Admin Panel (/ns-manage-site)...");
  if (fs.existsSync(path.join(__dirname, 'admin', 'frontend', 'package-lock.json'))) {
    fs.unlinkSync(path.join(__dirname, 'admin', 'frontend', 'package-lock.json'));
  }
  if (fs.existsSync(path.join(__dirname, 'admin', 'frontend', 'node_modules'))) {
    fs.rmSync(path.join(__dirname, 'admin', 'frontend', 'node_modules'), { recursive: true, force: true });
  }
  execSync('npm install --include=dev', { cwd: path.join(__dirname, 'admin', 'frontend'), stdio: 'inherit' });
  execSync('npm run build', { cwd: path.join(__dirname, 'admin', 'frontend'), stdio: 'inherit' });

  console.log("Copying Admin build to public/ns-manage-site...");
  if (fs.existsSync('public/admin')) {
    fs.rmSync('public/admin', { recursive: true, force: true });
  }
  if (fs.existsSync('public/ns-manage-site')) {
    fs.rmSync('public/ns-manage-site', { recursive: true, force: true });
  }
  copyDir(path.join(__dirname, 'admin', 'frontend', 'dist'), path.join(__dirname, 'public', 'ns-manage-site'));

  console.log("Build complete!");
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}
