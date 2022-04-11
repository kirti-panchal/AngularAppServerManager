import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, Subscriber, tap, throwError} from 'rxjs';
import { ServerStatus } from '../enum/Status.enum';
import { CustomeResponse } from '../interface/custom-response';
import { Server } from '../interface/server';

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  private readonly url = 'http://localhost:8080'

  constructor(private http: HttpClient) { }

  servers$ = <Observable<CustomeResponse>>
    this.http.get<CustomeResponse>(`${this.url}/server/list`)
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    );

  save$ = (server:Server) => <Observable<CustomeResponse>>
  this.http.post<CustomeResponse>(`${this.url}/server/save`,server)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  ping$ = (ipAddress:string) => <Observable<CustomeResponse>>
  this.http.get<CustomeResponse>(`${this.url}/server/ping/${ipAddress}`)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  delete$ = (serverId:number) => <Observable<CustomeResponse>>
  this.http.delete<CustomeResponse>(`${this.url}/server/delete/${serverId}`)
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  );

  getserver$ = (id:number) =><Observable<CustomeResponse>>
    this.http.get<CustomeResponse>(`${this.url}/server/get/${id}`)
    .pipe(
      tap(console.log),
      catchError(this.handleError)
    )
    
  filter$ = (status:ServerStatus, response:CustomeResponse) => <Observable<CustomeResponse>>
  new Observable<CustomeResponse>(
    subscriber => {
      console.log(response);
      subscriber.next(
        status === ServerStatus.ALL ? { ...response, message: `servers filtered by ${ServerStatus.ALL}`} :
        {
          ...response,
          //check if we have servers or no servers
          //if we have servers then check the stataus is down or up
          // and as per the status set the message string
          message: response.data.servers?.filter(server => server.status === status).length > 0 ? 
          `Servers filtered by ${status === ServerStatus.SERVER_UP ? `SERVER UP` : `SERVER:DOWN`} status` :
          `No servers available`,
          data: {servers: response.data.servers?.filter(server => server.status === status)}
        }
      );
      subscriber.complete();
    }
  )
  .pipe(
    tap(console.log),
    catchError(this.handleError)
  )

  private handleError(error:HttpErrorResponse):Observable<never>{
    console.log(error)
    return throwError(`An Error occured - Error Code: ${error.status}`);
  };
}

