import { useEffect, useRef, useState, useCallback } from "react";
import { SpotifyTrack } from '@/app/components/dashboard/widgets/spotify/types';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

declare namespace Spotify {
  interface Player {
    _options: {
      getOAuthToken: (callback: (token: string) => void) => void;
      name: string;
    };
    connect: () => Promise<boolean>;
    disconnect: () => void;
    addListener: (event: string, callback: (...args: any[]) => void) => boolean;
    removeListener: (event: string, callback?: (...args: any[]) => void) => boolean;
    getCurrentState: () => Promise<any>;
    setName: (name: string) => Promise<void>;
    getVolume: () => Promise<number>;
    setVolume: (volume: number) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    togglePlay: () => Promise<void>;
    seek: (position_ms: number) => Promise<void>;
    previousTrack: () => Promise<void>;
    nextTrack: () => Promise<void>;
  }
}

interface SpotifyPlayerState {
  isPaused: boolean;
  track: SpotifyTrack | null;
  position: number;
  duration: number;
}

interface ReadyEvent {
  device_id: string;
}

interface PlayerState {
  track_window: {
    current_track: {
      name: string;
      artists: Array<{ name: string }>;
      album: {
        name: string;
        images: Array<{ url: string }>;
      };
      uri: string;
      preview_url?: string;
      duration_ms: number;
    };
  };
  paused: boolean;
  position: number;
  duration: number;
}

interface ErrorEvent {
  message: string;
}

export function useSpotifyPlayer(refreshToken?: string) {
  const playerRef = useRef<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [state, setState] = useState<SpotifyPlayerState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlayerConnected, setIsPlayerConnected] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [volume, setVolume] = useState(50);
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get access token from localStorage or refresh if needed
  const getAccessToken = async (): Promise<string | null> => {
    if (refreshToken) {
      try {
        const res = await fetch("/api/spotify/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) return null;
        const json = await res.json();
        return json.access_token;
      } catch (err) {
        console.error("Failed to get access token:", err);
        return null;
      }
    } else {
      const accessToken = localStorage.getItem("access_token");
      const storedRefreshToken = localStorage.getItem("refresh_token");
      const expiresAt = Number(localStorage.getItem("expires_at"));

      if (!accessToken || !storedRefreshToken) return null;

      const now = Math.floor(Date.now() / 1000);
      if (now >= expiresAt - 60) {
        const res = await fetch("/api/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: storedRefreshToken }),
        });

        if (!res.ok) return null;
        const json = await res.json();

        localStorage.setItem("access_token", json.access_token);
        localStorage.setItem("expires_at", String(now + json.expires_in));
        return json.access_token;
      }

      return accessToken;
    }
  };

  // Fetch recent tracks
  const fetchRecentTracks = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch("/api/spotify/recent-tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recent tracks");
      }

      const data = await response.json();
      setRecentTracks(data.items.map((item: any) => ({
        name: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(", "),
        albumArt: item.track.album.images[0]?.url,
        uri: item.track.uri,
        preview_url: item.track.preview_url,
        album: item.track.album,
        artists: item.track.artists,
        duration_ms: item.track.duration_ms
      })));
    } catch (err) {
      console.error("Error fetching recent tracks:", err);
      setError("Failed to fetch recent tracks");
    }
  }, [refreshToken]);

  // Load SDK
  useEffect(() => {
    if (!refreshToken) return;

    if (!window.Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    window.onSpotifyWebPlaybackSDKReady = async () => {
      const token = await getAccessToken();
      if (!token) return;

      const player = new window.Spotify.Player({
        name: "My Dashboard Player",
        getOAuthToken: async (cb: (token: string | null) => void) => cb(await getAccessToken()),
        volume: volume / 100,
      });

      playerRef.current = player;

      player.addListener("ready", ({ device_id }: ReadyEvent) => {
        console.log("Spotify Web Playback SDK Ready");
        setDeviceId(device_id);
        setIsReady(true);
        fetchRecentTracks();
      });

      player.addListener("player_state_changed", (playerState: PlayerState) => {
        if (!playerState) return;
        const track = playerState.track_window.current_track;
        setState({
          isPaused: playerState.paused,
          track: {
            name: track.name,
            artists: track.artists,
            album: track.album,
            uri: track.uri,
            preview_url: track.preview_url,
            duration_ms: track.duration_ms
          },
          position: playerState.position,
          duration: playerState.duration,
        });
        setIsPlayerConnected(true);
      });

      player.addListener("not_ready", ({ device_id }: ReadyEvent) => {
        console.log("Device ID has gone offline", device_id);
        setIsPlayerConnected(false);
      });

      player.addListener("initialization_error", (e: ErrorEvent) => {
        console.error(e.message);
        setError("Failed to initialize Spotify player");
      });
      player.addListener("authentication_error", (e: ErrorEvent) => {
        console.error(e.message);
        setError("Authentication error with Spotify");
      });
      player.addListener("account_error", (e: ErrorEvent) => {
        console.error(e.message);
        setError("Account error with Spotify");
      });
      player.addListener("playback_error", (e: ErrorEvent) => {
        console.error(e.message);
        setError("Playback error with Spotify");
      });

      player.connect().then((success: boolean) => {
        if (success) {
          console.log("Spotify player connected successfully");
        }
      });
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [refreshToken, volume, fetchRecentTracks]);

  // Transfer playback to this device
  const transferPlayback = useCallback(async () => {
    if (!deviceId) return;

    try {
      setIsTransferring(true);
      const token = await getAccessToken();
      if (!token) throw new Error("No access token available");

      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      });

      setIsPlayerConnected(true);
    } catch (err) {
      console.error("Failed to transfer playback:", err);
      setError("Failed to transfer playback");
    } finally {
      setIsTransferring(false);
    }
  }, [deviceId]);

  // Control handlers
  const play = useCallback(() => {
    playerRef.current?.resume();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (state?.isPaused) {
      play();
    } else {
      pause();
    }
  }, [state?.isPaused, play, pause]);

  const next = useCallback(() => {
    playerRef.current?.nextTrack();
  }, []);

  const previous = useCallback(() => {
    playerRef.current?.previousTrack();
  }, []);

  const seek = useCallback((ms: number) => {
    playerRef.current?.seek(ms);
  }, []);

  const handleSeekChange = useCallback((event: Event, newValue: number | number[]) => {
    const newPosition = Array.isArray(newValue) ? newValue[0] : newValue;
    seek(newPosition);
  }, [seek]);

  const setPlayerVolume = useCallback((newVolume: number) => {
    playerRef.current?.setVolume(newVolume);
  }, []);

  const handleVolumeChange = useCallback((event: Event, newValue: number | number[]) => {
    const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
    setVolume(newVolume);
    setPlayerVolume(newVolume / 100);
  }, [setPlayerVolume]);

  const toggleMute = useCallback(() => {
    if (volume === 0) {
      setVolume(50);
      setPlayerVolume(0.5);
    } else {
      setVolume(0);
      setPlayerVolume(0);
    }
  }, [volume, setPlayerVolume]);

  // Format duration helper
  const formatDuration = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Play preview
  const playPreview = useCallback((url: string) => {
    const audio = new Audio(url);
    audio.play();
  }, []);

  // Open in Spotify
  const openInSpotify = useCallback((uri: string) => {
    window.open(uri, '_blank');
  }, []);

  return {
    isReady,
    isPlayerConnected,
    isTransferring,
    state,
    volume,
    recentTracks,
    error,
    controls: {
      play,
      pause,
      togglePlay,
      next,
      previous,
      seek,
      handleSeekChange,
      handleVolumeChange,
      toggleMute,
      transferPlayback,
      playPreview,
      openInSpotify
    },
    utils: {
      formatDuration,
      getVolumeIcon: () => {
        // This will be implemented in the component
        return null;
      }
    }
  };
}
