import React, { useState } from 'react';
import md5 from 'blueimp-md5';

interface MemberAvatarProps {
    email: string;
    fullName: string;
    avatarUrl?: string; // Original URL from DB (e.g., Google or uploaded)
    className?: string;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({ email, fullName, avatarUrl, className }) => {
    // Priority: DB Avatar -> Gravatar -> Local Initials (Fallback)
    // We start by trying to show the image if an URL exists (DB) or assume Gravatar.
    // If any image fails to load, we fall back to the next level.

    const [isImageError, setIsImageError] = useState(false);
    const [imgSrc, setImgSrc] = useState<string | null>(
        avatarUrl || (email ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=404` : null)
    );

    React.useEffect(() => {
        setIsImageError(false);
        setImgSrc(avatarUrl || (email ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=404` : null));
    }, [avatarUrl, email]);

    const handleError = () => {


        // Use a flag or check logic to verify what failed
        if (imgSrc === avatarUrl && avatarUrl) {
            // DB Avatar failed, try Gravatar
            const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email?.trim().toLowerCase() || '')}?d=404`;
            setImgSrc(gravatarUrl);
        } else {
            // Gravatar (or other) failed, show Local Initials
            setIsImageError(true);
        }
    };

    // Render Local Initials Fallback
    if (isImageError || !imgSrc) {
        const initials = fullName
            ? fullName.charAt(0).toUpperCase()
            : email?.charAt(0).toUpperCase() || '?';

        // Extract dimensions from className or default to w-10 h-10 size if parsing implies
        // But simpler to just apply the same className and bg-color
        // We'll use the orange theme that was requested
        return (
            <div className={`${className} bg-gradient-to-br from-orange-400 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-sm`}>
                {initials}
            </div>
        );
    }

    return (
        <img
            className={className}
            src={imgSrc}
            alt={fullName}
            onError={handleError}
            referrerPolicy="no-referrer"
        />
    );
};

export default MemberAvatar;
