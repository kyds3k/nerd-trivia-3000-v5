export interface User {
  id: string;
  created: string;
  updated: string;
  username: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  is_admin?: boolean;
  name?: string;
  avatar?: string;
}

export interface GoogleData {
  meta: {
    name: string;
    avatarURL: string;
    email: string;
  };
}

export interface Edition {
  id: string;
  title: string;
  date: string;
  teams: string[];
  winner_team: string;
  winning_team_id?: string;
  blurb: string;
  home_song: string;
  home_song_apple?: string;
  edition_gif: string;
  end_gif_1: string;
  end_gif_2: string;
  is_active?: boolean;
}