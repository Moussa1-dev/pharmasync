import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent {
  isOpen: boolean = false;
  messages: { text: string; sender: 'user' | 'bot' }[] = [
    { text: 'Bonjour ! Je suis l\'assistant IA de PharmaSync. Je suis connecté à notre base de données. Que cherchez-vous aujourd\'hui ?', sender: 'bot' }
  ];
  userInput: string = '';
  isTyping: boolean = false;

  constructor(private apiService: ApiService) {}

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    this.messages.push({ text: this.userInput, sender: 'user' });
    const query = this.userInput.toLowerCase();
    this.userInput = '';

    setTimeout(() => {
      this.generateBotResponse(query);
    }, 1500); // Increased delay slightly to show typing animation
  }

  generateBotResponse(query: string): void {
    this.isTyping = true; // start typing immediately when processing

    const resolveTyping = (response: string) => {
      this.isTyping = false;
      this.messages.push({ text: response, sender: 'bot' });
    };

    if (query.includes('garde') || query.includes('nuit')) {
      this.apiService.getAllPharmacies().subscribe({
        next: (pharmacies) => {
          const onCall = pharmacies.filter((p: any) => p.isOnCall);
          if (onCall.length > 0) {
            const names = onCall.map((p: any) => p.name).join(', ');
            resolveTyping(`Actuellement, les pharmacies de garde sont : ${names}.`);
          } else {
            resolveTyping("Il n'y a pas de pharmacie de garde enregistrée pour le moment.");
          }
        },
        error: () => resolveTyping("Désolé, je n'arrive pas à joindre le serveur.")
      });
    } else if (query.includes('bonjour') || query.includes('salut')) {
      resolveTyping("Bonjour ! Comment puis-je vous assister avec PharmaSync ?");
    } else if (query.includes('ordonnance') || query.includes('prescription')) {
      resolveTyping("Vous pouvez télécharger votre ordonnance lors de la réservation d'un médicament, la pharmacie s'occupera de préparer votre commande.");
    } else {
      const stopWords = ['cherche', 'trouver', 'avoir', 'besoin', 'voudrais', 'pour', 'pharmacie', 'avez-vous', 'avez', 'vous', 'est-ce', 'que', 'je', 'veux', 'cherche', 'comment', 'acheter', 'médicament'];
      const words = query.replace(/[?.,!]/g, '').split(' ');
      
      // Find the most likely drug name (usually a noun not in stop words)
      const potentialDrugs = words.filter(w => w.length > 3 && !stopWords.includes(w));
      const searchWord = potentialDrugs.length > 0 ? potentialDrugs[potentialDrugs.length - 1] : query;

      this.apiService.searchMedications(searchWord).subscribe({
        next: (results) => {
          if (results && results.length > 0) {
            const first = results[0];
            const stock = first.stock.quantity;
            const price = first.stock.medication.indicativePrice;
            const pharma = first.pharmacy.name;
            if (stock > 0) {
              resolveTyping(`Oui, j'ai trouvé "${first.stock.medication.name}". Il y en a ${stock} en stock à la ${pharma} au prix de ${price} FCFA. Vous pouvez le réserver via la barre de recherche principale !`);
            } else {
              resolveTyping(`J'ai trouvé "${first.stock.medication.name}", mais il est malheureusement en rupture de stock à la ${pharma}.`);
            }
          } else {
            resolveTyping(`Je ne trouve aucun médicament correspondant à "${searchWord}". Essayez d'utiliser la barre de recherche globale pour plus de précision.`);
          }
        },
        error: () => resolveTyping("Désolé, une erreur est survenue lors de la recherche dans notre base de données.")
      });
    }
  }
}
