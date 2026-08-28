import React, { useState } from 'react';

const GOOGLE_DRIVE_URL = 'https://drive.google.com/drive/folders/1sfBkiY8N6JwEoT31e1hl9JH-vJ0JSuxi?usp=sharing';

/**
 * Expandable QR Code button for downloading the latest PRANSETU Android APK from Google Drive.
 */
export const ApkQrCode: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const [expanded, setExpanded] = useState(false);

  // Generate QR code using the free Google Charts API (no npm dependency)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(GOOGLE_DRIVE_URL)}&bgcolor=0d1117&color=58a6ff&format=png&margin=8`;

  if (collapsed) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center py-2 text-on-surface-variant hover:text-primary transition-colors"
        title="Download PRANSETU APK (QR Code)"
      >
        <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full py-2 px-2.5 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm border ${
          expanded
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-surface-container border-outline-variant hover:bg-surface-container-high hover:border-primary/40 text-on-surface'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
        <span>Download APK</span>
        <span
          className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {/* Expandable QR Card */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-secondary">android</span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                PRANSETU APK
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative rounded-lg overflow-hidden bg-white p-2 shadow-inner">
              <img
                src={qrImageUrl}
                alt="Scan to download PRANSETU APK from Google Drive"
                className="w-[140px] h-[140px]"
                loading="eager"
              />
              {/* Center Android icon overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-[#3DDC84]">android</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-center space-y-1">
            <p className="text-[10px] text-on-surface-variant">
              Scan to view folder on Google Drive
            </p>
          </div>

          {/* Direct download link */}
          <a
            href={GOOGLE_DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 rounded bg-[#3DDC84]/15 hover:bg-[#3DDC84]/25 border border-[#3DDC84]/30 text-[#3DDC84] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">folder_open</span>
            Open Drive Folder
          </a>
        </div>
      </div>
    </div>
  );
};
