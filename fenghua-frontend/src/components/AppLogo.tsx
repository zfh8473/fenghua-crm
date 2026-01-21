/**
 * AppLogo
 *
 * 在「峰华AIO」左侧展示 FH 图标（public/logo-fh.png），收起时仅展示 FH 或「峰」。
 *
 * All custom code is proprietary and not open source.
 */

import { useState } from 'react';

interface AppLogoProps {
  /** 「峰华AIO」文字的 className */
  className?: string;
  /** 收起时仅展示 FH 图标（或加载失败时展示「峰」） */
  collapsed?: boolean;
  /** 展开时 FH 图标高度，默认 h-8 */
  imgHeight?: string;
  /** 收起时 FH 图标高度，默认 h-7 */
  collapsedImgHeight?: string;
}

const LOGO_FH_SRC = '/logo-fh.png';

/**
 * 展开：[FH 图标] + 峰华AIO；收起：仅 [FH 图标] 或「峰」。
 * FH 图标加载失败时：展开只显示文字，收起显示「峰」。
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'text-monday-3xl font-semibold tracking-tight text-gray-900',
  collapsed = false,
  imgHeight = 'h-8',
  collapsedImgHeight = 'h-7',
}) => {
  const [fhError, setFhError] = useState(false);

  if (collapsed) {
    if (fhError) {
      return <span className="text-monday-4xl font-bold text-uipro-cta">峰</span>;
    }
    return (
      <img
        src={LOGO_FH_SRC}
        alt="峰华AIO"
        className={`${collapsedImgHeight} w-auto object-contain flex-shrink-0`}
        onError={() => setFhError(true)}
      />
    );
  }

  return (
    <div className="flex items-center gap-monday-2 flex-shrink-0">
      {!fhError && (
        <img
          src={LOGO_FH_SRC}
          alt=""
          role="presentation"
          className={`${imgHeight} w-auto object-contain flex-shrink-0`}
          onError={() => setFhError(true)}
        />
      )}
      <span className={className}>峰华AIO</span>
    </div>
  );
};
