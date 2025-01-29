import fs from 'fs'

interface TranslationKeys {
  [key: string]: string | TranslationKeys
}

function getAllKeys(obj: TranslationKeys, prefix: string = ''): string[] {
  const keys: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'object') {
      keys.push(...getAllKeys(value as TranslationKeys, currentPath))
    } else {
      keys.push(currentPath)
    }
  }
  
  return keys
}

function findMissingKeys(
  sourceFile: string,
  targetFile: string,
  outputFormat: 'map' | 'array' = 'map'
): Map<string, string[]> | [string, string[]][] {
  try {
    // Read and parse both files
    const sourceContent = fs.readFileSync(sourceFile, 'utf-8')
    const targetContent = fs.readFileSync(targetFile, 'utf-8')
    const sourceTranslations = JSON.parse(sourceContent)
    const targetTranslations = JSON.parse(targetContent)

    // Get all keys from both files by namespace
    const differences = new Map<string, string[]>()
    
    // Check each namespace in source
    for (const namespace of Object.keys(sourceTranslations)) {
      const sourceKeys = new Set(getAllKeys(sourceTranslations[namespace]))
      const targetKeys = new Set(
        targetTranslations[namespace] 
          ? getAllKeys(targetTranslations[namespace]) 
          : []
      )

      // Find keys in source that are missing in target
      const missingKeys = [...sourceKeys].filter(key => !targetKeys.has(key))
      
      if (missingKeys.length > 0) {
        differences.set(namespace, missingKeys)
      }
    }

    // Print the differences in a readable format
    console.log('\nMissing translation keys:')
    differences.forEach((keys, namespace) => {
      console.log(`\nNamespace: ${namespace}`)
      keys.forEach(key => {
        const value = getKeyValue(sourceTranslations[namespace], key.split('.'))
        console.log(`- ${key} = "${value}"`)
      })
    })

    // Print in format ready for addMissingTranslationKeys.ts
    console.log('\nFormat for addMissingTranslationKeys.ts:')
    console.log('const translationsToAdd = new Map<string, string[]>([')
    differences.forEach((keys, namespace) => {
      console.log(`  ['${namespace}', [`)
      keys.forEach(key => {
        console.log(`    '${key}',`)
      })
      console.log('  ]],')
    })
    console.log('])')

    // Print in format ready for deleteUnusedTranslationKeys.ts
    console.log('\nFormat for deleteUnusedTranslationKeys.ts:')
    console.log('const unusedTranslations = new Map<string, string[]>([')
    differences.forEach((keys, namespace) => {
      console.log(`  ['${namespace}', [`)
      keys.forEach(key => {
        console.log(`    '${key}',`)
      })
      console.log('  ]],')
    })
    console.log('])')

    return outputFormat === 'map' ? differences : Array.from(differences.entries())
  } catch (error: any) {
    console.error('Error comparing translation files:', error.message)
    return outputFormat === 'map' ? new Map() : []
  }
}

function getKeyValue(obj: TranslationKeys, path: string[]): string | undefined {
  const [first, ...rest] = path
  if (!first) return undefined

  if (rest.length === 0) {
    return typeof obj[first] === 'string' ? obj[first] as string : undefined
  }

  if (typeof obj[first] === 'object') {
    return getKeyValue(obj[first] as TranslationKeys, rest)
  }

  return undefined
}

// Example usage:
const sourceFile = './messages/en.json'  // English source file
const targetFile = './messages/es.json'  // Target language file
findMissingKeys(sourceFile, targetFile)
