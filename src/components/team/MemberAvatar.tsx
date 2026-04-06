import React, { useMemo, useState } from "react";
import md5 from "blueimp-md5";

interface MemberAvatarProps {
  email: string;
  fullName: string;
  avatarUrl?: string; // Original URL from DB (e.g., Google or uploaded)
  className?: string;
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({
  email,
  fullName,
  avatarUrl,
  className,
}) => {
  // Always render initials background first so avatar is never blank.
  const [imgSrc, setImgSrc] = useState<string | null>(
    avatarUrl ||
      (email
        ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=404`
        : null),
  );
  React.useEffect(() => {
    setImgSrc(
      avatarUrl ||
        (email
          ? `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=404`
          : null),
    );
  }, [avatarUrl, email]);

  const initials = useMemo(() => {
    const normalizedName = (fullName || "").trim();
    if (normalizedName) {
      return normalizedName.charAt(0).toUpperCase();
    }
    const normalizedEmail = (email || "").trim();
    return normalizedEmail ? normalizedEmail.charAt(0).toUpperCase() : "?";
  }, [email, fullName]);

  const handleError = () => {
    if (imgSrc === avatarUrl && avatarUrl) {
      // DB avatar failed; try Gravatar once.
      const gravatarUrl = `https://www.gravatar.com/avatar/${md5((email || "").trim().toLowerCase())}?d=404`;
      setImgSrc(gravatarUrl);
      return;
    }

    // No image available; keep initials fallback only.
    setImgSrc(null);
  };

  return (
    <div
      className={`${className} relative overflow-hidden bg-gradient-to-br from-orange-400 to-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-sm`}
    >
      <span>{initials}</span>
      {imgSrc && (
        <img
          className={`absolute inset-0 h-full w-full object-cover`}
          src={imgSrc}
          alt={fullName || "User avatar"}
          onError={handleError}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
};

export default MemberAvatar;
