// src/app/hooks/useOAuth2Connection.ts
import { useState, useEffect } from 'react';
import { Widget } from '../components/dashboard/types';

interface OAuth2Config {
    refreshToken?: string;
    provider?: string;
}

interface UseOAuth2ConnectionProps {
    widget: Widget;
    messageType: string;
    authEndpoint: string;
    onUpdateWidget?: (updatedWidget: Widget) => void;
}

export const useOAuth2Connection = ({
    widget,
    messageType,
    authEndpoint,
    onUpdateWidget
}: UseOAuth2ConnectionProps) => {
    const [refreshToken, setRefreshToken] = useState(widget.config?.refreshToken || '');

    const connect = () => {
        // Calculate center position for the popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        // Include widget ID and credentials in the URL
        const url = new URL(authEndpoint, window.location.origin);
        url.searchParams.append('widgetId', widget.id);

        window.open(
            url.toString(),
            `oauth-${widget.id}`,
            `width=${width},height=${height},left=${left},top=${top}`
        );
    };

    const disconnect = () => {
        setRefreshToken('');
        if (onUpdateWidget) {
            onUpdateWidget({
                ...widget,
                config: {
                    ...widget.config,
                    refreshToken: ''
                }
            });
        }
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Check if the message is for this specific widget type
            if (event.data?.type === messageType) {
                const widgetId = event.data.widgetId;

                // Only process if this message is for this specific widget instance
                if (widgetId === widget.id) {
                    setRefreshToken(event.data.refreshToken);
                    if (onUpdateWidget) {
                        onUpdateWidget({
                            ...widget,
                            config: {
                                ...widget.config,
                                refreshToken: event.data.refreshToken
                            }
                        });
                    }
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [widget, messageType, onUpdateWidget]);

    return {
        refreshToken,
        isConnected: !!refreshToken,
        connect,
        disconnect
    };
};
