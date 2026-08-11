<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use App\Models\Contact;
use App\Services\ContactMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;


class ContactController extends Controller
{
    protected $mailService;

    /**
     * Injection du service de mail via le constructeur.
     *
     * @param ContactMailService $mailService
     */
    public function __construct(ContactMailService $mailService)
    {
        $this->mailService = $mailService;
    }

    /**
     * Display a listing of the resource (Pagination incluse).
     */
    public function index()
    {
        // Récupère les contacts, 15 par page, du plus récent au plus ancien.
        $contacts = Contact::latest()->paginate(15);
        return response()->json($contacts, 200);
    }

    /**
     * Compter le nombre de messages non lus.
     */
    public function countUnread()
    {
        $count = Contact::where('is_read', false)->count();
        return response()->json(['unread_count' => $count], 200);
    }

    /**
     * Store a newly created resource in storage (Front-end public).
     */
    public function store(ContactRequest $request)
    {
        // 1. Créer le contact dans la BDD avec les données validées
        $contact = Contact::create($request->validated());

        // 2. Envoyer l'e-mail de notification à l'administrateur (vous)
        try {
            $this->mailService->sendContactAdminNotification($contact->toArray());
        } catch (\Exception $e) {
            // Si l'envoi mail échoue, on log l'erreur mais on valide quand même la création
            // \Log::error("Erreur lors de l'envoi de l'email de contact à l'admin : " . $e->getMessage());
            return response()->json([
                'message' => 'Votre message a été enregistré, mais une erreur est survenue lors de l\'envoi de la notification.',
                'contact' => $contact,
                'mail_error' => $e->getMessage() // À retirer en production
            ], 201);
        }

        return response()->json([
            'message' => 'Votre message a bien été envoyé. Je vous répondrai dans les meilleurs délais.',
            'contact' => $contact
        ], 201);
    }

    /**
     * Display the specified resource (Marque comme lu automatiquement).
     */
    public function show($id)
    {
        $contact = Contact::findOrFail($id);

        // Marquer le message comme lu dès sa consultation par l'admin
        if (!$contact->is_read) {
            $contact->update(['is_read' => true]);
        }

        return response()->json($contact, 200);
    }

    /**
     * Répondre à un message depuis le dashboard admin et l'envoyer par e-mail.
     */
    public function reply(Request $request, $id)
    {
        // Validation du message de réponse
        $request->validate([
            'reply_message' => 'required|string|min:5'
        ]);

        $contact = Contact::findOrFail($id);

        // Utilisation d'une transaction pour s'assurer que tout se fait correctement
        DB::beginTransaction();

        try {
            // 1. Enregistrer la réponse dans la BDD, marquer comme lu et définir la date de réponse
            $contact->update([
                'reply_message' => $request->reply_message,
                'replied_at' => Carbon::now(),
                'is_read' => true, // Par sécurité, on force le statut lu
            ]);

            // 2. Envoyer l'e-mail de réponse au visiteur
            $this->mailService->sendReplyToVisitor(
                $contact->sender_email,
                $contact->sender_name,
                $request->reply_message,
                $contact->subject
            );

            // Valider la transaction
            DB::commit();

        } catch (\Exception $e) {
            // Annuler la transaction en cas d'erreur
            DB::rollBack();

            // \Log::error("Erreur lors de la réponse au contact ID {$id} : " . $e->getMessage());
            return response()->json([
                'message' => 'Une erreur est survenue lors de l\'envoi de la réponse.',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'message' => 'Votre réponse a été envoyée avec succès à l\'internaute.',
            'contact' => $contact
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $contact = Contact::findOrFail($id);
        $contact->delete();

        return response()->json(['message' => 'Message supprimé avec succès.'], 200);
    }
}