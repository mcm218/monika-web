import { Component, OnInit } from "@angular/core";
import { AuthService } from "../auth.service";
import { DbService, Playlist, Song, MusicController } from "../db.service";
import { faCog, faHome } from "@fortawesome/free-solid-svg-icons";
import { ActivatedRoute } from "@angular/router";

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

  settings: boolean = false;

  faCog = faCog;
  faHome = faHome;

  constructor(
    private auth: AuthService,
    private db: DbService,
    private route: ActivatedRoute
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
        this.db.controller.subscribe(
          controller => (this.controller = controller)
        );
        this.db.currentSong.subscribe(song => (this.currentSong = song));
      }
    });
    this.auth.user.subscribe(user => {
      if (user) {
        this.user = user;
        this.db.getLists();
        this.db.playlists.subscribe(playlists => (this.playlists = playlists));
        this.db.selectedList.subscribe(list => (this.selectedList = list));
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params["code"];
      if (code && !this.auth.authenticated.value) {
        const url = window.location.href.split("?")[0];
        //authorize discord
        this.auth.authorizeDiscord(url, code);
      } else if (code) {
        //authorize spoitfy
        //this.auth.authorizeSpotify();
      } else {
        this.auth.authorizeDiscord();
      }
    });
  }

  selectServer(server: any): void {
    this.auth.selectServer(server);
  }

  openSettings(): void {
    this.settings = !this.settings;
  }
}
