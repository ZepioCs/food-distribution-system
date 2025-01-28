import fs from 'fs'
import path from 'path'

interface TranslationKeys {
  [key: string]: string | TranslationKeys
}

function flattenKeys(obj: TranslationKeys, prefix = ''): string[] {
  return Object.entries(obj).reduce((acc: string[], [key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object') {
      return [...acc, ...flattenKeys(value, newKey)]
    }
    return [...acc, newKey]
  }, [])
}

function findAllTranslationUsages(dir: string): Map<string, Set<string>> {
  console.log('Searching for translation keys in:', dir)
  const usedKeys = new Map<string, Set<string>>()
  const files = fs.readdirSync(dir)

  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        const subDirKeys = findAllTranslationUsages(filePath)
        subDirKeys.forEach((keys, namespace) => {
          if (!usedKeys.has(namespace)) {
            usedKeys.set(namespace, new Set())
          }
          keys.forEach(key => usedKeys.get(namespace)!.add(key))
        })
      }
    } else if (stats.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      
      // Find all useTranslations declarations and their usages
      const translationHooks = Array.from(content.matchAll(/const\s+(\w+)\s*=\s*useTranslations\(['"]([\w.-]+)['"]\)/g))
      
      translationHooks.forEach(match => {
        const translationVar = match[1]
        const namespacePath = match[2]
        
        if (translationVar) {
          // Look for usage of the translation variable
          const keyMatches = Array.from(content.matchAll(new RegExp(`${translationVar}\\(['"]([\\w.-]+)['"](?:,\\s*{[^}]*})?\\)`, 'g')))
          
          // Split namespace path into parts (e.g., 'Admin.generalTab' -> ['Admin', 'generalTab'])
          const [namespace, ...nestedPath] = namespacePath.split('.')
          
          if (!usedKeys.has(namespace)) {
            usedKeys.set(namespace, new Set())
          }
          
          keyMatches.forEach(keyMatch => {
            const key = keyMatch[1]
            if (key) {
              // If we have a nested namespace path, prepend it to the key
              const fullKey = nestedPath.length > 0 
                ? `${nestedPath.join('.')}.${key}`
                : key
              
              // If the key contains a dot and starts with the namespace, strip the namespace
              const finalKey = fullKey.startsWith(`${namespace}.`) 
                ? fullKey.substring(namespace.length + 1) 
                : fullKey
                
              usedKeys.get(namespace)!.add(finalKey)
            }
          })
        }
      })

      // Also check for direct namespace usage (e.g., Navigation.dashboard)
      Object.keys(JSON.parse(fs.readFileSync(translationsPath, 'utf-8'))).forEach(namespace => {
        const directMatches = Array.from(content.matchAll(new RegExp(`${namespace}\\.([\\w.-]+)`, 'g')))
        if (directMatches.length > 0) {
          if (!usedKeys.has(namespace)) {
            usedKeys.set(namespace, new Set())
          }
          directMatches.forEach(match => {
            if (match[1]) {
              usedKeys.get(namespace)!.add(match[1])
            }
          })
        }
      })
    }
  })

  return usedKeys
}

function findUnusedTranslationKeys(translationsPath: string, srcDirs: string[]): Map<string, string[]> {
  const translationContent = fs.readFileSync(translationsPath, 'utf-8')
  const translations = JSON.parse(translationContent)
  
  // Get all translation keys by namespace
  const allKeysByNamespace = new Map<string, string[]>()
  Object.entries(translations).forEach(([namespace, values]) => {
    allKeysByNamespace.set(namespace, flattenKeys(values as TranslationKeys))
  })
  
  // Find all used keys in the codebase
  const usedKeysByNamespace = new Map<string, Set<string>>()
  srcDirs.forEach(dir => {
    const dirUsedKeys = findAllTranslationUsages(dir)
    dirUsedKeys.forEach((keys, namespace) => {
      if (!usedKeysByNamespace.has(namespace)) {
        usedKeysByNamespace.set(namespace, new Set())
      }
      keys.forEach(key => usedKeysByNamespace.get(namespace)!.add(key))
    })
  })
  
  // Find unused keys by namespace
  const unusedKeysByNamespace = new Map<string, string[]>()
  allKeysByNamespace.forEach((keys, namespace) => {
    const usedKeys = usedKeysByNamespace.get(namespace) || new Set()
    const unusedKeys = keys.filter(key => !usedKeys.has(key))
    if (unusedKeys.length > 0) {
      unusedKeysByNamespace.set(namespace, unusedKeys)
    }
  })
  
  return unusedKeysByNamespace
}

// Example usage
const translationsPath = path.join(process.cwd(), 'messages', 'en.json')
const srcDirs = [
  path.join(process.cwd(), 'app'),
  path.join(process.cwd(), 'components')
]

try {
  const unusedKeysByNamespace = findUnusedTranslationKeys(translationsPath, srcDirs)
  console.log('Unused translation keys by namespace:')
  unusedKeysByNamespace.forEach((unusedKeys, namespace) => {
    console.log(`\nNamespace: ${namespace}`)
    unusedKeys.forEach(key => console.log(`- ${key}`))
  })
} catch (error) {
  console.error('Error checking translation keys:', error)
}
