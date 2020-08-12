import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFireFunctions } from "@angular/fire/functions";
import { CookieService } from "ngx-cookie-service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  static selectedServer = new BehaviorSubject<any>(undefined);

  discordTokenUrl = "https://discordapp.com/api/oauth2/token";
  spotifyTokenUrl = "https://accounts.spotify.com/api/token";
  youtubeTokenUrl = "https://oauth2.googleapis.com/token";

  discordPath = "https://discordapp.com/api/";

  ApiPath = "https://rulwogx4wf.execute-api.us-east-2.amazonaws.com/Development/";
  // ApiPath = "http://localhost:3000/";
  // ApiPath = "http://66.42.90.210:3000/"

  DiscordAuthPath = this.ApiPath + "api/auth/discord";
  SpotifyAuthPath = this.ApiPath + "api/auth/spotify";
  YouTubeAuthPath = this.ApiPath + "api/auth/youtube";

  SpotifyRefreshPath = this.ApiPath + "api/auth/spotify/refresh";
  YouTubeRefreshPath = this.ApiPath + "api/auth/youtube/refresh";
  DiscordRefreshPath = this.ApiPath + "api/auth/discord/refresh";



  authenticated = new BehaviorSubject<boolean>(false);
  guildVerified = new BehaviorSubject<boolean>(false);
  youtubeAuth = new BehaviorSubject<boolean>(false);
  spotifyAuth = new BehaviorSubject<boolean>(false);
  servers = new BehaviorSubject<any[]>(undefined);
  user = new BehaviorSubject<any>(undefined);

  public isElectron = false;

  youtubeAccessToken: string;
  discordAccessToken: string;
  spotifyAccessToken: string;

  authSub: Subscription;
  constructor(
    private http: HttpClient,
    private router: Router,
    private fireAuth: AngularFireAuth,
    private fireFunctions: AngularFireFunctions,
    private firestore: AngularFirestore
  ) {}

  firebaseSignIn(user: any) {
    this.fireFunctions
      .httpsCallable("getUserToken")({ userId: user.id })
      .subscribe(async (res) => {
        if (res.status == 400) {
          console.log(res.msg);
        } else if (res.customToken) {
          console.log("Signing user in...");
          await this.fireAuth.auth.signInWithCustomToken(res.customToken);
          console.log(this.fireAuth.auth.currentUser.uid);
          this.user.next(user);
          // Load access tokens from Firebase
          this.loadUserData(user);
        }
      });
  }
  async uploadAuthData(id: string, url: string, code: string) {
    console.log("Uploading auth data...");
    await this.firestore
      .collection("temp")
      .doc(id)
      .set({ url: url, code: code }, { merge: true });
  }

  async desktopAuthorize(id: string, type: string) {
    this.isElectron = true;
    await this.firestore
      .collection("temp")
      .doc(id)
      .set({ type: type }, { merge: true })
      .then(() => {
        // Set up listener
        console.log("Listening...");
        this.authSub = this.firestore
          .collection("temp")
          .doc(id)
          .snapshotChanges()
          .subscribe((snapshot) => {
            // TODO: Create object for authData
            const data = snapshot.payload.data() as any;
            if (data.url && data.code) {
              if (data.type === "discord") {
                console.log("User authenticated!");
                this.authorizeDiscord(data.url, data.code);
                this.authSub.unsubscribe();
              } else if (data.type === "spotify") {
                this.authorizeSpotify(data.url, data.code);
                this.authSub.unsubscribe();
              } else if (data.type === "youtube") {
                this.authorizeYoutube(data.url, data.code);
                this.authSub.unsubscribe();
              }
              this.firestore.collection("temp").doc(id).delete();
            }
          });
      });
  }

  authorize(url: string, code: string): void {
    if (localStorage.getItem("discord-token")) {
      //authorize spotify
      if (localStorage.getItem("spotify-token")) {
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
    // Local Server
    let response = this.http.post(
      this.DiscordAuthPath + `/${code}`,
      { code: code, uri: url, id: localStorage.getItem("id") },
      {
        headers: new HttpHeaders({
          "Content-Type": "application/json"
        }),
      }
    );

    response.subscribe(
      (response) => {
        this.authenticated.next(true);
        let res = response as {
          access_token: string;
          expiration: string;
          id: string;
          guilds: Array<any>;
          user: any;
        };
        this.discordAccessToken = res.access_token;
        localStorage.setItem("id", res.id);
        localStorage.setItem("discord-token", res.access_token);
        localStorage.setItem("discord-expiration", res.expiration);
        console.log(res.guilds);
        this.servers.next(res.guilds);
        this.firebaseSignIn(res.user);
        if (res.guilds.length > 0) {
          AuthService.selectedServer.next(res.guilds[0]);
          this.guildVerified.next(true);
          console.log("Guild verified");
          // this.getUser();
        }
        // this.verifyServer();
        this.router.navigate(["/"]);
      },
      (error) => {
        localStorage.clear();
        console.error(error);
        this.authenticated.next(false);
        this.fireAuth.auth.signOut();
      }
    );
  }

  // Refresh Discord Access Token
  discordRefreshToken() {
    var url = window.location.href;
    // Local Server
    let response = this.http.post(
      this.DiscordRefreshPath,
      { uri: url, id: localStorage.getItem("id") },
      {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
        }),
      }
    );

    response.subscribe(
      (response) => {
        this.authenticated.next(true);
        let res = response as { access_token: string; expiration: string };
        this.discordAccessToken = res.access_token;
        this.verifyServer();
      },
      (error) => {
        console.error(error);
        this.authenticated.next(false);
        this.fireAuth.auth.signOut();
      }
    );
  }

  // Verify user is part of a valid server
  verifyServer(): void {
    console.log("Verifying guild membership...");
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.discordAccessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });
    this.http
      .get(this.discordPath + "users/@me/guilds", { headers: headers })
      .subscribe(
        (response) => {
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
            AuthService.selectedServer.next(servers[0]);
            this.guildVerified.next(true);
            console.log("Guild verified");
            this.getUser();
          }
        },
        (error) => {
          console.error(error);
          if (error.code == 401 || error.code == 403) {
            this.authenticated.next(false);
            localStorage.clear();
          }
        }
      );
  }

  selectServer(server: any): void {
    AuthService.selectedServer.next(server);
  }

  getUser(): void {
    console.log("Getting Discord user...");
    if (!this.authenticated) {
      return;
    }
    var headers = new HttpHeaders({
      Authorization: `Bearer ${this.discordAccessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });
    this.http
      .get(this.discordPath + "users/@me", { headers: headers })
      .subscribe(
        (response) => {
          let user = response as any;
          this.firebaseSignIn(user);
          // this.verifyVoice();
        },
        (error) => {
          console.log(error);
        }
      );
  }

  // Creates User collection for storing history, favorites
  async updateUser(user: any): Promise<void> {
    if (localStorage.getItem("spotify-token")) {
      user.spotifyAccessToken = localStorage.getItem("spotify-token");
      user.spotifyExpiration = new Date(
        localStorage.getItem("spotify-expiration")
      ).toString();
      user.spotifyRefreshToken = localStorage.getItem("spotify-refresh-token");
    }
    if (localStorage.getItem("youtube-token")) {
      user.youtubeAccessToken = localStorage.getItem("youtube-token");
      user.youtubeExpiration = new Date(
        localStorage.getItem("youtube-expiration")
      ).toString();
      user.youtubeRefreshToken = localStorage.getItem("youtube-refresh-token");
    }
    await this.firestore
      .collection("users")
      .doc(user.id)
      .set(user, { merge: true });
  }

  loadUserData(user: any): void {
    this.firestore
      .collection("users")
      .doc(user.id)
      .get()
      .subscribe((docSnapshot) => {
        let data = docSnapshot.data();
        if (!localStorage.getItem("spotify-token") && data.spotifyAccessToken) {
          this.spotifyAccessToken = data.spotifyAccessToken;
          localStorage.setItem("spotify-token", data.spotifyAccessToken);
          localStorage.setItem("spotify-expiration", data.spotifyExpiration);
          localStorage.setItem(
            "spotify-refresh-token",
            data.spotifyRefreshToken
          );

          this.authorizeSpotify();
        }
        if (!localStorage.getItem("youtube-token") && data.youtubeAccessToken) {
          this.youtubeAccessToken = data.youtubeAccessToken;
          localStorage.setItem("youtube-token", data.youtubeAccessToken);
          localStorage.setItem("youtube-expiration", data.youtubeExpiration);
          localStorage.setItem(
            "youtube-refresh-token",
            data.youtubeRefreshToken
          );

          this.authorizeYoutube();
        }
      });
  }

  // Spotify
  authorizeSpotify(url?: string, code?: string) {
    console.log("Authorizing Spotify");
    // Check AppData for token
    this.spotifyAccessToken = localStorage.getItem("spotify-token");
    if (this.spotifyAccessToken) {
      // If Date.now < expiration
      let expiration: Date = new Date(
        localStorage.getItem("spotify-expiration")
      );
      if (new Date(Date.now()) < expiration) {
        this.spotifyAuth.next(true);
        return;
      } else {
        this.spotifyRefreshToken();
        return;
      }
    } else if (!url || !code) {
      console.log("User not authorized to use Spotify");
      return;
    }
    // Local Server
    let response = this.http.post(
      this.SpotifyAuthPath + `/${code}`,
      { code: code, uri: url, id: localStorage.getItem("id") },
      {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
        }),
      }
    );

    response.subscribe(
      (response) => {
        let res = response as { access_token: string; expiration: string };
        this.spotifyAccessToken = res.access_token;
        localStorage.setItem("spotify-token", res.access_token);
        localStorage.setItem("spotify-expiration", res.expiration);

        this.router.navigate(["/"]);
      },
      (error) => {
        localStorage.clear();
        console.error(error);
        this.router.navigate(["/"]);
      }
    );
  }

  spotifyRefreshToken() {
    console.log("Refreshing Spotify Token...");
    // Local Server
    let response = this.http.post(
      this.SpotifyRefreshPath,
      { id: localStorage.getItem("id") },
      {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
        }),
      }
    );

    response.subscribe(
      (response) => {
        console.log(response);
        let res = response as { access_token: string; expiration: string };
        this.spotifyAccessToken = res.access_token;
        localStorage.setItem("spotify-token", res.access_token);
        localStorage.setItem("spotify-expiration", res.expiration);

        this.router.navigate(["/"]);
      },
      (error) => {
        console.error(error);
      }
    );
  }

  // Youtube

  authorizeYoutube(url?: string, code?: string): void {
    console.log("Authorizing Youtube");
    // Check AppData for token
    this.youtubeAccessToken = localStorage.getItem("youtube-token");
    if (this.youtubeAccessToken) {
      // If Date.now < expiration
      let expiration: Date = new Date(
        localStorage.getItem("youtube-expiration")
      );
      if (new Date(Date.now()) < expiration) {
        this.youtubeAuth.next(true);
        return;
      } else {
        this.youtubeRefreshToken();
        return;
      }
    } else if (!url || !code) {
      console.log("User not authorized to use Youtube");
      return;
    }
    var body = new URLSearchParams();
    body.set("client_id", environment.youtubeData.client_id);
    body.set("client_secret", environment.youtubeData.client_secret);
    body.set("grant_type", "authorization_code");
    body.set("code", code);
    body.set("redirect_uri", url);
    var headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    });
    this.http
      .post(this.youtubeTokenUrl, body.toString, { headers: headers })
      .pipe()
      .subscribe(
        (response) => {
          this.youtubeAccessToken = response["access_token"];
          this.youtubeAuth.next(true);
          localStorage.setItem("youtube-token", response["access_token"]);
          localStorage.setItem(
            "youtube-expiration",
            new Date(
              new Date().getTime() + Number(response["expires_in"] * 1000)
            ).toString()
          );
          localStorage.setItem(
            "youtube-refresh-token",
            response["refresh_token"]
          );

          if (!this.isElectron) {
            this.router.navigate(["/"]);
          }
        },
        (error) => {
          localStorage.removeItem("youtube-refresh-token");
          console.log(error);
        }
      );

    // Local Server
    let response = this.http.post(
      this.YouTubeAuthPath,
      { code: code, uri: url },
      {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
        }),
      }
    );

    response.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
  }

  youtubeRefreshToken(): void {
    console.log("Refreshing Youtube Token...");
    var body = new URLSearchParams();
    var refreshToken = localStorage.getItem("youtube-refresh-token");
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", refreshToken);
    var headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        environment.youtubeData.client_id +
          ":" +
          environment.youtubeData.client_secret
      )}`,
      "Content-Type": "application/x-www-form-urlencoded",
    });
    this.http
      .post(this.youtubeTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        (response) => {
          this.youtubeAccessToken = response["access_token"];
          this.youtubeAuth.next(true);
          localStorage.setItem("youtube-token", response["access_token"]);
          localStorage.setItem(
            "youtube-expiration",
            new Date(
              new Date().getTime() + Number(response["expires_in"] * 1000)
            ).toString()
          );
        },
        (error) => {
          localStorage.removeItem("youtube-refresh-token");
          console.log(error);
        }
      );

    // Local Server
    let response = this.http.post(
      this.YouTubeRefreshPath,
      {},
      {
        headers: new HttpHeaders({
          "Content-Type": "application/json",
        }),
      }
    );

    response.subscribe(
      (response) => {
        console.log(response);
      },
      (error) => console.error(error)
    );
  }
}
