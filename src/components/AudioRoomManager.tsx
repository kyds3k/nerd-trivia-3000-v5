'use client';
import { useGamePhase } from '@/contexts/GamePhaseContext';
import { useDailyCall } from '@/hooks/useDailyCall';

interface Props {
  teamId?: string;
}

export default function AudioRoomManager({ teamId }: Props) {
  const { phase } = useGamePhase();
  const roomName = phase === 'main' ? 'the-cantina' : teamId ? `team-${teamId}` : '';

  useDailyCall(roomName);

  return (
    <div className="p-4 rounded-lg shadow-md bg-white">
      <h2 className="text-lg font-bold mb-2">Audio Room</h2>
      <p className="text-gray-600">
        {phase === 'main' ? 'Listening to host...' : `Team room: ${teamId}`}
      </p>
    </div>
  );
}