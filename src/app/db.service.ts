import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { environment } from "src/environments/environment";
import { AuthService } from "./auth.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AngularFirestore } from "@angular/fire/firestore";
import { SongComponent } from "./song/song.component";
import { v4 as uuid } from "uuid";

export interface Playlist {
  source: string; // Spotify, Youtube, Firestore
  title: string;
  songs: any[];
  data?: any[];
}

export interface Song {
  title: string;
  youtubeTitle?: string;
  url?: string;
  uid?: string;
  id?: string;
  data?: any;
  thumbnail: string;
  user?: any;
  source?: string;
  artist?: string;
  pos?: number;
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
  pauseTime?: number;
  resumeTime?: number;
  startTime?: number;
  duration?: number;
}

@Injectable({
  providedIn: "root",
})
export class DbService {
  // HTTP Paths
  youtubeSearchPath =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&safeSearch=none&key=" +
    environment.youtubeKey +
    "&q=";
  youtubeChannelPath =
    "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true&key=" +
    environment.youtubeKey;

  spotifySearchPath = "https://api.spotify.com/v1/search?type=track&q=";
  spotifyAlbumSearchPath = "https://api.spotify.com/v1/search?type=album&q=";

  youtubeVideoPath =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&key=" +
    environment.youtubeKey +
    "&id=";
  youtubePlaylistPath =
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&key=" +
    environment.youtubeKey +
    "&playlistId=";
  userPlaylistsPath =
    "https://www.googleapis.com/youtube/v3/playlists?part=snippet%2CcontentDetails&maxResults=50&mine=true&key=" +
    environment.youtubeKey;
  spotifyPath = "https://api.spotify.com/v1/me/";
  spotifyAlbumPath = "https://api.spotify.com/v1/albums/";

  ApiPath = "https://rulwogx4wf.execute-api.us-east-2.amazonaws.com/Development/api";
  // ApiPath = "http://localhost:3000/api";
  // ApiPath = "http://66.42.90.210:3000/api"

  // localSongPath = 'http://localhost:3000/api';

  serverSubscriber;

  selectedList = new BehaviorSubject<Playlist>(undefined);
  queue = new BehaviorSubject<Song[]>([]);
  history = new BehaviorSubject<Song[]>([]);
  currentSong = new BehaviorSubject<Song>(undefined);
  playlists = new BehaviorSubject<Playlist[]>([]);
  controller = new BehaviorSubject<MusicController>(undefined);
  onlineUsers = new BehaviorSubject<any[]>([]);

  userHistory = new BehaviorSubject<Song[]>([]);
  userMostAdded = new BehaviorSubject<Song[]>([]);
  userFavorites = new BehaviorSubject<Map<string, Song>>(
    new Map<string, Song>()
  );
  otherLists = [];

  results = new BehaviorSubject<any[]>([]);
  settings = new BehaviorSubject<boolean>(false);

  // Subscriptions
  controlSub: Subscription;
  queueSub: Subscription;
  historySub: Subscription;
  usersSub: Subscription;

  constructor(
    private firestore: AngularFirestore,
    private auth: AuthService,
    private http: HttpClient
  ) {}

  // Firestore
  getMusicPlayerData(): void {
    const apiPath = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/player`;
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });

    const request = this.http.get<MusicController>(apiPath, {
      headers: header,
    });

    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
    // Controller
    const path = "guilds/" + AuthService.selectedServer.value.id + "/VC";
    const ref = this.firestore.collection(path);
    if (this.controlSub || this.queueSub || this.historySub || this.usersSub) {
      this.controlSub.unsubscribe();
      this.queueSub.unsubscribe();
      this.historySub.unsubscribe();
      this.usersSub.unsubscribe();
    }
    this.controlSub = ref
      .doc("controller")
      .snapshotChanges()
      .subscribe((snapshot) => {
        const data = snapshot.payload.data() as MusicController;
        this.controller.next(data);
      });

    // Queue
    this.queueSub = ref
      .doc("queue")
      .collection("songs")
      .snapshotChanges()
      .subscribe((snapshots) => {
        // each song needs to be a field (unsorted)
        // each song needs to contain its position
        // sort after reading doc
        const dbQueue = [];
        snapshots.forEach((snapshot) => {
          const data = snapshot.payload.doc.data();
          data.title = this.fixStringFormatting(data.title);
          data.youtubeTitle = this.fixStringFormatting(data.youtubeTitle);
          dbQueue.push(data);
        });
        dbQueue.sort((a, b) => a.pos - b.pos);
        const currentSong = dbQueue.splice(0, 1)[0];
        this.currentSong.next(currentSong);
        this.queue.next(dbQueue);
      });
    // History
    this.historySub = ref
      .doc("history")
      .snapshotChanges()
      .subscribe((snapshot) => {
        const data = snapshot.payload.data() as { history: [] };
        if (snapshot.payload.exists) {
          this.history.next(data.history);
        }
      });
    // Online Users
    this.usersSub = ref.snapshotChanges().subscribe((snapshots) => {
      const onlineUsers = [];
      snapshots.forEach((snapshot) => {
        const user = snapshot.payload.doc.data() as any;
        if (user.id && user.username) {
          // Valid User, add to list
          onlineUsers.push(user);
        }
      });
      this.onlineUsers.next(onlineUsers);
    });
  }

  async updateController(controller: MusicController) {
    controller.shuffleMode = false;

    const path = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/player`;
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });

    const request = this.http.put<MusicController>(path, controller, {
      headers: header,
    });

    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
    // controller.shuffleMode = false;
    // const path = 'guilds/' + this.auth.selectedServer.value.id + '/VC';
    // await this.firestore
    //   .collection(path)
    //   .doc('controller')
    //   .set(controller, { merge: true });
  }

  addToQueue(song: Song) {
    const copy = Object.assign({}, song);
    if (copy.source === "playlist") {
      // Youtube Playlist
      copy.user = this.auth.user.value;
      this.addYoutubePlaylist(copy);
      return;
    }
    copy.uid = uuid();
    this.pushSong(copy);
    copy.user = this.auth.user.value;
    this.addSongToLocalServer(copy);
    return;
    // if (copy.source === 'spotify') {
    //   // Spotify Song
    //   this.addSpotifySong(copy);
    // } else if (copy.source === 'playlist') {
    //   // Youtube Playlist
    //   this.addYoutubePlaylist(copy);
    // } else if (copy.source === 'album') {
    //   // Spotify Album
    //   this.addSpotifyAlbum(copy);
    // } else {
    //   // Youtube/Cached Song
    //   copy.uid = Date.now().toString();
    //   this.pushSong(copy);
    //   copy.user = this.auth.user.value;
    //   // const queue = this.queue.value;
    //   // queue.push(copy);
    //   this.addSongToLocalServer(copy);
    //   // this.updateQueue(queue);
    // }
  }

  addSongToLocalServer(song: Song) {
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/queue/song`;
    const request = this.http.post<Song>(path, song, { headers: header });
    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
  }
  removeFromQueue(song: Song) {
    this.removeSongFromLocalServer(song);
    return;
    // const queue = this.queue.value;
    // const pos = queue.findIndex((a) => a.id === song.id);
    // const path =
    //   'guilds/' + this.auth.selectedServer.value.id + '/VC/queue/songs';
    // this.firestore.collection(path).doc(song.uid).delete();
    // queue.splice(pos, 1);
    // this.updateQueue(queue);
  }

  removeSongFromLocalServer(song: Song) {
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/queue/song/${song.uid}`;
    const request = this.http.delete<Song>(path, { headers: header });
    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
  }

  updateHistory(songs: Song[]) {
    const path = "guilds/" + AuthService.selectedServer.value.id + "/VC/";
    while (songs.length > 20) {
      songs.pop();
    }
    this.history.next(songs);
    this.firestore.collection(path).doc("history").set({ history: songs });
  }

  skipCurrent() {
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/queue/song`;
    const request = this.http.delete<Song>(path, { headers: header });
    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
    return;
    // const queue = this.queue.value;
    // const history = this.history.value;
    // const current = this.currentSong.value;
    // const controller = this.controller.value;
    // const loop = controller.loop;
    // // this.queue.next(Object.assign([], queue));
    // const path =
    //   'guilds/' + this.auth.selectedServer.value.id + '/VC/queue/songs';
    // // update history
    // history.unshift(current);
    // this.updateHistory(history);
    // // delete last song to prevent duplicates
    // const batch = this.firestore.firestore.batch();
    // this.resetTime();
    // let i = 0;
    // // upload new queue
    // queue.forEach((song) => {
    //   song.pos = i;
    //   song.uid = song.uid ? song.uid : song.id + Date.now().toString();
    //   this.firestore.collection(path).doc(song.uid).set(song);
    //   i++;
    // });
    // if (loop == 0) {
    //   this.firestore.collection(path).doc(current.uid).delete();
    // } else {
    //   console.log(i);
    //   current.pos = i;
    //   current.uid = current.uid
    //     ? current.uid
    //     : current.id + Date.now().toString();
    //   this.firestore.collection(path).doc(current.uid).set(current);
    //   if (loop == 2) {
    //     this.updateController({
    //       loop: 1,
    //       pauseState: controller.pauseState,
    //       volume: controller.volume,
    //       shuffleMode: controller.shuffleMode,
    //     });
    //   }
    // }
    // batch.commit();
  }

  previousSong() {
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/queue/song`;
    const request = this.http.put(path, { headers: header });
    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
    return;
    // const history = this.history.value;
    // if (!history || history.length == 0) {
    //   return;
    // }
    // // get currentSong and queue
    // const currentSong = Object.assign({}, this.currentSong.value);
    // const queue = Object.assign([], this.queue.value);
    // // add current song to queue list
    // if (currentSong && currentSong.uid) {
    //   queue.unshift(currentSong);
    // }
    // // grab previous song
    // const prevSong = history[0];
    // // push prev song to queue, if it exists
    // // this.queue.next(Object.assign([], queue));
    // if (prevSong) {
    //   prevSong.uid = prevSong.id + Date.now().toString();
    //   queue.unshift(prevSong);
    // }
    // // update history
    // history.shift();
    // this.updateHistory(history);
    // const path =
    //   "guilds/" + AuthService.selectedServer.value.id + "/VC/queue/songs";
    // let i = 0;
    // const batch = this.firestore.firestore.batch();
    // this.resetTime();
    // queue.forEach((song) => {
    //   song.pos = i;
    //   song.uid =
    //     song.uid && song.uid != "" ? song.uid : song.id + Date.now().toString();
    //   this.firestore.collection(path).doc(song.uid).set(song);
    //   i++;
    // });
    // batch.commit();
  }

  changeSongPosition(songs: Song[], newIndex: number){
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/queue/song/${songs[newIndex].uid}/${newIndex + 1}`;
    const request = this.http.patch(path, { headers: header });
    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
    return;
  }

  resetTime() {
    const path = "guilds/" + AuthService.selectedServer.value.id + "/VC/";
    this.firestore
      .collection(path)
      .doc("controller")
      .set(
        { startTime: -1, duration: -1, pauseTime: -1, resumeTime: -1 },
        { merge: true }
      );
  }
  shuffle() {
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/queue/shuffle`;
    const request = this.http.put(path, { headers: header });
    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
    return;
    // const queue = this.queue.value;
    // for (let i = queue.length - 1; i > 0; i--) {
    //   const j = Math.floor(Math.random() * i);
    //   const temp = queue[i];
    //   queue[i] = queue[j];
    //   queue[j] = temp;
    // }
    // this.updateQueue(queue);
  }

  updateQueue(queue: Song[]) {
    queue = Object.assign([], queue);
    this.queue.next(Object.assign([], queue));
    const currentSong = Object.assign({}, this.currentSong.value);
    if (this.currentSong.value) {
      queue.unshift(currentSong);
    }
    const path =
      "guilds/" + AuthService.selectedServer.value.id + "/VC/queue/songs";
    let i = 0;
    const batch = this.firestore.firestore.batch();
    queue.forEach((song) => {
      song.title = this.fixStringFormatting(song.title);
      if (song.youtubeTitle) {
        song.youtubeTitle = this.fixStringFormatting(song.youtubeTitle);
      }
      song.pos = i;
      song.uid =
        song.uid && song.uid != "" ? song.uid : song.id + Date.now().toString();
      this.firestore.collection(path).doc(song.uid).set(song);
      i++;
    });
    batch.commit();
  }

  // Push song to user history, update dateAdded/timesAdded as necessary
  pushSong(song: any): void {
    return;
    const uid = this.auth.user.value.id;
    const user = this.auth.user.value;

    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/song/history`;
    const request = this.http.post(
      path,
      { uid: uid, song: song },
      { headers: header }
    );
    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
  }

  // Grabs user history
  getUserHistory(): void {
    const uid = this.auth.user.value.id;
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/users/${uid}/histories`;
    const request = this.http.get<Song[]>(path, { headers: header });
    request.subscribe(
      (response) => {
        console.log(response);
        this.userHistory.next(response);
        this.updateLists
      },
      (error) => console.error(error)
    );
    return;

    const ref = this.firestore.collection("users/" + uid + "/history", (ref) =>
      ref.orderBy("dateAdded", "desc").limit(50)
    );
    ref.snapshotChanges().subscribe((snapshots) => {
      const history: Song[] = [];
      snapshots.forEach((snapshot) => {
        const data = snapshot.payload.doc.data() as DbSong;
        history.push(data.song);
      });
      this.userHistory.next(history);
      this.updateLists();
    });
  }
  // Grabs user history, sorted by times added
  getUserMostAdded(): void {
    const uid = this.auth.user.value.id;
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/users/${uid}/histories/mostadded`;
    const request = this.http.get<Song[]>(path, { headers: header });
    request.subscribe(
      (response) => {
        console.log(response);
        this.userMostAdded.next(response);
        this.updateLists();
      },
      (error) => console.error(error)
    );
    return;
  }

  // Grabs user favorites
  getUserFavorites(): void {
    const uid = this.auth.user.value.id;
    const ref = this.firestore.collection(
      "users/" + uid + "/favorites",
      (ref) => ref.orderBy("date", "desc").limit(50)
    );
    ref.snapshotChanges().subscribe((snapshots) => {
      const favorites = new Map<string, Song>();
      snapshots.forEach((snapshot) => {
        const data = snapshot.payload.doc.data() as Song;
        favorites.set(data.id, data);
      });
      this.userFavorites.next(favorites);
      this.updateLists();
    });
  }

  cacheSearch(query: string, results: any, isVideo: boolean): void {
    let ref;
    if (isVideo) {
      ref = this.firestore
        .collection("searches/videos/" + query)
        .doc("results");
    } else {
      ref = this.firestore
        .collection("searches/playlists/" + query)
        .doc("results");
    }
    ref.set(results);
  }

  // Spotify
  getSpotifyLists(): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.spotifyAccessToken}`,
    });
    this.http
      .get(this.spotifyPath + "playlists?limit=50", {
        headers,
      })
      .subscribe(
        async (response) => {
          let i = 0;
          const items = (response as any).items;
          for (i = 0; i < items.length; i++) {
            this.getSpotifyTracks(items[i]);
            await this.delay(100);
          }
        },
        (error) => console.error(error)
      );
  }
  getSpotifyTracks(playlist: any): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.spotifyAccessToken}`,
    });
    this.http
      .get(playlist.tracks.href, {
        headers,
      })
      .subscribe(
        (response) => {
          const items = (response as any).items;
          const list: Song[] = [];
          if (items.length == 0) {
            return;
          }
          items.forEach((item) => {
            if (!item.track) {
              return;
            }
            const song: Song = {
              title: item.track.name,
              artist: item.track.artists[0].name,
              thumbnail: item.track.album.images[0]
                ? item.track.album.images[0].url
                : undefined,
              source: "spotify",
            };
            list.push(song);
          });
          const spotifyList: Playlist = {
            title: playlist.name,
            data: items,
            source: "spotify",
            songs: list,
          };
          this.otherLists.push(spotifyList);
          this.otherLists.sort((a, b) =>
            a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1
          );
          this.updateLists();
        },
        (error) => console.error(error)
      );
  }

  addSpotifySong(song: Song): void {
    const query = (song.title + "+" + song.artist).split(" ").join("+");
    console.log(query);
    this.firestore
      .collection("searches/videos/" + "spotify+" + query)
      .doc("results")
      .get()
      .subscribe((snapshot) => {
        if (snapshot.exists) {
          const result = snapshot.data().items[0];
          result.snippet.title = this.fixStringFormatting(result.snippet.title);

          // Turn into function?
          song.id = result.id.videoId;
          song.url = "https://www.youtube.com/watch?v=" + song.id;
          song.youtubeTitle = result.snippet.title;
          this.pushSong(song);
          song.user = this.auth.user.value;
          const queue = this.queue.value;
          queue.push(song);
          this.addSongToLocalServer(song);
          this.updateQueue(queue);
        } else {
          this.http
            .get(this.youtubeSearchPath + query + "+song" + "&type=video")
            .subscribe(
              (response) => {
                const result = (response as any).items[0];

                result.snippet.title = this.fixStringFormatting(
                  result.snippet.title
                );
                this.cacheSearch("spotify+" + query, response, true);
                // Turn into function?
                song.id = result.id.videoId;
                song.url = "https://www.youtube.com/watch?v=" + song.id;
                song.youtubeTitle = result.snippet.title;
                this.pushSong(song);
                song.user = this.auth.user.value;
                const queue = this.queue.value;
                queue.push(song);
                this.addSongToLocalServer(song);
                this.updateQueue(queue);
              },
              (error) => console.error(error)
            );
        }
      });
  }
  toggleSpotifyFavorite(song: Song): void {
    const query = (song.artist + " " + song.title).split(" ").join("+");
    this.firestore
      .collection("searches/videos/" + "spotify+" + query)
      .doc("results")
      .get()
      .subscribe((snapshot) => {
        if (snapshot.exists) {
          const result = snapshot.data().items[0];
          result.snippet.title = this.fixStringFormatting(result.snippet.title);
          // Turn into function?
          song.id = result.id.videoId;
          song.url = "https://www.youtube.com/watch?v=" + song.id;
          song.youtubeTitle = result.snippet.title;

          const date = new Date();
          const uid = this.auth.user.value.id;
          const ref = this.firestore
            .collection("users/" + uid + "/favorites")
            .doc(song.id);
          if (this.isFavorite(song.id)) {
            this.userFavorites.value.delete(song.id);
            ref.delete();
          } else {
            this.userFavorites.value.set(song.id, song);
            ref.set({ ...song, date });
          }
        } else {
          this.http
            .get(this.youtubeSearchPath + query + "+song" + "&type=video")
            .subscribe(
              (response) => {
                const result = (response as any).items[0];
                result.snippet.title = this.fixStringFormatting(
                  result.snippet.title
                );
                this.cacheSearch("spotify+" + query, response, true);
                // Turn into function?
                song.id = result.id.videoId;
                song.url = "https://www.youtube.com/watch?v=" + song.id;
                song.youtubeTitle = result.snippet.title;

                const date = new Date();
                const uid = this.auth.user.value.id;
                const ref = this.firestore
                  .collection("users/" + uid + "/favorites")
                  .doc(song.id);
                if (this.isFavorite(song.id)) {
                  this.userFavorites.value.delete(song.id);
                  ref.delete();
                } else {
                  this.userFavorites.value.set(song.id, song);
                  ref.set({ ...song, date });
                }
              },
              (error) => console.error(error)
            );
        }
      });
  }

  searchSpotify(query: string): void {
    const q = query.trim().split(" ").join("+");
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.spotifyAccessToken}`,
    });
    this.http.get(this.spotifySearchPath + q, { headers }).subscribe(
      (response) => {
        const items = (response as any).tracks.items;
        const results: Song[] = [];
        items.forEach((track) => {
          // console.log(track.artists[0].name + " - " + track.name);
          results.push({
            source: "spotify",
            title: track.name,
            artist: track.artists[0].name,
            thumbnail: track.album.images[0]
              ? track.album.images[0].url
              : undefined,
          });
        });
        this.results.next(results);
      },
      (error) => console.log(error)
    );
  }

  searchSpotifyAlbum(query: string): void {
    const q = query.trim().split(" ").join("+");
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.spotifyAccessToken}`,
    });
    this.http.get(this.spotifyAlbumSearchPath + q, { headers }).subscribe(
      (response) => {
        const items = (response as any).albums.items;
        const results: Song[] = [];
        items.forEach((album) => {
          results.push({
            title: album.name,
            thumbnail: album.images[0].url,
            artist: album.artists[0].name,
            source: "album",
            id: album.id,
          });
        });
        this.results.next(results);
      },
      (error) => console.log(error)
    );
  }

  addSpotifyAlbum(album: Song): void {
    // Get Album Tracks -> Format as Song -> addSpotifySong(song) on each
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.spotifyAccessToken}`,
    });
    this.http
      .get(this.spotifyAlbumPath + album.id + "/tracks?limit=50", {
        headers,
      })
      .subscribe(
        async (response) => {
          const tracks = (response as any).items;
          for (let i = 0; i < tracks.length; i++) {
            this.addSpotifySong({
              source: "spotify",
              thumbnail: album.thumbnail,
              title: tracks[i].name,
              artist: tracks[i].artists[0].name,
            });
            await this.delay(200);
          }
        },
        (error) => console.log(error)
      );
  }
  // Youtube
  getYoutubeLists(): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.youtubeAccessToken}`,
    });
    this.http
      .get(this.userPlaylistsPath, {
        headers,
      })
      .subscribe(
        (response) => {
          (response as any).items.forEach((playlist) => {
            console.log;
            this.getYoutubeVideos(playlist);
          });
        },
        (error) => console.error(error)
      );

    this.http
      .get(this.youtubeChannelPath, { headers })
      .subscribe((response) => {
        console.log(response);
      });
  }

  getYoutubeVideos(playlist: any): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.youtubeAccessToken}`,
    });
    this.http
      .get(this.youtubePlaylistPath + playlist.id, {
        headers,
      })
      .subscribe(
        (response) => {
          const items = (response as any).items;
          const list: Song[] = [];
          if (items.length == 0) {
            return;
          }
          items.forEach((item) => {
            const thumbnails = item.snippet.thumbnails;
            let thumbnail;
            if (!thumbnails) {
              thumbnail = "";
              return;
            } else if (thumbnails.maxres) {
              thumbnail = thumbnails.maxres.url;
            } else if (thumbnails.standard) {
              thumbnail = thumbnails.standard.url;
            } else if (thumbnails.high) {
              thumbnail = thumbnails.high.url;
            }
            item.snippet.title = this.fixStringFormatting(item.snippet.title);
            const song: Song = {
              title: item.snippet.title,
              id: item.snippet.resourceId.videoId,
              url:
                "https://www.youtube.com/watch?v=" +
                item.snippet.resourceId.videoId,
              thumbnail,
              source: "youtube",
            };
            list.push(song);
          });
          playlist.snippet.title = this.fixStringFormatting(
            playlist.snippet.title
          );
          const youtubeList: Playlist = {
            title: playlist.snippet.title,
            source: "youtube",
            songs: list,
          };
          this.otherLists.push(youtubeList);
          this.otherLists.sort((a, b) =>
            a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1
          );
          this.updateLists();
        },
        (error) => console.error(error)
      );
  }
  searchYoutube(query: string): void {
    const q = query.trim().split(" ").join("+");
    const path = `${this.ApiPath}/search/youtube/song/${q}`;
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });

    const request = this.http.get<Song[]>(path, { headers: header });

    request.subscribe(
      (response) => {
        console.log(response);
        this.results.next(response);
      },
      (error) => console.error(error)
    );
    return;
    // const q = query.trim().split(' ').join('+');
    // console.log(q);
    // this.firestore
    //   .collection('searches/videos/' + q)
    //   .doc('results')
    //   .get()
    //   .subscribe((snapshot) => {
    //     if (snapshot.exists) {
    //       const results: Song[] = [];
    //       const response = snapshot.data();
    //
    //       // Turn into function?
    //       response.items.forEach((result) => {
    //         const thumbnails = result.snippet.thumbnails;
    //         let thumbnail = thumbnails.high.url;
    //         if (thumbnails.maxres) {
    //           thumbnail = thumbnails.maxres.url;
    //         } else if (thumbnails.standard) {
    //           thumbnail = thumbnails.standard.url;
    //         }
    //         result.snippet.title = this.fixStringFormatting(
    //           result.snippet.title
    //         );
    //         results.push({
    //           source: 'youtube',
    //           title: result.snippet.title,
    //           youtubeTitle: result.snippet.title,
    //           id: result.id.videoId,
    //           url: 'https://www.youtube.com/watch?v=' + result.id.videoId,
    //           thumbnail,
    //         });
    //       });
    //       this.results.next(results);
    //     } else {
    //       this.http
    //         .get(this.youtubeSearchPath + q + '+song' + '&type=video')
    //         .subscribe(
    //           (response) => {
    //             const results: Song[] = [];
    //             this.cacheSearch(q, response, true);
    //             // Cache search for later
    //
    //             // Turn into function?
    //             (response as any).items.forEach((result) => {
    //               console.log(result);
    //               const thumbnails = result.snippet.thumbnails;
    //               let thumbnail = thumbnails.high.url;
    //               if (thumbnails.maxres) {
    //                 thumbnail = thumbnails.maxres.url;
    //               } else if (thumbnails.standard) {
    //                 thumbnail = thumbnails.standard.url;
    //               }
    //               result.snippet.title = this.fixStringFormatting(
    //                 result.snippet.title
    //               );
    //               results.push({
    //                 source: 'youtube',
    //                 title: result.snippet.title,
    //                 youtubeTitle: result.snippet.title,
    //                 id: result.id.videoId,
    //                 url: 'https://www.youtube.com/watch?v=' + result.id.videoId,
    //                 thumbnail,
    //               });
    //             });
    //             this.results.next(results);
    //           },
    //           (error) => console.error(error)
    //         );
    //     }
    //   });
  }

  searchYoutubePlaylist(query: string): void {
    const q = query.trim().split(" ").join("+");
    const path = `${this.ApiPath}/search/youtube/album/${q}`;
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });

    const request = this.http.get<Song[]>(path, { headers: header });

    request.subscribe(
      (response) => {
        console.log(response);
        this.results.next(response);
      },
      (error) => console.error(error)
    );
    return;
    // const q = query.trim().split(' ').join('+');
    // this.firestore
    //   .collection('searches/playlists/' + q)
    //   .doc('results')
    //   .get()
    //   .subscribe((snapshot) => {
    //     if (snapshot.exists) {
    //       const results: Song[] = [];
    //       const response = snapshot.data();
    //
    //       // Turn into function?
    //       (response as any).items.forEach((result) => {
    //         const thumbnails = result.snippet.thumbnails;
    //         let thumbnail = thumbnails.high.url;
    //         if (thumbnails.maxres) {
    //           thumbnail = thumbnails.maxres.url;
    //         } else if (thumbnails.standard) {
    //           thumbnail = thumbnails.standard.url;
    //         }
    //         result.snippet.title = this.fixStringFormatting(
    //           result.snippet.title
    //         );
    //         results.push({
    //           title: result.snippet.title,
    //           youtubeTitle: result.snippet.title,
    //           source: 'playlist',
    //           thumbnail,
    //           id: result.id.playlistId,
    //         });
    //       });
    //       this.results.next(results);
    //     } else {
    //       this.http
    //         .get(this.youtubeSearchPath + q + '+album' + '&type=playlist')
    //         .subscribe(
    //           (response) => {
    //             const results: Song[] = [];
    //             // Cache search for later
    //             this.cacheSearch(q, response, false);
    //             // Turn into function?
    //             (response as any).items.forEach((result) => {
    //               const thumbnails = result.snippet.thumbnails;
    //               let thumbnail = thumbnails.high.url;
    //               if (thumbnails.maxres) {
    //                 thumbnail = thumbnails.maxres.url;
    //               } else if (thumbnails.standard) {
    //                 thumbnail = thumbnails.standard.url;
    //               }
    //               result.snippet.title = this.fixStringFormatting(
    //                 result.snippet.title
    //               );
    //               results.push({
    //                 title: result.snippet.title,
    //                 youtubeTitle: result.snippet.title,
    //                 source: 'playlist',
    //                 thumbnail,
    //                 id: result.id.playlistId,
    //               });
    //             });
    //             this.results.next(results);
    //           },
    //           (error) => console.error(error)
    //         );
    //     }
    //   });
  }

  addYoutubePlaylist(playlist: Song): void {
    const path = `${this.ApiPath}/guilds/${AuthService.selectedServer.value.id}/queue/album/youtube`;
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });

    const request = this.http.post<Song[]>(path, playlist, { headers: header });

    request.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
    return;
    // this.http.get(this.youtubePlaylistPath + playlist.id).subscribe(
    //   (response) => {
    //     const items = (response as any).items;
    //     if (items.length == 0) {
    //       return;
    //     }
    //     items.forEach((item) => {
    //       const thumbnails = item.snippet.thumbnails;
    //       let thumbnail;
    //       if (!thumbnails) {
    //         thumbnail = '';
    //         return;
    //       } else if (thumbnails.maxres) {
    //         thumbnail = thumbnails.maxres.url;
    //       } else if (thumbnails.standard) {
    //         thumbnail = thumbnails.standard.url;
    //       } else if (thumbnails.high) {
    //         thumbnail = thumbnails.high.url;
    //       }
    //       item.snippet.title = this.fixStringFormatting(item.snippet.title);
    //       this.addToQueue({
    //         title: item.snippet.title,
    //         youtubeTitle: item.snippet.title,
    //         id: item.snippet.resourceId.videoId,
    //         url:
    //           'https://www.youtube.com/watch?v=' +
    //           item.snippet.resourceId.videoId,
    //         thumbnail,
    //         source: 'youtube',
    //       });
    //     });
    //   },
    //   (error) => console.error(error)
    // );
  }
  // Misc

  search(query: string): void {
    if (query.trim().length == 0) {
      this.clearResults();
      return;
    }
    const albumPos = query.search(/album/i);
    const playlistPos = query.search(/playlist/i);
    const spotifyAuthorized = this.auth.spotifyAuth.value;
    if (albumPos != -1) {
      console.log("Searching for album...");
      // remove album from search query
      query = this.removeString(query, albumPos, "album".length);
      if (query.trim().length == 0) {
        return;
      }
      const youtubePos = query.search(/youtube/i);
      // if (youtubePos != -1 || !spotifyAuthorized) {
      // search for youtube playlist
      query =
        youtubePos != -1
          ? this.removeString(query, youtubePos, "youtube".length)
          : query;
      if (query.trim().length == 0) {
        return;
      }
      this.searchYoutubePlaylist(query);
      return;
      // }
      // search for spotify album
      this.searchSpotifyAlbum(query);
    } else if (playlistPos != -1) {
      console.log("Searching for playlist...");
      // remove playlist from search query
      query = this.removeString(query, playlistPos, "playlist".length);
      if (query.trim().length == 0) {
        return;
      }
      const youtubePos = query.search(/youtube/i);
      // if (youtubePos != -1 || !spotifyAuthorized) {
      // search for youtube playlist
      query =
        youtubePos != -1
          ? this.removeString(query, youtubePos, "youtube".length)
          : query;
      if (query.trim().length == 0) {
        return;
      }
      this.searchYoutubePlaylist(query);
      return;
      // }
      // search for spotify album
      this.searchSpotifyAlbum(query);
    } else {
      const youtubePos = query.search(/youtube/i);
      // if (youtubePos != -1 || !spotifyAuthorized) {
      // search for video
      query =
        youtubePos != -1
          ? this.removeString(query, youtubePos, "youtube".length)
          : query;
      if (query.trim().length == 0) {
        return;
      }
      this.searchYoutube(query);
      return;
      // }
      this.searchSpotify(query);
    }
  }

  removeString(a: string, index: number, length: number): string {
    const array = [...a];
    array.splice(index, length);
    return array.join("");
  }

  clearResults(): void {
    this.results.next([]);
  }
  getLists(): void {
    this.getUserHistory();
    this.getUserMostAdded();
    this.getUserFavorites();
    this.auth.youtubeAuth.subscribe((status) => {
      if (status) {
        this.getYoutubeLists();
      }
    });
    this.auth.spotifyAuth.subscribe((status) => {
      if (status) {
        this.getSpotifyLists();
      }
    });
  }

  updateLists(): void {
    const playlists: Playlist[] = [];
    playlists.push({
      title: "Favorites",
      source: "firestore",
      songs: [...this.userFavorites.value.values()],
    });
    playlists.push({
      title: "Most Added",
      source: "firestore",
      songs: this.userMostAdded.value,
    });
    playlists.push({
      title: "History",
      source: "firestore",
      songs: this.userHistory.value,
    });
    playlists.push(...this.otherLists);
    this.playlists.next(playlists);
  }

  // Checks Favorite list to see if song is favorited
  isFavorite(id: string): boolean {
    return this.userFavorites.value.get(id) ? true : false;
  }

  // Toggles favorite status for song
  toggleFavorite(song: Song): void {
    const favorites = this.userFavorites.value;
    const isFavorite = favorites.get(song.id) ? true : false;
    console.log(isFavorite);
    const header = new HttpHeaders({
      "Content-Type": "application/json",
    });
    const path = `${this.ApiPath}/users/${this.auth.user.value.uid}/favorites/songs/${song.id}`;
    let request;
    if (isFavorite){
      request = this.http.delete(path, { headers: header });
      favorites.delete(song.id);
    }
    else{
      request = this.http.post(path, {song: song }, { headers: header });
      favorites.set(song.id, song);
    } 

    request.subscribe(
      (response) => {
        console.log(response);
        this.userFavorites.next(favorites);
      },
      (error) => console.error(error)
    );
    // if (song.source === 'spotify' && !song.id) {
    //   this.toggleSpotifyFavorite(song);
    //   return;
    // }
    // const date = new Date();
    // const uid = this.auth.user.value.id;
    // const ref = this.firestore
    //   .collection('users/' + uid + '/favorites')
    //   .doc(song.id);
    // if (this.isFavorite(song.id)) {
    //   this.userFavorites.value.delete(song.id);
    //   ref.delete();
    // } else {
    //   this.userFavorites.value.set(song.id, song);
    //   ref.set({ ...song, date });
    // }
  }
  // Select list to be shown
  selectList(playlist: Playlist) {
    this.selectedList.next(playlist);
  }

  // Return to Music Player
  deselectList() {
    this.selectedList.next(undefined);
  }

  toggleSettings() {
    this.settings.next(!this.settings.value);
  }

  // Check URL is a valid URL
  // Primarily used to check for valid Youtube URLs
  validURL(str: string): boolean {
    const pattern = new RegExp(
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

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  fixStringFormatting(str: string): string {
    // str = str.replace(/&#39;/g, "'");
    // str = str.replace(/&amp;/g, "&");
    // str = str.replace(/&quot;/g, "\"");
    return str;
  }
}
