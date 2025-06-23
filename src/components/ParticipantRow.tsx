'use client';

import { useParticipantProperty } from '@daily-co/daily-react';
import type { DailyCall } from '@daily-co/daily-js';

export default function ParticipantRow({
  id,
  call,
}: {
  id: string;
  call: DailyCall | null;
}) {
  const userName = useParticipantProperty(id, 'user_name');
  const audioState = useParticipantProperty(id, 'tracks.audio.state');
  const micOn = audioState === 'playable';

  const handleMute = () => {
    call?.updateParticipant(id, { setAudio: false });
  };

  return (
    <li>
      {userName ?? 'Unknown'} – Mic: {micOn ? 'On' : 'Off'}{' '}
      <button onClick={handleMute}>Mute</button>
    </li>
  );
}
