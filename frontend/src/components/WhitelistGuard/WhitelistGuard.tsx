import React, { useState, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { EnterLoading } from '../EnterLoading/EnterLoading';
import { BetaPage } from '../../pages/BetaPage';
import { useWhitelistCheck } from '../../api/user';

interface WhitelistGuardProps {
  children: ReactNode;
}

export const WhitelistGuard: React.FC<WhitelistGuardProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const { data: whitelistData, isLoading: isWhitelistLoading } = useWhitelistCheck();

  const handleAnimationComplete = () => {
    setLoading(false);
  };

  const isAllowed = whitelistData?.allowed ?? false;
  
  const showBetaPage = !loading && !isWhitelistLoading && !isAllowed;

  return (
    <AnimatePresence mode="wait">
      {loading || isWhitelistLoading ? (
        <EnterLoading key="loader" onComplete={handleAnimationComplete} />
      ) : showBetaPage ? (
        <BetaPage key="beta" />
      ) : (
        <React.Fragment key="content">
          {children}
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
