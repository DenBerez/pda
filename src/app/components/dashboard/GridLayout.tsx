import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Box, useTheme } from '@mui/material';
import { Widget } from './types';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface GridLayoutProps {
    widgets: Widget[];
    editMode: boolean;
    isMobile: boolean;
    onLayoutChange: (currentLayout: any, allLayouts: any) => void;
    children: React.ReactNode;
}

const GridLayout: React.FC<GridLayoutProps> = ({
    widgets,
    editMode,
    isMobile,
    onLayoutChange,
    children
}) => {
    const theme = useTheme();

    return (
        <Box sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderRadius: 2,
            p: 1,
            mb: 2
        }}>
            <ResponsiveGridLayout
                className="layout"
                layouts={{
                    lg: widgets.map(widget => ({
                        i: widget.id,
                        x: widget.x,
                        y: widget.y,
                        w: widget.w,
                        h: widget.h,
                        minW: widget.minW || 2,
                        minH: widget.minH || 2,
                    })),
                }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={100}
                onLayoutChange={onLayoutChange}
                isDraggable={editMode && !isMobile}
                isResizable={editMode && !isMobile}
                compactType="vertical"
                margin={[16, 16]}
                containerPadding={[16, 16]}
                useDragHandle={true}
                draggableHandle=".widget-drag-handle"
            >
                {children}
            </ResponsiveGridLayout>
        </Box>
    );
};

export default GridLayout; 