const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const replacements = [
  { regex: /bg-gray-50/g, replacement: 'bg-surface-alt' },
  { regex: /bg-gray-100/g, replacement: 'bg-surface-alt' },
  { regex: /border-gray-100/g, replacement: 'border-border-dim' },
  { regex: /border-gray-200/g, replacement: 'border-border' },
  { regex: /text-gray-900/g, replacement: 'text-ink' },
  { regex: /text-gray-800/g, replacement: 'text-ink' },
  { regex: /text-gray-700/g, replacement: 'text-ink-sub' },
  { regex: /text-gray-600/g, replacement: 'text-ink-sub' },
  { regex: /text-gray-500/g, replacement: 'text-ink-dim' },
  { regex: /text-gray-400/g, replacement: 'text-ink-dim' },
  { regex: /text-gray-300/g, replacement: 'text-ink-dim' },
  { regex: /text-gray-200/g, replacement: 'text-ink-dim' },
  { regex: /bg-gray-200/g, replacement: 'bg-border' },
  { regex: /bg-gray-300/g, replacement: 'bg-border' },
  { regex: /bg-gray-400/g, replacement: 'bg-border' },
  { regex: /border-gray-300/g, replacement: 'border-border' },
  { regex: /border-gray-400/g, replacement: 'border-border' },
  { regex: /focus:ring-black/g, replacement: 'focus:ring-brand' },
  { regex: /ring-black/g, replacement: 'ring-brand' },
  { regex: /bg-black/g, replacement: 'bg-brand' },
  { regex: /text-black/g, replacement: 'text-ink' },
  { regex: /border-black/g, replacement: 'border-brand' },
  { regex: /hover:text-black/g, replacement: 'hover:text-ink' },
  { regex: /hover:border-black/g, replacement: 'hover:border-brand' },
  { regex: /hover:bg-gray-50/g, replacement: 'hover:bg-surface-alt' },
  { regex: /hover:bg-gray-100/g, replacement: 'hover:bg-surface-alt' },
  { regex: /rounded-3xl/g, replacement: 'rounded-panel' },
  { regex: /rounded-2xl/g, replacement: 'rounded-card' },
  { regex: /rounded-xl/g, replacement: 'rounded-input' },
  { regex: /rounded-lg/g, replacement: 'rounded-chip' },
  { regex: /shadow-sm/g, replacement: 'shadow-card' },
  { regex: /shadow-xl/g, replacement: 'shadow-elevated' },
  { regex: /shadow-2xl/g, replacement: 'shadow-float' },
  { regex: /bg-green-100/g, replacement: 'bg-trust-surface' },
  { regex: /text-green-700/g, replacement: 'text-trust' },
  { regex: /text-green-800/g, replacement: 'text-trust' },
  { regex: /bg-red-100/g, replacement: 'bg-danger-surface' },
  { regex: /text-red-700/g, replacement: 'text-danger' },
  { regex: /text-red-600/g, replacement: 'text-danger' },
  { regex: /bg-blue-100/g, replacement: 'bg-info-surface' },
  { regex: /text-blue-700/g, replacement: 'text-info' },
  { regex: /bg-orange-100/g, replacement: 'bg-caution-surface' },
  { regex: /text-orange-700/g, replacement: 'text-caution' },
  { regex: /bg-yellow-100/g, replacement: 'bg-caution-surface' },
  { regex: /text-yellow-700/g, replacement: 'text-caution' },
  { regex: /text-yellow-500/g, replacement: 'text-brand' },
  { regex: /text-yellow-400/g, replacement: 'text-brand' },
  { regex: /bg-purple-100/g, replacement: 'bg-brand-muted' },
  { regex: /text-purple-700/g, replacement: 'text-brand-dark' },
];

const processFile = (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Special case for min-h-screen bg-gray-50 -> min-h-screen bg-canvas
  content = content.replace(/min-h-screen bg-gray-50/g, 'min-h-screen bg-canvas');
  content = content.replace(/min-h-screen bg-surface-alt/g, 'min-h-screen bg-canvas');

  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
};

walkDir('app/provider', processFile);
walkDir('app/admin', processFile);

