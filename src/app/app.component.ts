import { Component } from '@angular/core';
import { catchError, Observable, of, startWith, map, BehaviorSubject } from 'rxjs';
import { DataState } from './enum/data-state.enum';
import { AppState } from './interface/app-state';
import { CustomeResponse } from './interface/custom-response';
import { ServerService } from './service/server.service';
import { ServerStatus } from './enum/Status.enum'
import { Server } from './interface/server';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  appState$:Observable<AppState<CustomeResponse>>;
  
  readonly DataState = DataState
  readonly status = ServerStatus
  
  private filterSubject = new BehaviorSubject<string>('');
  filterStatus$ = this.filterSubject.asObservable();
  
  private dataSubject = new BehaviorSubject<CustomeResponse>(null);
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  
  constructor(private serverService:ServerService){}

  ngOnInit(): void{    
    this.appState$ = this.serverService.servers$
    .pipe(
      map(response => {
        console.log(response)
        this.dataSubject.next(response);
        return {dataState: DataState.LOADED_STATE, appData: {...response, data:{servers: response.data.servers.reverse()}}}
      }),
      startWith({dataState: DataState.LOADING_STATE}),
      catchError((error:string) => {
        return of({dataState: DataState.ERROR_STATE, error : error})
      })
    )
  }

  pingServer(ipAddress:string): void{      
    //Server with this ip address will have the spinner
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
    .pipe(
      map(response => {
        const index = this.dataSubject.value.data.servers.findIndex(server => 
            server.id === response.data.server.id
          )
        //console.log(index)
        this.dataSubject.value.data.servers[index] = response.data.server;
        //console.log(this.dataSubject.value.data.servers)
        this.filterSubject.next("");
        return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
      }),
      startWith({dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}),
      catchError((error:string) => {
        this.filterSubject.next("");
        return of({dataState: DataState.ERROR_STATE, error : error})
      })
    )
  }

  filterServer(event$): void{    
    const status = event$.target.value;
    console.log(status)
    this.appState$ = this.serverService.filter$(status,this.dataSubject.value)
    .pipe(
      map(response => {        
        return {dataState: DataState.LOADED_STATE, appData: response}
      }),
      startWith({dataState: DataState.LOADING_STATE, appData: this.dataSubject.value}),
      catchError((error:string) => {
        return of({dataState: DataState.ERROR_STATE, error : error});
      })
    )
  }

  saveServer(serverForm:NgForm): void{     
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value as Server)
    .pipe(
      map(response => {
        this.dataSubject.next(
          {...response, data:{ servers: [response.data.server, ...this.dataSubject.value.data.servers]}}
        );
        document.getElementById("closeModal").click();
        this.isLoading.next(false);
        serverForm.resetForm({status: this.status.SERVER_DOWN})
        return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
      }),
      startWith({dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}),
      catchError((error:string) => {
        this.isLoading.next(false);
        return of({dataState: DataState.ERROR_STATE, error : error})
      })
    )
  }

  deleteServer(server:Server): void{   
    this.appState$ = this.serverService.delete$(server.id)
    .pipe(
      map(response => {
        this.dataSubject.next(
          { ...response, data: { servers: this.dataSubject.value.data.servers.filter(s => s.id !== server.id) }}
        )
        return {dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}
      }),
      startWith({dataState: DataState.LOADED_STATE, appData: this.dataSubject.value}),
      catchError((error:string) => {
        this.filterSubject.next("");
        return of({dataState: DataState.ERROR_STATE, error : error})
      })
    )
  }

  printReport():void{
    let dataType = 'application/vnd.ms-excel.sheet.binary.macroEnabled.12';
    let table = document.getElementById("serverTable");
    let tableHtml = table.outerHTML.replace(/ /g,'%20');
    let downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:'+ dataType + ',' + tableHtml;
    downloadLink.download = 'server-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  toggleModal(){
    var x = document.getElementById("addServerModal");
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }
}
