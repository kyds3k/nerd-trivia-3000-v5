'use client';

import {
  useDaily,
  useParticipantIds,
  useParticipantProperty,
} from '@daily-co/daily-react';
import ParticipantRow from './ParticipantRow';

export default function AdminCallControls() {
  const call = useDaily();
  const participantIds = useParticipantIds({ filter: 'remote' });

  return (
    <div>
      <h2>Admin Controls</h2>
      <ul>
        {participantIds.map((id) => (
          <ParticipantRow key={id} id={id} call={call} />
        ))}
      </ul>
    </div>
  );
}
