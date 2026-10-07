import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../environments/environment';

export interface AppNotification {
  id: number;
  recipientKey: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  readFlag: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private itemsSubject = new BehaviorSubject<AppNotification[]>([]);
  private unreadSubject = new BehaviorSubject<number>(0);
  private stompClient: Client | null = null;
  private currentSubscription: any = null;

  items$ = this.itemsSubject.asObservable();
  unread$ = this.unreadSubject.asObservable();

  constructor(private api: ApiService, private auth: AuthService) {
    this.auth.isLoggedIn$.subscribe(logged => {
      if (logged) {
        this.refresh();
        this.connectWebSocket();
      } else {
        this.disconnectWebSocket();
        this.itemsSubject.next([]);
        this.unreadSubject.next(0);
      }
    });
  }

  ngOnDestroy(): void {
    this.disconnectWebSocket();
  }

  private connectWebSocket(): void {
    if (this.stompClient && this.stompClient.active) return;

    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiHost}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        const recipientKey = this.auth.isPharmacistOrAdmin() 
            ? `PHARMACY_${this.auth.getActivePharmacyId()}` 
            : this.auth.getEmail();
            
        if (!recipientKey) return;

        const topicStr = this.sanitizeTopic(recipientKey);
        this.currentSubscription = this.stompClient!.subscribe(`/topic/notifications/${topicStr}`, (message: Message) => {
          if (message.body) {
            const newNotification = JSON.parse(message.body);
            const currentItems = this.itemsSubject.value;
            this.itemsSubject.next([newNotification, ...currentItems]);
            this.unreadSubject.next(this.unreadSubject.value + 1);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    this.stompClient.activate();
  }

  private disconnectWebSocket(): void {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
      this.currentSubscription = null;
    }
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }

  private sanitizeTopic(key: string): string {
    return key.replace(/@/g, '_at_').replace(/:/g, '_').replace(/\./g, '_');
  }

  private pharmacyIdParam(): number | undefined {
    return this.auth.isPharmacistOrAdmin() ? this.auth.getActivePharmacyId() : undefined;
  }

  refresh(): void {
    if (!this.auth.getCurrentRole()) return;
    this.api.getNotifications(this.pharmacyIdParam()).subscribe({
      next: (list) => {
        this.itemsSubject.next(list || []);
        this.unreadSubject.next((list || []).filter((n: AppNotification) => !n.readFlag).length);
      },
      error: () => undefined
    });
  }

  markRead(id: number): void {
    this.api.markNotificationRead(id, this.pharmacyIdParam()).subscribe({
      next: () => this.refresh(),
      error: () => undefined
    });
  }

  markAllRead(): void {
    this.api.markAllNotificationsRead(this.pharmacyIdParam()).subscribe({
      next: () => this.refresh(),
      error: () => undefined
    });
  }
}
