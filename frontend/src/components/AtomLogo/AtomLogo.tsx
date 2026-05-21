import React from 'react';

export interface AtomLogoProps {
  size?: number | string;
  color?: string;
}

export const AtomLogo: React.FC<AtomLogoProps> = ({
  size = 24,
  color = 'currentColor',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 250 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M169.409 167.053C169.409 167.053 175.911 189.526 171.07 203.931C160.236 236.167 99.7539 125.423 95.8704 126.682C88.0981 129.2 62.4202 203.822 72.9758 208.027C87.034 213.628 111.081 186.027 111.081 186.027M136.842 64.6012C136.842 64.6012 153.053 47.7332 167.949 44.7234C201.282 37.9878 135.617 145.739 138.648 148.473C144.716 153.945 222.179 138.872 220.543 127.628C218.364 112.652 182.438 105.628 182.438 105.628M64.887 144.76C64.887 144.76 42.1735 139.155 32.1191 127.76C9.6191 102.26 135.767 105.252 136.619 101.26C138.324 93.2696 86.539 33.7212 77.6191 40.7599C65.7395 50.1341 77.6191 84.7599 77.6191 84.7599"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
};
