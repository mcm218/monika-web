import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthService } from "./auth.service";
import { HttpClient } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";

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
export interface DbSong {
  dateAdded: Date;
  song: Song;
  timesAdded: number;
}
export interface MusicController {
  loop: number;
  pauseState: boolean;
  shuffleMode: boolean;
  volume: number;
}

@Injectable({
  providedIn: "root"
})
export class DbService {
  // HTTP Paths
  youtubeSearchPath =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&key=" +
    environment.youtubeKey +
    "&q=";
  youtubeVideoPath =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&key=" +
    environment.youtubeKey +
    "&id=";
  playlistPath =
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&key=" +
    environment.youtubeKey +
    "&playlistId=";
  userPlaylistsPath =
    "https://www.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&maxResults=25&mine=true&key=" +
    environment.youtubeKey;

  selectedList = new BehaviorSubject<Playlist>(undefined);
  queue = new BehaviorSubject<Song[]>([]);
  currentSong = new BehaviorSubject<Song>(undefined);
  playlists = new BehaviorSubject<Playlist[]>([]);
  controller = new BehaviorSubject<MusicController>(undefined);

  userHistory = new BehaviorSubject<Song[]>([]);
  userMostAdded = new BehaviorSubject<Song[]>([]);
  userFavorites = new BehaviorSubject<Map<string, Song>>(
    new Map<string, Song>()
  );

  constructor(
    private firestore: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient
  ) {}

  // Firestore
  getMusicPlayerData(): void {
    // Controller
    const path = "guilds/" + this.auth.selectedServer.value.id + "/VC";
    const ref = this.firestore.collection(path);
    ref
      .doc("controller")
      .snapshotChanges()
      .subscribe(snapshot => {
        var data = snapshot.payload.data() as MusicController;
        this.controller.next(data);
      });

    // Queue
    ref
      .doc("queue")
      .snapshotChanges()
      .subscribe(snapshot => {
        var data = snapshot.payload.data() as { queue: [] };
        var currentSong = data.queue.splice(0, 1)[0];
        this.currentSong.next(currentSong);
        this.queue.next(data.queue);
      });
  }

  updateController(controller: MusicController) {
    const path = "guilds/" + this.auth.selectedServer.value.id + "/VC";
    this.firestore
      .collection(path)
      .doc("controller")
      .set(controller);
  }

  updateQueue(queue: any[]) {
    const path = "guilds/" + this.auth.selectedServer.value.id + "/VC";
    this.firestore
      .collection(path)
      .doc("queue")
      .set({ queue: queue });
  }

  // Push song to user history, update dateAdded/timesAdded as necessary
  pushSong(song: any): void {
    const uid = this.auth.user.value.id;
    const user = this.auth.user.value;
    const now = new Date();
    const ref = this.firestore
      .collection("users/" + uid + "/history")
      .doc(song.id);
    ref.get().subscribe(snapshot => {
      if (!snapshot.data()) {
        ref.set({ song: song, dateAdded: now, timesAdded: 1 });
      } else {
        var num = snapshot.data().timesAdded + 1;
        ref.set({ dateAdded: now, timesAdded: num }, { merge: true });
      }
    });
  }

  // Grabs user history
  getUserHistory(): void {
    const uid = this.auth.user.value.id;
    const ref = this.firestore.collection("users/" + uid + "/history", ref =>
      ref.orderBy("dateAdded", "desc")
    );
    ref.snapshotChanges().subscribe(snapshots => {
      var history: Song[] = [];
      snapshots.forEach(snapshot => {
        var data = snapshot.payload.doc.data() as DbSong;
        history.push(data.song);
      });
      this.userHistory.next(history);
      this.updateLists();
    });
  }
  // Grabs user history, sorted by times added
  getUserMostAdded(): void {
    const uid = this.auth.user.value.id;
    const ref = this.firestore.collection("users/" + uid + "/history", ref =>
      ref.orderBy("timesAdded", "desc")
    );
    ref.snapshotChanges().subscribe(snapshots => {
      var mostAdded: Song[] = [];
      snapshots.forEach(snapshot => {
        var data = snapshot.payload.doc.data() as DbSong;
        mostAdded.push(data.song);
      });
      this.userMostAdded.next(mostAdded);
      this.updateLists();
    });
  }

  // Grabs user favorites
  getUserFavorites(): void {
    const uid = this.auth.user.value.id;
    const ref = this.firestore.collection("users/" + uid + "/favorites", ref =>
      ref.orderBy("date", "desc")
    );
    ref.snapshotChanges().subscribe(snapshots => {
      let favorites = new Map<string, Song>();
      snapshots.forEach(snapshot => {
        var data = snapshot.payload.doc.data() as Song;
        favorites.set(data.id, data);
      });
      this.userFavorites.next(favorites);
      this.updateLists();
    });
  }
  // Spotify
  getSpotifyLists(): void {}
  // Youtube
  getYoutubeLists(): void {}
  // Misc
  getLists(): void {
    this.getUserHistory();
    this.getUserMostAdded();
    this.getUserFavorites();
    this.auth.youtubeAuth.subscribe(status => {
      if (status) {
        this.getYoutubeLists();
      }
    });
    if (this.auth.spotifyAuth.value) {
      if (status) {
        this.getSpotifyLists();
      }
    }
  }

  updateLists(): void {
    const playlists: Playlist[] = [];
    playlists.push({
      title: "Favorites",
      source: "firestore",
      songs: [...this.userFavorites.value.values()]
    });
    playlists.push({
      title: "Most Added",
      source: "firestore",
      songs: this.userMostAdded.value
    });
    playlists.push({
      title: "History",
      source: "firestore",
      songs: this.userHistory.value
    });
    this.playlists.next(playlists);
  }

  // Checks Favorite list to see if song is favorited
  isFavorite(id: string): boolean {
    return this.userFavorites.value.get(id) ? true : false;
  }

  // Toggles favorite status for song
  toggleFavorite(song: Song): void {
    var date = new Date();
    var uid = this.auth.user.value.id;
    var ref = this.firestore
      .collection("users/" + uid + "/favorites")
      .doc(song.id);
    if (this.isFavorite(song.id)) {
      this.userFavorites.value.delete(song.id);
      ref.delete();
    } else {
      this.userFavorites.value.set(song.id, song);
      ref.set({ ...song, date: date });
    }
  }
  // Select list to be shown
  selectList(playlist: Playlist) {
    this.selectedList.next(playlist);
  }

  // Return to Music Player
  deselectList() {
    this.selectedList.next(undefined);
  }

  //Check URL is a valid URL
  // Primarily used to check for valid Youtube URLs
  validURL(str: string): boolean {
    var pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
      "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return !!pattern.test(str);
  }
}
