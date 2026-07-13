const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  // Text colors
  { regex: /text-white(?![\w/-])/g, replace: 'text-foreground' },
  { regex: /text-gray-400(?![\w/-])/g, replace: 'text-muted-foreground' },
  { regex: /text-gray-300(?![\w/-])/g, replace: 'text-muted-foreground' },
  { regex: /text-zinc-400(?![\w/-])/g, replace: 'text-muted-foreground' },
  // Backgrounds
  { regex: /bg-black(?![\w/-])/g, replace: 'bg-background' },
  { regex: /bg-zinc-900(?![\w/-])/g, replace: 'bg-card' },
  { regex: /bg-zinc-800(?![\w/-])/g, replace: 'bg-muted' },
  { regex: /bg-white\/5(?![\w/-])/g, replace: 'bg-black/5' },
  { regex: /bg-white\/10(?![\w/-])/g, replace: 'bg-black/5' },
  { regex: /bg-white\/20(?![\w/-])/g, replace: 'bg-black/10' },
  { regex: /bg-background\/50(?![\w/-])/g, replace: 'bg-background/80' },
  // Borders
  { regex: /border-white\/10(?![\w/-])/g, replace: 'border-border' },
  { regex: /border-white\/20(?![\w/-])/g, replace: 'border-border' },
  { regex: /border-zinc-800(?![\w/-])/g, replace: 'border-border' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Theme replacement complete!');
