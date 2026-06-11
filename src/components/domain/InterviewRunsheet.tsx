"use client"
import * as React from 'react';
import { useEffect, useState } from 'react';

import { toast } from "sonner";

import Chip from '@mui/joy/Chip';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';

import { FormDataM } from '@/lib/types/form_data';
import { DataDictionaryM } from '@/lib/types/data_dictionary';

export type InterviewRunsheetProps = {
    interviewName: string;
};

export default function InterviewRunsheet(props: InterviewRunsheetProps) {
    const { interviewName } = props;

    const [formData, setFormData] = useState<FormDataM | null>(null);
    const [dataDictionary, setDataDictionary] = useState<DataDictionaryM[]>([]);
    const [formRecords, setFormRecords] = useState<Record<string, string | null>[]>([]);
    const [usingClosestRunsheet, setUsingClosestRunsheet] = useState(false);
    const [noRunsheet, setNoRunsheet] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(`/api/v2/interviews/${interviewName}/runsheet`);
            if (response.redirected) {
                setUsingClosestRunsheet(true);
                toast.message('Uh oh! You were redirected!.', {
                    description: `No runsheet found. Redirecting to closest runsheet.`,
                })
            }
            if (!response.ok) {
                if (response.status === 404) {
                    setNoRunsheet(true);
                    return;
                }
                toast.message('Uh oh! Something went wrong.', {
                    description: `Request for runsheet failed - ${response.statusText}`,
                })
                throw new Error('Network response was not ok');
            }
            const data: FormDataM = await response.json();
            setFormData(data);
        };

        if (!formData) {
            fetchData();
        }
    }, [interviewName]);

    useEffect(() => {
        const fetchDataDictionary = async (formName: string) => {
            const response = await fetch(`/api/v2/forms/${formName}/dictionary`);
            if (!response.ok) {
                toast.message('Uh oh! Something went wrong.', {
                    description: 'Request for data dictionary failed.',
                })
                throw new Error('Network response was not ok');
            }
            const data: DataDictionaryM[] = await response.json();
            setDataDictionary(data);
        };

        if (formData && dataDictionary.length === 0) {
            fetchDataDictionary(formData.form_name)
        }
    }, [formData]);

    // Parse the data dictionary and form data
    // Filter out the data dictionary items that are not in the form data
    useEffect(() => {
        const filteredData: Record<string, string | null>[] = [];
        for (const item of dataDictionary) {
            const fieldName = item.field_name;

            if (!fieldName || !formData?.form_data || !(fieldName in formData.form_data)) {
                continue;
            }

            const fieldValue = formData.form_data[fieldName] as string;

            const fieldLabel = item.field_label;
            const fieldType = item.field_type;

            let value = fieldValue;
            if (fieldType === 'yesno') {
                value = fieldValue === '1' ? '✅ Yes' : '❌ No';
            } else {
                const choices = item.select_choices_or_calculations;

                // "select_choices_or_calculations":{"raw":"1, M1- Measure refusal (no reason provided) | 2, M2- No show | 3, M3- Research assistant forgot | 4, M4- Uncontrollable circumstance | 5, M5- Participant dropped out | M6, M6- Evaluation not necessary because the screening PSYCHS was done within 21 days of the final baseline visit component (not including RA prediction, CBC w/differential, and GCP Current Health Status)","parsed":[{"value":"1","label":"M1- Measure refusal (no reason provided)"},{"value":"2","label":"M2- No show"},{"value":"3","label":"M3- Research assistant forgot"},{"value":"4","label":"M4- Uncontrollable circumstance"},{"value":"5","label":"M5- Participant dropped out"},{"value":"M6","label":"M6- Evaluation not necessary because the screening PSYCHS was done within 21 days of the final baseline visit component (not including RA prediction"}]}

                if (choices) {
                    const parsedChoices = choices.parsed;
                    if (parsedChoices) {
                        for (const choice of parsedChoices) {
                            if (choice.value === fieldValue) {
                                value = choice.label;
                                break;
                            }
                        }
                    } else {
                        value = fieldValue;
                    }
                }
            }

            const filteredItem = {
                field_name: fieldName,
                field_label: fieldLabel,
                field_value: value,
                field_value_raw: fieldValue,
                all_choices: item.select_choices_or_calculations?.raw || null
            };
            filteredData.push(filteredItem);
        }

        setFormRecords(filteredData);
    }, [dataDictionary]);

    const importantFields = [
        "chrspeech_deviation",
        "chrspeech_upload",

        "chrpsychs_av_deviation",
        "chrpsychs_av_upload",
    ];

    return (
        <div className="flex flex-col gap-4 mt-4">
            {formData ? (
                <div className="flex flex-row items-center gap-2">
                    <h3 className="text-md font-semibold text-gray-800">
                        {usingClosestRunsheet ? "Closest Runsheet" : "Runsheet"}
                    </h3>
                    <div className="flex items-center gap-2 ml-2 text-gray-600">
                        <span className="font-medium">{formData.interview_name}</span>
                        <Chip
                            color="neutral"
                            variant="outlined"
                            size='lg'
                        >
                            {formData.event_name}
                        </Chip>
                        {/* <span className="text-gray-400">•</span>
                        <span className="italic">{formData.event_name}</span> */}
                    </div>
                    {usingClosestRunsheet && (
                        <Chip
                            color="warning"
                            variant="solid"
                        >
                            Not Exact Match
                        </Chip>
                    )}
                </div>
            ) : (
                <Skeleton variant="text" width={200} height={30} />
            )}
            {formRecords.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-gray-200 px-4 py-2 text-left text-gray-700 font-medium"><strong>Field Label</strong></th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-gray-700 font-medium" style={{ width: '30%' }}><strong>Field Value</strong></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formRecords.map((item, index) => (
                                <tr
                                    key={index}
                                    className={item.field_name && importantFields.includes(item.field_name) ? 'bg-lime-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                >
                                    <td className="border border-gray-200 px-4 py-3">
                                        <Tooltip title={`field_name: ${item.field_name}`} arrow placement='left'>
                                            <div className="line-clamp-3 hover:line-clamp-none cursor-help text-sm text-gray-700">
                                                {item.field_label}
                                                {item.all_choices && (
                                                    <span className="text-gray-500 text-xs ml-2">
                                                        ({item.all_choices})
                                                    </span>
                                                )}
                                            </div>
                                        </Tooltip>
                                    </td>
                                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800">
                                        {item.field_value}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-5xl mx-auto">
                        {filteredDataDictionary.map((item, index) => (
                            <div 
                                key={index} 
                                // className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                                className="bg-white border border-gray-200 transition-all duration-300 hover:border-blue-300"
                            >
                                <div className="p-5">
                                    <Tooltip 
                                        title={`Field ID: ${item.field_name}`} 
                                        arrow 
                                        placement='top-start'
                                        className="w-full"
                                    >
                                        <h3 className="text-sm text-gray-600 mb-2 font-medium cursor-help">
                                            {item.field_label}
                                        </h3>
                                    </Tooltip>
                                    <div className="pl-3 border-l-4 border-blue-500 py-1">
                                        <p className="text-md font-medium text-gray-800">
                                            {item.field_value || "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div> */}
                </div>
            ) : noRunsheet ? (
                <div className="bg-gray-50 border border-gray-200 rounded p-6 text-center text-gray-500">
                    No runsheet data available
                </div>
            ) : (
                <Skeleton variant="rectangular" height={500} sx={{ mt: 2 }} />
            )}
        </div>
    )
}