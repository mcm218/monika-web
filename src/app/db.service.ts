import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export interface Playlist {
  source: string; // Spotify, Youtube, Firestore
  title: string;
  songs: Song[];
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
  selectedList = new BehaviorSubject<Playlist>(undefined);
  queue = new BehaviorSubject<Song[]>(undefined);
  currentSong = new BehaviorSubject<Song>(undefined);
  playlists = new BehaviorSubject<Playlist[]>(undefined);

  constructor() {}

  selectList(playlist: Playlist) {
    this.selectedList.next(playlist);
  }
  deselectList() {
    this.selectedList.next(undefined);
  }

  getQueue() {
    console.log("Getting song queue...");
    var queue = [];
    this.currentSong.next({
      id: "",
      thumbnail:
        "https://i.scdn.co/image/ab67616d0000b27396e554b2799b4452e026e20e",
      url: "youtube.com",
      artist: "Mickie Darling",
      user: "Me",
      title: "Mom Jeans"
    });
    queue.push({
      id: "",
      thumbnail: "",
      title: "Come in",
      url: "youtube.com",
      artist: "Weatherday",
      user: "Me"
    });
    queue.push({
      id: "",
      thumbnail: "",
      title: "pretty cvnt",
      url: "youtube.com",
      artist: "Sewerslvt"
    });
    queue.push({
      id: "",
      thumbnail: "",
      title: "Youtube Video",
      url: "youtube.com"
    });
    this.queue.next(queue);
  }

  getPlaylists() {
    console.log("Getting user playlists...");
    var playlists = [];
    playlists.push({
      songs: [
        {
          id: "00000",
          thumbnail:
            "https://i.scdn.co/image/ab67616d0000b27396e554b2799b4452e026e20e",
          title: "Come in",
          artist: "Weatherday",
          url: "youtube.com",
          user: "me"
        },
        {
          id: "00000",
          thumbnail:
            "https://i.scdn.co/image/ab67616d0000b27396e554b2799b4452e026e20e",
          title: "Mio, Min Mio",
          artist: "Weatherday",
          url: "youtube.com",
          user: "me"
        },
        {
          id: "00000",
          thumbnail:
            "https://i.scdn.co/image/ab67616d0000b27396e554b2799b4452e026e20e",
          title: "Mom Jeans",
          artist: "Mickie Darling",
          url: "youtube.com",
          user: "me"
        }
      ],
      source: "spotify",
      title: "Top Tracks"
    });
    playlists.push({
      songs: [],
      source: "youtube",
      title: "Music"
    });
    playlists.push({
      songs: [],
      source: "firestore",
      title: "History"
    });

    this.playlists.next(playlists);
  }
}
