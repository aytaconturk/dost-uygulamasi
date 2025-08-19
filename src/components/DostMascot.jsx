import React from 'react';
export default function DostMascot({ mode }) {
    const imageSrc = mode === 'talking' ? '/dost/talking.gif' : '/dost/idle.png';
    return (<div className="absolute bottom-4 right-4 w-28 h-28">
        <img src={imageSrc} alt="DOST maskotu" className="w-full h-full object-contain"/>
      </div>);
}
