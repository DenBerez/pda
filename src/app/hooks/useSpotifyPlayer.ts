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
  const [lastVolume, setLastVolume] = useState(50);

  // Get access token from localStorage or refresh if needed
  const getAccessToken = async (): Promise<string | null> => {
    console.log('🔑 Getting access token...');
    if (refreshToken) {
      try {
        console.log('🔄 Using refresh token to get access token');
        const res = await fetch("/api/spotify/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          console.error('❌ Failed to get token from API', { status: res.status });
          return null;
        }
        const json = await res.json();
        console.log('✅ Successfully retrieved access token');
        return json.access_token;
      } catch (err) {
        console.error("❌ Failed to get access token:", err);
        return null;
      }
    } else {
      console.log('🔍 Checking localStorage for tokens');
      const accessToken = localStorage.getItem("access_token");
      const storedRefreshToken = localStorage.getItem("refresh_token");
      const expiresAt = Number(localStorage.getItem("expires_at"));

      if (!accessToken || !storedRefreshToken) {
        console.log('❌ No tokens found in localStorage');
        return null;
      }

      const now = Math.floor(Date.now() / 1000);
      if (now >= expiresAt - 60) {
        console.log('🔄 Token expired, refreshing...');
        const res = await fetch("/api/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: storedRefreshToken }),
        });

        if (!res.ok) {
          console.error('❌ Failed to refresh token', { status: res.status });
          return null;
        }
        const json = await res.json();

        localStorage.setItem("access_token", json.access_token);
        localStorage.setItem("expires_at", String(now + json.expires_in));
        console.log('✅ Token refreshed successfully');
        return json.access_token;
      }

      console.log('✅ Using existing valid token');
      return accessToken;
    }
  };

  // Fetch recent tracks
  const fetchRecentTracks = useCallback(async () => {
    console.log('🎧 Fetching recent tracks...');
    try {
      const token = await getAccessToken();
      if (!token) {
        console.log('❌ No token available for fetching recent tracks');
        return;
      }

      const response = await fetch("/api/spotify/recent-tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch recent tracks', { status: response.status });
        throw new Error("Failed to fetch recent tracks");
      }

      const data = await response.json();
      console.log(`✅ Retrieved ${data.items.length} recent tracks`);
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
      console.error("❌ Error fetching recent tracks:", err);
      setError("Failed to fetch recent tracks");
    }
  }, [refreshToken]);

  // Load SDK
  useEffect(() => {
    console.log('🔄 SDK loading effect triggered', { hasRefreshToken: !!refreshToken });
    if (!refreshToken) {
      console.log('⚠️ No refresh token provided, skipping SDK initialization');
      return;
    }

    if (!window.Spotify) {
      console.log('📥 Loading Spotify SDK script...');
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      console.log('ℹ️ Spotify SDK already loaded');
    }

    window.onSpotifyWebPlaybackSDKReady = async () => {
      console.log('🎉 Spotify Web Playback SDK is ready');
      const token = await getAccessToken();
      if (!token) {
        console.error('❌ No token available for SDK initialization');
        return;
      }

      console.log('🔧 Creating Spotify player instance');
      const player = new window.Spotify.Player({
        name: "My Dashboard Player",
        getOAuthToken: async (cb: (token: string | null) => void) => cb(await getAccessToken()),
        volume: volume / 100,
      });

      playerRef.current = player;

      player.addListener("ready", ({ device_id }: ReadyEvent) => {
        console.log("✅ Spotify Web Playback SDK Ready", { device_id });
        setDeviceId(device_id);
        setIsReady(true);
        fetchRecentTracks();
      });

      player.addListener("player_state_changed", (playerState: PlayerState) => {
        if (playerState) {
          console.log("🔄 Player state changed", {
            playerState: playerState,
            track: playerState.track_window.current_track.name,
            isPaused: playerState.paused,
            position: playerState.position,
          });
          setState({
            track: playerState.track_window.current_track,
            isPaused: playerState.paused,
            position: playerState.position,
            duration: playerState.duration,
          });
          setIsPlayerConnected(true);
        }
      });

      player.addListener("not_ready", ({ device_id }: ReadyEvent) => {
        console.warn("⚠️ Device ID has gone offline", device_id);
        setIsPlayerConnected(false);
      });

      player.addListener("initialization_error", (e: ErrorEvent) => {
        console.error("❌ Initialization error:", e.message);
        setError("Failed to initialize Spotify player");
      });
      player.addListener("authentication_error", (e: ErrorEvent) => {
        console.error("❌ Authentication error:", e.message);
        setError("Authentication error with Spotify");
      });
      player.addListener("account_error", (e: ErrorEvent) => {
        console.error("❌ Account error:", e.message);
        setError("Account error with Spotify");
      });
      player.addListener("playback_error", (e: ErrorEvent) => {
        console.error("❌ Playback error:", e.message);
        setError("Playback error with Spotify");
      });

      console.log('🔌 Connecting to Spotify player...');
      player.connect().then((success: boolean) => {
        if (success) {
          console.log("✅ Spotify player connected successfully");
        } else {
          console.error("❌ Failed to connect Spotify player");
        }
      });
    };

    return () => {
      console.log('🧹 Cleaning up Spotify player');
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [refreshToken, volume, fetchRecentTracks]);

  // Transfer playback to this device
  const transferPlayback = useCallback(async () => {
    console.log('🔄 Attempting to transfer playback', { deviceId });
    if (!deviceId) {
      console.warn('⚠️ No device ID available for transfer');
      return;
    }

    try {
      setIsTransferring(true);
      const token = await getAccessToken();
      if (!token) throw new Error("No access token available");

      console.log('📡 Sending transfer request to Spotify API');
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

      console.log('✅ Playback transferred successfully');
      setIsPlayerConnected(true);
    } catch (err) {
      console.error("❌ Failed to transfer playback:", err);
      setError("Failed to transfer playback");
    } finally {
      setIsTransferring(false);
    }
  }, [deviceId]);

  // Control handlers
  const play = useCallback(() => {
    console.log('▶️ Play requested');
    playerRef.current?.resume();
  }, []);

  const pause = useCallback(() => {
    console.log('⏸️ Pause requested');
    playerRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    console.log('⏯️ Toggle play/pause', { currentlyPaused: state?.isPaused });
    if (state?.isPaused) {
      play();
    } else {
      pause();
    }
  }, [state?.isPaused, play, pause]);

  const next = useCallback(() => {
    console.log('⏭️ Next track requested');
    playerRef.current?.nextTrack();
  }, []);

  const previous = useCallback(() => {
    console.log('⏮️ Previous track requested');
    playerRef.current?.previousTrack();
  }, []);

  const seek = useCallback((ms: number) => {
    console.log('🔍 Seek requested', { position: ms });
    playerRef.current?.seek(ms);
  }, []);

  const handleSeekChange = useCallback((event: Event, newValue: number | number[]) => {
    const newPosition = Array.isArray(newValue) ? newValue[0] : newValue;
    console.log('🎯 Seek change', { newPosition });
    seek(newPosition);
  }, [seek]);

  const handleVolumeChange = useCallback(async (volume: number) => {
    try {
      const response = await fetch('/api/spotify/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'volume',
          volume,
          refreshToken
        }),
      });

      if (!response.ok) {
        console.error('Failed to update volume:', await response.json());
        return;
      }

      setVolume(volume);
    } catch (error) {
      console.error('Error updating volume:', error);
    }
  }, [refreshToken]);

  const toggleMute = useCallback(() => {
    handleVolumeChange(volume === 0 ? 50 : 0);
  }, [volume, handleVolumeChange]);

  // Format duration helper
  const formatDuration = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Play preview
  const playPreview = useCallback((url: string) => {
    console.log('🎵 Playing preview', { url });
    const audio = new Audio(url);
    audio.play();
  }, []);

  // Open in Spotify
  const openInSpotify = useCallback((uri: string) => {
    console.log('🔗 Opening in Spotify', { uri });
    window.open(uri, '_blank');
  }, []);

  const reconnectPlayer = useCallback(async () => {
    console.log('🔄 Attempting to reconnect Spotify player');
    if (playerRef.current) {
      try {
        const success = await playerRef.current.connect();
        if (success) {
          console.log('✅ Spotify player reconnected successfully');
          setIsPlayerConnected(true);
        } else {
          console.error('❌ Failed to reconnect Spotify player');
        }
      } catch (err) {
        console.error('❌ Error reconnecting player:', err);
      }
    }
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
      transferPlayback,
      play,
      pause,
      togglePlay,
      next,
      previous,
      seek,
      handleSeekChange,
      onVolumeChange: handleVolumeChange,
      onMute: toggleMute,
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
