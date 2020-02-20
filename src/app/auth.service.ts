import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { CookieService } from "ngx-cookie-service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  discordTokenUrl = "https://discordapp.com/api/oauth2/token";
  spotifyTokenUrl = "https://accounts.spotify.com/api/token";
  youtubeTokenUrl = "https://oauth2.googleapis.com/token";

  discordPath = "https://discordapp.com/api/";

  authenticated = new BehaviorSubject<boolean>(false);
  guildVerified = new BehaviorSubject<boolean>(false);
  youtubeAuth = new BehaviorSubject<boolean>(false);
  spotifyAuth = new BehaviorSubject<boolean>(false);
  selectedServer = new BehaviorSubject<any>(undefined);
  servers = new BehaviorSubject<any[]>(undefined);
  user = new BehaviorSubject<any>(undefined);

  youtubeAccessToken: string;
  discordAccessToken: string;
  spotifyAccessToken: string;

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private router: Router,
    private firestore: AngularFirestore
  ) {}

  authorize(url: string, code: string): void {
    if (this.cookieService.check("discord-token")) {
      //authorize spotify
      if (this.cookieService.check("spotify-token")) {
        this.authorizeYoutube(url, code);
      } else {
        this.authorizeSpotify(url, code);
      }
    } else {
      //authorize discord
      this.authorizeDiscord(url, code);
    }
  }
  //Discord

  // Check if User is Discord Authorized
  // If token is expired, refresh
  // If user has begun authorization process(url/code provided), request access token
  authorizeDiscord(url?: string, code?: string): void {
    console.log("Authorizing Discord");
    if (this.cookieService.check("discord-token")) {
      this.discordAccessToken = this.cookieService.get("discord-token");
      this.verifyServer();
      this.authenticated.next(true);
      return;
    } else if (this.cookieService.check("discord-refresh-token")) {
      this.discordRefreshToken();
      return;
    } else if (!url || !code) {
      console.log("User not authenticated");
      return;
    }
    var body = new URLSearchParams();
    body.set("client_id", environment.discordData.client_id);
    body.set("client_secret", environment.discordData.client_secret);
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", url);
    body.set("scope", environment.discordData.scope);

    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.discordTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.authenticated.next(true);
          this.discordAccessToken = response["access_token"];
          this.cookieService.set(
            "discord-token",
            response["access_token"],
            new Date(
              new Date().getTime() + Number(response["expires_in"] * 1000)
            )
          );
          this.cookieService.set(
            "discord-refresh-token",
            response["refresh_token"]
          );
          this.verifyServer();
          this.router.navigate(["/"]);
        },
        error => {
          console.error(error);
          this.router.navigate(["/"]);
        }
      );
  }

  // Refresh Discord Access Token
  discordRefreshToken() {
    var url = window.location.href;
    var body = new URLSearchParams();
    var refreshToken = this.cookieService.get("discord-refresh-token");
    body.set("client_id", environment.discordData.client_id);
    body.set("client_secret", environment.discordData.client_secret);
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);
    body.set("redirect_uri", url);
    body.set("scope", environment.discordData.scope);
    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.discordTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.authenticated.next(true);
          this.discordAccessToken = response["access_token"];
          this.cookieService.set(
            "discord-token",
            response["access_token"],
            new Date(
              new Date().getTime() + Number(response["expires_in"] * 1000)
            )
          );
          this.cookieService.set(
            "discord-refresh-token",
            response["refresh_token"]
          );
          this.verifyServer();
        },
        error => {
          this.cookieService.delete("discord-refresh-token");
          console.log(error);
        }
      );
  }

  // Verify user is part of a valid server
  verifyServer(): void {
    console.log("Verifying guild membership...");
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.discordAccessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .get(this.discordPath + "users/@me/guilds", { headers: headers })
      .subscribe(
        response => {
          const servers = [];
          let guilds = response as Array<any>;
          for (let guild of guilds) {
            if (
              guild.id == environment.discordData.testGuildId ||
              guild.id == environment.discordData.mainGuildId
            ) {
              servers.push(guild);
            }
          }
          this.servers.next(servers);
          if (servers.length > 0) {
            this.selectedServer.next(servers[0]);
            this.guildVerified.next(true);
            console.log("Guild verified");
            this.getUser();
          }
        },
        error => {
          console.error(error);
          if (error.code == 401 || error.code == 403) {
            this.authenticated.next(false);
            this.cookieService.deleteAll();
          }
        }
      );
  }

  selectServer(server: any): void {
    this.selectedServer.next(server);
  }

  getUser(): void {
    console.log("Getting Discord user...");
    if (!this.authenticated) {
      return;
    }
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.discordAccessToken}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .get(this.discordPath + "users/@me", { headers: headers })
      .subscribe(
        response => {
          let user = response as any;
          this.createUser(user);
          this.user.next(user);
          // this.verifyVoice();
        },
        error => {
          console.log(error);
        }
      );
  }

  // Creates User collection for storing history, favorites
  createUser(user: any): void {
    this.firestore
      .collection("users")
      .doc(user.id)
      .set(user);
  }

  // Spotify
  authorizeSpotify(url?: string, code?: string) {
    console.log("Authorizing Spotify");
    if (this.cookieService.check("spotify-token")) {
      this.spotifyAccessToken = this.cookieService.get("spotify-token");
      this.spotifyAuth.next(true);
      return;
    } else if (this.cookieService.check("spotify-refresh-token")) {
      this.spotifyRefreshToken();
      return;
    } else if (!url || !code) {
      return;
    }
    var body = new URLSearchParams();
    body.set("client_id", environment.spotifyData.client_id);
    body.set("client_secret", environment.spotifyData.client_secret);
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", url);
    body.set("scope", environment.spotifyData.scope);
    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.spotifyTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.spotifyAccessToken = response["access_token"];
          this.spotifyAuth.next(true);
          this.cookieService.set(
            "spotify-token",
            response["access_token"],
            new Date(
              new Date().getTime() + Number(response["expires_in"] * 1000)
            )
          );
          this.cookieService.set(
            "spotify-refresh-token",
            response["refresh_token"]
          );
          this.router.navigate(["/"]);
        },
        error => {
          if (!this.cookieService.check("youtube-token")) {
            this.authorizeYoutube(url, code);
          }
          console.log(error);
        }
      );
  }

  spotifyRefreshToken() {
    console.log("Refreshing Spotify Token...");
    var body = new URLSearchParams();
    var refreshToken = this.cookieService.get("spotify-refresh-token");
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);
    var headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        environment.spotifyData.client_id +
          ":" +
          environment.spotifyData.client_secret
      )}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.spotifyTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          console.log(response);
          this.spotifyAccessToken = response["access_token"];
          this.spotifyAuth.next(true);
          this.cookieService.set(
            "spotify-token",
            response["access_token"],
            new Date(
              new Date().getTime() + Number(response["expires_in"] * 1000)
            )
          );
        },
        error => {
          this.cookieService.delete("spotify-refresh-token");
          console.log(error);
        }
      );
  }

  // Youtube

  authorizeYoutube(url?: string, code?: string): void {
    console.log("Authorizing Youtube");
    if (this.cookieService.check("youtube-token")) {
      this.youtubeAccessToken = this.cookieService.get("youtube-token");
      this.youtubeAuth.next(true);
      return;
    } else if (this.cookieService.check("youtube-refresh-token")) {
      this.youtubeRefreshToken();
      return;
    } else if (!url || !code) {
      return;
    }
    var body = new URLSearchParams();
    body.set("client_id", environment.youtubeData.client_id);
    body.set("client_secret", environment.youtubeData.client_secret);
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", url);
    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.youtubeTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.youtubeAccessToken = response["access_token"];
          this.youtubeAuth.next(true);
          this.cookieService.set(
            "youtube-token",
            response["access_token"],
            new Date(
              new Date().getTime() + Number(response["expires_in"] * 1000)
            )
          );
          this.router.navigate(["/"]);
        },
        error => {
          this.cookieService.delete("youtube-refresh-token");
          console.log(error);
        }
      );
  }

  youtubeRefreshToken(): void {
    console.log("Refreshing Youtube Token...");
    var body = new URLSearchParams();
    var refreshToken = this.cookieService.get("youtube-refresh-token");
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);
    var headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        environment.youtubeData.client_id +
          ":" +
          environment.youtubeData.client_secret
      )}`,
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.youtubeTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.youtubeAccessToken = response["access_token"];
          this.youtubeAuth.next(true);
          this.cookieService.set(
            "youtube-token",
            response["access_token"],
            new Date(
              new Date().getTime() + Number(response["expires_in"] * 1000)
            )
          );
          this.cookieService.set(
            "youtube-refresh-token",
            response["refresh_token"]
          );
        },
        error => {
          this.cookieService.delete("youtube-refresh-token");
          console.log(error);
        }
      );
  }
}
