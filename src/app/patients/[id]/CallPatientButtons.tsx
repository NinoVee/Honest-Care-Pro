"use client";

interface Props {
  patientId: string;
  patientName: string;
  phone: string | null;
}

/// Cross-platform calling: Jitsi Meet rooms work from any browser
/// (Windows, Mac) and from the iOS app via the same URL — no account,
/// API key, or paid service required. The room name is deterministic
/// (based on patientId) so both sides always land in the same room
/// without needing a signaling/scheduling step.
export function CallPatientButtons({ patientId, patientName, phone }: Props) {
  const roomUrl = "https://meet.jit.si/HonestCare-" + patientId;
  const voiceOnlyUrl = roomUrl + "#config.startAudioOnly=true";
  const faceTimeUrl = phone ? "facetime://" + phone : null;

  return (
    <div className="flex flex-wrap gap-3">
      <a href={roomUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
        Video Call {patientName}
      </a>
      <a href={voiceOnlyUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
        Voice Call (No Video)
      </a>
      {faceTimeUrl && (
        <a href={faceTimeUrl} className="btn-secondary text-xs">
          FaceTime (Mac only)
        </a>
      )}
    </div>
  );
}