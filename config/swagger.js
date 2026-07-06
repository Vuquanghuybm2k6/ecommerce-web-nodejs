const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const docsDir = path.join(__dirname, '..', 'docs')

function loadYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8'))
}

// Load root config: openapi, info, servers, security, tags
const spec = loadYaml(path.join(docsDir, 'openapi.yaml'))

// Load and merge component schemas + security schemes
const schemas = loadYaml(path.join(docsDir, 'schemas.yaml'))
spec.components = schemas.components

// Load all path files from client/ and admin/
const pathDirs = ['client', 'admin']
let allPaths = {}

for (const dir of pathDirs) {
  const dirPath = path.join(docsDir, dir)
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.yaml'))
    for (const file of files) {
      const fileSpec = loadYaml(path.join(dirPath, file))
      Object.assign(allPaths, fileSpec)
    }
  }
}

spec.paths = allPaths

module.exports = spec
