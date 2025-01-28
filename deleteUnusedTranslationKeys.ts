import fs from 'fs'

interface TranslationKeys {
  [key: string]: string | TranslationKeys
}

function removeKey(obj: TranslationKeys, path: string[]): boolean {
  const [first, ...rest] = path
  if (!first) return false

  if (rest.length === 0) {
    if (first in obj) {
      delete obj[first]
      return true
    }
    return false
  }

  if (typeof obj[first] === 'object') {
    const removed = removeKey(obj[first] as TranslationKeys, rest)
    // If the object is empty after removing the key, remove the object too
    if (removed && Object.keys(obj[first] as TranslationKeys).length === 0) {
      delete obj[first]
    }
    return removed
  }

  return false
}

function deleteUnusedTranslationKeys(filePath: string, unusedKeys: Map<string, string[]>) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`Error: Translation file not found at ${filePath}`)
      return
    }

    // Read and parse the translation file
    const content = fs.readFileSync(filePath, 'utf-8')
    const translations = JSON.parse(content)

    // Keep track of changes
    let totalRemoved = 0
    let skippedNamespaces = 0

    // Process each namespace
    unusedKeys.forEach((keys, namespace) => {
      // Skip if namespace doesn't exist
      if (!translations[namespace]) {
        console.log(`\nSkipping namespace: ${namespace} (not found in translation file)`)
        skippedNamespaces++
        return
      }

      console.log(`\nProcessing namespace: ${namespace}`)
      keys.forEach(key => {
        try {
          const keyPath = key.split('.')
          const removed = removeKey(translations[namespace], keyPath)
          if (removed) {
            console.log(`Removed: ${namespace}.${key}`)
            totalRemoved++
          } else {
            console.log(`Warning: Could not find key ${namespace}.${key}`)
          }
        } catch (error: any) {
          console.log(`Error processing key ${namespace}.${key}: ${error.message}`)
        }
      })

      // If namespace is empty after removing keys, remove it too
      if (translations[namespace] && Object.keys(translations[namespace]).length === 0) {
        delete translations[namespace]
        console.log(`Removed empty namespace: ${namespace}`)
      }
    })

    // Write the updated translations back to file
    fs.writeFileSync(
      filePath,
      JSON.stringify(translations, null, 2),
      'utf-8'
    )

    console.log(`\nDone!`)
    console.log(`- Removed ${totalRemoved} unused translation keys`)
    console.log(`- Skipped ${skippedNamespaces} non-existent namespaces`)
  } catch (error: any) {
    console.error('Error processing translation file:', error.message)
  }
}

// Example usage:
const unusedTranslations = new Map<string, string[]>([
  ['Common', ['error.title', 'error.unknown', 'success.title']],
  ['Navigation', ['testDashboard']],
  ['Auth', [
    'registrationSuccess',
    'passwordRequirements.length',
    'passwordRequirements.characters'
  ]],
  ['Analytics', [
    'filters.dateRange',
    'metrics.topItems',
    'metrics.peakHours',
    'charts.weekly',
    'charts.monthly'
  ]],
  ['Profile', [
    'personalInfo.name',
    'personalInfo.phone',
    'security.changePassword',
    'preferences.title',
    'preferences.emailNotifications',
    'preferences.mobileNotifications',
    'buttons.save',
    'roles.teacher',
    'roles.foodProvider',
    'roles.admin'
  ]],
  ['Feedback', [
    'form.attachment',
    'messages.success',
    'messages.error'
  ]],
  ['Notifications', ['clearAll']],
  ['Theme', ['light', 'dark', 'system']],
  ['Toast', [
    'success.settingsSaved',
    'success.profileUpdated',
    'success.reportGenerated',
    'success.reportDeleted',
    'success.reportDownloaded',
    'success.menuItemAdded',
    'success.menuItemUpdated',
    'success.menuItemDeleted',
    'error.settingsSaveFailed',
    'error.profileUpdateFailed',
    'error.reportGenerationFailed',
    'error.reportDeletionFailed',
    'error.reportDownloadFailed',
    'error.menuItemAddFailed',
    'error.menuItemUpdateFailed',
    'error.menuItemDeleteFailed',
    'warning.title',
    'warning.unsavedChanges',
    'warning.sessionExpiring',
    'info.processingRequest',
    'info.generatingReport',
    'info.downloadingReport',
    'info.updatingMenu'
  ]],
  ['MenuManagement', [
    'description',
    'form.available',
    'messages.addSuccess',
    'messages.editSuccess',
    'messages.deleteSuccess',
    'messages.error'
  ]],
  ['Reports', [
    'filters.dateRange',
    'filters.startDate',
    'filters.endDate',
    'filters.type',
    'filters.status',
    'filters.apply',
    'filters.day',
    'types.daily',
    'types.custom',
    'table.date',
    'table.type',
    'table.status',
    'table.items',
    'table.total',
    'table.actions',
    'actions.view',
    'actions.download',
    'actions.print',
    'actions.delete',
    'status.generated',
    'status.pending',
    'status.failed',
    'noData',
    'generateReport'
  ]],
  ['Admin', [
    'generalTab.fetchError',
    'generalTab.sections.users',
    'generalTab.sections.orders',
    'generalTab.sections.systemStatus',
    'generalTab.sections.updates',
    'generalTab.sections.systemHealth',
    'generalTab.metrics.totalValue',
    'generalTab.metrics.activeItems',
    'generalTab.metrics.feedback',
    'generalTab.metrics.unresolvedFeedback',
    'generalTab.metrics.notifications',
    'generalTab.metrics.unreadNotifications',
    'generalTab.metrics.orders',
    'generalTab.metrics.systemHealthy',
    'generalTab.filters.custom',
    'actions.reject'
  ]]
])

// Run the script
const translationFile = './messages/en.json'
deleteUnusedTranslationKeys(translationFile, unusedTranslations)
