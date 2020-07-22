import { NgModule, OnInit } from "@angular/core";
import { Routes, RouterModule, ActivatedRoute } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { DesktopAuthComponent } from './desktop-auth/desktop-auth.component';
import { MobileAuthComponent } from './mobile-auth/mobile-auth.component';

const routes: Routes = [
  { path: "", component: HomeComponent },
  { path: "auth", component: DesktopAuthComponent },
  { path: "mobile/auth", component: MobileAuthComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 

}
