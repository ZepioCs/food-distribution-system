import fs from 'fs'

interface TranslationKeys {
  [key: string]: string | TranslationKeys
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

function setKeyValue(obj: TranslationKeys, path: string[], value: string): void {
  const [first, ...rest] = path
  if (!first) return

  if (rest.length === 0) {
    obj[first] = value
    return
  }

  if (!(first in obj)) {
    obj[first] = {}
  }

  if (typeof obj[first] === 'object') {
    setKeyValue(obj[first] as TranslationKeys, rest, value)
  }
}

function addMissingTranslationKeys(
  sourceFile: string,
  targetFile: string,
  keysToAdd: Map<string, string[]>
) {
  try {
    // Check if files exist
    if (!fs.existsSync(sourceFile)) {
      console.error(`Error: Source translation file not found at ${sourceFile}`)
      return
    }
    if (!fs.existsSync(targetFile)) {
      console.error(`Error: Target translation file not found at ${targetFile}`)
      return
    }

    // Read and parse both files
    const sourceContent = fs.readFileSync(sourceFile, 'utf-8')
    const targetContent = fs.readFileSync(targetFile, 'utf-8')
    const sourceTranslations = JSON.parse(sourceContent)
    const targetTranslations = JSON.parse(targetContent)

    // Keep track of changes
    let totalAdded = 0
    let skippedNamespaces = 0
    let skippedKeys = 0

    // Process each namespace
    keysToAdd.forEach((keys, namespace) => {
      // Skip if namespace doesn't exist in source
      if (!sourceTranslations[namespace]) {
        console.log(`\nSkipping namespace: ${namespace} (not found in source file)`)
        skippedNamespaces++
        return
      }

      // Create namespace in target if it doesn't exist
      if (!targetTranslations[namespace]) {
        targetTranslations[namespace] = {}
      }

      console.log(`\nProcessing namespace: ${namespace}`)
      keys.forEach(key => {
        try {
          const keyPath = key.split('.')
          const sourceValue = getKeyValue(sourceTranslations[namespace], keyPath)

          if (sourceValue === undefined) {
            console.log(`Warning: Key ${namespace}.${key} not found in source file`)
            skippedKeys++
            return
          }

          // Add the key with the source value
          setKeyValue(targetTranslations[namespace], keyPath, sourceValue)
          console.log(`Added: ${namespace}.${key} = "${sourceValue}"`)
          totalAdded++
        } catch (error: any) {
          console.log(`Error processing key ${namespace}.${key}: ${error.message}`)
        }
      })
    })

    // Write the updated translations back to target file
    fs.writeFileSync(
      targetFile,
      JSON.stringify(targetTranslations, null, 2),
      'utf-8'
    )

    console.log(`\nDone!`)
    console.log(`- Added ${totalAdded} translation keys`)
    console.log(`- Skipped ${skippedNamespaces} non-existent namespaces`)
    console.log(`- Skipped ${skippedKeys} keys not found in source file`)
  } catch (error: any) {
    console.error('Error processing translation files:', error.message)
  }
}

// Example usage:
const translationsToAdd = new Map<string, string[]>([
  ['Admin', [
    'generalTab.metrics.averageRevenuePerOrder',
    'generalTab.metrics.dailyRevenue',
    'generalTab.metrics.monthlyRevenue'
  ]],
  ['Analytics', [
    'metrics.averageOrderValue',
    'metrics.dailyOrders',
    'metrics.monthlyOrders'
  ]]
])

// Run the script
const sourceFile = './messages/en.json'  // English source file
const targetFile = './messages/de.json'  // Target language file
addMissingTranslationKeys(sourceFile, targetFile, translationsToAdd)
