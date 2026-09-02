INSERT INTO pharmacy (name, address, contact, latitude, longitude, is_on_call) VALUES
('Pharmacie du Salut', 'Avenue Pascal Yoadoumadji, Chagoua, N''Djamena', '+235 66 89 54 18', 12.0965, 15.0673, true),
('Pharmacie du Béguinage', 'Quartier Béguinage, Rue du Havre, N''Djamena', '+235 66 36 57 57', 12.1158, 15.0645, false),
('Pharmacie Santé Assurée', 'Boulevard du Président N''Garta Tombalbaye, N''Djamena', '+235 62 11 22 33', 12.1112, 15.0445, true),
('Pharmacie Bahry', 'Rond-Point Hamama, N''Djamena', '+235 63 44 55 66', 12.1287, 15.0423, false),
('Pharmacie Providence', 'Quartier Moursal, N''Djamena', '+235 66 22 33 44', 12.1001, 15.0501, false),
('Pharmacie de la Nation', 'Avenue Charles de Gaulle, N''Djamena', '+235 62 34 56 78', 12.1150, 15.0390, true);

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
(1, 1, 150, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '12 months'),
(1, 2, 200, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '24 months'),
(1, 3, 40, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '8 months'),
(1, 4, 0, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '6 months'),
(1, 7, 25, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '24 months'),
(1, 9, 60, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '10 months'),
(2, 1, 80, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '18 months'),
(2, 5, 30, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '20 months'),
(2, 6, 15, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '12 months'),
(2, 9, 42, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '14 months'),
(2, 10, 22, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '11 months'),
(3, 1, 200, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '24 months'),
(3, 8, 50, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '6 months'),
(3, 2, 0, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '3 months'),
(3, 10, 90, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '16 months'),
(4, 1, 120, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '10 months'),
(4, 2, 45, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '11 months'),
(4, 3, 60, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '14 months'),
(4, 4, 20, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '8 months'),
(5, 1, 95, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '15 months'),
(5, 3, 50, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '12 months'),
(5, 5, 25, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '22 months'),
(6, 10, 40, CURRENT_TIMESTAMP, CURRENT_DATE + INTERVAL '10 months');

INSERT INTO reservation (patient_name, patient_contact, stock_id, quantity, status, delivery_mode, delivery_address, created_at, prescription_base64) VALUES
('Mahamat Saleh', '+235 66 12 34 56', 1, 2, 'PENDING', 'RETRAIT', '', CURRENT_TIMESTAMP, NULL),
('Fatime Zara', '+235 62 88 99 44', 2, 1, 'CONFIRMED', 'LIVRAISON', 'Quartier Moursal, Rue 32', CURRENT_TIMESTAMP - INTERVAL '2 hours', NULL),
('Abdoulaye Youssouf', '+235 68 99 88 77', 3, 3, 'COMPLETED', 'RETRAIT', '', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL);
