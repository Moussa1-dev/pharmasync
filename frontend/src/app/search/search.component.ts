import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';
import { OfflineCacheService } from '../offline-cache.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import Swal from 'sweetalert2';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Fix leaflet icon issue in angular
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  private map: L.Map | any;
  private routingControl: any;
  private readonly defaultLat = 12.1131;
  private readonly defaultLng = 15.0491;
  query: string = '';
  results: any[] = [];
  loading: boolean = false;
  userLat: number = 12.1131;
  userLng: number = 15.0491;
  onCallOnly: boolean = false;
  stockOnly: boolean = false;
  maxPrice: number | null = null;
  maxDistance: number | null = 10;
  sortBy: 'distance' | 'price' | 'stock' = 'distance';
  allResults: any[] = [];
  nearestPharmacies: any[] = [];
  closestPharmacy: any = null;
  /** Résultat en stock le plus proche du patient (mis en avant automatiquement) */
  closestResult: any = null;
  searchHistory: string[] = [];
  locationStatus: string = 'Position par défaut : N\'Djamena';
  suggestions: string[] = [];
  showSuggestions = false;
  offlineMode = false;
  private suggest$ = new Subject<string>();
  
  isListening: boolean = false;
  recognition: any;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private auth: AuthService,
    private offlineCache: OfflineCacheService
  ) {
    this.initVoiceRecognition();
    this.suggest$.pipe(
      debounceTime(220),
      distinctUntilChanged(),
      switchMap(q => {
        if (!q || q.trim().length < 2) return of([]);
        return this.apiService.suggestMedications(q.trim()).pipe(catchError(() => of([])));
      })
    ).subscribe(list => {
      this.suggestions = list || [];
      this.showSuggestions = this.suggestions.length > 0;
    });
  }

  showModal: boolean = false;
  showToast: boolean = false;
  selectedStock: any = null;
  reservationData = {
    patientName: '',
    patientContact: '',
    quantity: 1,
    deliveryMode: 'RETRAIT',
    deliveryAddress: '',
    prescriptionBase64: '',
    paymentMethod: 'CASH',
    paymentPhone: '',
    stock: { id: null }
  };

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.reservationData.prescriptionBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  initVoiceRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'fr-FR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Supprimer le point final souvent ajouté par la reconnaissance vocale
        this.query = transcript.replace(/\.$/, '').trim();
        this.onSearch();
      };

      this.recognition.onerror = (event: any) => {
        console.error('Erreur de reconnaissance vocale', event.error);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    } else {
      console.warn("L'API de reconnaissance vocale n'est pas supportée par ce navigateur.");
    }
  }

  toggleVoiceSearch(): void {
    if (this.isListening) {
      this.recognition.stop();
    } else {
      if (this.recognition) {
        this.recognition.start();
      } else {
        Swal.fire('Erreur', 'Votre navigateur ne supporte pas la recherche vocale.', 'error');
      }
    }
  }

  ngOnInit(): void {
    this.userLat = this.defaultLat;
    this.userLng = this.defaultLng;
    this.locationStatus = 'Position par défaut : N\'Djamena';
    this.loadSearchHistory();

    this.route.queryParamMap.subscribe(params => {
      const query = params.get('query');
      // Lien "Pharmacies de garde" de l'accueil : filtre de garde activé d'office
      this.onCallOnly = params.get('garde') === '1';
      if (query) {
        this.query = query;
        this.getUserLocation(false, true);
      } else {
        this.getUserLocation(true, true);
      }
    });
  }

  private applyFallbackLocation(reason: string, autoSearchNearest: boolean): void {
    this.userLat = this.defaultLat;
    this.userLng = this.defaultLng;
    this.locationStatus = reason;
    this.loading = false;
    this.onSearch();
  }

  private loadSearchHistory(): void {
    const saved = localStorage.getItem('pharma-search-history');
    this.searchHistory = saved ? JSON.parse(saved) : [];
  }

  private saveSearchHistory(term: string): void {
    if (!term || !term.trim()) {
      return;
    }
    const normalized = term.trim();
    this.searchHistory = [normalized, ...this.searchHistory.filter(item => item !== normalized)].slice(0, 6);
    localStorage.setItem('pharma-search-history', JSON.stringify(this.searchHistory));
  }

  selectHistory(term: string): void {
    this.query = term;
    this.onSearch();
  }

  clearHistory(): void {
    this.searchHistory = [];
    localStorage.removeItem('pharma-search-history');
  }

  /**
   * @param autoSearchNearest lance la recherche des pharmacies proches
   * @param silent si vrai (ouverture de la page), aucun message n'est affiché
   *               en cas d'échec : on utilise simplement N'Djamena par défaut.
   */
  getUserLocation(autoSearchNearest: boolean = false, silent: boolean = false): void {
    // À l'ouverture de la page (silent) : si l'utilisateur a déjà choisi sa
    // position sur ce PC, on l'utilise tout de suite, sans attendre le GPS.
    const savedAtStart = silent ? this.loadSavedPosition() : null;
    if (savedAtStart) {
      this.userLat = savedAtStart.lat;
      this.userLng = savedAtStart.lng;
      this.locationStatus = 'Votre position enregistrée est utilisée (' + savedAtStart.label + ').';
      this.loading = false;
      if (autoSearchNearest || this.query.trim()) {
        this.onSearch();
      } else {
        this.initMap();
      }
      return;
    }

    // Numéro de cette demande : une réponse GPS tardive est ignorée si
    // l'utilisateur a placé sa position à la main entre-temps.
    const requestId = ++this.geoRequestId;
    const isCurrent = () => requestId === this.geoRequestId;

    this.loading = true;
    this.locationStatus = 'Détection de votre position exacte en cours...';

    const fallbackToDefault = () => {
      if (!isCurrent()) {
        return;
      }
      const saved = this.loadSavedPosition();
      if (saved) {
        // PC sans GPS : on réutilise la position choisie la dernière fois
        this.userLat = saved.lat;
        this.userLng = saved.lng;
        this.locationStatus = 'Votre position enregistrée est utilisée (' + saved.label + ').';
      } else {
        this.userLat = this.defaultLat;
        this.userLng = this.defaultLng;
        this.locationStatus = 'Position par défaut (N\'Djamena). Tapez votre quartier ou cliquez sur la carte pour la corriger.';
      }
      this.loading = false;
      if (autoSearchNearest || this.query.trim()) {
        this.onSearch();
      } else {
        this.initMap();
      }
    };

    if (!navigator.geolocation) {
      fallbackToDefault();
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      if (!isCurrent()) {
        return;
      }
      this.userLat = position.coords.latitude;
      this.userLng = position.coords.longitude;
      const precision = Math.round(position.coords.accuracy);
      this.locationStatus = `Position détectée (précision ± ${precision} m)`;
      this.loading = false;

      if (autoSearchNearest) {
        this.query = '';
        this.onSearch();
      } else if (this.query.trim()) {
        this.onSearch();
      } else {
        this.initMap();
      }
    };

    const onFinalError = (error: GeolocationPositionError) => {
      if (!isCurrent()) {
        return;
      }
      console.warn('Geolocation error:', error);

      let errorMsg = 'Impossible d\'obtenir votre position.';
      if (error.code === 1) {
        errorMsg = 'Votre navigateur bloque l\'accès au GPS. Cliquez sur l\'icône cadenas à gauche de la barre d\'adresse (URL), et autorisez la "Position", puis rechargez la page.';
      } else if (error.code === 2) {
        errorMsg = 'Le signal GPS est introuvable sur cet appareil (fréquent sur les PC fixes).';
      } else if (error.code === 3) {
        errorMsg = 'Le délai d\'attente du GPS a expiré.';
      }

      // Message seulement si l'utilisateur a cliqué sur "Utiliser ma position".
      // À l'ouverture de la page, on bascule sans bruit sur N'Djamena.
      if (!silent) {
        Swal.fire({
          icon: 'info',
          title: 'Position non disponible',
          text: errorMsg + ' La position par défaut (N\'Djamena) est utilisée : la recherche fonctionne quand même.',
          confirmButtonText: 'J\'ai compris'
        });
      }

      fallbackToDefault();
    };

    // 1er essai : GPS précis (téléphone). 2e essai : position par Wi-Fi/réseau (PC).
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        if (!isCurrent()) {
          return;
        }
        if (error.code === 1) {
          onFinalError(error); // accès refusé : inutile de réessayer
          return;
        }
        this.locationStatus = 'GPS précis indisponible, recherche de la position par le réseau...';
        navigator.geolocation.getCurrentPosition(onSuccess, onFinalError, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  // ---------- Position manuelle (ordinateur sans GPS) ----------

  /** Texte saisi dans le champ "Mon quartier / adresse" */
  addressQuery = '';
  locatingAddress = false;
  private readonly positionStorageKey = 'pharma-user-position';
  private geoRequestId = 0;

  private loadSavedPosition(): { lat: number; lng: number; label: string } | null {
    try {
      const raw = localStorage.getItem(this.positionStorageKey);
      const pos = raw ? JSON.parse(raw) : null;
      return pos && typeof pos.lat === 'number' && typeof pos.lng === 'number' ? pos : null;
    } catch {
      return null;
    }
  }

  /** Fixe la position du patient, la mémorise et relance la recherche. */
  setManualPosition(lat: number, lng: number, label: string): void {
    this.geoRequestId++; // annule une détection GPS encore en cours
    this.loading = false;
    this.userLat = lat;
    this.userLng = lng;
    this.locationStatus = 'Position choisie : ' + label + ' (mémorisée pour la prochaine fois).';
    try {
      localStorage.setItem(this.positionStorageKey, JSON.stringify({ lat, lng, label }));
    } catch {
      // stockage plein ou désactivé : la position reste valable pour cette visite
    }
    this.onSearch();
  }

  /** Quartiers officiels de N'Djamena (10 arrondissements) : suggestions de saisie. */
  readonly quartiers: string[] = [
    'Farcha', 'Milezi', 'Madjorio', 'Guilmeye', 'Djougoulier', 'Karkandjeri', 'Amsinéné', 'Guinébor',
    'N\'Djamena-Koudou', 'Massil Abcoma', 'Zaraf', 'Allaya', 'Ardeb-Timan', 'Antona',
    'Djamba Ngato', 'Mardjandaffack', 'Bololo', 'Goudji', 'Klémat',
    'Gardolé', 'Ambassatna', 'Ardep Djoumal', 'Sabangali', 'Kabalaye', 'Djambalbahr',
    'Repos I', 'Repos II', 'Naga I', 'Naga II', 'Blabine',
    'Ridina', 'Am-Riguebé', 'Karkandjie', 'Champ de Fils',
    'Moursal', 'Paris-Congo',
    'Chagoua', 'Dembé', 'Dembé 2', 'Ambatta', 'Ambatta 2', 'Boutalbagara', 'Kourmanadji', 'Atrone',
    'Amtoukoui', 'Habena', 'Gassi', 'Kilwiti', 'Karkouta', 'Djinio',
    'Diguel', 'Ndjari', 'Angabo', 'Zaffaye-Est', 'Zaffaye-Ouest', 'Machaga', 'Amtoukougne Koudou',
    'Walia', 'Ngoumna', 'Digangali', 'Ngueli', 'Kabé', 'Toukra', 'Gardolé 2', 'Toukra Massa',
    'Gozator', 'Goudji-Charffa', 'Ouroula', 'Gaoui', 'Lamadji', 'Sadjeri', 'Achawayil', 'Fondoré',
    'Djaballiro', 'Hillé Houdjaj', 'Tamon Kessa', 'Wouroulou', 'Kalatchou Sadjéré', 'Matabono'
  ];

  /** Nom du quartier introuvable : le prochain clic sur la carte l'enregistrera sous ce nom. */
  private pendingPlaceLabel: string | null = null;

  /** Une recherche sur OpenStreetMap, limitée à la zone de N'Djamena. */
  private async geocode(text: string, bounded: boolean): Promise<{ lat: number; lng: number } | null> {
    // Zone approximative de N'Djamena (ouest, nord, est, sud)
    const zone = bounded ? '&viewbox=14.90,12.30,15.25,11.95&bounded=1' : '';
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=td'
      + zone + '&q=' + encodeURIComponent(text);
    const response = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
    const places = await response.json();
    return Array.isArray(places) && places.length
      ? { lat: parseFloat(places[0].lat), lng: parseFloat(places[0].lon) }
      : null;
  }

  /** Cherche un quartier ou une adresse de N'Djamena (OpenStreetMap / Nominatim). */
  async locateAddress(): Promise<void> {
    const text = this.addressQuery.trim();
    if (!text) {
      return;
    }
    this.locatingAddress = true;
    try {
      // Plusieurs essais, car les noms s'écrivent de façons différentes :
      // nom exact, nom sans accents, puis nom + "N'Djamena".
      const sansAccents = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const essais: Array<[string, boolean]> = [
        [text, true],
        [sansAccents, true],
        [text.replace(/-/g, ' '), true],
        [text + ', N\'Djamena', false],
        [sansAccents + ', Ndjamena', false]
      ];
      let found: { lat: number; lng: number } | null = null;
      for (const [q, bounded] of essais) {
        found = await this.geocode(q, bounded);
        if (found) {
          break;
        }
      }

      if (found) {
        this.pendingPlaceLabel = null;
        this.setManualPosition(found.lat, found.lng, text);
      } else {
        // Quartier absent d'OpenStreetMap : l'utilisateur le place une fois sur la carte,
        // puis il est mémorisé sous son nom.
        this.pendingPlaceLabel = text;
        this.locationStatus = '« ' + text + ' » : cliquez sur la carte à l\'endroit où vous êtes.';
        Swal.fire({
          icon: 'info',
          title: 'Quartier pas encore sur la carte',
          text: '« ' + text + ' » n\'est pas encore connu d\'OpenStreetMap. Cliquez une fois sur la carte, '
            + 'à l\'endroit où vous êtes : la position sera enregistrée sous le nom « ' + text + ' ».',
          confirmButtonText: 'D\'accord'
        }).then(() => document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      }
    } catch {
      Swal.fire('Pas de connexion', 'La recherche de quartier demande Internet. Vous pouvez cliquer sur la carte pour placer votre position.', 'info');
    } finally {
      this.locatingAddress = false;
    }
  }

  /** Un clic sur la carte place la position du patient à cet endroit. */
  private enableMapClickPosition(): void {
    this.map.on('click', (e: any) => {
      const label = this.pendingPlaceLabel || 'point choisi sur la carte';
      this.pendingPlaceLabel = null;
      this.setManualPosition(e.latlng.lat, e.latlng.lng, label);
    });
  }

  public getClosestPharmacy(pharmacies: any[] = []): any {
    if (!pharmacies.length) {
      return null;
    }

    const validPharmacies = pharmacies.filter((pharma) => pharma && pharma.latitude != null && pharma.longitude != null);
    if (!validPharmacies.length) {
      return null;
    }

    return validPharmacies.sort((a, b) => {
      const distanceA = this.calculateDistanceKm(this.userLat, this.userLng, a.latitude, a.longitude);
      const distanceB = this.calculateDistanceKm(this.userLat, this.userLng, b.latitude, b.longitude);
      return distanceA - distanceB;
    })[0];
  }

  public calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadiusKm = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Le calcul Haversine donne la distance "à vol d'oiseau" (ligne droite).
    // On multiplie par 1.3 (facteur de tortuosité moyen) pour estimer la vraie distance routière.
    return (earthRadiusKm * c) * 1.3;
  }

  private toRadians(value: number): number {
    return value * (Math.PI / 180);
  }

  onSearch(): void {
    this.loading = true;
    this.showSuggestions = false;
    this.offlineMode = !this.offlineCache.isOnline;

    if (!this.query.trim()) {
      this.apiService.getNearestPharmacies(this.userLat, this.userLng).subscribe({
        next: (all) => {
          const data = this.onCallOnly ? (all || []).filter((p: any) => p.isOnCall) : all;
          this.nearestPharmacies = data;
          this.closestPharmacy = this.getClosestPharmacy(data);
          this.results = [];
          this.allResults = [];
          this.offlineCache.save('nearest-pharmacies', data);
          this.loading = false;
          this.offlineMode = false;
          setTimeout(() => this.initMapNearest(), 100);
        },
        error: () => {
          const cached = this.offlineCache.load<any[]>('nearest-pharmacies');
          if (cached?.data) {
            this.nearestPharmacies = cached.data;
            this.closestPharmacy = this.getClosestPharmacy(cached.data);
            this.offlineMode = true;
          }
          this.loading = false;
        }
      });
      return;
    }

    this.apiService.searchMedicationsSmart(this.query, {
      lat: this.userLat,
      lng: this.userLng,
      maxDistance: this.maxDistance,
      onCallOnly: this.onCallOnly,
      inStockOnly: this.stockOnly,
      maxPrice: this.maxPrice
    }).subscribe({
      next: (data) => {
        this.allResults = data;
        this.nearestPharmacies = [];
        this.saveSearchHistory(this.query);
        this.offlineCache.save('last-search:' + this.query.toLowerCase(), data);
        this.applyFilters();
        this.loading = false;
        this.offlineMode = false;
      },
      error: () => {
        const cached = this.offlineCache.load<any[]>('last-search:' + this.query.toLowerCase());
        if (cached?.data) {
          this.allResults = cached.data;
          this.applyFilters();
          this.offlineMode = true;
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Hors-ligne : résultats en cache',
            showConfirmButton: false,
            timer: 2500
          });
        } else {
          Swal.fire('Hors-ligne', 'Aucun résultat en cache pour cette recherche.', 'warning');
        }
        this.loading = false;
      }
    });
  }

  onQueryInput(): void {
    this.suggest$.next(this.query);
  }

  selectSuggestion(term: string): void {
    this.query = term;
    this.showSuggestions = false;
    this.onSearch();
  }

  applyFilters(): void {
    let filtered = [...this.allResults];

    if (this.onCallOnly) {
      filtered = filtered.filter(res => res.pharmacy?.isOnCall);
    }
    if (this.stockOnly) {
      filtered = filtered.filter(res => res.stock?.quantity > 0);
    }
    if (typeof this.maxPrice === 'number' && this.maxPrice >= 0) {
      filtered = filtered.filter(res => (res.stock?.medication?.indicativePrice ?? 0) <= this.maxPrice!);
    }
    if (typeof this.maxDistance === 'number' && this.maxDistance > 0) {
      filtered = filtered.filter(res => res.distanceKm == null || res.distanceKm <= this.maxDistance!);
    }

    filtered = filtered.sort((a, b) => {
      if (this.sortBy === 'price') {
        return (a.stock?.medication?.indicativePrice ?? 0) - (b.stock?.medication?.indicativePrice ?? 0);
      }
      if (this.sortBy === 'stock') {
        return (b.stock?.quantity ?? 0) - (a.stock?.quantity ?? 0);
      }
      return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
    });

    this.results = filtered;
    this.closestResult = this.findClosestInStock(filtered);
    setTimeout(() => this.initMap(), 100);
  }

  /** Pharmacie la plus proche qui a le médicament en stock. */
  private findClosestInStock(list: any[]): any {
    const inStock = list.filter(res => (res.stock?.quantity ?? 0) > 0
      && res.pharmacy?.latitude != null && res.pharmacy?.longitude != null);
    if (!inStock.length) {
      return null;
    }
    const dist = (res: any) => res.distanceKm != null
      ? res.distanceKm
      : this.calculateDistanceKm(this.userLat, this.userLng, res.pharmacy.latitude, res.pharmacy.longitude);
    return inStock.reduce((best, cur) => dist(cur) < dist(best) ? cur : best);
  }

  toggleOnCallFilter(): void {
    this.onCallOnly = !this.onCallOnly;
    // Avec ou sans médicament saisi, on relance pour filtrer la liste affichée
    this.onSearch();
  }

  resetFilters(): void {
    this.onCallOnly = false;
    this.stockOnly = false;
    this.maxPrice = null;
    this.maxDistance = 10;
    this.sortBy = 'distance';
    if (this.query.trim()) {
      this.onSearch();
    } else {
      this.applyFilters();
    }
  }

  private initMap(): void {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      return;
    }

    if (this.map) {
      this.map.remove();
    }
    
    this.map = L.map(mapContainer).setView([this.userLat, this.userLng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Marqueur Patient (Draggable pour ajuster la position manuellement)
    const userMarker = L.marker([this.userLat, this.userLng], { draggable: true, zIndexOffset: 1000 })
      .bindPopup('<b>Votre Position</b><br><small>Glissez-moi pour ajuster</small>')
      .addTo(this.map)
      .openPopup();

    userMarker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.setManualPosition(pos.lat, pos.lng, 'marqueur déplacé sur la carte');
    });
    this.enableMapClickPosition();

    // Marqueurs Pharmacies
    const closest = this.closestResult;
    this.results.forEach(res => {
      const isClosest = closest && res === closest;
      const onCallBadge = res.pharmacy.isOnCall ? '<br><span style="color: #ef4444; font-weight: bold;">🌙 Pharmacie de Garde</span>' : '';
      const label = isClosest ? '<br><span style="color: #22c55e; font-weight: bold;">✅ La plus proche avec ce médicament</span>' : '';
      const distance = res.distanceKm != null ? res.distanceKm.toFixed(2) + ' km' : '—';
      const marker = L.marker([res.pharmacy.latitude, res.pharmacy.longitude]).addTo(this.map);
      marker.bindPopup(`
        <b>${res.pharmacy.name}</b>${onCallBadge}${label}<br>
        Stock: ${res.stock.quantity}<br>
        Distance: ${distance}
      `);
      if (isClosest) {
        userMarker.closePopup();
        marker.openPopup();
      }
    });

    // Cadrer la carte sur le patient et la pharmacie la plus proche
    if (closest) {
      this.map.fitBounds(
        L.latLngBounds([[this.userLat, this.userLng], [closest.pharmacy.latitude, closest.pharmacy.longitude]]),
        { padding: [50, 50], maxZoom: 16 }
      );
    }
  }

  private initMapNearest(): void {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    const closest = this.closestPharmacy || this.getClosestPharmacy(this.nearestPharmacies) || this.nearestPharmacies[0];
    this.map = L.map(mapContainer).setView([this.userLat, this.userLng], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    const userMarker = L.marker([this.userLat, this.userLng], { draggable: true, zIndexOffset: 1000 })
      .bindPopup('<b>Votre Position</b><br><small>Glissez-moi pour ajuster</small>')
      .addTo(this.map);

    userMarker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.query = '';
      this.setManualPosition(pos.lat, pos.lng, 'marqueur déplacé sur la carte');
    });
    this.enableMapClickPosition();

    if (closest && closest.latitude != null && closest.longitude != null) {
      const bounds = L.latLngBounds(
        [[this.userLat, this.userLng], [closest.latitude, closest.longitude]]
      );
      this.map.fitBounds(bounds, { padding: [40, 40] });
    }

    this.nearestPharmacies.forEach(pharma => {
      const isClosest = closest && pharma.id === closest.id;
      const onCallBadge = pharma.isOnCall ? '<br><span style="color: #ef4444; font-weight: bold;">🌙 Pharmacie de Garde</span>' : '';
      const label = isClosest ? '<br><span style="color: #22c55e; font-weight: bold;">✅ La plus proche</span>' : '';
      const marker = L.marker([pharma.latitude, pharma.longitude]).addTo(this.map);
      marker.bindPopup(`
        <b>${pharma.name}</b>${onCallBadge}${label}<br>
        Adresse: ${pharma.address}<br>
        Contact: ${pharma.contact}
      `);
      if (isClosest) {
        marker.openPopup();
      }
    });

    if (closest) {
      const closestDistance = this.calculateDistanceKm(this.userLat, this.userLng, closest.latitude, closest.longitude);
      userMarker.bindPopup(`<b>Votre Position</b><br><small>Glissez-moi pour ajuster</small><br>Pharmacie la plus proche : <b>${closest.name}</b><br>Distance : ${closestDistance.toFixed(1)} km`);
      userMarker.openPopup();
    }
  }

  traceRoute(lat: number, lng: number): void {
    if (this.routingControl) {
      this.map.removeControl(this.routingControl);
    }
    
    this.routingControl = L.Routing.control({
      waypoints: [
        L.latLng(this.userLat, this.userLng),
        L.latLng(lat, lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{color: '#3b82f6', opacity: 0.8, weight: 6}],
        extendToWaypoints: true,
        missingRouteTolerance: 10
      }
    }).addTo(this.map);
    
    // Scroller vers la carte
    window.scrollTo({ top: document.getElementById('map')?.offsetTop, behavior: 'smooth' });
  }

  openReservationModal(stock: any): void {
    this.selectedStock = stock;
    this.reservationData.stock.id = stock.id;
    this.reservationData.quantity = 1;
    this.showModal = true;
  }

  subscribeToAlert(stock: any): void {
    if (!this.auth.isLoggedIn()) {
      Swal.fire('Connexion requise', 'Vous devez être connecté pour vous abonner aux alertes de disponibilité.', 'warning');
      return;
    }
    
    this.apiService.subscribeToRestockAlert({
      medicationId: stock.medication.id,
      pharmacyId: stock.pharmacy.id
    }).subscribe({
      next: (res) => Swal.fire('Abonné', res.message || 'Vous serez notifié dès que le stock sera réapprovisionné.', 'success'),
      error: (err) => Swal.fire('Erreur', err.error?.message || err.error || 'Impossible de s\'abonner.', 'error')
    });
  }

  closeReservationModal(): void {
    this.showModal = false;
    this.selectedStock = null;
  }

  submitReservation(): void {
    // require only patient name; contact is optional for anonymous reservations
    if (!this.reservationData.patientName) return;

    const mobilePay = this.reservationData.paymentMethod === 'ORANGE_MONEY'
      || this.reservationData.paymentMethod === 'AIRTEL_MONEY';

    if (mobilePay && !this.reservationData.paymentPhone?.trim()) {
      Swal.fire('Paiement', 'Indiquez le numéro Mobile Money.', 'warning');
      return;
    }

    const payload: any = {
      ...this.reservationData,
      // include patientEmail only if available
      ...(this.auth.getEmail() ? { patientEmail: this.auth.getEmail() } : {}),
      // include patientContact only if provided in the form (optional)
      ...(this.reservationData.patientContact ? { patientContact: this.reservationData.patientContact } : {}),
      paymentStatus: mobilePay ? 'PENDING' : 'UNPAID'
    };

    this.apiService.createReservation(payload).subscribe({
      next: (saved) => {
        this.closeReservationModal();
        this.selectedStock.quantity -= this.reservationData.quantity;

        if (mobilePay && saved?.id) {
          Swal.fire({
            icon: 'info',
            title: 'Paiement Mobile Money',
            html: `Réservation N°${saved.id}<br>Montant : <b>${saved.amountDue || '?'} FCFA</b><br>
                   Réf. : <code>${saved.paymentReference || '—'}</code><br><br>
                   Validez sur votre téléphone, puis confirmez ici (simulation démo).`,
            showCancelButton: true,
            confirmButtonText: 'Simuler paiement réussi',
            cancelButtonText: 'Plus tard'
          }).then(res => {
            if (res.isConfirmed) {
              this.apiService.confirmPayment({ reservationId: saved.id, success: true }).subscribe({
                next: () => Swal.fire('Payé', 'Paiement confirmé avec succès.', 'success'),
                error: () => Swal.fire('Erreur', 'Confirmation impossible.', 'error')
              });
            }
          });
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Réservation confirmée !',
            showConfirmButton: false,
            timer: 3000
          });
        }
        this.onSearch();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Erreur', 'Impossible de finaliser la réservation.', 'error');
      }
    });
  }
}
