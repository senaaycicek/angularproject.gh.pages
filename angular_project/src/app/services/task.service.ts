import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/todos';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<Todo[]> {
    // Get 200 tasks from jsonplaceholder for demo purposes
    const remoteUrl = 'https://jsonplaceholder.typicode.com/todos';
    
    return this.http.get<Todo[]>(remoteUrl).pipe(
      catchError(() => {
        // If remote fails, fall back to local json-server
        console.log('Remote API (jsonplaceholder) failed, using local json-server...');
        return this.http.get<Todo[]>(this.apiUrl);
      })
    );
  }

  getTaskById(id: number): Observable<Todo> {
    // First check localStorage for local tasks (ID >= 201)
    if (id >= 201) {
      const localTasks = localStorage.getItem('localTasks');
      if (localTasks) {
        const tasks: Todo[] = JSON.parse(localTasks);
        const localTask = tasks.find(t => t.id === id);
        if (localTask) {
          console.log(`Found local task ${id} in localStorage:`, localTask);
          return of(localTask);
        }
      }
    }

    // First try local json-server
    return this.http.get<Todo>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => {
        // If local fails, try jsonplaceholder
        console.log(`Local server failed for ID ${id}, trying jsonplaceholder...`);
        return this.http.get<Todo>(`https://jsonplaceholder.typicode.com/todos/${id}`).pipe(
          catchError(() => {
            // If both fail, return a fallback task
            console.log(`Both APIs failed for ID ${id}, returning fallback task`);
            const fallbackTask: Todo = {
              id: id,
              title: `Task #${id} (fallback - not found on server)`,
              completed: false
            };
            return of(fallbackTask);
          })
        );
      })
    );
  }

  createTask(task: Partial<Todo>): Observable<Todo> {
    // Try to post to both local server (for persistence) and handle errors gracefully
    console.log('Creating task:', task);
    
    // First try local json-server for persistence
    return this.http.post<Todo>(this.apiUrl, task).pipe(
      catchError(() => {
        // If local server fails, create a fake response so UI works
        console.log('Local server not available, creating task with fake ID');
        const fakeTask: Todo = {
          id: Math.floor(Math.random() * 10000) + 1000,
          title: task.title || 'New Task',
          completed: task.completed || false
        };
        return of(fakeTask);
      })
    );
  }

  deleteTask(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}