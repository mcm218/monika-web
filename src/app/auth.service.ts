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
  ) { }


  firebaseSignIn(user: any) {
    this.fireFunctions.httpsCallable("getUserToken")({ userId: user.id }).subscribe(async res => {
      if (res.status == 400) {
        console.log(res.msg);
      } else if (res.customToken) {
        console.log("Signing user in...");
        await this.fireAuth.auth.signInWithCustomToken(res.customToken);
        console.log(this.fireAuth.auth.currentUser.uid);
        this.user.next(user);
        await this.updateUser(user);
        // Load access tokens from Firebase
        this.loadUserData(user);
      }
    });

  }
  async uploadAuthData(id: string, url: string, code: string) {
    console.log("Uploading auth data...")
    await this.firestore.collection("temp").doc(id).set({ url: url, code: code }, { merge: true });
  }

  async desktopAuthorize(id: string, type: string) {
    this.isElectron = true;
    await this.firestore.collection("temp").doc(id).set({ type: type }, { merge: true }).then(() => {
      // Set up listener
      console.log("Listening...")
      this.authSub = this.firestore.collection("temp").doc(id).snapshotChanges().subscribe(snapshot => {
        // TODO: Create object for authData
        const data = snapshot.payload.data() as any;
        if (data.url && data.code) {
          if (data.type === "discord") {
            console.log("User authenticated!")
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
    // Check AppData for token
    this.discordAccessToken = localStorage.getItem("discord-token");
    if (this.discordAccessToken) {
      // If Date.now < expiration
      let expiration: Date = new Date(localStorage.getItem("discord-expiration"));
      if (new Date(Date.now()) < expiration) {
        this.verifyServer();
        this.authenticated.next(true);
        return;
      } else {
        this.discordRefreshToken();
        return;
      }
    } else if (!url || !code) {
      this.fireAuth.auth.signOut();
      console.log("User not authorized to use Discord");
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
          // Set tokens in AppData
          localStorage.setItem("discord-token", response["access_token"]);
          localStorage.setItem("discord-expiration", new Date(
            new Date().getTime() + Number(response["expires_in"] * 1000)
          ).toString());
          localStorage.setItem("discord-refresh-token", response["refresh_token"]);

          this.verifyServer();
          if (!this.isElectron) {
            this.router.navigate(["/"]);
          }
        },
        error => {
          this.authenticated.next(false);
          this.fireAuth.auth.signOut();
          console.error(error);
          if (!this.isElectron) {
            this.router.navigate(["/"]);
          }
        }
      );
  }

  // Refresh Discord Access Token
  discordRefreshToken() {
    var url = window.location.href;
    var body = new URLSearchParams();
    var refreshToken;
    refreshToken = localStorage.getItem("discord-refresh-token");
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
          // Set tokens in local storage
          localStorage.setItem("discord-token", response["access_token"]);
          localStorage.setItem("discord-expiration", new Date(
            new Date().getTime() + Number(response["expires_in"] * 1000)
          ).toString());

          this.verifyServer();
        },
        error => {
          this.authenticated.next(false);
          this.fireAuth.auth.signOut();
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
            localStorage.clear();
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
          this.firebaseSignIn(user);
          // this.verifyVoice();
        },
        error => {
          console.log(error);
        }
      );
  }

  // Creates User collection for storing history, favorites
  async updateUser(user: any): Promise<void> {
    if (localStorage.getItem("spotify-token")) {
      user.spotifyAccessToken = localStorage.getItem("spotify-token");
      user.spotifyExpiration = new Date(localStorage.getItem("spotify-expiration")).toString();
      user.spotifyRefreshToken = localStorage.getItem("spotify-refresh-token");
    }
    if (localStorage.getItem("youtube-token")) {
      user.youtubeAccessToken = localStorage.getItem("youtube-token");
      user.youtubeExpiration = new Date(localStorage.getItem("youtube-expiration")).toString();
      user.youtubeRefreshToken = localStorage.getItem("youtube-refresh-token");
    }
    await this.firestore
      .collection("users")
      .doc(user.id)
      .set(user, { merge: true });
  }

  loadUserData(user: any): void {
    this.firestore.collection("users").doc(user.id).get().subscribe(docSnapshot => {
      let data = docSnapshot.data();
      if (!localStorage.getItem("spotify-token") && data.spotifyAccessToken) {
        this.spotifyAccessToken = data.spotifyAccessToken;
        localStorage.setItem("spotify-token", data.spotifyAccessToken);
        localStorage.setItem("spotify-expiration", data.spotifyExpiration);
        localStorage.setItem("spotify-refresh-token", data.spotifyRefreshToken);

        this.authorizeSpotify();
      }
      if (!localStorage.getItem("youtube-token") && data.youtubeAccessToken) {
        this.youtubeAccessToken = data.youtubeAccessToken;
        localStorage.setItem("youtube-token", data.youtubeAccessToken);
        localStorage.setItem("youtube-expiration", data.youtubeExpiration);
        localStorage.setItem("youtube-refresh-token", data.youtubeRefreshToken);

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
      let expiration: Date = new Date(localStorage.getItem("spotify-expiration"));
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
          // Set tokens in local storage
          localStorage.setItem("spotify-token", response["access_token"]);
          localStorage.setItem("spotify-expiration", new Date(
            new Date().getTime() + Number(response["expires_in"] * 1000)
          ).toString());
          localStorage.setItem("spotify-refresh-token", response["refresh_token"]);
          if (this.user.value) {
            this.updateUser(this.user.value);
          }
          if (!this.isElectron) {
            this.router.navigate(["/"]);
          }
        },
        error => {
          if (!localStorage.getItem("youtube-token")) {
            this.authorizeYoutube(url, code);
          }
          console.log(error);
        }
      );
  }

  spotifyRefreshToken() {
    console.log("Refreshing Spotify Token...");
    var body = new URLSearchParams();
    var refreshToken = localStorage.getItem("spotify-refresh-token");
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
          localStorage.setItem("spotify-token", response["access_token"]);
          localStorage.setItem("spotify-expiration", new Date(
            new Date().getTime() + Number(response["expires_in"] * 1000)
          ).toString());
          if (this.user.value) {
            this.updateUser(this.user.value);
          }
        },
        error => {
          localStorage.removeItem("spotify-refresh-token");
          console.log(error);
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
      let expiration: Date = new Date(localStorage.getItem("youtube-expiration"));
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
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.youtubeTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.youtubeAccessToken = response["access_token"];
          this.youtubeAuth.next(true);
          localStorage.setItem("youtube-token", response["access_token"]);
          localStorage.setItem("youtube-expiration", new Date(
            new Date().getTime() + Number(response["expires_in"] * 1000)
          ).toString());
          localStorage.setItem("youtube-refresh-token", response["refresh_token"]);
          if (this.user.value) {
            this.updateUser(this.user.value);
          }
          if (!this.isElectron) {
            this.router.navigate(["/"]);
          }
        },
        error => {
          localStorage.removeItem("youtube-refresh-token");
          console.log(error);
        }
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
      "Content-Type": "application/x-www-form-urlencoded"
    });
    this.http
      .post(this.youtubeTokenUrl, body.toString(), { headers: headers })
      .pipe()
      .subscribe(
        response => {
          this.youtubeAccessToken = response["access_token"];
          this.youtubeAuth.next(true);
          localStorage.setItem("youtube-token", response["access_token"]);
          localStorage.setItem("youtube-expiration", new Date(
            new Date().getTime() + Number(response["expires_in"] * 1000)
          ).toString());
          if (this.user.value) {
            this.updateUser(this.user.value);
          }
        },
        error => {
          localStorage.removeItem("youtube-refresh-token");
          console.log(error);
        }
      );
  }
}
