import { DbFile } from '@/lib/types/file';

export type DbInterview = {
    interview_name: string;
    interview_type: string;
    subject_id: string;
    study_id: string;
};

export type DbInterviewEnhanced = {
    interview_name: string;
    interview_type: string;
    subject_id: string;
    study_id: string;
    interview_ra_md: string;
    interview_day: number;
    interview_datetime: Date;
};

export type Interview = {
    interview_name: string;
    interview_type: string;
    subject_id: string;
    study_id: string;
    parts: InterviewPart[];
    transcript_files: InterviewTranscriptFile[];
};

export type DbInterviewPart = {
    interview_path: string;
    interview_name: string;
    interview_day: number;
    interview_part: number;
    interview_datetime: Date;
    is_primary: boolean;
    is_duplicate: boolean;
};

export type InterviewPart = {
    interview_path: string;
    interview_name: string;
    interview_day: number;
    interview_part: number;
    interview_datetime: Date;
    is_primary: boolean;
    is_duplicate: boolean;
    interview_files: InterviewFile[];
};

export type DbTranscriptFiles = {
    transcript_file: string;
    identifier_name: string;
    identifier_type: string;
    transcript_file_tags: string;
}

export type InterviewTranscriptFile = {
    interview_name: string;
    transcript_file: DbFile;
    transcript_file_tags: string[];
}

export type DbInterviewFile = {
    interview_path: string;
    interview_file: string;
    interview_file_tags: string;
    ignored: boolean;
};

export type InterviewFile = {
    interview_file: DbFile;
    interview_file_tags: string[];
    ignored: boolean;
};

export type InterviewProcessingData = {
    interview_name: string;
    interview_date: Date | undefined;
    data_received_date: Date | undefined;
    has_duplicates: boolean;
    has_primary: boolean;
    ffprobe_metadata_extraction_date: Date | null;
    video_quick_qc: {
        has_black_bars: boolean | null;
        timestamp: Date | null;
    } | null;
    video_streams: {
        count: number;
        timestamp: Date;
    } | null;
    openface: {
        count: number;
        timestamp: Date;
    } | null;
    openface_qc: {
        successful_frames_count: number;
        successful_frames_percentage: number;
        successful_frames_confidence_mean: number | null;
        successful_frames_confidence_std: number | null;
        successful_frames_confidence_median: number | null;
        passed: boolean;
        timestamp: Date;
    } | null;
    pdf_report: {
        pdf_report_path: string;
        timestamp: Date;
    } | null;
};