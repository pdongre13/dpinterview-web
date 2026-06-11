import { Interviews } from "@/lib/models/Interviews";
import { FfprobeMetadata } from "@/lib/models/FfProbeMetadata";
import { VideoQuickQc } from "@/lib/models/VideoQuickQc";
import { VideoStream } from "@/lib/models/VideoStreams";
import { OpenFace } from "@/lib/models/OpenFace";
import { OpenfaceQc } from "@/lib/models/OpenfaceQc";
import { PdfReports } from "@/lib/models/PdfReports";

import { Interview, InterviewProcessingData } from "@/lib/types/interview";


function getInterviewDate(
    interview_data: Interview
): Date | undefined {
    const interviewPart = interview_data.parts[0];
    const interviewDate = interviewPart.interview_datetime;

    if (interviewDate) {
        return new Date(interviewDate);
    }
    return undefined;
}

function getInterviewDataReceivedDate(
    interview_data: Interview
): Date | undefined {
    let earliestDate: Date | undefined = undefined;

    for (const part of interview_data.parts) {
        for (const file of part.interview_files) {
            const fileDate = file.interview_file.m_time
            if (fileDate) {
                const date = new Date(fileDate);
                if (!earliestDate || date < earliestDate) {
                    earliestDate = date;
                }
            }
        }
    }

    return earliestDate;
}



export async function GET(
    _: Request,
    props: { params: Promise<{ interview_name: string }> }
): Promise<Response> {
    const params = await props.params;
    const interview_name = params.interview_name;
    if (!interview_name) {
        return new Response(JSON.stringify({ error: 'Missing name parameter' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const interviews = await Interviews.get(interview_name);

    if (!interviews) {
        return new Response(JSON.stringify({ error: 'Interview not found' }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    const interviewDate = getInterviewDate(interviews);
    const dataReceivedDate = getInterviewDataReceivedDate(interviews);

    const interviewHasDuplicates = await Interviews.hasDuplicate(interview_name);
    const interviewHasPrimary = await Interviews.hasPrimary(interview_name);

    const ffprobeMetadataExtractionData = await FfprobeMetadata.getFfprobeMetadataExtractionDate(interview_name);
    const VideoQuickQcData = await VideoQuickQc.get(interview_name);
    const videoQuickQcHasBlackBars = VideoQuickQcData ? VideoQuickQcData.has_black_bars : null;
    const videoQuickQcTimestamp = VideoQuickQcData ? VideoQuickQcData.vqqc_timestamp : null;

    const videoStreamCount = await VideoStream.getCount(interview_name);
    let vidoeStreamsTimestamp: Date | undefined = undefined;
    if (videoStreamCount > 0) {
        const videoStreams = await VideoStream.get(interview_name);
        if (videoStreams && videoStreams.length > 0 && videoStreams[0].vs_timestamp) {
            vidoeStreamsTimestamp = new Date(videoStreams[0].vs_timestamp);
        }
    }

    const openFaceCount = await OpenFace.getCount(interview_name);
    let openFaceTimestamp: Date | undefined = undefined;
    if (openFaceCount > 0) {
        const openFaces = await OpenFace.get(interview_name);
        openFaceTimestamp = new Date(openFaces[0].of_timestamp);
    }

    const OpenfaceQcData = await OpenfaceQc.get(interview_name);

    const pdfReportData = await PdfReports.get(interview_name);

    const result: InterviewProcessingData = {
        interview_name: interview_name,
        interview_date: interviewDate,
        data_received_date: dataReceivedDate,
        has_duplicates: interviewHasDuplicates,
        has_primary: interviewHasPrimary,
        ffprobe_metadata_extraction_date: ffprobeMetadataExtractionData,
        video_quick_qc: VideoQuickQcData ? {
            has_black_bars: videoQuickQcHasBlackBars,
            timestamp: videoQuickQcTimestamp,
        } : null,
        video_streams: videoStreamCount > 0 && vidoeStreamsTimestamp ? {
            count: videoStreamCount,
            timestamp: vidoeStreamsTimestamp,
        } : null,
        openface: openFaceCount > 0 && openFaceTimestamp ? {
            count: openFaceCount,
            timestamp: openFaceTimestamp,
        } : null,
        openface_qc: OpenfaceQcData ? {
            successful_frames_count: OpenfaceQcData.successful_frames_count,
            successful_frames_percentage: OpenfaceQcData.successful_frames_percentage,
            successful_frames_confidence_mean: OpenfaceQcData.successful_frames_confidence_mean,
            successful_frames_confidence_std: OpenfaceQcData.successful_frames_confidence_std,
            successful_frames_confidence_median: OpenfaceQcData.successful_frames_confidence_median,
            passed: OpenfaceQcData.passed,
            timestamp: OpenfaceQcData.ofqc_timestamp,
        } : null,
        pdf_report: pdfReportData ? {
            pdf_report_path: pdfReportData.pr_path,
            timestamp: pdfReportData.pr_timestamp,
        } : null,
    };


    return new Response(JSON.stringify(result), {
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
