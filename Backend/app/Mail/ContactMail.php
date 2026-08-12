<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Les données du contact (nom, email, sujet, message).
     *
     * @var array
     */
    public $contactData;

    /**
     * Create a new message instance.
     *
     * @param  array  $contactData  Les données validées du formulaire.
     */
    public function __construct(array $contactData)
    {
        $this->contactData = $contactData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            // Sujet dynamique basé sur le sujet entré par le visiteur
            subject: 'Nouveau message de contact : '.$this->contactData['subject'],
            // Utilisation correcte de l'objet Address pour éviter les warnings
            replyTo: [
                new Address($this->contactData['sender_email'], $this->contactData['sender_name']),
            ],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            // Définit la vue Blade qui sera utilisée pour le corps du mail.
            view: 'emails.contact',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
