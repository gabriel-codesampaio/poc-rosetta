// Copia src/contract.ts para os fronts (projetos independentes, contrato único).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'src/contract.ts'), 'utf8');
const header = '// GERADO por middleware/scripts/sync-contract.mjs — não edite. Fonte: middleware/src/contract.ts\n';

for (const target of ['../web/src/contract.ts', '../mobile/src/contract.ts']) {
  const path = resolve(root, target);
  const repo = resolve(path, '../..');
  if (!existsSync(repo)) {
    console.log(`- pulando ${target} (projeto não existe)`);
    continue;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, header + source);
  console.log(`✓ ${target}`);
}
