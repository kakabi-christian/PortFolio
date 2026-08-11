<?php

namespace App\Services;

use App\Mail\ContactMail;
use Illuminate\Support\Facades\Mail;
use Exception;

class ContactMailService
{
    /**
     * Envoie la notification de contact à l'administrateur du site.
     *
     * @param array $data Les données validées du formulaire.
     * @return void
     *
     * @throws Exception Si l'envoi échoue.
     */
    public function sendContactAdminNotification(array $data): void
    {
        // --- LECTURE DEPUIS LE .ENV ---
        // Laravel récupère automatiquement ces valeurs depuis votre fichier .env
        // MAIL_FROM_ADDRESS=kakabichristian@gmail.com
        // MAIL_FROM_NAME=... (défini par APP_NAME)
        $adminEmail = config('mail.from.address');
        $adminName = config('mail.from.name', 'Admin Portfolio');

        // Vérification de sécurité basique
        if (empty($adminEmail)) {
            throw new Exception("L'e-mail administrateur n'est pas configuré dans le fichier .env.");
        }

        // Envoi du Mailable ContactMail en utilisant les informations du .env
        // comme expéditeur (From) implicite.
        Mail::to($adminEmail, $adminName)
            ->send(new ContactMail($data));
    }

    /**
     * Envoie une réponse au visiteur depuis l'administration.
     * (Optionnel pour le moment, mais prêt pour la suite).
     *
     * @param string $visitorEmail
     * @param string $visitorName
     * @param string $adminReplyMessage
     * @return void
     */
    public function sendReplyToVisitor(string $visitorEmail, string $visitorName, string $adminReplyMessage, string $originalSubject): void
    {
        // Pour la réponse, on utilise la même logique d'expéditeur définie dans le .env
        Mail::raw($adminReplyMessage, function ($message) use ($visitorEmail, $visitorName, $originalSubject) {
            $message->to($visitorEmail, $visitorName)
                    ->subject('Re: ' . $originalSubject);
        });
    }
}