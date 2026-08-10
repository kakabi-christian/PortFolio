<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Précise le nom de la table si elle ne suit pas le pluriel anglais par défaut
    protected $table = 'utilisateurs';

    // Les champs qui peuvent être remplis massivement
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    // Les champs à cacher lors des retours JSON (sécurité)
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Cast des types de données si nécessaire
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}