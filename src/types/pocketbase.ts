export interface User {
  id: string;
  created: string;
  updated: string;
  username: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  name?: string;
  avatar?: string;
}

export interface Edition {
  id: string;
  title: string;
  date: string;
  teams: string[];
  winner_team: string;
  blurb: string;
  home_song: string;
  edition_gif: string;
  end_gif_1: string;
  end_gif_2: string;
}