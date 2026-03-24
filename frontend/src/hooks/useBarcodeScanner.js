import { useEffect, useRef } from 'react';

const useBarcodeScanner = (onScan) => {
    const barcodeBuffer = useRef('');
    const lastKeyTime = useRef(Date.now());

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only ignore if the user is explicitly focused on an input field 
            // EXCEPT for when we WANT the scanner to type into it (we handle that gracefully)
            
            const currentTime = Date.now();
            
            // Barcode scanners emulate a keyboard, but type extremely fast.
            // If the time between keystrokes is more than 50ms, it's likely a human typing.
            // So we clear the buffer to start fresh.
            if (currentTime - lastKeyTime.current > 50) {
                barcodeBuffer.current = '';
            }
            
            lastKeyTime.current = currentTime;

            // When the scanner finishes, it always ends with 'Enter'
            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 3) {
                    e.preventDefault(); // Stop form submissions if any
                    onScan(barcodeBuffer.current);
                }
                barcodeBuffer.current = '';
            } else if (e.key.length === 1) { 
                // Only collect alphanumeric characters
                barcodeBuffer.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onScan]);
};

export default useBarcodeScanner;
