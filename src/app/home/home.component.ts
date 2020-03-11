import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService, Playlist, Song, MusicController } from "../db.service";
import {
  faCog,
  faHome,
  faVolumeMute,
  faPhoneSlash
} from "@fortawesome/free-solid-svg-icons";
import { ActivatedRoute } from "@angular/router";
import { FormControl } from "@angular/forms";

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
  controller: MusicController;
  user: any;
  onlineUsers: any[];

  query = new FormControl("");

  results: boolean = false;
  settings: boolean = false;

  faCog = faCog;
  faHome = faHome;
  faMicrophoneSlash = faVolumeMute;
  faPhoneSlash = faPhoneSlash;

  constructor(
    private auth: AuthService,
    private db: DbService,
    private route: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    this.auth.guildVerified.subscribe(guildVerified => {
      this.authenticated = guildVerified;
      if (guildVerified) {
        this.auth.servers.subscribe(servers => (this.servers = servers));
        this.auth.selectedServer.subscribe(server => {
          this.selectedServer = server;
          this.db.getMusicPlayerData();
        });
        this.db.queue.subscribe(queue => (this.queue = queue));
        this.db.onlineUsers.subscribe(users => (this.onlineUsers = users));
        this.db.controller.subscribe(
          controller => (this.controller = controller)
        );
        this.db.currentSong.subscribe(song => (this.currentSong = song));
        this.db.results.subscribe(results => {
          this.results = results && results.length > 0;
        });
        this.db.settings.subscribe(settings => (this.settings = settings));
      }
    });
    this.auth.user.subscribe(user => {
      if (user) {
        console.log("Getting user data...");
        this.user = user;
        this.db.getLists();
        this.db.playlists.subscribe(playlists => { this.playlists = playlists; changeDetectorRef.detectChanges() });
        this.db.selectedList.subscribe(list => (this.selectedList = list));
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params["code"];
      const accessToken = params["access_token"];
      const url = window.location.href.split("?")[0];
      if (url.search("file://") != -1) {
        this.auth.isElectron = true;
      }
      if (code) {
        this.auth.authorize(url, code);
      } else {
        this.auth.authorizeDiscord();
        this.auth.authorizeSpotify();
        this.auth.authorizeYoutube();
      }
    });
  }

  selectServer(server: any): void {
    this.auth.selectServer(server);
  }

  openSettings(): void {
    this.db.toggleSettings();
  }

  search(): void {
    this.db.search(this.query.value);
  }
}
