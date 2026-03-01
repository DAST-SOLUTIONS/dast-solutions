-- ============================================================================
-- DAST Solutions - Matériaux de base (Québec)
-- Basé sur: Rona, Lowes, Réno-Dépôt, BMR, Home Hardware, Patrick Morin,
--           Canac, Home Dépôt, Manugypse, Lefebvre et Benoit, Matério,
--           Matériaux Pont Masson, Coupal
-- ============================================================================

-- Note: Les prix sont indicatifs (base 2026, région Montréal)
-- L'utilisateur doit mettre à jour régulièrement via le module "Mise à jour des prix"

-- ============================================================
-- DIV 03 - BÉTON (cost_items)
-- ============================================================
INSERT INTO cost_items (code, name, csc_division, csc_section, unit, unit_label, price_material, price_labor, notes) VALUES
-- Béton prêt-à-l'emploi
('BET-01-001', 'Béton 20 MPa (livraison)', '03', '03 30 00', 'M3', 'mètre cube', 145.00, 0, 'Cylindre 150x300, slump 80-100mm'),
('BET-01-002', 'Béton 25 MPa (livraison)', '03', '03 30 00', 'M3', 'mètre cube', 155.00, 0, ''),
('BET-01-003', 'Béton 30 MPa (livraison)', '03', '03 30 00', 'M3', 'mètre cube', 165.00, 0, ''),
('BET-01-004', 'Béton 35 MPa (livraison)', '03', '03 30 00', 'M3', 'mètre cube', 175.00, 0, 'Standard structurel'),
('BET-01-005', 'Béton 40 MPa (livraison)', '03', '03 30 00', 'M3', 'mètre cube', 195.00, 0, 'Haute résistance'),
('BET-01-006', 'Béton de plancher autonivelant', '03', '03 54 00', 'M3', 'mètre cube', 320.00, 0, 'Gypcrete ou similaire'),
('BET-01-007', 'Voyage incomplet béton (< 8M3)', '03', '03 30 00', 'U', 'voyage', 175.00, 0, 'Frais de retour'),
-- Armature
('BET-02-001', 'Armature 10M', '03', '03 21 00', 'KG', 'kilogramme', 1.85, 0.65, 'Barres d''armature 10M'),
('BET-02-002', 'Armature 15M', '03', '03 21 00', 'KG', 'kilogramme', 1.80, 0.60, ''),
('BET-02-003', 'Armature 20M', '03', '03 21 00', 'KG', 'kilogramme', 1.78, 0.55, ''),
('BET-02-004', 'Armature 25M', '03', '03 21 00', 'KG', 'kilogramme', 1.75, 0.50, ''),
('BET-02-005', 'Armature 30M', '03', '03 21 00', 'KG', 'kilogramme', 1.75, 0.50, ''),
('BET-02-006', 'Treillis soudé 6x6 W1.4xW1.4', '03', '03 22 00', 'M2', 'mètre carré', 3.50, 0.80, 'Dalle sur sol'),
('BET-02-007', 'Treillis soudé 6x6 W2.9xW2.9', '03', '03 22 00', 'M2', 'mètre carré', 5.20, 0.80, ''),
-- Coffrage
('BET-03-001', 'Coffrage murs droit (main-d''œuvre)', '03', '03 11 00', 'M2', 'mètre carré', 12.50, 32.00, 'Planche à coffrer'),
('BET-03-002', 'Coffrage dalles (main-d''œuvre)', '03', '03 11 00', 'M2', 'mètre carré', 18.00, 35.00, 'Avec étais'),
('BET-03-003', 'Coffrage circulaire (main-d''œuvre)', '03', '03 11 00', 'M2', 'mètre carré', 25.00, 55.00, ''),
('BET-03-004', 'Système Symons (location)', '03', '03 11 00', 'M2', 'mètre carré', 8.50, 0, 'Par semaine'),

-- ============================================================
-- DIV 04 - MAÇONNERIE
-- ============================================================
('MAC-01-001', 'Brique standard 61x92x222mm rouge', '04', '04 21 00', 'U', 'unité', 0.95, 0, 'Brique commune'),
('MAC-01-002', 'Brique standard 61x92x222mm grise', '04', '04 21 00', 'U', 'unité', 0.95, 0, ''),
('MAC-01-003', 'Brique de parement 68x90x190mm', '04', '04 21 13', 'U', 'unité', 1.45, 0, 'Face exposée'),
('MAC-01-004', 'Brique texturée split face', '04', '04 21 13', 'U', 'unité', 1.85, 0, ''),
('MAC-02-001', 'Bloc béton 200x200x400mm', '04', '04 22 00', 'U', 'unité', 3.25, 0, 'Standard 20MPa'),
('MAC-02-002', 'Bloc béton 150x200x400mm', '04', '04 22 00', 'U', 'unité', 2.85, 0, ''),
('MAC-02-003', 'Bloc béton 100x200x400mm', '04', '04 22 00', 'U', 'unité', 2.45, 0, ''),
('MAC-02-004', 'Bloc d''angle 200mm', '04', '04 22 00', 'U', 'unité', 4.50, 0, ''),
('MAC-02-005', 'Bloc linteau 200mm', '04', '04 22 00', 'U', 'unité', 8.50, 0, 'U-block'),
('MAC-03-001', 'Mortier type S (sac 30 kg)', '04', '04 05 13', 'SAC', 'sac', 14.50, 0, ''),
('MAC-03-002', 'Mortier type N (sac 30 kg)', '04', '04 05 13', 'SAC', 'sac', 13.50, 0, ''),
('MAC-03-003', 'Coulis de remplissage (sac 25 kg)', '04', '04 05 13', 'SAC', 'sac', 12.00, 0, ''),

-- ============================================================
-- DIV 06 - BOIS ET CHARPENTE
-- ============================================================
-- Bois d''ossature
('BOI-01-001', 'Montant 2x4 - 8'' (SPF)', '06', '06 11 00', 'U', 'unité', 3.85, 0, 'Épinette-Pin-Sapin'),
('BOI-01-002', 'Montant 2x4 - 10'' (SPF)', '06', '06 11 00', 'U', 'unité', 4.75, 0, ''),
('BOI-01-003', 'Montant 2x6 - 8'' (SPF)', '06', '06 11 00', 'U', 'unité', 5.45, 0, ''),
('BOI-01-004', 'Montant 2x6 - 10'' (SPF)', '06', '06 11 00', 'U', 'unité', 6.95, 0, ''),
('BOI-01-005', 'Solive 2x8 - 10'' (SPF)', '06', '06 11 00', 'U', 'unité', 9.50, 0, ''),
('BOI-01-006', 'Solive 2x10 - 12'' (SPF)', '06', '06 11 00', 'U', 'unité', 14.50, 0, ''),
('BOI-01-007', 'Solive 2x12 - 12'' (SPF)', '06', '06 11 00', 'U', 'unité', 18.50, 0, ''),
('BOI-01-008', 'Planche 1x6 pin commun 8''', '06', '06 11 00', 'U', 'unité', 7.25, 0, ''),
('BOI-01-009', 'Lisse d''assise 2x6 PT', '06', '06 11 00', 'LF', 'pied linéaire', 1.85, 0, 'Bois traité autoclave'),
-- Contreplaqué et panneaux
('BOI-02-001', 'Contreplaqué structural 4x8 - 7/16"', '06', '06 16 00', 'U', 'feuille', 32.50, 0, 'OSB structurel'),
('BOI-02-002', 'Contreplaqué structural 4x8 - 1/2"', '06', '06 16 00', 'U', 'feuille', 38.00, 0, ''),
('BOI-02-003', 'Contreplaqué structural 4x8 - 5/8"', '06', '06 16 00', 'U', 'feuille', 45.00, 0, ''),
('BOI-02-004', 'Contreplaqué structural 4x8 - 3/4"', '06', '06 16 00', 'U', 'feuille', 55.00, 0, ''),
('BOI-02-005', 'Gypse 4x8 - 1/2" standard', '06', '06 16 00', 'U', 'feuille', 12.50, 0, 'Cloisons intérieures'),
('BOI-02-006', 'Gypse 4x8 - 5/8" Type X', '06', '06 16 00', 'U', 'feuille', 15.50, 0, 'Coupe-feu 1hr'),
('BOI-02-007', 'Gypse humide 4x8 - 1/2" vert', '06', '06 16 00', 'U', 'feuille', 18.50, 0, 'Salles de bain'),
('BOI-02-008', 'Panneau acoustique 2x4 - 5/8"', '06', '06 16 00', 'U', 'feuille', 24.00, 0, ''),
-- Charpente métallique légère
('BOI-03-001', 'Track 3-5/8" (3.5m)', '06', '06 11 16', 'U', 'unité', 8.50, 0, 'Profilé U acier galvanisé'),
('BOI-03-002', 'Stud 3-5/8" (2.44m)', '06', '06 11 16', 'U', 'unité', 6.25, 0, 'Montant acier galvanisé'),
('BOI-03-003', 'Track 6" (3.5m)', '06', '06 11 16', 'U', 'unité', 11.50, 0, ''),
('BOI-03-004', 'Stud 6" (2.44m)', '06', '06 11 16', 'U', 'unité', 8.75, 0, ''),
('BOI-03-005', 'Fourrure métallique 7/8" (3.65m)', '06', '06 11 16', 'U', 'unité', 4.25, 0, ''),

-- ============================================================
-- DIV 07 - ISOLATION ET ÉTANCHÉITÉ
-- ============================================================
('ISO-01-001', 'Isolant en vrac (laine soufflée) - sac', '07', '07 21 00', 'SAC', 'sac', 22.00, 0, 'R-value variable selon épaisseur'),
('ISO-01-002', 'Isolant en rouleaux R-12 (2x4)', '07', '07 21 00', 'SF', 'pied carré', 0.65, 0, 'Laine de verre, kraft face'),
('ISO-01-003', 'Isolant en rouleaux R-20 (2x6)', '07', '07 21 00', 'SF', 'pied carré', 0.95, 0, ''),
('ISO-01-004', 'Isolant en panneaux R-5 - 1"', '07', '07 22 00', 'SF', 'pied carré', 0.45, 0, 'Styromousse/EPS'),
('ISO-01-005', 'Isolant en panneaux R-7.5 - 1.5"', '07', '07 22 00', 'SF', 'pied carré', 0.65, 0, 'Styrodur/XPS'),
('ISO-01-006', 'Isolant en panneaux R-10 - 2"', '07', '07 22 00', 'SF', 'pied carré', 0.85, 0, ''),
('ISO-01-007', 'Isolant en panneaux R-20 - 4"', '07', '07 22 00', 'SF', 'pied carré', 1.65, 0, 'Fondation'),
('ISO-01-008', 'Isolant projeté (SPF) - par cm', '07', '07 21 29', 'SF', 'pied carré/cm', 0.75, 0, 'Mousse polyuréthane'),
('ISO-02-001', 'Pare-vapeur 6 mil - 100'' x 20''', '07', '07 26 00', 'RLX', 'rouleau', 95.00, 0, 'Polyéthylène'),
('ISO-02-002', 'Pare-air Tyvek 5'' x 150''', '07', '07 27 00', 'RLX', 'rouleau', 145.00, 0, 'Housse de construction'),
('ISO-02-003', 'Membrane bitumineuse auto-adhésive (45 mil)', '07', '07 51 00', 'M2', 'mètre carré', 8.50, 0, ''),
('ISO-02-004', 'Membrane élastomère SBS - 3mm', '07', '07 51 00', 'M2', 'mètre carré', 12.00, 0, 'Sous-couche'),
('ISO-02-005', 'Membrane élastomère SBS - 4mm granulée', '07', '07 51 00', 'M2', 'mètre carré', 18.50, 0, 'Couche de surface'),
('ISO-02-006', 'Membrane EPDM 1.5mm', '07', '07 53 23', 'M2', 'mètre carré', 22.00, 0, 'Toiture plate'),
('ISO-02-007', 'Mousse d''étanchéité (canette 750ml)', '07', '07 92 00', 'U', 'canette', 9.50, 0, 'Pur-Mousse polyuréthane'),
('ISO-03-001', 'Drain français 4" perforé (par m)', '07', '07 18 00', 'M', 'mètre', 2.85, 0, 'PVC annelé'),
('ISO-03-002', 'Géotextile 4oz (par m2)', '07', '07 18 00', 'M2', 'mètre carré', 1.25, 0, 'Non-tissé'),
('ISO-03-003', 'Mastic d''étanchéité polyuréthane (tube 300ml)', '07', '07 92 13', 'U', 'tube', 8.50, 0, 'Sikaflex ou équiv.'),

-- ============================================================
-- DIV 08 - OUVERTURES (PORTES ET FENÊTRES)
-- ============================================================
('OUV-01-001', 'Porte intérieure creux 2/0x6/8', '08', '08 14 00', 'U', 'unité', 85.00, 0, 'HDF moulée, blanche'),
('OUV-01-002', 'Porte intérieure creux 2/6x6/8', '08', '08 14 00', 'U', 'unité', 92.00, 0, ''),
('OUV-01-003', 'Porte intérieure creux 3/0x6/8', '08', '08 14 00', 'U', 'unité', 98.00, 0, ''),
('OUV-01-004', 'Porte extérieure acier 3/0x6/8 isolée', '08', '08 11 13', 'U', 'unité', 385.00, 0, 'R-15'),
('OUV-01-005', 'Porte patio 6'' coulissante PVC', '08', '08 12 00', 'U', 'unité', 650.00, 0, ''),
('OUV-01-006', 'Cadre métal 16ga 3/0x7/0 (standard)', '08', '08 11 16', 'U', 'unité', 155.00, 0, ''),
('OUV-01-007', 'Cadre métal 16ga 3/0x9/0', '08', '08 11 16', 'U', 'unité', 195.00, 0, ''),
('OUV-02-001', 'Fenêtre PVC battante 24x36"', '08', '08 50 00', 'U', 'unité', 285.00, 0, 'Double vitrage'),
('OUV-02-002', 'Fenêtre PVC coulissante 36x36"', '08', '08 50 00', 'U', 'unité', 325.00, 0, ''),
('OUV-02-003', 'Fenêtre PVC à guillotine 36x48"', '08', '08 50 00', 'U', 'unité', 375.00, 0, ''),
('OUV-02-004', 'Vitrage triple LoE argon ($/pi2)', '08', '08 80 00', 'PI2', 'pied carré', 28.00, 0, ''),
('OUV-03-001', 'Quincaillerie porte int. (passage)', '08', '08 71 00', 'U', 'ensemble', 35.00, 0, 'Bouton + gâche'),
('OUV-03-002', 'Quincaillerie porte ext. (sécurité)', '08', '08 71 00', 'U', 'ensemble', 125.00, 0, 'Serrure mortaise'),
('OUV-03-003', 'Ferme-porte hydraulique grade 1', '08', '08 71 13', 'U', 'unité', 185.00, 0, ''),
('OUV-03-004', 'Charnières 4-1/2" acier inox (paire)', '08', '08 71 00', 'U', 'paire', 22.00, 0, ''),

-- ============================================================
-- DIV 09 - FINITIONS
-- ============================================================
-- Gypse et plâtre
('FIN-01-001', 'Compound à joint séchage 5 gal', '09', '09 21 16', 'U', 'seau', 28.50, 0, ''),
('FIN-01-002', 'Joint papier (500'')', '09', '09 21 16', 'U', 'rouleau', 12.50, 0, ''),
('FIN-01-003', 'Joint maille fibre de verre', '09', '09 21 16', 'U', 'rouleau', 8.50, 0, ''),
('FIN-01-004', 'Vis gypse 1-1/4" (1000)', '09', '09 21 00', 'BOX', 'boîte', 9.50, 0, ''),
('FIN-01-005', 'Coin PVC 90° (par 10 pieds)', '09', '09 21 00', 'U', 'pièce', 2.85, 0, ''),
-- Carrelage
('FIN-02-001', 'Mortier-colle blanc STR (sac 25kg)', '09', '09 30 00', 'SAC', 'sac', 28.00, 0, 'Schluter, MAPEI ou équiv.'),
('FIN-02-002', 'Coulis ciment 1/16"-1/8" (sac 2.5kg)', '09', '09 30 00', 'SAC', 'sac', 12.50, 0, ''),
('FIN-02-003', 'Membrane étanche sous-carrelage (m2)', '09', '09 30 13', 'M2', 'mètre carré', 9.50, 0, ''),
-- Peinture
('FIN-03-001', 'Peinture int. acrylique satin blanc (3.78L)', '09', '09 91 00', 'U', 'gallon', 58.00, 0, 'Dulux, Bétonel, Sherwin ou équiv.'),
('FIN-03-002', 'Peinture int. mat blanc (3.78L)', '09', '09 91 00', 'U', 'gallon', 52.00, 0, ''),
('FIN-03-003', 'Peinture ext. acrylique satin (3.78L)', '09', '09 91 00', 'U', 'gallon', 68.00, 0, ''),
('FIN-03-004', 'Apprêt PVA universel (3.78L)', '09', '09 91 00', 'U', 'gallon', 38.00, 0, ''),
-- Revêtements de sol
('FIN-04-001', 'Plancher laminé AC3 - 8mm (m2)', '09', '09 64 00', 'M2', 'mètre carré', 18.00, 0, ''),
('FIN-04-002', 'Plancher flottant bois ingéniéré (m2)', '09', '09 62 00', 'M2', 'mètre carré', 45.00, 0, ''),
('FIN-04-003', 'Tuile vinyle LVP 6"x36" (m2)', '09', '09 65 13', 'M2', 'mètre carré', 28.00, 0, 'Imperméable'),
('FIN-04-004', 'Moquette comm. niveau 1 (m2)', '09', '09 68 00', 'M2', 'mètre carré', 22.00, 0, ''),
('FIN-04-005', 'Sous-plancher acoustique 3mm (m2)', '09', '09 64 00', 'M2', 'mètre carré', 2.85, 0, 'Polypropylène'),
-- Plafond
('FIN-05-001', 'Tuiles acoustiques 2x2 (boîte 16 tuiles)', '09', '09 51 00', 'BOX', 'boîte', 42.00, 0, 'Armstrong ou équiv.'),
('FIN-05-002', 'Tuiles acoustiques 2x4 (boîte 8 tuiles)', '09', '09 51 00', 'BOX', 'boîte', 48.00, 0, ''),
('FIN-05-003', 'Rail plafond suspendu 12'' (main)', '09', '09 51 00', 'U', 'pièce', 8.50, 0, ''),
('FIN-05-004', 'Fourrure plafond suspendu (paquet)', '09', '09 51 00', 'U', 'paquet', 45.00, 0, ''),

-- ============================================================
-- DIV 22 - PLOMBERIE
-- ============================================================
('PLO-01-001', 'Tuyau PVC 2" DWV (per 10'')', '22', '22 11 16', 'U', 'bâton 10 pieds', 12.50, 0, ''),
('PLO-01-002', 'Tuyau PVC 3" DWV (per 10'')', '22', '22 11 16', 'U', 'bâton 10 pieds', 18.50, 0, ''),
('PLO-01-003', 'Tuyau PVC 4" DWV (per 10'')', '22', '22 11 16', 'U', 'bâton 10 pieds', 26.00, 0, ''),
('PLO-01-004', 'Tuyau cuivre L 3/4" (per pied)', '22', '22 11 13', 'LF', 'pied linéaire', 4.85, 0, ''),
('PLO-01-005', 'Tuyau cuivre L 1/2" (per pied)', '22', '22 11 13', 'LF', 'pied linéaire', 3.25, 0, ''),
('PLO-01-006', 'Tuyau PEX 1/2" (per pied)', '22', '22 11 13', 'LF', 'pied linéaire', 0.85, 0, ''),
('PLO-01-007', 'Tuyau PEX 3/4" (per pied)', '22', '22 11 13', 'LF', 'pied linéaire', 1.25, 0, ''),
('PLO-02-001', 'Toilette standard 12" roughin', '22', '22 42 00', 'U', 'unité', 285.00, 0, ''),
('PLO-02-002', 'Lavabo salle de bain céramique', '22', '22 42 13', 'U', 'unité', 165.00, 0, ''),
('PLO-02-003', 'Bain/douche acrylique 32x60"', '22', '22 41 00', 'U', 'unité', 385.00, 0, ''),
('PLO-02-004', 'Évier inox double cuisine 33"', '22', '22 42 00', 'U', 'unité', 225.00, 0, ''),
('PLO-02-005', 'Chauffe-eau électrique 40 gal', '22', '22 33 00', 'U', 'unité', 725.00, 0, ''),
('PLO-02-006', 'Chauffe-eau électrique 60 gal', '22', '22 33 00', 'U', 'unité', 895.00, 0, ''),

-- ============================================================
-- DIV 26 - ÉLECTRICITÉ
-- ============================================================
('ELE-01-001', 'Conduit EMT 1/2" (per 10'')', '26', '26 05 33', 'U', 'bâton 10 pieds', 4.50, 0, ''),
('ELE-01-002', 'Conduit EMT 3/4" (per 10'')', '26', '26 05 33', 'U', 'bâton 10 pieds', 6.25, 0, ''),
('ELE-01-003', 'Câble NMD90 14-2 (par bobine 75m)', '26', '26 05 19', 'U', 'bobine', 95.00, 0, 'Romex 15A'),
('ELE-01-004', 'Câble NMD90 12-2 (par bobine 75m)', '26', '26 05 19', 'U', 'bobine', 125.00, 0, 'Romex 20A'),
('ELE-01-005', 'Câble armé BX 14-2 (par m)', '26', '26 05 19', 'M', 'mètre', 2.85, 0, ''),
('ELE-02-001', 'Panneau électrique 100A 20 circuits', '26', '26 24 16', 'U', 'unité', 285.00, 0, ''),
('ELE-02-002', 'Panneau électrique 200A 40 circuits', '26', '26 24 16', 'U', 'unité', 485.00, 0, ''),
('ELE-02-003', 'Disjoncteur 15A simple', '26', '26 28 13', 'U', 'unité', 12.50, 0, ''),
('ELE-02-004', 'Disjoncteur 20A simple', '26', '26 28 13', 'U', 'unité', 14.50, 0, ''),
('ELE-02-005', 'Disjoncteur 2 pôles 30A', '26', '26 28 13', 'U', 'unité', 28.00, 0, ''),
('ELE-03-001', 'Prise de courant duplex 15A blanc', '26', '26 27 26', 'U', 'unité', 2.85, 0, ''),
('ELE-03-002', 'Prise GFCI 15A blanc', '26', '26 27 26', 'U', 'unité', 18.50, 0, 'Requis salles humides'),
('ELE-03-003', 'Interrupteur simple blanc', '26', '26 27 23', 'U', 'unité', 2.50, 0, ''),
('ELE-03-004', 'Interrupteur 3 voies blanc', '26', '26 27 23', 'U', 'unité', 6.50, 0, ''),
('ELE-03-005', 'Luminaire DEL encastré 4" (dimmable)', '26', '26 51 00', 'U', 'unité', 28.00, 0, ''),
('ELE-03-006', 'Détecteur fumée 120V interconnectable', '26', '26 55 61', 'U', 'unité', 38.00, 0, ''),
('ELE-03-007', 'Détecteur CO combo', '26', '26 55 61', 'U', 'unité', 55.00, 0, ''),

-- ============================================================
-- DIV 31 - TERRASSEMENT
-- ============================================================
('TER-01-001', 'Remblai granulaire 0-3/4" (tonne)', '31', '31 05 16', 'T', 'tonne métrique', 28.00, 0, 'MG-20 / granulaire A'),
('TER-01-002', 'Sable de remplissage (tonne)', '31', '31 05 16', 'T', 'tonne métrique', 22.00, 0, ''),
('TER-01-003', 'Pierre concassée 3/4" (tonne)', '31', '31 05 16', 'T', 'tonne métrique', 32.00, 0, 'MG-56'),
('TER-01-004', 'Terre végétale (m3)', '31', '31 14 00', 'M3', 'mètre cube', 45.00, 0, ''),
('TER-01-005', 'Pierre 3-6" riprap (tonne)', '31', '31 37 00', 'T', 'tonne métrique', 55.00, 0, 'Enrochement'),
('TER-01-006', 'Transport remblai (camion 10 roues)', '31', '31 00 00', 'HR', 'heure', 135.00, 0, ''),

-- ============================================================
-- MAIN-D''ŒUVRE DE BASE (CSC 01)
-- ============================================================
('MO-01-001', 'Charpentier-menuisier - taux ICI', '01', '01 00 00', 'HR', 'heure', 0, 78.50, 'CCQ - ICI 2026 avec charg.'),
('MO-01-002', 'Briqueteur-maçon - taux ICI', '01', '01 00 00', 'HR', 'heure', 0, 95.22, 'CCQ - ICI 2026 avec charg.'),
('MO-01-003', 'Cimentier-applicateur - taux ICI', '01', '01 00 00', 'HR', 'heure', 0, 82.50, ''),
('MO-01-004', 'Électricien - taux ICI', '01', '01 00 00', 'HR', 'heure', 0, 98.50, ''),
('MO-01-005', 'Plombier - taux ICI', '01', '01 00 00', 'HR', 'heure', 0, 102.00, ''),
('MO-01-006', 'Ferblantier - taux ICI', '01', '01 00 00', 'HR', 'heure', 0, 92.00, ''),
('MO-01-007', 'Peintre - taux ICI', '01', '01 00 00', 'HR', 'heure', 0, 68.50, ''),
('MO-01-008', 'Carreleur - taux ICI', '01', '01 00 00', 'HR', 'heure', 0, 88.00, ''),
('MO-01-009', 'Manœuvre spécialisé', '01', '01 00 00', 'HR', 'heure', 0, 58.00, ''),
('MO-01-010', 'Contremaître', '01', '01 00 00', 'HR', 'heure', 0, 115.00, ''),

-- ============================================================
-- ÉQUIPEMENT
-- ============================================================
('EQP-01-001', 'Excavatrice 20T (location + opérateur)', '01', '01 52 00', 'HR', 'heure', 285.00, 0, ''),
('EQP-01-002', 'Chargeuse frontale (location + op.)', '01', '01 52 00', 'HR', 'heure', 225.00, 0, ''),
('EQP-01-003', 'Camion-benne 10 roues', '01', '01 52 00', 'HR', 'heure', 135.00, 0, ''),
('EQP-01-004', 'Compacteur à rouleau', '01', '01 52 00', 'HR', 'heure', 185.00, 0, ''),
('EQP-01-005', 'Grue 50T (location + opérateur)', '01', '01 52 00', 'HR', 'heure', 485.00, 0, ''),
('EQP-01-006', 'Élévateur à fourche 5000 lbs', '01', '01 52 00', 'HR', 'heure', 95.00, 0, ''),
('EQP-01-007', 'Pompe à béton (location)', '01', '01 52 00', 'HR', 'heure', 225.00, 0, ''),
('EQP-01-008', 'Nacelle ciseau 19'' (location/jour)', '01', '01 52 00', 'JR', 'jour', 285.00, 0, ''),
('EQP-01-009', 'Échafaudage (location/m2/semaine)', '01', '01 52 00', 'M2', 'mètre carré/sem.', 4.50, 0, '')

ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- ASSEMBLAGES DE BASE (murs types)
-- ============================================================
INSERT INTO cost_assemblies (name, code, assembly_type, category_code, unit, description, specifications) VALUES
('Mur extérieur 2x6 R-24', 'ASS-MUR-EXT-2x6', 'wall', '06', 'M2', 
 'Mur extérieur standard 2x6 avec isolation R-20 + R-4 ext.',
 '{"r_value": 24, "thickness_mm": 206, "fire_rating": "N/A", "studs_spacing": "16 OC"}'::jsonb),

('Mur intérieur 2x4 standard', 'ASS-MUR-INT-2x4', 'wall', '06', 'M2',
 'Cloison intérieure 2x4 avec gypse 1/2" deux faces',
 '{"thickness_mm": 114, "sound_srt": "STC 33", "studs_spacing": "16 OC"}'::jsonb),

('Mur coupe-feu 2 heures', 'ASS-MUR-CF-2HR', 'wall', '06', 'M2',
 'Mur coupe-feu 2hr - 2x4 doubled + gypse 5/8" Type X (4 couches)',
 '{"fire_rating": "2hr", "thickness_mm": 240, "sound_srt": "STC 50"}'::jsonb),

('Dalle béton 4" sur sol', 'ASS-DALLE-4IN', 'floor', '03', 'M2',
 'Dalle béton 25MPa 4" avec treillis 6x6 W1.4, pare-vapeur 6mil',
 '{"thickness_mm": 100, "concrete_mpa": 25, "r_value": 0}'::jsonb),

('Toiture plate membrane EPDM', 'ASS-TOIT-EPDM', 'ceiling', '07', 'M2',
 'Isolation 4" polyiso R-24 + membrane EPDM 1.5mm',
 '{"r_value": 24, "membrane": "EPDM 1.5mm", "slope_min": "2%"}'::jsonb)

ON CONFLICT (code) DO NOTHING;
