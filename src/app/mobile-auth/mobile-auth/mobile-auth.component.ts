import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-mobile-auth',
  templateUrl: './mobile-auth.component.html',
  styleUrls: ['./mobile-auth.component.css']
})
export class MobileAuthComponent implements OnInit {

  constructor(
    private route: ActivatedRoute
  ){

  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code: string = params["code"];
      if (code) {
        window.open("MonikaXamarin://?code=" + code, "_self");
      }
    });
  }

}
