-- Pharmacies réelles de N'Djamena : nom, adresse, téléphone et position GPS
-- relevés sur Google Maps (septembre 2026). Le statut "de garde" (is_on_call)
-- et les stocks ci-dessous sont des données de DÉMONSTRATION.
INSERT INTO pharmacy (name, address, contact, latitude, longitude, is_on_call) VALUES
('Pharmacie du Salut', '4112 Avenue Pascal Yoadoumadji, N''Djamena', '+235 66 30 46 98', 12.0893523, 15.0919092, true),
('Pharmacie Béguinage', 'Rue du Havre, N''Djamena', '+235 66 36 57 57', 12.1163732, 15.0389880, false),
('Pharmacie La Place', 'Avenue du Général Charles de Gaulle (face à la Place de la Nation), N''Djamena', '+235 66 01 03 02', 12.1111266, 15.0391510, true),
('Pharmacie La Vaillance', 'Moursal, N''Djamena', '+235 66 30 70 41', 12.1037872, 15.0782705, false),
('Pharmacie du Sacré-Cœur', 'Avenue du Lycée de Gassi, N''Djamena', '+235 66 89 25 48', 12.0885640, 15.1408380, false),
('Dépôt Pharmaceutique Al-Salama', 'BP 926, N''Djamena', '+235 22 51 15 11', 12.1280896, 15.0501900, true);

INSERT INTO medication (name, description, indicative_price, category, barcode) VALUES
('Coartem 20/120mg', 'Traitement de première intention du paludisme', 2500, 'Antipaludéen', '3400930000001'),
('Doliprane 1000mg', 'Paracétamol pour douleurs et fièvre', 1500, 'Antalgique/Antipyrétique', '3400930000002'),
('Amoxicilline 500mg', 'Antibiotique à large spectre', 2000, 'Antibiotique', '3400930000003'),
('Spasfon', 'Antispasmodique pour douleurs abdominales', 2500, 'Antispasmodique', '3400930000004'),
('Smecta', 'Traitement des diarrhées aiguës', 3500, 'Antidiarrhéique', '3400930000005'),
('Fefol', 'Supplément de fer et acide folique', 1500, 'Complément alimentaire', '3400930000006'),
('Ventoline 100µg', 'Bronchodilatateur pour l''asthme (sur ordonnance)', 4500, 'Antiasthmatique', '3400930000007'),
('Efferalgan 500mg', 'Antalgique et antipyrétique', 1200, 'Antalgique/Antipyrétique', '3400930000008'),
('Quinine 300mg', 'Traitement du paludisme sévère', 2000, 'Antipaludéen', '3400930000009'),
('Metronidazole 250mg', 'Antibactérien et antiparasitaire', 1000, 'Antibiotique', '3400930000010');

INSERT INTO stock (pharmacy_id, medication_id, quantity, updated_at, expiration_date) VALUES
(1, 1, 150, CURRENT_TIMESTAMP, DATEADD('MONTH', 12, CURRENT_DATE)),
(1, 2, 200, CURRENT_TIMESTAMP, DATEADD('MONTH', 24, CURRENT_DATE)),
(1, 3, 40, CURRENT_TIMESTAMP, DATEADD('MONTH', 8, CURRENT_DATE)),
(1, 4, 0, CURRENT_TIMESTAMP, DATEADD('MONTH', 6, CURRENT_DATE)),
(1, 7, 25, CURRENT_TIMESTAMP, DATEADD('MONTH', 24, CURRENT_DATE)),
(1, 9, 60, CURRENT_TIMESTAMP, DATEADD('MONTH', 10, CURRENT_DATE)),
(2, 1, 80, CURRENT_TIMESTAMP, DATEADD('MONTH', 18, CURRENT_DATE)),
(2, 5, 30, CURRENT_TIMESTAMP, DATEADD('MONTH', 20, CURRENT_DATE)),
(2, 6, 15, CURRENT_TIMESTAMP, DATEADD('MONTH', 12, CURRENT_DATE)),
(2, 9, 42, CURRENT_TIMESTAMP, DATEADD('MONTH', 14, CURRENT_DATE)),
(2, 10, 22, CURRENT_TIMESTAMP, DATEADD('MONTH', 11, CURRENT_DATE)),
(3, 1, 200, CURRENT_TIMESTAMP, DATEADD('MONTH', 24, CURRENT_DATE)),
(3, 8, 50, CURRENT_TIMESTAMP, DATEADD('MONTH', 6, CURRENT_DATE)),
(3, 2, 0, CURRENT_TIMESTAMP, DATEADD('MONTH', 3, CURRENT_DATE)),
(3, 10, 90, CURRENT_TIMESTAMP, DATEADD('MONTH', 16, CURRENT_DATE)),
(4, 1, 120, CURRENT_TIMESTAMP, DATEADD('MONTH', 10, CURRENT_DATE)),
(4, 2, 45, CURRENT_TIMESTAMP, DATEADD('MONTH', 11, CURRENT_DATE)),
(4, 3, 60, CURRENT_TIMESTAMP, DATEADD('MONTH', 14, CURRENT_DATE)),
(4, 4, 20, CURRENT_TIMESTAMP, DATEADD('MONTH', 8, CURRENT_DATE)),
(5, 1, 95, CURRENT_TIMESTAMP, DATEADD('MONTH', 15, CURRENT_DATE)),
(5, 3, 50, CURRENT_TIMESTAMP, DATEADD('MONTH', 12, CURRENT_DATE)),
(5, 5, 25, CURRENT_TIMESTAMP, DATEADD('MONTH', 22, CURRENT_DATE)),
(6, 10, 40, CURRENT_TIMESTAMP, DATEADD('MONTH', 10, CURRENT_DATE));

INSERT INTO reservation (patient_name, patient_contact, stock_id, quantity, status, delivery_mode, delivery_address, created_at, prescription_base64) VALUES
('Mahamat Saleh', '+235 66 12 34 56', 1, 2, 'PENDING', 'RETRAIT', '', CURRENT_TIMESTAMP, NULL),
('Fatime Zara', '+235 62 88 99 44', 2, 1, 'CONFIRMED', 'LIVRAISON', 'Quartier Moursal, Rue 32', DATEADD('HOUR', -2, CURRENT_TIMESTAMP), NULL),
('Abdoulaye Youssouf', '+235 68 99 88 77', 3, 3, 'COMPLETED', 'RETRAIT', '', DATEADD('DAY', -1, CURRENT_TIMESTAMP), NULL);
