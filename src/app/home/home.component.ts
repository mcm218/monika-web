import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService, Playlist, Song } from "../db.service";
import { faCog, faHome } from "@fortawesome/free-solid-svg-icons";
import { LoginComponent } from "../login/login.component";
import { MusicPlayerComponent } from "../music-player/music-player.component";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent implements OnInit {
  authenticated: boolean = false;
  selectedServer: any;
  servers: any[];
  playlists: Playlist[];
  selectedList: Playlist;
  queue: Song[];
  currentSong: Song;

  settings: boolean = false;

  faCog = faCog;
  faHome = faHome;

  constructor(private auth: AuthService, private db: DbService) {
    this.auth.authenticated.subscribe(authenticated => {
      this.authenticated = authenticated;
      if (authenticated) {
        console.info("User Authenticated");
        this.db.getQueue();
        this.db.getPlaylists();
        this.auth.servers.subscribe(servers => (this.servers = servers));
        this.auth.selectedServer.subscribe(
          server => (this.selectedServer = server)
        );
        this.db.playlists.subscribe(playlists => (this.playlists = playlists));
        this.db.selectedList.subscribe(list => (this.selectedList = list));
        this.db.queue.subscribe(queue => (this.queue = queue));
        this.db.currentSong.subscribe(song => (this.currentSong = song));
      } else {
        console.info("User Not Authenticated");
      }
    });
  }

  ngOnInit() {}

  selectServer(server: any): void {
    this.auth.selectServer(server);
  }

  openSettings(): void {
    this.settings = !this.settings;
  }
}
