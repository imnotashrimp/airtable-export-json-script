// This script runs in the Script block in Airtable.
// You'll need to modify the code to work with your base.

output.markdown("## Pre-export checks")

let criticalChecksPassed

// Replace your table name
let table = base.getTable("TABLE_NAME")

// Replace your view name
let view = table.getView("VIEW_NAME")
let query = await view.selectRecordsAsync()
let resultsList = createResultsList()
let allKeys = resultsList.map(record => record.key)

let invalidRecords = resultsList.filter( record => record.validation !== null )
let duplicatedKeys = allKeys.filter((item, index) => allKeys.indexOf(item) != index)

// This is because I had two fields for the copy. You may not need this section.
let hasDesignCopy = resultsList.filter( record => record.designCopy )

invalidRecordsCheck()
duplicatedKeysCheck()
hasDesignCopyCheck()
await generateJson()

function createResultsList () {
    return query.records.map(record => {
        return {
            id: record.id,
            // Replace with the name of the field that will contain your JSON key.
            key: record.getCellValue('KEY_FIELD'),
            
            // Replace with the name of the field that has your validation formula.
            validation: record.getCellValue('VALIDATION_FIELD'),
            
            // If you have a separate field for design copy, include that field here.
            designCopy: record.getCellValue('DESIGN_COPY_FIELD'),
            
            // Replace with the field that contains your production copy.
            productionCopy: record.getCellValue('PRODUCTION_COPY_FIELD')
        }
    })
}

let recordsToExport = {
    allRecords: resultsList
}

function invalidRecordsCheck () {
    output.markdown('---')
    if (invalidRecords.length === 0 ) {
        output.markdown("### ✅ Validation check")
        output.markdown("👍 All records are valid")
    } else {
        criticalChecksPassed = false

        output.markdown("### ❌ Validation check failed")

        output.markdown(`**There are invalid records. Do not export**.`)
        
        // Replace with the details for the view you want to link to.
        output.markdown(`Troubleshoot using [VIEW_NAME](https://airtable.com/TABLE_ID/VIEW_NAME).`)
        output.table(invalidRecords.map(record => {
            return {
                Key: record.key,
                Errors: record.validation
            }
        }))
    }
}

function duplicatedKeysCheck () {
    output.markdown('---')

    if (duplicatedKeys.length === 0) {
        output.markdown("### ✅ Duped key check")
        output.markdown("👍 All keys are unique")
    } else {
        criticalChecksPassed = false

        output.markdown("### ❌ Duped key check failed")

        output.markdown(`**There are duplicated keys. Do not export**.`)
        
        // Replace with your details.
        output.markdown(`Troubleshoot using the [DeDupe block](https://airtable.com/TABLE_ID/VIEW_ID?blocks=bipaVX7bKRjvfdzJL&bip=full).`)
        output.table(duplicatedKeys.map(key => {
            return {
                Key: key
            }
        }))

    }
}

function hasDesignCopyCheck () {
    output.markdown('---')

    if (hasDesignCopy.length === 0) {
        output.markdown("### ✅ Design <> prod copy check")
        output.markdown("👍 All records have production copy only")
    } else {
        output.markdown("### 🟡 Some records have design copy")

        output.markdown(`🤚 Some records have design copy. This might not be a problem, but **double-check everything before exporting.**`)
        output.markdown(`If you spot a field that needs to change, put the correct string in the \`productionCopy\` field using [Migrate design > prod copy](https://airtable.com/tbl0o5Kt0adTtKm5R/viwHMqZ1gCW1S8SLX?blocks=bipnOsvNtyTmXXTHJ).`)
        output.table(hasDesignCopy.map(record => {
            return {
                Key: record.key,
                'Design copy': record.designCopy,
                'Production copy': record.productionCopy
            }
        }))

    }
}

function constructJson () {
    let jsonOut = {}
    resultsList.forEach(record => {
        Object.assign(jsonOut, {
            [record.key]: record.productionCopy 
        })
    })

    return JSON.stringify(jsonOut)
}


async function generateJson () {
    output.markdown('---')
    output.markdown('## Generate JSON')
    if (criticalChecksPassed !== false) {

        let generateJsonBtnClick = input.buttonsAsync('The critical checks passed! Scroll up ☝️ and review all the checks before generating JSON.', ['Generate JSON'])

        if (await generateJsonBtnClick) {
            output.markdown("**Triple-click the text below, and paste it to your JSON file.**")
            output.markdown(` \`\`\`json
${constructJson()}
            \`\`\` `
            )
        }
    } else {
        output.text('🛑 Critical checks failed. Fix the issues above, and then re-run the pre-export checks')
    }   
}
