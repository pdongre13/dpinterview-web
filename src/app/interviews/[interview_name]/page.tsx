"use client"
import * as React from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Typography from '@mui/joy/Typography';

import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

import Box from '@mui/material/Box';

import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';

import { Descriptions } from 'antd';
import type { DescriptionsProps } from 'antd';
import { Typography as AntTypography } from 'antd';
import { Empty } from 'antd';

import { Interview } from '@/lib/types/interview';
import FileInfoCard, { FileInfoCardProps } from '@/components/domain/FileInfoCard';
import InterviewPartCard, { updateInterviewPartCardProps } from '@/components/domain/InterviewPartCard';

import InterviewTimelineS from '@/components/domain/InterviewTimelineS';
import InterviewRunsheet from '@/components/domain/InterviewRunsheet';
import QcForm from '@/components/domain/QcForm';
import Transcript from '@/components/domain/TranscriptE';
import InterviewPdfReport from '@/components/domain/InterviewPdfReport';

const { Paragraph } = AntTypography;



function getInterviewPartInfo(interview_part_path: string, interview_data: Interview): updateInterviewPartCardProps | null {
    for (const part of interview_data.parts) {
        if (part.interview_path === interview_part_path) {
            part.interview_name = interview_data.interview_name;
            return part;
        }
    }
    return null;
}


function interviewPartOnChange(
    interview_part_path: string,
    interview: Interview,
    is_primary: boolean,
    is_duplicate: boolean,
    setInterview: (interview: Interview) => void
) {
    const updatedParts = interview.parts.map((part) => {
        if (part.interview_path === interview_part_path) {
            return {
                ...part,
                is_primary: is_primary,
                is_duplicate: is_duplicate,
            };
        }
        return part;
    });

    // console.log('Updated interview parts:', updatedParts);

    setInterview({
        ...interview,
        parts: updatedParts,
    });
}

function interviewFileOnTagsChange(
    interview_file_path: string,
    interview: Interview,
    tags: string[],
    setInterview: (interview: Interview) => void
) {
    const updatedFiles = interview.parts.map((part) => {
        part.interview_files.map((file) => {
            if (file.interview_file.file_path === interview_file_path) {
                file.interview_file_tags = tags;
            }
            return file;
        });
        return part;
    });

    const newInterview = {
        ...interview,
        parts: updatedFiles,
    };
    setInterview(newInterview);
    // console.log('Updated interview files:', newInterview);
}

function interviewFileOnIgnore(
    interview_file_path: string,
    interview: Interview,
    ignored: boolean,
    setInterview: (interview: Interview) => void
) {
    const updatedFiles = interview.parts.map((part) => {
        part.interview_files.map((file) => {
            if (file.interview_file.file_path === interview_file_path) {
                file.ignored = ignored;
            }
            return file;
        });
        return part;
    });

    const newInterview = {
        ...interview,
        parts: updatedFiles,
    };
    setInterview(newInterview);
}

// ts-ignore
export default function Page({
    params,
}: {
    params: Promise<{ interview_name: string }>
}) {
    const [interviews, setInterviews] = useState<Interview | null>(null);
    // const [interviewProcessingData, setInterviewProcessingData] = useState<InterviewProcessingData | null>(null);
    const [interview_name, setInterview_name] = useState<string>('');
    const [descriptionItems, setDescriptionItems] = useState<DescriptionsProps['items']>([]);
    const [files, setFiles] = useState<Record<string, Record<string, any>> | null>({});
    const [loading, setLoading] = React.useState(true);

    const [lastSelectedItem, setLastSelectedItem] = React.useState<string | null>(
        null,
    );
    const [selectedFileProps, setSelectedFileProps] = React.useState<FileInfoCardProps | null>(
        null,
    );
    const [selectedPartProps, setSelectedPartProps] = React.useState<updateInterviewPartCardProps | null>(
        null,
    );
    const [currentAudioTime, setCurrentAudioTime] = React.useState<number>(0);


    useEffect(() => {
        const fetchData = async () => {
            // console.log('Fetching interview data...');
            // Get slug from the params
            const { interview_name } = await params;
            setInterview_name(interview_name);
            // Fetch data from the API
            const res = await fetch(`/api/v2/interviews/${interview_name}/info`);
            if (!res.ok) {
                setLoading(false);
                throw new Error(`Failed to fetch interview data: ${res.status} ${res.statusText}`);
            }
            const data: Interview = await res.json();
            setInterviews(data);
            setLoading(false);

            // // Fetch interview processing data
            // const processingDataResponse = await fetch(`/api/v2/interviews/${interview_name}/processing`);
            // if (processingDataResponse.ok) {
            //     const processingData: InterviewProcessingData = await processingDataResponse.json();
            //     setInterviewProcessingData(processingData);
            // }
        };
        fetchData();
    }, [params])

    useEffect(() => {
        if (!interviews) return;

        const tempFiles: Record<string, Record<string, any>> = {};
        // Add part_name to Interview Parts
        interviews.parts.forEach(
            (part, _) => {  // eslint-disable-line @typescript-eslint/no-unused-vars
                // Add last part of interview_path as part_name
                const part_name = part.interview_path.split('/').pop();

                (part as any).part_name = part_name;
                part.interview_files.forEach(
                    (file, _) => {  // eslint-disable-line @typescript-eslint/no-unused-vars
                        const relative_path = file.interview_file.file_path.replace(part.interview_path + '/', '');
                        if (relative_path === file.interview_file.file_path) {
                            // Use just file name
                            (file as any).relative_path = file.interview_file.file_name;
                        } else {
                            (file as any).relative_path = relative_path;
                        }

                        // Add file to files
                        tempFiles[file.interview_file.file_path] = file.interview_file
                        tempFiles[file.interview_file.file_path].interview_file_tags = file.interview_file_tags;

                        tempFiles[file.interview_file.file_path].ignored = file.ignored;
                    });
            });

        setFiles(tempFiles);

        // parse to description items
        const items = [
            {
            label: 'Interview Name',
            children: <Paragraph copyable={{ text: interviews.interview_name }}>{interviews.interview_name ?? 'null'}</Paragraph>,
            },
            {
            label: 'Interview Type',
            children: interviews.interview_type,
            },
            {
            label: 'Subject ID',
            children: (
                <Link href={`/studies/${interviews.study_id}/subjects/${interviews.subject_id}`}>
                {interviews.subject_id}
                </Link>
            ),
            },
            {
            label: 'Study ID',
            children: interviews.study_id,
            },
            {
            label: '# Parts',
            children: interviews.parts.length,
            },
            {
            label: '# Transcript Files',
            children: interviews.transcript_files.length,
            }
        ];


        setDescriptionItems(items);
    }, [interviews]);

    const handleItemSelectionToggle = (
        event: React.SyntheticEvent,
        itemId: string,
        isSelected: boolean,
    ) => {
        if (isSelected) {
            setLastSelectedItem(itemId);
        }
    };

    useEffect(() => {
        if (lastSelectedItem && files && files[lastSelectedItem]) {
            const fileProps: FileInfoCardProps = {
                interview_name: interview_name,
                file_path: files[lastSelectedItem].file_path,
                file_name: files[lastSelectedItem].file_name,
                file_size_mb: files[lastSelectedItem].file_size_mb,
                m_time: new Date(files[lastSelectedItem].m_time),
                md5: files[lastSelectedItem].md5,
                tags: files[lastSelectedItem].interview_file_tags,
                ignored: files[lastSelectedItem].ignored,
                onTagsChange: (tags: string[]) => {
                    interviewFileOnTagsChange(
                        files[lastSelectedItem].file_path,
                        interviews as Interview,
                        tags,
                        setInterviews,
                    );
                },
                onIgnoredChange: (ignored: boolean) => {
                    interviewFileOnIgnore(
                        files[lastSelectedItem].file_path,
                        interviews as Interview,
                        ignored,
                        setInterviews,
                    );
                },
            };

            setSelectedPartProps(null);
            setSelectedFileProps(fileProps);
        } else {
            if (lastSelectedItem && files && !files[lastSelectedItem] && interviews) {
                if (lastSelectedItem.startsWith('p_')) {
                    const part_path = lastSelectedItem.replace('p_', '');
                    const part = getInterviewPartInfo(part_path, interviews);
                    setSelectedFileProps(null);
                    setSelectedPartProps(part);
                }
            }
        }
    }, [lastSelectedItem, files, interviews, interview_name]);

    // function updateAudioTime(newTime: number) {

    //     const audio = document.querySelector('audio');
    //     if (audio) {
    //         audio.currentTime = newTime;
    //     }
    //     const video = document.querySelector('video');
    //     if (video) {
    //         video.currentTime = newTime;
    //     }
    // }


    return (
        <div className="container mx-auto p-4">
            {/* <Backdrop
                sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
                open={showBackDrop}
            >
                <CircularProgress color="inherit" />
            </Backdrop> */}
            <div>
                <Typography level="h4">
                    Interview Details
                </Typography>
                {loading ? (
                    <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
                ) : (
                    interview_name && (
                        <Typography textColor="text.secondary" sx={{ mb: 2 }}>
                            {interview_name}
                        </Typography>
                    )
                )}
            </div>

            {loading ? (
                <div className='mb-32'>
                    <Typography level="title-md" sx={{ mb: 3 }}>
                        <strong>Interview Info</strong>
                    </Typography>
                    <Skeleton variant="rectangular" sx={{ height: 150 }} />

                    <Typography level="title-lg" sx={{ mt: 3 }}>
                        <strong>Interview Parts</strong>
                    </Typography>

                    <div>
                        <Skeleton variant="text" sx={{ fontSize: '3rem' }} />
                    </div>

                    <Typography level="title-lg" sx={{ mt: 3 }}>
                        <strong>Further Information</strong>
                    </Typography>

                    <Skeleton variant="rectangular" sx={{ height: 400, mt: 4 }} />
                </div>
            ) : (
                interviews ? (
                    <div className='mb-32'>
                        <Descriptions
                            title="Interview Info"
                            bordered
                            column={{ xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
                            size='small'
                            items={descriptionItems}
                        />

                        <Typography level="title-lg" sx={{ mt: 3 }}>
                            <strong>Interview Parts</strong>
                        </Typography>

                        <div className='m-4'>
                            {lastSelectedItem && files && files[lastSelectedItem] && selectedFileProps?.interview_name && selectedFileProps?.file_path && selectedFileProps?.file_name && selectedFileProps?.file_size_mb && selectedFileProps?.m_time && (
                                <FileInfoCard {
                                    ...selectedFileProps as FileInfoCardProps
                                }
                                currentAudioTime={currentAudioTime}
                                setCurrentAudioTime={setCurrentAudioTime}
                                />
                            )}
                            {lastSelectedItem && files && !files[lastSelectedItem] && selectedPartProps && (
                                <InterviewPartCard
                                    interview_path={selectedPartProps.interview_path}
                                    interview_name={selectedPartProps.interview_name || interview_name}
                                    is_primary={selectedPartProps.is_primary}
                                    is_duplicate={selectedPartProps.is_duplicate}
                                    onChange={(is_primary, is_duplicate) => {
                                        interviewPartOnChange(
                                            selectedPartProps.interview_path,
                                            interviews,
                                            is_primary,
                                            is_duplicate,
                                            setInterviews,
                                        );
                                    }}
                                />
                            )}
                        </div>

                        <SimpleTreeView onItemSelectionToggle={handleItemSelectionToggle}>
                            {interviews.parts.map((part, index) => (
                                <TreeItem key={index} itemId={'p_' + part.interview_path} label={(part as any).part_name}>
                                    {part.interview_files.map((file, fileIndex) => (
                                        <TreeItem key={fileIndex} itemId={file.interview_file.file_path} label={((file as any).relative_path ?? file.interview_file.file_name ?? '').replace('.lock', '').replace('.mkv', '.mp4')} />
                                    ))}
                                </TreeItem>
                            ))}
                        </SimpleTreeView>

                        <Typography level="title-lg" sx={{ mt: 3 }}>
                            <strong>Further Information</strong>
                        </Typography>

                        <Box
                        // sx={{ display: { xs: 'block', md: 'none' }}}
                        >
                            <Tabs aria-label="Basic tabs" defaultValue={0} sx={{ mt: 3 }}>
                                <TabList>
                                    <Tab>⏱️ Interview Timeline</Tab>
                                    <Tab>📝 Run Sheet</Tab>
                                    <Tab>🚩 QC Issues</Tab>
                                    <Tab>📄 PDF Report</Tab>
                                    <Tab>📄 Transcript</Tab>
                                </TabList>
                                <TabPanel value={0}>
                                    <Typography level="title-lg" textColor="text.secondary" sx={{ mt: 3 }}>
                                        <strong>Interview Timeline</strong>
                                    </Typography>

                                    <InterviewTimelineS interviewName={interview_name} />
                                </TabPanel>
                                <TabPanel value={1}>
                                    <Typography level="title-lg" textColor="text.secondary" sx={{ mt: 3 }}>
                                        <strong>Run Sheet</strong>
                                    </Typography>

                                    <InterviewRunsheet interviewName={interview_name} />
                                </TabPanel>
                                <TabPanel value={2}>
                                    <Typography level="title-lg" textColor="text.secondary" sx={{ mt: 3 }}>
                                        <strong>QC Issues</strong>
                                    </Typography>

                                    <QcForm interviewName={interview_name} />
                                </TabPanel>
                                <TabPanel value={3}>
                                    <InterviewPdfReport interviewName={interview_name} />
                                </TabPanel>
                                <TabPanel value={4}>
                                    <Transcript 
                                        identifier={interview_name} identifier_type='interview' 
                                        currentAudioTime={currentAudioTime}
                                        updateAudioTime={setCurrentAudioTime}
                                    />
                                </TabPanel>
                            </Tabs>
                        </Box>

                        {/* <Stack 
                            direction="row" 
                            spacing={2}
                            sx={{ width: '100%', display: { xs: 'none', md: 'flex' } }}
                        >
                            <Box sx={{ width: '50%' }}>
                                <Typography level="title-lg" textColor="text.secondary" sx={{ mt: 3 }}>
                                    <strong>Interview Timeline</strong>
                                </Typography>

                                <InterviewTimelineS interviewName={interview_name} />
                            </Box>
                            <Box sx={{ width: '50%' }}>
                                <Typography level="title-lg" textColor="text.secondary" sx={{ mt: 3 }}>
                                    <strong>Run Sheet</strong>
                                </Typography>

                                <InterviewRunsheet interviewName={interview_name} />

                            </Box>
                        </Stack> */}

                    </div>
                ) : (
                    <div>
                        <Alert severity="error">Interview not found</Alert>

                        <div className='m-32'>
                            <Empty description="No interview data available" />
                        </div>

                        <div className='mb-32'>
                            <Typography level="title-lg" textColor="text.secondary" sx={{ mt: 3 }}>
                                <strong>Run Sheet</strong>
                            </Typography>

                            <InterviewRunsheet interviewName={interview_name} />
                        </div>
                    </div>
                )
            )}

        </div>
    )
}