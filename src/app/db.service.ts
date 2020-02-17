import { Injectable } from "@angular/core";

export interface Playlist {
  source: string; // Spotify, Youtube, Firestore
  title: string;
  list: Song[];
}

export interface Song {
  title: string;
  url: string;
  id: string;
  thumbnail: any;
  user?: string;
  source?: string;
  artist?: string;
}

@Injectable({
  providedIn: "root"
})
export class DbService {
  constructor() {}
}
