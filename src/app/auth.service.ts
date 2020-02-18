import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  authenticated = new BehaviorSubject<boolean>(false);
  selectedServer = new BehaviorSubject<any>(undefined);
  servers = new BehaviorSubject<any[]>(undefined);
  constructor() {}

  authenticate(): void {
    this.getServers();
    this.authenticated.next(true);
  }

  getServers(): void {
    console.log("Getting servers...");
    var servers = [];
    servers.push({
      name: "Test Server",
      thumbnail:
        "https://cdn.discordapp.com/icons/673878842628112414/8b6c95c95fdace21b12c169beaedd8e7",
      id: "0"
    });
    servers.push({
      name: "Just Monika",
      thumbnail:
        "https://cdn.discordapp.com/icons/523720897593606155/c779e1b973dbaae7726654c9d2d818e4",
      id: "1"
    });
    this.selectedServer.next(servers[0]);
    this.servers.next(servers);
  }
  selectServer(server: any): void {
    this.selectedServer.next(server);
  }
}
