import * as React from "react";

export type SelectionCoord = {
    rowIdx: number;
    colIdx: number;
};

export type SelectionRange = {
    start: SelectionCoord;
    end: SelectionCoord;
};

export function useTableSelection(maxRows: number, maxCols: number) {
    const [anchor, setAnchor] = React.useState<SelectionCoord | null>(null);
    const [current, setCurrent] = React.useState<SelectionCoord | null>(null);
    const [isSelecting, setIsSelecting] = React.useState(false);
    const [isFilling, setIsFilling] = React.useState(false);
    const [fillEnd, setFillEnd] = React.useState<SelectionCoord | null>(null);

    const onMouseDown = (rowIdx: number, colIdx: number) => {
        setAnchor({ rowIdx, colIdx });
        setCurrent({ rowIdx, colIdx });
        setIsSelecting(true);
    };

    const onMouseEnter = (rowIdx: number, colIdx: number) => {
        if (isSelecting) {
            setCurrent({ rowIdx, colIdx });
        }
    };

    const onMouseUp = () => {
        setIsSelecting(false);
        setIsFilling(false);
    };

    const onFillHandleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsFilling(true);
        setFillEnd(null);
    };

    const onFillHandleMouseEnter = (rowIdx: number, colIdx: number) => {
        if (isFilling && range) {
            // Only allow filling downwards
            if (rowIdx > range.end.rowIdx) {
                setFillEnd({ rowIdx, colIdx: range.end.colIdx });
            }
        }
    };

    React.useEffect(() => {
        const handleMouseUp = () => {
            setIsSelecting(false);
            setIsFilling(false);
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (isFilling) {
                e.preventDefault();
            }
        };
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousemove", handleMouseMove, { passive: false });
        return () => {
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [isFilling]);

    // Handle keyboard shortcuts for extending selection (Ctrl+Shift+Arrow)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!current || !anchor) return;

            // Ctrl+Shift+Arrow extends selection to the end in that direction
            if (e.ctrlKey && e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();

                let newCurrent = { ...current };

                switch (e.key) {
                    case 'ArrowUp':
                        newCurrent.rowIdx = 0; // Go to first row
                        break;
                    case 'ArrowDown':
                        newCurrent.rowIdx = maxRows - 1; // Go to last row
                        break;
                    case 'ArrowLeft':
                        newCurrent.colIdx = 0; // Go to first column
                        break;
                    case 'ArrowRight':
                        newCurrent.colIdx = maxCols - 1; // Go to last column
                        break;
                }

                setCurrent(newCurrent);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [anchor, current, maxRows, maxCols]);

    const range: SelectionRange | null = anchor && current ? {
        start: {
            rowIdx: Math.min(anchor.rowIdx, current.rowIdx),
            colIdx: Math.min(anchor.colIdx, current.colIdx),
        },
        end: {
            rowIdx: Math.max(anchor.rowIdx, current.rowIdx),
            colIdx: Math.max(anchor.colIdx, current.colIdx),
        }
    } : null;

    const isSelected = (rowIdx: number, colIdx: number) => {
        if (!range) return false;
        return (
            rowIdx >= range.start.rowIdx &&
            rowIdx <= range.end.rowIdx &&
            colIdx >= range.start.colIdx &&
            colIdx <= range.end.colIdx
        );
    };

    const getFillRange = () => {
        if (!range || !fillEnd) return null;
        return {
            sourceStart: range.start,
            sourceEnd: range.end,
            targetEnd: fillEnd
        };
    };

    return {
        range,
        onMouseDown,
        onMouseEnter,
        onMouseUp,
        isSelected,
        isFilling,
        fillEnd,
        onFillHandleMouseDown,
        onFillHandleMouseEnter,
        getFillRange,
        clearFillEnd: () => setFillEnd(null),
        clearSelection: () => {
            setAnchor(null);
            setCurrent(null);
            setFillEnd(null);
        }
    };
}
