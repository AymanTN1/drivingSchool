package com.drivingschool.model;

public enum ProspectStatus {
    NEW,          // Nouveau prospect de la landing page
    CALLED,       // Appelé, en réflexion
    WAITING_DOCS, // A accepté, on attend le dossier/paiement
    ENROLLED,     // Converti en candidat
    LOST          // N'est plus intéressé
}
