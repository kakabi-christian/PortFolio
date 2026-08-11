<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'contacts';

    /**
     * Les attributs qui sont mass assignable (remplissables).
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sender_name',
        'sender_email',
        'subject',
        'message',
        'is_read',
        'reply_message',
        'replied_at',
    ];

    /**
     * Les attributs qui doivent être convertis vers un type natif.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_read' => 'boolean',
        'replied_at' => 'datetime',
    ];

    /**
     * Valeurs par défaut pour les attributs du modèle.
     *
     * @var array
     */
    protected $attributes = [
        'is_read' => false,
    ];
}