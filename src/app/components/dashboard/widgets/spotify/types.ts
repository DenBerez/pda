import React from 'react';
import { Theme } from '@mui/material';
import { Widget } from '../../types';

export interface SpotifyTrack {
    name: string;
    album: {
        name: string;
        images: { url: string }[];
    };
    artists: SpotifyArtist[];
    duration_ms: number;
    preview_url?: string;
    uri: string;
}

export interface SpotifyArtist {
    name: string;
}

export interface SpotifyViewProps {
    currentTrack: SpotifyTrack | null;
    isPlaying: boolean;
    position: number;
    duration: number;
    volume: number;
    recentTracks: SpotifyTrack[];
    showRecent: boolean;
    isPlayerConnected: boolean;
    isTransferringPlayback: boolean;
    handleTransferPlayback: () => void;
    togglePlay: () => void;
    previousTrack: () => void;
    nextTrack: () => void;
    handleSeekChange: (event: Event, newValue: number | number[]) => void;
    onVolumeChange: (volume: number) => void;
    onMute: () => void;
    getVolumeIcon: () => React.ReactElement;
    playPreview: (url: string) => void;
    openInSpotify: (uri: string) => void;
    formatDuration: (ms: number) => string;
    toggleView: () => void;
    theme: Theme;
    showTransferButton: boolean;
}

export interface SpotifyWidgetProps {
    widget: Widget;
    editMode: boolean;
    onUpdateWidget?: (widget: Widget) => void;
}