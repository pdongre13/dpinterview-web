"use client"
import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';

import { Descriptions } from 'antd';
import { Typography } from 'antd';
import type { DescriptionsProps } from 'antd';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ButtonGroup from '@mui/material/ButtonGroup';

import DeleteIcon from '@mui/icons-material/Delete';
import QuestionMark from '@mui/icons-material/QuestionMark';
import AudioFile from '@mui/icons-material/AudioFile';
import VideoFile from '@mui/icons-material/VideoFile';
import People from '@mui/icons-material/People';
import { InterpreterMode } from '@mui/icons-material';
import { Person } from '@mui/icons-material';
import { GraphicEq } from '@mui/icons-material';

import { toast } from "sonner";

const { Paragraph } = Typography;


export type FileInfoCardProps = {
    interview_name: string;
    file_path: string;
    file_name: string;
    file_size_mb: number;
    m_time: Date;
    md5: string | null;
    tags: string[];
    ignored: boolean;
    onTagsChange?: (tags: string[]) => void;
    currentAudioTime?: number;
    setCurrentAudioTime?: (time: number) => void;
};

FileInfoCard.defaultProps = {
    md5: null,
    tags: [],
    ignored: false,
};

function removeRoles(
    props: FileInfoCardProps,
): Promise<void> {
    const interview_name = props.interview_name;
    const audio_path = props.file_path;

    const body: Record<string, any> = {};
    body.audio_path = audio_path;

    fetch(`/api/v2/interviews/${interview_name}/audio/clearRole`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            // console.error(response);
            throw new Error('Failed to remove roles');
        }
        return response.json();
    })
    .then((data) => {
        // Update the tags in the props
        const new_tags: string = data.new_tags;
        const new_tags_array: string[] = new_tags.split(',').map((tag: string) => tag.trim());
        // Update the UI
        if (props.onTagsChange) {
            props.onTagsChange(new_tags_array);
        }
    })

    return Promise.resolve();
};

function setRole(
    props: FileInfoCardProps,
    role: string
): Promise<void> {
    const interview_name = props.interview_name;
    const audio_path = props.file_path;

    const body: Record<string, any> = {};
    body.audio_path = audio_path;
    body.role = role;

    fetch(`/api/v2/interviews/${interview_name}/audio/updateRole`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            // console.error(response);
            throw new Error('Failed to set roles');
        }
        return response.json();
    })
    .then((data) => {
        // Update the tags in the props
        const new_tags: string = data.new_tags;
        const new_tags_array: string[] = new_tags.split(',').map((tag: string) => tag.trim());
        // Update the UI
        if (props.onTagsChange) {
            props.onTagsChange(new_tags_array);
        }
    })

    return Promise.resolve();
}

export default function FileInfoCard(props: FileInfoCardProps) {
    const { currentAudioTime } = props;
    const [playbackPath, setPlaybackPath] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!props.file_path || !props.interview_name) return;

        const fileName = props.file_path.split('/').pop() || '';
        const parentFolder = props.file_path.split('/').slice(-2, -1)[0] || '';

        fetch(`/api/v1/interview-files/decrypted?interview_name=${props.interview_name}&parent_folder=${parentFolder}&file_name=${encodeURIComponent(fileName)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && data.decrypted_path) {
                    setPlaybackPath(data.decrypted_path);
                } else {
                    setPlaybackPath(props.file_path);
                }
            })
            .catch(() => {
                setPlaybackPath(props.file_path);
            });
    }, [props.file_path, props.interview_name]);

    React.useEffect(() => {
        if (currentAudioTime) {
            // Get player element
            const player = document.getElementById('player') as HTMLAudioElement | HTMLVideoElement;
            if (player) {
                const currentTime = player.currentTime;
                if (Math.abs(currentTime - currentAudioTime) > 2) {
                    player.currentTime = currentAudioTime;
                }
            }
        }
    }
    , [currentAudioTime]);

    // file_path = '/mnt/ProNET/Lochness/PHOENIX/PROTECTED/PronetXX/raw/XXXXXXX/interviews/open/YYYY-MM-DD 12.00.00 RENAME BL NLP/Audio Record/audio.m4a'
    // const file_path_pretty: string | null = props.file_path ? 'PHOENIX' + (props.file_path.split('PHOENIX')[1] || props.file_path) : null;
    let render_element: string = 'video';

    const items: DescriptionsProps['items'] = [
        {
            key: '1',
            label: 'File Name',
            children: <Paragraph copyable={{ text: props.file_path }}>{props.file_name ?? 'null'}</Paragraph>,
        },
        {
            key: '2',
            label: 'File Size',
            children: `${props.file_size_mb?.toFixed(2) ?? 'null'} MB`,
        },
        {
            key: '3',
            label: 'Modified Time',
            children: props.m_time ? `${props.m_time.toLocaleString()} (${formatDistanceToNow(props.m_time)} ago)` : 'null',
        },
        {
            key: '4',
            label: 'MD5',
            children: props.md5 ?? 'Not Computed',
        },
        {
            key: '5',
            label: 'Tags',
            children: props.tags ? props.tags.join(', ') : 'null',
        },
        {
            key: '6',
            label: 'Ignored',
            children: props.ignored ? 'Yes' : 'No',
        },
    ];

    if (props.tags && props.tags.length > 0) {
        // Push Chips to Stack
        const stack: React.ReactNode[] = [];
        let isDiarized = false;
        for (let i = 0; i < props.tags.length; i++) {
            let icon: React.ReactNode = <QuestionMark />;
            let color: "error" | "default" | "primary" | "secondary" | "info" | "success" | "warning" = 'default';
            if (props.tags[i].toLowerCase().includes('video')) {
                icon = <VideoFile />;
                color = 'secondary';
            } else if (props.tags[i].toLowerCase().includes('audio')) {
                icon = <AudioFile />;
                color = 'primary';
                render_element = 'audio';
            } else if (props.tags[i].toLowerCase().includes('diarized')) {
                icon = <People />;
                color = 'info';
                isDiarized = true;
            } else if (props.tags[i].toLowerCase().includes('interviewer')) {
                icon = <InterpreterMode />;
                color = 'warning';
            } else if (props.tags[i].toLowerCase().includes('participant')) {
                icon = <Person />;
                color = 'success';
            } else if (props.tags[i].toLowerCase().includes('combined')) {
                icon = <GraphicEq />;
            } else {
                color = 'error';
            }
            stack.push(
                <Chip
                    key={i}
                    icon={icon}
                    color={color}
                    label={props.tags[i]}
                    variant="filled"
                />
            );
        }

        const subStack = <Stack direction="row" spacing={1}>{stack}</Stack>;

        const roleButtonGroup = 
                <ButtonGroup variant="text" aria-label="role-change" size='small'>
                    <Tooltip title="Mark as Interviewer">
                        <IconButton aria-label="interviewer" key="interviewer" onClick={() => {
                            const promise = setRole(props, 'interviewer');
                            toast.promise(promise, {
                                loading: 'Marking as Interviewer...',
                                success: 'Marked as Interviewer',
                                error: 'Failed to mark as Interviewer',
                            });
                        }
                        }>
                            <InterpreterMode color="warning" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Mark as Subject">
                        <IconButton aria-label="subject" key="subject" onClick={() => {
                            const promise = setRole(props, 'participant');
                            toast.promise(promise, {
                                loading: 'Marking as Subject...',
                                success: 'Marked as Subject',
                                error: 'Failed to mark as Subject',
                            });
                        }
                        }>
                            <Person color="success" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear Roles">
                        <IconButton aria-label="delete" key="delete" onClick={() => {
                            const promise = removeRoles(props);
                            toast.promise(promise, {
                                loading: 'Removing roles...',
                                success: 'Roles removed',
                                error: 'Failed to remove roles',
                            });
                        }
                        }>
                            <DeleteIcon color="error" />
                        </IconButton>
                    </Tooltip>
                </ButtonGroup>

        const tagsComponent = (
            <div className="flex flex-row">
                <div className="flex-1">
                    {subStack}
                </div>
                <div className="flex-none">
                    {isDiarized && roleButtonGroup}
                </div>
            </div>
        );

        // Replace the children of the 'Tags' item with the Stack of Chips
        items[4].children = tagsComponent;
    }


    return (
        <div>

            <div className="flex justify-center my-4">
                {props.file_path && playbackPath && (
                    render_element === 'audio' ? (
                        <audio
                            id="player"
                            src={playbackPath ? `/api/v1/interview-files/stream?file_path=${encodeURIComponent(playbackPath)}` : ''}
                            controls
                            style={{ width: '100%' }}
                            onError={() => {
                                toast.error("Failed to load audio file. The file may be missing or the media server is not running.");
                            }}
                            onTimeUpdate={(e) => {
                                if (props.setCurrentAudioTime) {
                                    const audio = e.target as HTMLAudioElement;
                                    props.setCurrentAudioTime(audio.currentTime);
                                }
                            }}
                        />
                    ) : (
                        <video
                            id="player"
                            src={playbackPath ? `/api/v1/interview-files/stream?file_path=${encodeURIComponent(playbackPath)}` : ''}
                            controls
                            onError={() => {
                                toast.error("Failed to load video file. The file may be missing or the media server is not running.");
                            }}
                            onTimeUpdate={(e) => {
                                if (props.setCurrentAudioTime) {
                                    const video = e.target as HTMLVideoElement;
                                    props.setCurrentAudioTime(video.currentTime);
                                }
                            }}
                        />
                    )
                )}
            </div>

            <Descriptions
                bordered
                column={{ xs: 1, sm: 1, md: 1, lg: 2, xl: 2, xxl: 2 }}
                size='small'
                items={items}
            />
        </div>
    );
}