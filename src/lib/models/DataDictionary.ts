import { getConnection } from "@/lib/db";

import { DbDataDictionary, DataDictionaryM } from "@/lib/types/data_dictionary";


export class DataDictionary {

    static async DbToDataDictionary(dataDictionaryRows: DbDataDictionary[]): Promise<DataDictionaryM[]> {
        const dataDictionary: DataDictionaryM[] = [];
        for (const row of dataDictionaryRows) {
            const field_name = row.field_name
            const form_name = row.form_name
            const field_label = row.field_label
            const field_type = row.field_type
            const select_choices_or_calculations = row.select_choices_or_calculations
            let choices = null;
            
            if (select_choices_or_calculations) {
                // "1, M1- Measure refusal (no reason provided) | 2, M2- No show | 3, M3- Research assistant forgot | 4, M4- Uncontrollable circumstance | 5, M5- Participant dropped out | M6, M6- Evaluation not necessary because the screening PSYCHS was done within 21 days of the final baseline visit component (not including RA prediction, CBC w/differential, and GCP Current Health Status)"

                // Split by "|"
                const parsedChoices = select_choices_or_calculations.split("|").map(choice => {
                    const [value, label] = choice.split(",").map(item => item.trim());
                    return { value: value.trim(), label: label.trim() };
                });

                // Add to choices
                choices = {
                    'raw': select_choices_or_calculations,
                    'parsed': parsedChoices
                }
            } else {
                choices = null;
            }

            dataDictionary.push({
                field_name: field_name?.trim() || null,
                form_name: form_name?.trim() || null,
                field_label: field_label?.trim() || null,
                field_type: field_type?.trim() || null,
                select_choices_or_calculations: choices
            });
        }
        return dataDictionary;
    }

    static async getDataDictionary(form_name: string): Promise<DataDictionaryM[]> {
        const connection = getConnection();

        // Get Data Dictionary
        const dataDictionaryQuery = `
        SELECT
            "Variable / Field Name" as field_name,
            "Form Name" as form_name,
            "Field Label" as field_label,
            "Field Type" as field_type,
            "Choices, Calculations, OR Slider Labels" as select_choices_or_calculations
        FROM data_dictionary
        WHERE "Form Name" = $1
        `;
        const dataDictionaryResults = await connection.query(dataDictionaryQuery, [form_name]);
        const dataDictionaryRows = dataDictionaryResults.rows as DbDataDictionary[];

        // Convert to Data Dictionary
        const dataDictionary = await DataDictionary.DbToDataDictionary(dataDictionaryRows);

        return dataDictionary;
    }
}