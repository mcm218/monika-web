import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "../auth.service";

@Component({
  selector: 'app-desktop-auth',
  templateUrl: './desktop-auth.component.html',
  styleUrls: ['./desktop-auth.component.scss']
})
export class DesktopAuthComponent implements OnInit {
  discordUrl;
  constructor(private auth: AuthService, private route: ActivatedRoute) { }

  ngOnInit() {
    // read code

    this.route.queryParams.subscribe(async params => {
      const code = params["code"];
      const state = params["state"];
      const url = window.location.href.split("?")[0];
      if (code && state && url) {
        this.auth.authorize(url, code);
        // save data to users/node-machine-id
        await this.auth.uploadAuthData(state, url, code);
        window.close();
        // close page
      } else {
        console.log("Something is missing!");
      }
    });
  }
}
