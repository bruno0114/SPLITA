import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
    // Always mount to body to escape any stacking context
    return createPortal(children, document.body);
};

export default Portal;
