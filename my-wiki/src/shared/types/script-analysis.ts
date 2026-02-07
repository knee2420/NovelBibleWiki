
export type SegmentType = 'dialogue' | 'action' | 'description';

export interface NovelSegment {
    text: string;
    type: SegmentType;
    actor: string;
}

export interface ScriptAnalysisResult {
    characters: string[];
    segments: NovelSegment[];
}
