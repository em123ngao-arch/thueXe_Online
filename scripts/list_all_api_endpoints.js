const fs = require('fs');
const path = require('path');

function scanControllers(dir, results = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) scanControllers(full, results);
    else if (item.name.endsWith('.java')) {
      const content = fs.readFileSync(full, 'utf-8');
      if (content.includes('@RestController')) {
        const reqMatch = content.match(/@RequestMapping\((?:value\s*=\s*)?["']([^"']+)["']/);
        const basePath = reqMatch ? reqMatch[1] : '';
        const lines = content.split('\n');
        const endpoints = [];

        for (let i = 0; i < lines.length; i++) {
          const l = lines[i].trim();
          const mapMatch = l.match(/@(Get|Post|Put|Delete|Patch)Mapping(?:\((?:value\s*=\s*)?["']?([^"'\)]*)["']?\))?/);
          if (mapMatch) {
            const method = mapMatch[1].toUpperCase();
            let subPath = mapMatch[2] || '';
            if (subPath.startsWith('value =')) {
              const sm = subPath.match(/["']([^"']+)["']/);
              subPath = sm ? sm[1] : '';
            }
            // get method declaration
            let methodDecl = '';
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
              if (lines[j].includes('public ') || lines[j].includes('ResponseEntity')) {
                methodDecl = lines[j].trim();
                break;
              }
            }
            const fullPath = (basePath + '/' + subPath).replace(/\/+/g, '/').replace(/\/$/, '');
            endpoints.push({ method, fullPath: fullPath || '/', methodDecl });
          }
        }
        results.push({
          controller: item.name,
          basePath,
          endpoints
        });
      }
    }
  }
  return results;
}

const controllers = scanControllers('backend/src/main/java');
controllers.forEach(c => {
  console.log(`\n========================================================================`);
  console.log(`🎮 CONTROLLER: ${c.controller} (Base: ${c.basePath})`);
  console.log(`========================================================================`);
  c.endpoints.forEach(e => {
    console.log(`  [${e.method.padEnd(6)}] ${e.fullPath.padEnd(45)} -> ${e.methodDecl}`);
  });
});
