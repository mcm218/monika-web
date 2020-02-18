import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { CookieService } from "ngx-cookie-service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";
import { AngularFireAuth } from "@angular/fire/auth";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  discordTokenUrl = "https://discordapp.com/api/oauth2/token";
  spotifyTokenUrl = "https://accounts.spotify.com/api/token";

  discordPath = "https://discordapp.com/api/";

  authenticated = new BehaviorSubject<boolean>(false);
  guildVerified = new BehaviorSubject<boolean>(false);
  youtubeAuth = new BehaviorSubject<boolean>(false);
  spotifyAuth = new BehaviorSubject<boolean>(false);
  selectedServer = new BehaviorSubject<any>(undefined);
  servers = new BehaviorSubject<any[]>(undefined);
  user = new BehaviorSubject<any>(undefined);

  discordAccessToken: string;
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private router: Router,
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore
  ) {}

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
          // await this.delay(200);
          console.log(response);
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
    var index = url.search(/login/i);
    if (index == -1) {
      url += "login";
    }
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
          // await this.delay(200);
          this.authenticated.next(true);
          console.log(response);
          console.log(response["access_token"]);
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

  // Get
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
        error => console.error(error)
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
          // await this.delay(200);
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

  // Youtube
}
