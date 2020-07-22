import { NgModule, OnInit } from "@angular/core";
import { Routes, RouterModule, ActivatedRoute } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { DesktopAuthComponent } from './desktop-auth/desktop-auth.component';

const routes: Routes = [
  { path: "", component: HomeComponent }, { path: "auth", component: DesktopAuthComponent },
  { path: "/mobile/auth", component: HomeComponent }, { path: "auth", component: DesktopAuthComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule implements OnInit { 

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
