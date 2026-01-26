import React, { useState } from 'react';
import md5 from 'blueimp-md5';

interface MemberAvatarProps {
    email: string;
    fullName: string;
    avatarUrl?: string; // Original URL from DB (e.g., Google or uploaded)
    className?: string;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({ email, fullName, avatarUrl, className }) => {
    const [imgSrc, setImgSrc] = useState<string>(
        avatarUrl || `https://www.gravatar.com/avatar/${md5(email?.trim().toLowerCase() || '')}?d=404`
    );

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        const target = e.currentTarget;
        // If current src is DB avatar, try Gravatar
        if (avatarUrl && target.src === avatarUrl) {
            setImgSrc(`https://www.gravatar.com/avatar/${md5(email?.trim().toLowerCase() || '')}?d=404`);
        }
        // If current src is Gravatar (which returns 404 due to d=404), try UI Avatars
        else if (target.src.includes('gravatar.com')) {
            setImgSrc(`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`);
        }
    };

    return (
        <img
            className={className}
            src={imgSrc}
            alt={fullName}
            onError={handleError}
        />
    );
};

export default MemberAvatar;
